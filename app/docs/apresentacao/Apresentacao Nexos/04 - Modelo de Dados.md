---
tags: [nexos, apresentacao, dados, schema]
---

# 4. Modelo de Dados

⬅️ [[00 - Nexos (Início)]]

Extraído de `api/prisma/schema.prisma` — 26 modelos, todos (exceto os de nível plataforma) amarrados a um `Condominium` via `condominiumId`.

## Núcleo: estrutura física e pessoas

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

## Controle de acesso: visitantes

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

## Encomendas

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

## Áreas comuns, reservas e eventos

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

## Onboarding e convites (nível plataforma)

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

## Observação de design

Note que `User.condominiumId` é **opcional** — o único papel que fica com esse campo nulo é o `admin` de plataforma, exatamente porque ele não pertence a um único condomínio. Essa é a "costura" técnica que sustenta todo o modelo multi-tenant.

---
⬅️ [[03 - Arquitetura Técnica]] | ➡️ [[05 - Fluxos de Negócio]]
