# Gaps Estratégicos: Administradoras & Multi-Condomínio — NexosX

Data: 2026-08-25
Escopo: visibilidade comercial do founder sobre seus clientes (administradoras de condomínio) e capacidade do produto de atender quem administra mais de um condomínio — levantado a pedido do founder após a virada de produção (todos os bloqueadores da triagem de 20/08 corrigidos, sistema pronto para vender). Não repete o roadmap funcional geral já coberto em `melhorias-nexosx.md`.
Método: cruzamento de duas falas do founder — "não sei se tenho boa visibilidade dos meus compradores" e "o sistema não tem muita funcionalidade pro administrador, meu cliente principal" — com o modelo de dados (`prisma/schema.prisma`), sessão/JWT (`token.ts`), controllers operacionais e as 4 telas admin-facing existentes.
Companion visual: `gaps-administradoras-multi-condominio.canvas`

---

## Contexto: duas frentes, uma causa raiz comum

O founder quer prospectar administradoras — empresas ou profissionais que cuidam de vários condomínios ao mesmo tempo, não o síndico de um prédio só. Duas dúvidas motivaram esta análise:

- **Ângulo A**: o founder, como operador da plataforma, tem hoje visibilidade/CRM de verdade sobre quem são seus clientes ("compradores")?
- **Ângulo B**: o produto em si tem funcionalidade suficiente pra quem administra vários condomínios — o cliente principal que ele quer vender?

Adiantando a conclusão: os dois ângulos nascem do mesmo buraco. Hoje nada no modelo de dados representa "uma administradora" como algo distinto de "um condomínio". Cada condomínio é uma ilha completa e isolada — inclusive para o próprio founder, que não tem como enxergar que 4 condomínios diferentes pertencem, na prática, ao mesmo cliente.

---

## 0. O fork arquitetural — decisão central antes de priorizar qualquer coisa abaixo

Hoje, `User.condominiumId` (`api/prisma/schema.prisma`) é uma FK escalar única e opcional. A constraint `@@unique([condominiumId, email])` permite que a mesma pessoa tenha N linhas de `User`, uma por condomínio — mas nenhuma tabela liga essas linhas entre si. Essa é a causa raiz técnica de quase todos os gaps do Ângulo B, e também do A1 abaixo.

Existem dois caminhos de solução, com riscos e prazos bem diferentes:

**Opção (a) — camada fina, sem tocar autenticação/sessão.** Manter `manager` como está hoje (1 conta = 1 condomínio). Construir, por cima, um endpoint/tela de agregação que, para o e-mail logado, usa o mecanismo `candidates` que já existe no login (ver B4) pra descobrir todos os condomínios daquela pessoa, consulta cada um pelos endpoints já existentes, e junta o resultado na tela. Não muda schema, JWT nem `requireCondominiumId()`.
- Prós: risco baixo, rápido de entregar, totalmente reversível, zero migração de dados.
- Contras: continua sendo N contas separadas por baixo do capô — não resolve permissão unificada nem billing consolidado por administradora; teto de valor comercial mais baixo no longo prazo.

**Opção (b) — entidade real `Organization`/`Administradora`.** Criar um model novo com relação N:N para `Condominium`, e evoluir a sessão/JWT pra carregar múltiplos escopos de condomínio (ou um `orgId` central). `requireCondominiumId()` e praticamente todo controller operacional precisariam aceitar contexto multi-condomínio.
- Prós: resolve de verdade — uma conta, N condomínios, e abre caminho pra billing e planos por carteira de clientes.
- Contras: mexe em schema + toda a cadeia de autenticação + a maior parte dos controllers; exige migrar com cuidado os `User` que hoje já existem duplicados e "invisíveis" entre si.

**Nota de sequenciamento** (não é uma recomendação fechada, é um caminho possível): a opção (a) pode servir de MVP validador — inclusive os itens B5 e B6 abaixo já dão pra construir sobre ela — antes de comprometer o esforço maior da opção (b). Mas a decisão de qual caminho seguir, e quando eventualmente migrar de (a) para (b), é do founder.

**Status**: ✅ RESOLVIDO (2026-08-25) — o founder decidiu resolver pela raiz, opção (b). Implementado: model `Organization` (1:N com `Condominium`, não N:N — um condomínio tem uma administradora por vez, ver justificativa no commit), `organizationId` em `Condominium` e `User`, e `PATCH /auth/active-condominium` pra trocar o condomínio ativo sem logout. Duas simplificações em relação ao desenho original, descobertas durante a implementação: (1) não foi preciso o JWT carregar múltiplos escopos — `authenticate()` (`api/src/middlewares/auth-middlewares.ts`) já re-busca o usuário no banco a cada requisição e nunca confiava no `condominiumId` do token, então trocar de condomínio é só um `UPDATE` na linha do `User`, sem reemitir token; (2) não foi preciso criar um papel novo em `Role` — `organizationId` já expressa "esta pessoa administra uma carteira" sem tocar no enum nem no `authorize()`. Migração aplicada sem backfill (só dado de teste em produção até aqui). Ver `api/prisma/schema.prisma`, `api/src/controllers/auth-controller.ts`, `api/src/controllers/organizations-controller.ts`.

---

## 1. Ângulo A — Visibilidade comercial do operador sobre seus clientes

O founder vende para administradoras, mas o sistema hoje só enxerga "condomínios" isolados — nunca "quem é meu cliente".

| Item | Onde (evidência) | Por que importa | Proposta |
| --- | --- | --- | --- |
| **A1. Não existe conceito de "cliente"/administradora, só "condomínio"** | `schema.prisma`: sem model `Organization`/`Administradora`/`Cliente`; `Condominium` não tem FK para nenhum "dono"; `CondominiumRequest.adminName` é o nome de uma pessoa, não de uma empresa | Sem isso, cada condomínio parece uma conta independente e desconexa — o founder não consegue ver concentração de carteira, LTV por administradora, nem contar quantos clientes reais tem, só quantos condomínios | 🟡 **Parcial (2026-08-25)** — a entidade `Organization` já existe (Fork §0 resolvido) e um condomínio já pode ser vinculado a ela via `organizationId`. Falta a metade voltada pro founder: nenhuma tela hoje agrupa condomínios/leads por administradora (ver A4/A6, ainda pendentes) |
| **A2. Intake de lead (`CondominiumRequest`) não qualifica** | `condominium-request-schemas.ts` e o controller: só aceitam `name` (do condomínio), `code`, `adminName`, `adminEmail`, `adminPhone`, senha e até 5 imagens — sem nome de empresa, sem "quantos condomínios administra", sem origem do lead, sem campo de notas | Toda solicitação entra "cega": o founder não sabe se está falando com uma administradora de 15 prédios ou um síndico avulso de 1 — não dá pra segmentar nem priorizar a prospecção | Campos opcionais no formulário público (nome da empresa, nº de condomínios administrados, como conheceu o NexosX) + campo de notas internas visível só ao admin |
| **A3. Solicitações do mesmo administrador não são vinculáveis** | Nenhuma chave de agrupamento existe entre múltiplos `CondominiumRequest` enviados pelo mesmo administrador real | Uma administradora com 4 condomínios manda 4 solicitações completamente desconexas — o founder subestima o tamanho real da conta e perde o sinal de oportunidade de cross-sell (venderam 1, tinham 4) | Agrupar por e-mail (ou CNPJ, se vier a existir) no intake; perguntar explicitamente "já é cliente NexosX em outro condomínio?" |
| **A4. Dashboard do admin é operacional, não comercial** | `admin-dashboard-controller.ts` + `admin/dashboard.tsx`: só 5 métricas agregadas da plataforma inteira; o "pipeline" de vendas é apenas `pending`/`approved`/`rejected`; tabela mostra só as últimas 5 solicitações pendentes | O founder está ativamente prospectando — falta um funil de vendas de verdade (contatado → em negociação → proposta enviada → fechado/perdido) e um jeito de saber quem priorizar ligar hoje | Kanban comercial leve construído sobre `CondominiumRequest`, com estágios extras, campo de notas e responsável pelo contato |
| **A5. Nenhum sinal de saúde/assinatura da conta-cliente do próprio SaaS** | `Condominium` só tem `id`, `name`, `code`, `createdAt`, `updatedAt` — sem plano/tier/status; o único model de billing existente (`Charge`) é condomínio → morador (taxa condominial via Asaas), sem nenhuma relação com o que o founder cobra da administradora pelo uso do NexosX | O founder não consegue ver, dentro do próprio produto, quais clientes estão em trial, ativos, em risco ou já deram churn no negócio dele | Adicionar `subscriptionStatus`/`plano` ao `Condominium` (mesmo que gerido manualmente no início, sem integração de gateway de pagamento) |
| **A6. Gestão de condomínios é lista plana sem relacionamento** | `admin/condominiums.tsx`: tabela simples (nome/código/criado em/link de portaria), sem busca, sem filtro, sem paginação, sem página de detalhe, sem histórico de interação | Conforme a carteira de clientes cresce, uma tabela sem busca não escala pra gestão de contas; o founder não tem onde registrar "falei com o síndico X sobre Y no dia Z" | Página de detalhe por condomínio/cliente com notas e histórico de interações; busca e filtro na listagem |

---

## 2. Ângulo B — Produto para o administrador multi-condomínio

Dividido em duas camadas: **fundação** (o que precisa mudar no modelo de dados/sessão pra viabilizar qualquer coisa multi-condo) e **produto** (o que se constrói em cima, uma vez que a fundação existe).

### 2.1 Fundação — modelo de dados e sessão

| Item | Onde (evidência) | Por que importa | Status |
| --- | --- | --- | --- |
| **B1. `User.condominiumId` é escalar único — sem portfólio** | `schema.prisma`: FK única e opcional, `@@unique([condominiumId, email])` → a mesma pessoa precisa de N linhas de `User` pra N condomínios, sem nenhuma tabela conectando-as | É literalmente por isso que "o sistema não tem funcionalidade pro administrador": quem cuida de 5 condomínios hoje precisa de 5 logins separados, sem nada ligando os dados entre eles | ✅ **CORRIGIDO (2026-08-25)** — model `Organization` + `organizationId` em `User`/`Condominium`; `condominiumId` do usuário org-scoped agora é seu "condomínio ativo", trocável, não mais fixo |
| **B2. `Role` não tem papel multi-condomínio** | `enum Role { admin, manager, doorman, resident }` — `manager` é implicitamente single-condo em todo o sistema | Não existe forma de expressar "esta pessoa administra uma carteira" como papel de primeira classe, com permissões e UI diferentes de um síndico de condomínio único | ✅ **CORRIGIDO (2026-08-25)** — sem precisar mexer no enum: `organizationId` setado já expressa "administra uma carteira"; `manager` com org e `manager` standalone continuam sendo o mesmo `role`, só o escopo muda |
| **B3. JWT/sessão carrega exatamente um `condominiumId`** | `token.ts`: payload com `condominiumId` único, expira em 8h; todo controller depende de `requireCondominiumId()` pra resolver esse único id | Mesmo resolvendo o modelo de dados, sem mexer aqui nada muda na experiência — o usuário ainda precisaria trocar de sessão inteira pra ver outro condomínio | ✅ **CORRIGIDO (2026-08-25)**, mas não como o desenho original previa — o JWT continua carregando um único `condominiumId` (deliberado, ver §0), só que agora esse campo é mutável no banco via `PATCH /auth/active-condominium`, sem reemitir token |
| **B4. Login multi-conta é seletor único no login, não troca em tempo real** | `auth-controller.ts` / `sign-in.tsx`: quando o mesmo e-mail tem contas em vários condomínios, o login devolve um array `candidates` e a pessoa escolhe uma única vez na tela de login — sem seletor dentro da sessão já autenticada | Um administrador de vários condomínios precisa deslogar e logar de novo (escolhendo outro `candidate`) só pra ver outro condomínio — a experiência é de usar N produtos separados, não um só | ✅ **CORRIGIDO (2026-08-25)** — seletor "Trocar condomínio" persistente no menu de conta (`components/condominium-switcher.tsx`), troca sem logout. O picker `candidates` do login continua existindo, agora só como caminho legado (e-mail com contas standalone realmente independentes) |

### 2.2 Produto — UI e workflow em cima da fundação

| Item | Onde (evidência) | Por que importa | Proposta |
| --- | --- | --- | --- |
| **B5. Nenhuma agregação cross-condomínio existe hoje** | Confirmado na auditoria: zero trechos de código agregam dado entre condomínios em qualquer requisição/resposta do sistema, em nenhum controller | Um administrador de 5 condomínios quer ver "quantas encomendas pendentes em TODOS os meus condomínios" sem precisar logar 5 vezes separadas | ⏳ **Pendente (Fase 2)** — a fundação já existe (`GET /organizations/me/condominiums` lista o portfólio), falta o endpoint que efetivamente une dado de todos os condomínios numa resposta só |
| **B6. Não existe home/dashboard de portfólio** | Nenhuma tela em `app/lab`/`app/web` é multi-condo — toda tela (inclusive o dashboard do manager) está escopada a um único condomínio | Sem uma tela consolidada, o administrador multi-condo não tem uma "página inicial" que reflita o trabalho real que ele faz no dia a dia | ⏳ **Pendente (Fase 2)** — tela "Minha Carteira"/"Meus Condomínios": lista dos condomínios administrados + indicadores-chave por condomínio + navegação rápida entre eles |
| **B7. `admin/condominiums.tsx` não tem hierarquia condomínio → administradora** | Tabela plana, sem agrupamento algum (mesma evidência de A6) | Simétrico ao A6, do lado do founder: uma vez existindo a entidade `Organization` (Fork opção b), a própria tela de gestão da plataforma deveria refletir esse agrupamento | ⏳ **Pendente (Fase 2)** — a entidade já existe, falta reagrupar `condominiums.tsx` por administradora, com expand/collapse |

---

## 3. Matriz de síntese

| Item | Ângulo | Camada | Depende do Fork? | Esforço aprox. | Status |
| --- | --- | --- | --- | --- | --- |
| A1 | A | Fundação | Sim (compartilha decisão com B1) | M | 🟡 Parcial |
| A2 | A | Produto | Não | P | ⏳ Pendente |
| A3 | A | Produto | Parcial | P | ⏳ Pendente |
| A4 | A | Produto | Não | M | ⏳ Pendente |
| A5 | A | Fundação | Não | P | ⏳ Pendente |
| A6 | A | Produto | Não | M | ⏳ Pendente |
| B1 | B | Fundação | **É o Fork** | G | ✅ Corrigido |
| B2 | B | Fundação | Sim | M | ✅ Corrigido |
| B3 | B | Fundação | Sim | G | ✅ Corrigido |
| B4 | B | Fundação | Parcial (MVP possível sem esperar) | P–M | ✅ Corrigido |
| B5 | B | Produto | Não (MVP sob opção a) | M | ⏳ Pendente (Fase 2) |
| B6 | B | Produto | Não (MVP sob opção a) | M | ⏳ Pendente (Fase 2) |
| B7 | B | Produto | Sim | P | ⏳ Pendente (Fase 2) |
| C1 | — | Fundação | Não (gap independente) | M | ⏳ Pendente |

(P = pequeno, M = médio, G = grande — estimativa de esforço relativo, não prazo em dias.)

---

## 4. Gap adicional (fora do escopo original): mesma pessoa com múltiplos papéis no mesmo condomínio

Este item surgiu numa conversa de acompanhamento, não faz parte da dupla Ângulo A/Ângulo B original — mas nasce da mesma característica rígida do modelo de dados. Registrado aqui pra não se perder.

| Item | Onde (evidência) | Por que importa | Proposta |
| --- | --- | --- | --- |
| **C1. Uma pessoa não pode acumular papéis no mesmo condomínio (ex: síndico/porteiro/administrador que também mora lá)** | `Role` é um valor único por linha de `User` (`schema.prisma`); `@@unique([condominiumId, email])` impede até duas contas com o mesmo e-mail no mesmo condomínio; `StaffInvitesController.signUp()` nunca cria `ResidentInfo`/vínculo de residência (só o convite de morador faz isso) — mesmo `residenceId` existindo tecnicamente em `User` pra qualquer role, nenhum fluxo de produto o preenche pra gestor/porteiro | Situação real e comum — síndico, porteiro ou administrador que também mora no condomínio que administra. Hoje a única forma de simular isso é ter duas contas com e-mails diferentes, sem visão unificada — a mesma fricção do problema multi-condomínio (Ângulo B), só no eixo oposto: múltiplos papéis numa conta só, em vez de um papel em N condomínios | Menor em escopo que o fork §0 — duas direções: (a) trocar `Role` de valor único pra um conjunto de papéis por conta (`roles: Role[]`); ou (b) manter um `role` principal e adicionar um flag independente (`isResidentToo` + `residenceId` desacoplado), preenchido por um fluxo de onboarding que hoje não existe pra staff |

---

## Nota de fechamento: a mesma causa raiz, dois sintomas

A1 e B1 são, na prática, o mesmo gap visto por dois ângulos diferentes: falta uma entidade que represente "administradora" no sistema. Antes de espalhar esforço pelos itens de UI (A4, A6, B6, B7), vale a pena o founder decidir o Fork (§0) primeiro — essa decisão dimensiona quanto desses itens de produto dá pra entregar rápido (via opção a) versus quais precisam esperar uma fundação mais sólida (opção b). Os itens marcados como "MVP possível sem esperar" (B4, B5, B6) são o caminho mais curto pra validar, na prática, se administradoras multi-condomínio realmente valorizam essa visão consolidada — antes de comprometer o esforço maior da opção (b).

**Atualização (2026-08-25): o Fork foi decidido e a fundação (B1-B4) está implementada.** O que falta agora é só a metade "produto" — B5 (agregação cross-condomínio), B6 (dashboard de portfólio) e B7 (agrupamento na tela do admin) — e a metade "comercial" do Ângulo A (A2-A6), que nunca dependeu do Fork e continua com o mesmo custo relativo de antes. A1 evoluiu de "não existe" para "existe o dado, falta a tela" — o próximo passo natural é B6 (a tela que o administrador multi-condomínio de fato usa no dia a dia) ou A4/A6 (a visibilidade comercial que o founder pediu originalmente), a depender de qual dor é mais urgente resolver primeiro. C1 (gap adicional, múltiplos papéis) segue como um item independente, não tocado por este trabalho.
