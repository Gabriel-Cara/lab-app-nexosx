const RESEND_API_URL = 'https://api.resend.com/emails';

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function readJson(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (!req.read) return {};

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function json(res: any, status: number, payload: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    json(res, 405, {error: 'Method not allowed'});
    return;
  }

  const body = await readJson(req);
  const name = toStringValue(body?.name);
  const email = toStringValue(body?.email);
  const company = toStringValue(body?.company);
  const phone = toStringValue(body?.phone);
  const message = toStringValue(body?.message);
  const locale = toStringValue(body?.locale);
  const honeypot = toStringValue(body?._hp);

  if (honeypot) {
    json(res, 200, {ok: true});
    return;
  }

  if (!name || !email || !message) {
    json(res, 400, {error: 'Missing required fields.'});
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    json(res, 500, {error: 'RESEND_API_KEY is not configured.'});
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Nexos <onboarding@resend.dev>';
  const toEmail = process.env.CONTACT_TO_EMAIL || 'gabricar28@gmail.com';

  const subject = `New contact - ${name}`;
  const text = [
    'New contact from Nexos landing',
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || '-'}`,
    `Phone: ${phone || '-'}`,
    `Locale: ${locale || 'pt'}`,
    'Message:',
    message
  ].join('\n');

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      text,
      reply_to: email
    })
  });

  const resendJson = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    json(res, 502, {error: resendJson?.message ?? 'Resend request failed.'});
    return;
  }

  json(res, 200, {ok: true, id: resendJson?.id ?? null});
}
