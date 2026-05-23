import {env} from './env';
import type {ContactPayload} from './contact';

export type CRMResult =
  | {ok: true; destinations: string[]}
  | {ok: false; error: string; destinations?: string[]};

function safeString(value?: string | null) {
  const v = (value ?? '').trim();
  return v.length ? v : undefined;
}

async function postJson(url: string, data: unknown, init?: RequestInit) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    body: JSON.stringify(data),
    ...init
  });

  const text = await res.text().catch(() => '');
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }

  return {res, json};
}

async function sendToWebhook(payload: ContactPayload) {
  const url = env.CRM_WEBHOOK_URL;
  if (!url) return {enabled: false as const};

  const {res} = await postJson(url, {
    source: 'nexos-landing',
    timestamp: new Date().toISOString(),
    payload
  });

  if (!res.ok) {
    throw new Error(`Webhook returned ${res.status}`);
  }

  return {enabled: true as const};
}

async function hubspotCreateOrFetchContact(payload: ContactPayload) {
  const token = env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) return {enabled: false as const};

  const fullName = payload.name.trim();
  const [firstname, ...rest] = fullName.split(' ');
  const lastname = rest.join(' ').trim();

  const properties: Record<string, string> = {
    email: payload.email,
    firstname,
    ...(lastname ? {lastname} : {}),
    ...(safeString(payload.company) ? {company: payload.company!.trim()} : {}),
    ...(safeString(payload.phone) ? {phone: payload.phone!.trim()} : {})
  };

  // Try create contact
  const {res, json} = await postJson('https://api.hubapi.com/crm/v3/objects/contacts', {properties}, {
    headers: {Authorization: `Bearer ${token}`}
  });

  if (res.ok) {
    const id = (json as any)?.id as string | undefined;
    if (!id) throw new Error('HubSpot contact created but ID missing');
    return {enabled: true as const, contactId: id};
  }

  // If already exists, fetch by email
  if (res.status === 409 || res.status === 400) {
    const getRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(payload.email)}?idProperty=email`,
      {headers: {Authorization: `Bearer ${token}`}}
    );

    if (getRes.ok) {
      const existing = (await getRes.json()) as any;
      const id = existing?.id as string | undefined;
      if (!id) throw new Error('HubSpot contact fetch missing ID');
      return {enabled: true as const, contactId: id};
    }
  }

  throw new Error(`HubSpot contact error (${res.status})`);
}

async function sendToHubSpot(payload: ContactPayload) {
  const token = env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) return {enabled: false as const};

  const {contactId} = await hubspotCreateOrFetchContact(payload);

  // Create a note (and then associate it to the contact)
  // Notes API guide: /crm/v3/objects/notes
  const noteBody = [
    `📩 Novo lead do site (Nexos)`,
    `Nome: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.company ? `Condomínio/Administradora: ${payload.company}` : undefined,
    payload.phone ? `Telefone: ${payload.phone}` : undefined,
    `Mensagem:`,
    payload.message
  ]
    .filter(Boolean)
    .join('\n');

  const {res: noteRes, json: noteJson} = await postJson(
    'https://api.hubapi.com/crm/v3/objects/notes',
    {
      properties: {
        hs_timestamp: Date.now(),
        hs_note_body: noteBody
      }
    },
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );

  if (!noteRes.ok) {
    throw new Error(`HubSpot note error (${noteRes.status})`);
  }

  const noteId = (noteJson as any)?.id as string | undefined;
  if (!noteId) throw new Error('HubSpot note created but ID missing');

  // Associate note -> contact
  // HubSpot docs mention that associationTypeId can be numeric or snake_case
  const assocRes = await fetch(
    `https://api.hubapi.com/crm/v3/objects/notes/${noteId}/associations/contact/${contactId}/note_to_contact`,
    {
      method: 'PUT',
      headers: {Authorization: `Bearer ${token}`}
    }
  );

  if (!assocRes.ok) {
    // Not fatal for the lead; contact and note were created.
    console.warn('HubSpot note association failed:', assocRes.status);
  }

  return {enabled: true as const};
}

async function sendToPipedrive(payload: ContactPayload) {
  const token = env.PIPEDRIVE_API_TOKEN;
  if (!token) return {enabled: false as const};

  const base = 'https://api.pipedrive.com/v1';
  const qs = `api_token=${encodeURIComponent(token)}`;

  // Create person
  const {res: personRes, json: personJson} = await postJson(
    `${base}/persons?${qs}`,
    {
      name: payload.name,
      email: payload.email,
      ...(safeString(payload.phone) ? {phone: payload.phone} : {})
    }
  );

  if (!personRes.ok) {
    throw new Error(`Pipedrive person error (${personRes.status})`);
  }

  const personId = (personJson as any)?.data?.id as number | undefined;

  // Create organization (optional)
  let orgId: number | undefined = undefined;
  if (safeString(payload.company)) {
    const {res: orgRes, json: orgJson} = await postJson(`${base}/organizations?${qs}`, {
      name: payload.company
    });

    if (orgRes.ok) {
      orgId = (orgJson as any)?.data?.id as number | undefined;
    }
  }

  // Create lead
  const title = payload.company
    ? `Lead do site (Nexos) — ${payload.company}`
    : `Lead do site (Nexos) — ${payload.name}`;

  const {res: leadRes} = await postJson(`${base}/leads?${qs}`, {
    title,
    ...(personId ? {person_id: personId} : {}),
    ...(orgId ? {organization_id: orgId} : {}),
    // Visible message for sales team
    ...(payload.message
      ? {
          description: [
            `Mensagem:`,
            payload.message,
            '',
            `Email: ${payload.email}`,
            payload.phone ? `Telefone: ${payload.phone}` : undefined
          ]
            .filter(Boolean)
            .join('\n')
        }
      : {})
  });

  if (!leadRes.ok) {
    // Not fatal: person is created
    console.warn('Pipedrive lead creation failed');
  }

  return {enabled: true as const};
}

async function sendEmailResend(payload: ContactPayload) {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) return {enabled: false as const};

  const from = env.RESEND_FROM_EMAIL ?? 'Nexos <onboarding@resend.dev>';

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height: 1.6">
      <h2>Novo lead do site (Nexos)</h2>
      <p><b>Nome:</b> ${escapeHtml(payload.name)}</p>
      <p><b>Email:</b> ${escapeHtml(payload.email)}</p>
      ${payload.company ? `<p><b>Condomínio / Administradora:</b> ${escapeHtml(payload.company)}</p>` : ''}
      ${payload.phone ? `<p><b>Telefone:</b> ${escapeHtml(payload.phone)}</p>` : ''}
      <p><b>Mensagem:</b></p>
      <pre style="white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 8px">${escapeHtml(
        payload.message
      )}</pre>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [env.CONTACT_TO_EMAIL],
      subject: `Novo lead (Nexos): ${payload.name}`,
      html
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend error (${res.status}): ${body || res.statusText}`);
  }

  return {enabled: true as const};
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendLead(payload: ContactPayload): Promise<CRMResult> {
  const destinations: string[] = [];
  const errors: string[] = [];

  const tasks = [
    {name: 'CRM_WEBHOOK_URL', run: () => sendToWebhook(payload)},
    {name: 'HUBSPOT_PRIVATE_APP_TOKEN', run: () => sendToHubSpot(payload)},
    {name: 'PIPEDRIVE_API_TOKEN', run: () => sendToPipedrive(payload)},
    {name: 'RESEND_API_KEY', run: () => sendEmailResend(payload)}
  ];

  let anyEnabled = false;

  for (const task of tasks) {
    try {
      const result = await task.run();
      if ((result as any)?.enabled) {
        anyEnabled = true;
        destinations.push(task.name);
      }
    } catch (err) {
      anyEnabled = true;
      errors.push(`${task.name}: ${(err as Error).message}`);
    }
  }

  if (destinations.length > 0) {
    return {ok: true, destinations};
  }

  if (!anyEnabled) {
    return {
      ok: false,
      error:
        'Nenhuma integração configurada. Defina CRM_WEBHOOK_URL ou HUBSPOT_PRIVATE_APP_TOKEN ou PIPEDRIVE_API_TOKEN (ou RESEND_API_KEY + CONTACT_TO_EMAIL) no .env.local.'
    };
  }

  return {ok: false, error: errors.join(' | '), destinations};
}
