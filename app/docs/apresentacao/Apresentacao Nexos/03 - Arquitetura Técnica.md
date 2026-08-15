---
tags: [nexos, apresentacao, arquitetura, tecnico]
---

# 3. Arquitetura Técnica

⬅️ [[00 - Nexos (Início)]]

## Visão de alto nível

```mermaid
graph TB
    subgraph Cliente
        WEB["🖥️ web/ — React 19 + Vite<br/>PWA instalável<br/>shadcn/ui + Tailwind"]
    end

    subgraph Backend["api/ — Node.js + Express + TypeScript"]
        ROUTES[Rotas] --> VALID[Validação — Zod]
        VALID --> CTRL[Controllers]
        CTRL --> SVC[Serviços de domínio]
        SVC --> PRISMA[Prisma ORM]
    end

    DB[("PostgreSQL")]

    subgraph Integrações Externas
        RESEND["Resend<br/>(e-mail transacional)"]
        TWILIO["Twilio<br/>(SMS / WhatsApp)"]
    end

    WEB -->|REST + JWT Bearer| ROUTES
    PRISMA --> DB
    SVC --> RESEND
    SVC --> TWILIO

    style WEB fill:#2563eb,color:#fff
    style Backend fill:#1f2937,color:#fff
    style DB fill:#4a7c59,color:#fff
```

## Camadas do back-end

O código do `api/` segue uma separação clara de responsabilidades — cada request atravessa 5 camadas antes de tocar o banco:

```mermaid
flowchart LR
    A[Rota] --> B[Middleware de<br/>Autenticação/Autorização]
    B --> C[Validação<br/>Zod schema]
    C --> D[Controller]
    D --> E[Serviço de domínio<br/>regra de negócio pura]
    E --> F[(Prisma / PostgreSQL)]
```

Isso mantém a regra de negócio (ex.: "não pode reservar mais de 1 mês à frente") testável de forma isolada, fora do controller — vários módulos já têm testes automatizados (`.test.ts`) para essas regras.

## Stack resumida

| Camada | Tecnologias |
|---|---|
| **Front-end** | React 19, TypeScript, Vite, React Router 7, shadcn/ui (Radix), Tailwind CSS v4, React Hook Form + Zod, TanStack Query, Recharts, PWA |
| **Back-end** | Node.js, Express, TypeScript, Prisma ORM, Zod, JWT, bcrypt |
| **Banco de dados** | PostgreSQL (34+ migrações versionadas) |
| **E-mail transacional** | Resend (confirmação de conta, redefinição de senha, aprovação de condomínio) |
| **Notificação SMS/WhatsApp** | Twilio (código de retirada de encomenda), com fallback em console para ambientes sem provedor configurado |
| **Documentação de API** | Swagger (`/docs`) |
| **Testes** | Jest, cobrindo encomendas, reservas, visitantes e convites |

## Por que essas escolhas fazem sentido para o negócio

- **PWA mobile-first**: portaria e morador vivem no celular — instalar como app aumenta adoção sem passar por loja de apps.
- **Multi-tenant desde o schema**: crescer para novos condomínios não exige nova infraestrutura, apenas novo registro de `Condominium`.
- **Validação em camadas (Zod no front e no back)**: erros de formulário aparecem instantaneamente na tela, e são revalidados no servidor — nenhuma regra de negócio depende só do JavaScript do navegador.

---
⬅️ [[02 - Papéis e Permissões]] | ➡️ [[04 - Modelo de Dados]]
