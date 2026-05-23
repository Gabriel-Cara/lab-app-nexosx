# Nexos Landing (Next.js + next-intl + Framer Motion)

Landing page pronta para o **Nexos** (SaaS de gestão completa de condomínio), com:

- ✅ Animações (Framer Motion)
- ✅ SEO completo + OpenGraph/Twitter Cards (Metadata API + imagens dinâmicas)
- ✅ Formulário real (`/api/contact`) com validação + notificação por e-mail via **Resend**
- ✅ Versão PT / EN (roteamento por `/pt` e `/en`)
- ✅ Página de preços (`/pricing`)
- ✅ Screenshots animados do sistema (`/public/screenshots` + carousel)

---

## 1) Requisitos

- Node.js **18+**
- NPM / PNPM / Yarn

---

## 2) Como rodar localmente

```bash
# 1) entre na pasta
cd nexos-landing

# 2) crie seu env local
cp .env.example .env.local

# 3) instale dependências
npm install

# 4) rode o projeto
npm run dev
```

Abra:

- http://localhost:3000/pt
- http://localhost:3000/en

---

## 3) Build e produção

```bash
npm run build
npm start
```

---

## 4) Configuração de ambiente

Edite o arquivo `.env.local`.

### Variáveis públicas (aparecem no navegador)

- `NEXT_PUBLIC_SITE_NAME`: nome do produto
- `NEXT_PUBLIC_SITE_URL`: URL canônica (importante para SEO)
- `NEXT_PUBLIC_TWITTER_HANDLE`: ex `@nexos`
- `NEXT_PUBLIC_APP_URL`: URL do app (botão **Entrar**) — opcional
- `NEXT_PUBLIC_CONTACT_EMAIL` e `NEXT_PUBLIC_CONTACT_PHONE`: exibidos na seção de contato

### Variáveis de servidor (não vão para o browser)

O formulário envia para **`POST /api/contact`** e, no servidor, envia uma notificação de lead via Resend.

---

## 5) Formulário real + Resend (notificação do lead)

### Endpoint

- `POST /api/contact`

Payload enviado:

```json
{
  "name": "Seu Nome",
  "email": "voce@empresa.com",
  "company": "Condomínio / Administradora",
  "phone": "+55 11 99999-9999",
  "message": "Mensagem...",
  "locale": "pt",
  "_hp": ""
}
```

> `_hp` é um **honeypot anti-spam** (deve ficar vazio).

### Resend

No `.env.local`:

```bash
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Nexos <onboarding@resend.dev>
CONTACT_TO_EMAIL=leads@suaempresa.com
```

---

## 6) SEO completo + OpenGraph

- Metadata API (title, description, robots, twitter)
- Sitemap em `/sitemap.xml`
- Robots em `/robots.txt`
- OpenGraph e Twitter images geradas dinamicamente:
  - `/pt/opengraph-image`
  - `/en/opengraph-image`
  - `/pt/twitter-image`
  - `/en/twitter-image`

Para produção, ajuste:

```bash
NEXT_PUBLIC_SITE_URL=https://seudominio.com
```

---

## 7) i18n PT/EN

- Mensagens em:
  - `messages/pt.json`
  - `messages/en.json`

Rotas:

- `/pt/...`
- `/en/...`

---

## 8) Página de preços

- `app/[locale]/pricing/page.tsx`
- Conteúdo (planos, features e FAQs) vem de `messages/*`.

---

## 9) Screenshots animados do sistema

- Imagens em: `public/screenshots/*.svg`
- Carousel animado em: `components/screenshot-showcase.tsx`

Para trocar:

1. Substitua os SVGs (ou coloque PNG/JPG) dentro de `public/screenshots`
2. Mantenha os mesmos nomes (ou ajuste o array `screens` em `components/screenshot-showcase.tsx`)


## Deploy na HostGator (hospedagem compartilhada)

1) Instale dependências e gere o build estático:
```bash
npm install
npm run build
```

2) A pasta gerada é `dist/`. Envie **todo o conteúdo** de `dist/` via FTP/gerenciador de arquivos para o diretório público do seu domínio (geralmente `public_html/`).

3) Este projeto inclui um `.htaccess` (copiado para `dist/`) para permitir rotas do React Router.
- Se você já tem um `.htaccess`, mescle as regras.

### Variáveis de ambiente (opcionais)

Crie um arquivo `.env` na raiz (localmente) antes do build:

- `VITE_APP_URL` — URL do app/login (botão "Entrar").
- `VITE_SITE_URL` — URL do site (para JSON-LD).
- `VITE_SITE_NAME` — Nome do site.
- `VITE_CONTACT_ENDPOINT` — Endpoint externo para receber leads (ex.: Make/Zapier/Formspree custom).
- `VITE_CONTACT_EMAIL` — E-mail usado no fallback `mailto:` quando `VITE_CONTACT_ENDPOINT` não estiver definido.
