---
tags: [nexos, apresentacao, fluxos, processos]
---

# 5. Fluxos de Negócio

⬅️ [[00 - Nexos (Início)]]

Os seis fluxos que sustentam a proposta de valor do Nexos, reconstruídos a partir do código de controllers, serviços e validadores.

## 5.1 Onboarding de um novo condomínio

```mermaid
flowchart TD
    A[Prospect preenche formulário<br/>público de solicitação] --> B[CondominiumRequest<br/>status: pending]
    B --> C{Admin da plataforma<br/>analisa a fila}
    C -->|Aprova| D[Cria Condomínio<br/>+ usuário Gestor automaticamente]
    C -->|Rejeita + motivo| E[Status: rejected<br/>e-mail explicando o motivo]
    D --> F[E-mail de boas-vindas<br/>com link de acesso]
    F --> G[Gestor acessa e começa<br/>a cadastrar blocos/residências]
```

## 5.2 Convite e cadastro de morador/porteiro

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

## 5.3 Visitante — do registro à saída

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

## 5.4 Encomenda — recebimento e retirada segura

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

## 5.5 Reserva de área comum — sem conflito de horário

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

## 5.6 Evento — criação, curtidas e confirmação de presença

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
⬅️ [[04 - Modelo de Dados]] | ➡️ [[06 - Tour pelo Produto (Galeria)]]
