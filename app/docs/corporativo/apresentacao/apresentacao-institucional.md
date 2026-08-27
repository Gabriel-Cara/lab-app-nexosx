---
tags: [nexos, apresentacao, condominio, saas]
---

# Nexos — Plataforma de Gestão de Condomínios

> **Diagnóstico histórico** — gerado a partir da leitura completa do código-fonte (`api/` + `web/`) em 12/08/2026, com dados reais capturados de um ambiente de demonstração local. É um retrato do produto naquele momento, **anterior** a todo o trabalho registrado em `desenvolvimento/roadmap/checklist-implementacao.md` (51+ itens entregues desde então — dashboard admin, financeiro, chamados, assembleias, mural, documentos, notificações, redesign visual completo, suporte a administradoras multi-condomínio). Útil como material institucional/pitch e como retrato de arquitetura de base, mas **não é a fonte da verdade sobre o estado atual** — para isso, ver o checklist.

![Tela de login](assets/01-login.jpg)

## O que é

**Nexos** (nome de código interno: *Porty*) é um **SaaS multi-tenant** que digitaliza a operação de portaria e a administração de condomínios: controle de visitantes, encomendas, reserva de áreas comuns, eventos e onboarding de novos condomínios na plataforma.

Quatro papéis de acesso — **Administrador da plataforma**, **Gestor (síndico)**, **Portaria** e **Morador** — compartilham a mesma aplicação, cada um vendo apenas o que lhe é relevante.

## Números do diagnóstico (12/08/2026)

| Métrica | Valor |
|---|---|
| Módulos de negócio | 10 (visitantes, encomendas, áreas/reservas, eventos, blocos, residências, moradores, portaria, condomínios, convites) |
| Papéis de acesso | 4 (admin, gestor, portaria, morador) |
| Migrações de banco de dados | 34+ |
| Endpoints de API mapeados | ~55 |
| Telas capturadas nesta apresentação | 18 |

---

## 1. Visão Geral e Objetivo

### Problema que resolve

Todo condomínio residencial enfrenta três dores operacionais recorrentes:

```mermaid
mindmap
  root((Dores do<br/>condomínio))
    Segurança
      Quem entra?
      A convite de quem?
      Por quanto tempo?
    Encomendas
      Fila na portaria
      Extravio
      "Ninguém avisou"
    Vida em comunidade
      Conflito de horário<br/>em área comum
      Comunicação de eventos
      Avisos perdidos em grupo de WhatsApp
```

O **Nexos** ataca as três em um único painel, com um app dedicado para a portaria e um para o morador — a mesma aplicação, adaptada por papel de acesso.

### Modelo de negócio

**SaaS multi-tenant**: uma única instalação da plataforma atende a múltiplos condomínios, isolados entre si. Um operador de plataforma (Administrador) aprova a entrada de novos condomínios e mantém visão consolidada de toda a base — é o dono do produto, não de um condomínio específico.

```mermaid
graph LR
    P[Plataforma Nexos] --> C1[Condomínio A]
    P --> C2[Condomínio B]
    P --> C3[Condomínio C]
    C1 -.dados isolados.- C2
    C2 -.dados isolados.- C3

    style P fill:#4a7c59,color:#fff
```

Um detalhe de identidade relevante para o modelo comercial: **o mesmo e-mail pode existir em condomínios diferentes** — cenário real de síndicos profissionais que administram mais de um prédio. No login, se o e-mail existir em mais de um condomínio, o sistema apresenta uma tela de escolha de conta em vez de travar o acesso. *(Nota: desde então esse cenário evoluiu para um modelo de administradora de verdade — entidade `Organization` — ver `corporativo/estrategia-produto/`.)*

### Público-alvo

| Perfil | Quem é | O que busca no Nexos |
|---|---|---|
| **Administradora de condomínios** (cliente comercial) | Empresa que gerencia dezenas de prédios | Um painel único, multi-tenant, para toda a carteira |
| **Síndico (Gestor)** | Responsável por um condomínio | Visibilidade e controle sem depender só da portaria |
| **Portaria** | Time operacional do dia a dia | Ferramenta rápida para registrar e liberar acessos |
| **Morador** | Usuário final, mobile-first | Autoatendimento: acompanhar encomendas, autorizar visitas, reservar espaços |

### Proposta de valor por papel

- **Para quem vende o produto**: modelo SaaS escalável — um novo condomínio entra por um formulário de solicitação, sem trabalho manual de setup.
- **Para o síndico**: dashboard com indicadores operacionais (encomendas pendentes, visitantes ativos, reservas aguardando aprovação) em vez de planilhas soltas.
- **Para a portaria**: fluxo de trabalho guiado — cada ação (autorizar, registrar entrada, marcar retirada) é um botão, não uma ligação para o morador.
- **Para o morador**: app instalável (PWA) para resolver tudo do celular — autorizar visita, ver código da encomenda, reservar o salão de festas.

---

## 2. Papéis e Permissões

O Nexos define **4 papéis** (`role` no banco de dados). O menu lateral e as rotas do front-end são derivados de uma única tabela de permissões — não existem "apps separados", é a mesma interface se adaptando.

```mermaid
graph TD
    ADMIN["👑 Administrador<br/>(plataforma)"] -->|aprova/rejeita| REQ[Solicitações de<br/>novo condomínio]
    ADMIN -->|enxerga tudo| ALL[Todos os condomínios<br/>e usuários]

    MANAGER["🏢 Gestor / Síndico<br/>(por condomínio)"] --> BLOCKS[Blocos e Residências]
    MANAGER --> STAFF[Equipe de Portaria]
    MANAGER --> APPROVE[Aprova reservas]
    MANAGER --> EVENTS_M[Cria eventos]

    DOORMAN["🛡️ Portaria"] --> VISITORS[Registra visitantes<br/>e controla entrada/saída]
    DOORMAN --> PACKAGES[Recebe e entrega<br/>encomendas]
    DOORMAN --> APPROVE

    RESIDENT["🏠 Morador"] --> MYVISITS[Autoriza seus<br/>próprios visitantes]
    RESIDENT --> MYPACK[Acompanha suas<br/>encomendas]
    RESIDENT --> BOOK[Reserva áreas comuns]
    RESIDENT --> RSVP[Curte e confirma<br/>presença em eventos]

    style ADMIN fill:#8b5cf6,color:#fff
    style MANAGER fill:#4a7c59,color:#fff
    style DOORMAN fill:#d97706,color:#fff
    style RESIDENT fill:#2563eb,color:#fff
```

### Matriz de acesso por módulo

| Módulo | Admin | Gestor | Portaria | Morador |
|---|:---:|:---:|:---:|:---:|
| Solicitações de condomínio | ✅ aprova | — | — | — |
| Condomínios (lista global) | ✅ | — | — | — |
| Usuários (lista global) | ✅ | — | — | — |
| Blocos | ✅* | ✅ | 👁️ | 👁️ |
| Residências | ✅* | ✅ | 👁️ | 👁️ (só a sua) |
| Moradores | ✅* | ✅ | 👁️ | — |
| Portaria (equipe) | ✅* | ✅ | — | — |
| Visitantes | ✅* | ✅ | ✅ | ✅ (só os seus) |
| Encomendas | ✅* | ✅ | ✅ | 👁️ (só as suas) |
| Áreas de Lazer (cadastro) | ✅* | ✅ | ✅ | 👁️ |
| Agendamentos (aprovação) | ✅* | ✅ | ✅ | cria + cancela os seus |
| Eventos (criação) | ✅* | ✅ | ✅ | curte + confirma presença |

`✅* ` = admin opera cross-tenant escolhendo explicitamente o condomínio-alvo.
`👁️` = somente leitura.

### Isolamento entre condomínios (multi-tenancy)

```mermaid
sequenceDiagram
    participant U as Usuário (token)
    participant M as Middleware<br/>requireCondominiumId
    participant C as Controller

    U->>M: Requisição + JWT
    alt papel = manager / doorman / resident
        M->>M: condominiumId vem gravado no token
        Note over M: Não pode ser sobrescrito<br/>por parâmetro de URL
    else papel = admin
        M->>M: busca x-condominium-id (header)<br/>ou query/body
        Note over M: Admin escolhe explicitamente<br/>qual condomínio operar
    end
    M->>C: Requisição autorizada, escopada a 1 condomínio
    C->>C: Toda consulta ao banco filtra por condominiumId
```

Praticamente toda tabela do banco carrega uma referência ao condomínio. O isolamento é garantido na camada de aplicação (cada consulta inclui `condominiumId`), não apenas na interface.

---

## 3. Arquitetura Técnica

### Visão de alto nível

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

### Camadas do back-end

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

### Stack resumida

| Camada | Tecnologias |
|---|---|
| **Front-end** | React 19, TypeScript, Vite, React Router 7, shadcn/ui (Radix), Tailwind CSS v4, React Hook Form + Zod, TanStack Query, Recharts, PWA |
| **Back-end** | Node.js, Express, TypeScript, Prisma ORM, Zod, JWT, bcrypt |
| **Banco de dados** | PostgreSQL (34+ migrações versionadas) |
| **E-mail transacional** | Resend (confirmação de conta, redefinição de senha, aprovação de condomínio) |
| **Notificação SMS/WhatsApp** | Twilio (código de retirada de encomenda), com fallback em console para ambientes sem provedor configurado |
| **Documentação de API** | Swagger (`/docs`) |
| **Testes** | Jest, cobrindo encomendas, reservas, visitantes e convites |

### Por que essas escolhas fazem sentido para o negócio

- **PWA mobile-first**: portaria e morador vivem no celular — instalar como app aumenta adoção sem passar por loja de apps.
- **Multi-tenant desde o schema**: crescer para novos condomínios não exige nova infraestrutura, apenas novo registro de `Condominium`.
- **Validação em camadas (Zod no front e no back)**: erros de formulário aparecem instantaneamente na tela, e são revalidados no servidor — nenhuma regra de negócio depende só do JavaScript do navegador.

---

## 4. Modelo de Dados

Extraído de `api/prisma/schema.prisma` — 26 modelos (no diagnóstico original; mais desde então), todos (exceto os de nível plataforma) amarrados a um `Condominium` via `condominiumId`.

### Núcleo: estrutura física e pessoas

```mermaid
erDiagram
    CONDOMINIUM ||--o{ BLOCK : possui
    CONDOMINIUM ||--o{ USER : possui
    BLOCK ||--o{ RESIDENCE : possui
    RESIDENCE ||--o{ USER : "abriga moradores"
    USER ||--o| RESIDENT_INFO : "detalha (se morador)"
    RESIDENT_INFO ||--o{ RESIDENT_VEHICLE : possui

    CONDOMINIUM {
        string id
        string name
        string code "único"
    }
    USER {
        string id
        string name
        string email
        string role "admin|manager|doorman|resident"
        string condominiumId "nulo se admin"
        string residenceId "nulo se não-morador"
    }
    RESIDENT_INFO {
        string building
        string emergencyContact
    }
    RESIDENT_VEHICLE {
        string model
        string plate
        string parkingSpot
        int year
    }
```

### Controle de acesso: visitantes

```mermaid
erDiagram
    CONDOMINIUM ||--o{ VISITOR : possui
    VISITOR ||--o{ VISIT_LOG : "gera registros de visita"
    USER ||--o{ VISIT_LOG : "é anfitrião de"

    VISITOR {
        string name
        string document "único por condomínio"
        boolean unlimitedAccess
    }
    VISIT_LOG {
        string status "pending|authorized|denied|entry|left"
        datetime entryTime
        datetime exitTime
        datetime expectedExitTime
        int allowedHours
    }
```

### Encomendas

```mermaid
erDiagram
    USER ||--o{ PACKAGE : "recebe"
    PACKAGE ||--o{ RETRIEVAL_LOG : "gera log de retirada"

    PACKAGE {
        string codeHash "hash bcrypt, nunca texto puro"
        datetime codeExpiresAt "48h por padrão"
        int codeAttempts "máx 5"
        string type "box|envelope|food|others"
        string status "pending|delayed|retrieved|cancelled"
    }
    RETRIEVAL_LOG {
        datetime verifiedAt
        string method
    }
```

### Áreas comuns, reservas e eventos

```mermaid
erDiagram
    COMMON_AREA ||--o{ AREA_TIME_SLOT : "define horários"
    COMMON_AREA ||--o{ AREA_RESERVATION : recebe
    AREA_TIME_SLOT ||--o{ AREA_RESERVATION : "referenciado por"
    USER ||--o{ AREA_RESERVATION : solicita
    COMMON_AREA ||--o{ EVENT : sedia
    EVENT ||--o{ EVENT_BOOKING : recebe
    EVENT ||--o{ EVENT_LIKE : recebe

    COMMON_AREA {
        string name
        int capacity
        boolean available
    }
    AREA_RESERVATION {
        date date
        string status "pending|approved|rejected|cancelled"
    }
    EVENT {
        string title
        int capacity
        boolean allowBookings
    }
```

### Onboarding e convites (nível plataforma)

```mermaid
erDiagram
    CONDOMINIUM_REQUEST }o--|| CONDOMINIUM : "vira, se aprovado"
    CONDOMINIUM ||--o{ STAFF_INVITE : gera
    CONDOMINIUM ||--o{ RESIDENT_INVITE : gera

    CONDOMINIUM_REQUEST {
        string status "pending|approved|rejected"
        string adminEmail
        string rejectionReason
    }
    STAFF_INVITE {
        string tokenHash
        datetime expiresAt "7 dias"
    }
    RESIDENT_INVITE {
        string tokenHash
        datetime expiresAt "7 dias"
    }
```

### Observação de design

Note que `User.condominiumId` é **opcional** — o único papel que fica com esse campo nulo é o `admin` de plataforma, exatamente porque ele não pertence a um único condomínio. Essa é a "costura" técnica que sustenta todo o modelo multi-tenant.

---

## 5. Fluxos de Negócio

Os seis fluxos que sustentam a proposta de valor do Nexos, reconstruídos a partir do código de controllers, serviços e validadores.

### 5.1 Onboarding de um novo condomínio

```mermaid
flowchart TD
    A[Prospect preenche formulário<br/>público de solicitação] --> B[CondominiumRequest<br/>status: pending]
    B --> C{Admin da plataforma<br/>analisa a fila}
    C -->|Aprova| D[Cria Condomínio<br/>+ usuário Gestor automaticamente]
    C -->|Rejeita + motivo| E[Status: rejected<br/>e-mail explicando o motivo]
    D --> F[E-mail de boas-vindas<br/>com link de acesso]
    F --> G[Gestor acessa e começa<br/>a cadastrar blocos/residências]
```

### 5.2 Convite e cadastro de morador/porteiro

```mermaid
flowchart TD
    A[Gestor/Portaria gera<br/>link de convite] --> B[Token válido por 7 dias]
    B --> C[Convidado abre o link]
    C --> D{Token ainda válido?}
    D -->|Não| E[410 — convite expirado]
    D -->|Sim| F[Preenche nome, telefone,<br/>senha — e veículos, se morador]
    F --> G[Conta criada com o papel correto]
    G --> H[E-mail de confirmação<br/>ou definição de senha]
```

### 5.3 Visitante — do registro à saída

```mermaid
flowchart TD
    A[Portaria/Morador registra visitante<br/>documento + anfitrião] --> B{Tipo de acesso}
    B -->|Tempo determinado| C[status: pending]
    B -->|Acesso ilimitado| D[status: authorized<br/>pula aprovação]
    C --> E{Anfitrião ou portaria<br/>aprova?}
    E -->|Aprova| F[status: authorized]
    E -->|Rejeita| G[status: denied — fim]
    F --> H[Portaria marca ENTRADA]
    D --> H
    H --> I[Sistema calcula<br/>saída prevista]
    I --> J[Portaria marca SAÍDA]
    J --> K[status: left]
```

### 5.4 Encomenda — recebimento e retirada segura

```mermaid
flowchart TD
    A[Portaria registra encomenda] --> B[Gera código de 6 caracteres<br/>hash bcrypt, nunca texto puro]
    B --> C[Notifica morador<br/>SMS / WhatsApp / e-mail]
    C --> D[Morador vai até a portaria<br/>e informa o código]
    D --> E{Código confere<br/>e não expirou?}
    E -->|Sim| F[status: retrieved<br/>+ log de retirada]
    E -->|Não| G[Tentativa +1<br/>máx. 5 tentativas]
    G -->|excedeu| H[Bloqueado — 429]
    C -.sem retirada em 1 dia — comida<br/>ou 30 dias — demais tipos.-> I[Job automático marca<br/>status: delayed]
```

### 5.5 Reserva de área comum — sem conflito de horário

```mermaid
flowchart TD
    A[Gestor configura área<br/>com horário de funcionamento] --> B[Sistema gera grade<br/>de horários fixos]
    B --> C[Morador escolhe data<br/>+ horário início/fim]
    C --> D{Data está entre hoje<br/>e +1 mês?}
    D -->|Não| E[Bloqueado]
    D -->|Sim| F{Horário conflita com<br/>outra reserva pendente/aprovada?}
    F -->|Sim| G[409 — conflito,<br/>escolha outro horário]
    F -->|Não| H[Reserva criada:<br/>status pending]
    H --> I{Portaria/Gestor<br/>aprova ou rejeita}
    I -->|Aprova| J[status: approved]
    I -->|Rejeita| K[status: rejected]
```

### 5.6 Evento — criação, curtidas e confirmação de presença

```mermaid
flowchart TD
    A[Gestor/Portaria cria evento<br/>vinculado a uma área comum] --> B[Define capacidade e<br/>se permite inscrição]
    B --> C[Morador vê o evento no feed]
    C --> D[Morador curte 💚<br/>ação idempotente]
    C --> E{Evento permite<br/>inscrição?}
    E -->|Sim| F{Já atingiu<br/>a capacidade?}
    F -->|Não| G[Confirma presença<br/>— 1 vaga por morador]
    F -->|Sim| H[400 — evento lotado]
```

---

## 6. Tour pelo Produto — Telas Reais

Capturas reais do sistema, feitas sobre um ambiente local com dados de demonstração seedados (condomínio "Condomínio Demo", 4 moradores, 1 porteiro, visitantes, encomendas, reservas e eventos de exemplo). Nenhuma comunicação real (e-mail/SMS) foi disparada durante a captura.

### Acesso

![Tela de login — multi-tenant: o mesmo formulário atende qualquer papel de acesso.](assets/01-login.jpg)

### 👑 Visão do Administrador da plataforma

O admin não pertence a um condomínio — ele opera a plataforma como um todo.

![Fila de solicitações de novos condomínios aguardando aprovação.](assets/02-admin-solicitacoes.jpg)

![Todos os condomínios cadastrados na plataforma, com opção de gerar link de convite para a portaria.](assets/03-admin-condominios.jpg)

![Diretório global de usuários — visão cross-tenant, com papel e condomínio de cada um.](assets/04-admin-usuarios.jpg)

### 🏢 Visão do Gestor (síndico)

Painel operacional completo do condomínio, com indicadores em tempo real.

![Dashboard do gestor: ações rápidas, KPIs (encomendas pendentes, visitantes ativos, moradores, reservas aprovadas) e gráfico de recebidas x retiradas dos últimos 7 dias.](assets/05-dashboard-gestor.jpg)

![Cadastro de blocos/torres do condomínio.](assets/06-blocos.jpg)

![Unidades vinculadas a cada bloco, com os moradores associados.](assets/07-residencias.jpg)

![Diretório de moradores, com contato e informações adicionais (bloco, telefone).](assets/08-moradores.jpg)

![Equipe de portaria cadastrada, com turno de trabalho.](assets/09-portaria.jpg)

![Painel de visitantes — cada card mostra status (Entrou / Pendente / Autorizado) e as ações disponíveis (autorizar, negar, marcar entrada/saída).](assets/10-visitantes.jpg)

![Encomendas por morador — badges de tipo (Caixa, Envelope, Comida) e status (Pendente, Atrasada, Retirada).](assets/11-encomendas.jpg)

![Cadastro das áreas comuns disponíveis para reserva, com capacidade e horário de funcionamento.](assets/12-areas-lazer.jpg)

![Console de aprovação de reservas: KPIs da semana, fila de pendentes e próximos agendamentos confirmados.](assets/13-agendamentos.jpg)

![Gestão de eventos: estatísticas de inscrições/curtidas e lista de eventos ativos (agendáveis e informativos).](assets/14-eventos.jpg)

### 🏠 Visão do Morador

Experiência mais enxuta, focada no que importa para quem mora no condomínio.

![Dashboard do morador: mesmas seções do gestor, mas filtradas para os dados do próprio apartamento.](assets/15-dashboard-morador.jpg)

![Áreas de lazer disponíveis para reserva, com atalho direto para "Agendar".](assets/16-areas-morador.jpg)

![Fluxo de reserva: calendário + seleção de horário de início e fim a partir da grade de slots pré-configurada.](assets/18-modal-agendamento.jpg)

![Feed de eventos do condomínio, no estilo rede social — curtidas e vagas disponíveis visíveis de cara.](assets/17-eventos-morador.jpg)

### O que essas telas confirmam sobre o produto

- A **mesma base de código** serve os quatro papéis — não há retrabalho de manutenção entre "app do morador" e "painel do síndico".
- O **dashboard é o centro de gravidade** do produto: tanto gestor quanto morador chegam nele após o login, com granularidade diferente.
- A reserva de área comum é a **interação mais rica** da interface (calendário + grade de horários), condizente com ser a funcionalidade com mais regras de concorrência no back-end.
