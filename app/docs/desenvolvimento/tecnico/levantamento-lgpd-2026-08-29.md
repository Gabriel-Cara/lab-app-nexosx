# Levantamento Técnico — Dados Pessoais e LGPD — 2026-08-29

> **Isto não é um parecer jurídico.** É um inventário técnico — o que o sistema coleta, onde armazena, com quem compartilha e o que consegue (ou não) apagar — pra alguém que entenda de conformidade de dados pessoais no Brasil avaliar antes de formalizar contrato com o primeiro cliente pagante. Última pendência do backlog levantado em `gaps-administradoras-multi-condominio.md`, adiada desde a `triagem-producao-2026-08-20.md` ("fora do escopo desta triagem técnica").

Escopo: todo o backend (`api`), schema Prisma completo, serviços de e-mail/SMS/pagamento, e as telas de cadastro do frontend (`web`). Método: leitura direta do código — schema, validators, services, migrations (constraints reais de FK, não só o que o Prisma declara) — nada inferido sem confirmar no arquivo.

---

## Resumo

Não há bug de segurança básica (controle de acesso, isolamento entre condomínios, senha em texto plano) — isso já foi endereçado na auditoria de 15/08 e segue válido. As lacunas aqui são de **natureza diferente**: coisas que uma revisão de conformidade de dados pessoais olha e que não fazem parte de uma auditoria de segurança comum.

**O achado mais importante, e o único que é puramente técnico (não depende de decisão jurídica) — vale abrir como item de backlog separado**: o mecanismo de exclusão de usuário quebra silenciosamente pra qualquer morador com cobrança, chamado ou voto de assembleia — ou seja, a maioria dos moradores ativos. Ver seção 4.

Os demais achados (CPF em texto plano, ausência de termo de consentimento, ausência de política de retenção, ausência de tratamento diferenciado pra menores) são decisões que dependem de alguém que entenda de LGPD dizer o que é obrigatório vs. recomendado vs. aceitável pro estágio atual do produto — por isso este documento só descreve o estado real, sem recomendar o que fazer.

---

## 1. Inventário de dado pessoal por tabela (`api/prisma/schema.prisma`)

| Tabela | Campos PII | Observação |
|---|---|---|
| `users` | `name`, `email`, `phone`, `imageUrl` (foto de perfil), `apartment` | Senha (`password`) é hash bcrypt custo 12 — não é PII em texto plano |
| `resident-infos` | `emergencyContact` (texto livre), `cpf` | **`cpf` é `String?` em texto plano — sem hash, sem máscara, sem criptografia** (linha 441 do schema) |
| `resident-vehicles` | `plate`, `model`, `parkingSpot` | Placa de veículo é PII sob jurisprudência recente |
| `visitors` | `document` (RG/CPF do visitante), `name`, `phone` | Texto plano |
| `visit-logs` | `imageUrl` (foto do visitante), `notes` | |
| `visitor-pre-registrations` | `document`, `name` | |
| `package-proxies` | `name`, `document` (procurador de encomenda) | |
| `retrieval-logs` | `receivedByName`, `receivedByDocument`, `proofImageUrl` (assinatura/foto) | |
| `condominium-requests` | `adminName`, `adminEmail`, `adminPhone` | `adminPasswordHash` é hash, não plano |
| `charges` | vinculado a `resident-id` + valor/vencimento | Dado financeiro individualizável |

## 2. Armazenamento de imagem

Confirmado por comentário no próprio código (`api/src/validators/image-schemas.ts:1-2`):

```
// Images are stored as base64 directly in Postgres (no external object storage),
// so an unbounded upload is a real scale/DoS risk...
```

Toda foto (morador, visitante, assinatura de retirada de encomenda) é uma data URL base64 gravada direto em colunas do Postgres — **nenhum storage externo**. Limite de 5MB decodificados por imagem, validação por magic-byte. A superfície de exposição desses dados é inteiramente o banco de dados principal (mesmo lugar de tudo o resto), não um bucket separado com política própria.

## 3. Terceiros que recebem dado pessoal (operadores, no sentido da LGPD)

- **Resend** (e-mail transacional) — `api/src/services/mail/*.ts`. Recebe `email`, `name`, e em alguns fluxos nome/código do condomínio.
- **Twilio** (SMS/WhatsApp) — `api/src/services/notification-service.ts`. Recebe `phone` + corpo da mensagem. Só ativa se as credenciais estiverem configuradas.
- **Asaas** (gateway de pagamento) — `api/src/services/payments/asaas-client.ts:53-81`. Recebe `{name, cpfCnpj, email?, mobilePhone?}` pra criar o cliente cobrável, mais dado financeiro (valor, vencimento) por cobrança. **É o único terceiro que recebe CPF** — junto de dado financeiro, a combinação mais sensível do sistema.

## 4. Mecanismo de exclusão — achado técnico crítico

`api/src/services/user-deletion-service.ts` (arquivo completo, 62 linhas) faz um **hard delete de verdade** — sem soft-delete, sem flag, remove do banco — mas incompleto: limpa `EventLike`/`EventBooking`/`Event` (criados pelo usuário), `RetrievalLog`, `Package`, `VisitLog` (desvincula como `handledBy`, apaga como host), `AreaReservation`, `ResidentInfo`, `ResidenceOccupancyLog` — e só então tenta `prisma.user.delete()`.

**O que não limpa**: `Charge`, `MaintenanceRequest`, `AssemblyVote`. Confirmei as constraints reais nas migrations (não é suposição sobre o `schema.prisma` — é o SQL que realmente rodou no banco):

```sql
-- prisma/migrations/20260818024728_fase10_charges_assemblies/migration.sql:99
ALTER TABLE "charges" ADD CONSTRAINT "charges_resident-id_fkey"
  FOREIGN KEY ("resident-id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- mesma migration, linha 117
ALTER TABLE "assembly-votes" ADD CONSTRAINT "assembly-votes_resident-id_fkey"
  FOREIGN KEY ("resident-id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- prisma/migrations/20260818014437_fase9_documents_maintenance_requests/migration.sql:59
ALTER TABLE "maintenance-requests" ADD CONSTRAINT "maintenance-requests_requested-by-id_fkey"
  FOREIGN KEY ("requested-by-id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

As três são `ON DELETE RESTRICT` — o Postgres recusa o delete se existir qualquer linha filha. **Qualquer morador que já teve uma cobrança, um chamado ou votou numa assembleia — o que é o uso mais básico do produto, não um caso raro — faz a transação inteira de `deleteUserWithRelations` estourar um erro de FK não tratado** (não há try/catch na função; o erro sobe cru). Hoje não existe capacidade técnica de atender uma solicitação de exclusão de um morador com qualquer histórico financeiro ou de chamados.

Contraste: `announcements`, `assemblies` e `audit-logs` apontam pra `users` com `ON DELETE SET NULL` — essas não bloqueiam, só o campo `createdBy`/`actorId` fica órfão.

**Isso é uma correção de engenharia pura, não uma decisão de compliance** — vale virar item de backlog próprio depois, independente do que sair da avaliação jurídica (decidir se o caminho certo é anonimizar `Charge`/`MaintenanceRequest`/`AssemblyVote` ao invés de apagar, ou apagar em cascata, é aí sim uma decisão que depende de orientação jurídica sobre retenção de dado fiscal/financeiro).

## 5. Retenção de dados — nenhuma política encontrada

`api/src/server.ts:60-84` lista os 5 jobs agendados do sistema (sync de status de encomenda/visitante/reserva, lembrete de evento, cobrança em atraso). **Nenhum apaga ou anonimiza dado antigo.** Sem job de limpeza de `VisitLog` histórico, imagens antigas, ou tokens de recuperação de senha expirados (`PasswordResetToken`/`PasswordSetupToken` permanecem no banco após `expiresAt`, só ganham `usedAt` quando efetivamente usados). Tudo é retido indefinidamente por padrão — não há decisão tomada, é a ausência de qualquer decisão.

## 6. Isolamento multi-tenant

Confirmado consistente com o que já era conhecido de sessões anteriores: `requireCondominiumId()` + `authorize([...roles])` seguem o mesmo padrão nos ~48 controllers — um condomínio não acessa dado pessoal de outro. Não reinvestigado a fundo aqui (já coberto pela auditoria de 15/08 e pela triagem de 20/08).

## 7. Medidas de segurança técnica já existentes (relevantes ao Art. 46 da LGPD)

- Senha: bcrypt custo 12.
- JWT: expira em 8h.
- Rate limiting: login, recuperação de senha e cadastro público (15-60min por janela) — não cobre todas as rotas, só esses 3 fluxos públicos/sensíveis.
- HTTPS: é configuração de deploy, não de código — nada a verificar no repo.
- Os ~67 achados da auditoria de segurança de 15/08 (`auditoria-seguranca-2026-08-15.md`) seguem corrigidos.

## 8. Consentimento — nenhum fluxo encontrado

Nenhuma tela de cadastro (`web/src/pages/auth/sign-up.tsx`, `resident-sign-up.tsx`, fluxos de convite de morador/síndico/porteiro) tem checkbox de aceite de termo de uso ou política de privacidade. Além disso, a maioria dos moradores/visitantes/porteiros **não se autocadastra** — são cadastrados por um terceiro (síndico ou portaria, via convite ou criação direta), o que muda qual base legal do Art. 7º realistamente se aplica (dificilmente "consentimento" no sentido estrito).

## 9. Dados de menores de idade — sem tratamento diferenciado

Nenhum campo de data de nascimento/idade em nenhuma tabela do schema. O sistema não distingue morador adulto de menor — mas crianças moradoras existem na realidade (dependentes cadastrados como `ResidentInfo`/ocupantes da unidade), e qualquer dado delas que entre no sistema recebe o mesmo tratamento de um adulto.

---

## Perguntas pra levar pra quem for avaliar

- CPF em texto plano no banco principal — precisa de criptografia em repouso, ou o controle de acesso + isolamento multi-tenant já existente é suficiente pro estágio atual?
- Ausência de termo de consentimento/política de privacidade no cadastro — obrigatório desde já, ou aceitável dado que o cadastro é feito por terceiro (síndico/portaria) sob outra base legal?
- Ausência de política de retenção — que prazo faz sentido pra cada tipo de dado (foto de visitante, log de acesso, cobrança)?
- Dado de menores — precisa de tratamento diferenciado formal, ou o fato de quem opera o sistema ser sempre um adulto (responsável, síndico, portaria) já resolve?
- O achado da seção 4 (exclusão incompleta) — depois de corrigido tecnicamente, qual é o comportamento correto pra `Charge`/`MaintenanceRequest`/`AssemblyVote` de um usuário excluído: anonimizar mantendo o registro financeiro/fiscal, ou apagar de fato?
