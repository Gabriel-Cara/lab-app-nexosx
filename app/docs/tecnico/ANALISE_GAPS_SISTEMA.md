# Análise de Gaps, Bugs e Casos Não Mapeados — NexosX

Data: 2026-08-15
Escopo: `app/api` (Express + Prisma/PostgreSQL) e `app/web` (React), sistema multi-tenant de gestão de condomínios.
Método: auditoria dirigida por 4 varreduras paralelas cobrindo (1) auth/multi-tenancy/convites, (2) áreas comuns/reservas/eventos, (3) encomendas/visitantes, (4) blocos/residências/veículos/imagens/frontend geral.

Cada item traz: arquivo:linha, cenário concreto de falha, severidade e sugestão de correção. Itens sem correção "urgente" ficam marcados como observação.

---

## 1. CRÍTICOS DE SEGURANÇA (controle de acesso)

### 1.1 Escalação de privilégio: doorman pode se auto-promover a manager
`api/src/controllers/users-controller.ts:319-468` (`update`) + `api/src/routes/auth-routes.ts:26`
`PUT /auth/users/:id` é liberado para `admin|manager|doorman`. O controller só confere se o alvo é do mesmo `condominiumId` (linha 337-340) — não há checagem de hierarquia. Um `doorman` pode chamar `PUT /auth/users/<próprio-id>` com `{ role: "manager" }` e, ao relogar, receber um JWT com `role: manager`, assumindo controle total do tenant.
**Fix:** proibir alteração de `role` por quem não é admin/manager; nunca permitir auto-alteração de `role`.

### 1.2 Mesma rota permite doorman resetar senha ou excluir um manager (account takeover)
`api/src/routes/auth-routes.ts:27` (`DELETE /auth/users/:id` liberado a doorman) + `users-controller.ts:319-397,470-486`
`doorman` pode chamar `PUT /auth/users/<id-do-manager>` com `{ password: "..." }` (assume a conta) ou `DELETE /auth/users/<id-do-manager>` (remove o gestor do condomínio).
**Fix:** restringir `DELETE`/troca de senha a papéis iguais ou superiores ao alvo.

### 1.3 JWT nunca revalidado contra o banco — usuário excluído/rebaixado continua autenticado até o token expirar (8h)
`api/src/middlewares/auth-middlewares.ts:5-35`
`request.user` é montado 100% a partir do payload do token, sem consulta ao banco. Um doorman demitido continua acessando tudo por até 8h após ser excluído; se ele executar uma ação que grava seu `id` como FK (ex. `packages-controller.ts:69`), a escrita falha com erro de FK não tratado → 500 genérico.
**Fix:** revogação por versão/blacklist de token, ou checagem periódica de existência do usuário.

### 1.4 Convites (StaffInvite/ResidentInvite) sem uso único e sem revogação
`api/prisma/schema.prisma:130-158`, `staff-invites-controller.ts:101-198`, `resident-invites-controller.ts:94-219`
Comportamento confirmado como intencional pelo próprio teste (`staff-invites-controller.test.ts:94`: "allows the same invite link to be used for more than one staff signup"). Link válido por 7 dias, reutilizável por qualquer número de pessoas, sem endpoint de revogação.
**Cenário:** link de convite de portaria vaza → qualquer pessoa vira `doorman` (acesso a pacotes/visitantes) por até 7 dias, sem que o gestor consiga invalidar.
**Fix:** endpoint `DELETE` de revogação + opção de uso único.

### 1.5 Nenhum rate limiting em nenhuma rota
`api/src/app.ts` (sem `express-rate-limit`/`helmet`)
- Login: força bruta/dicionário viável (agravado por 1.9, bcrypt custo 8).
- `POST /condominium-requests` é **totalmente público**, sem auth/captcha — um atacante pode preencher `adminEmail` com e-mail de terceiro e disparar spam de e-mail repetidamente às custas da cota do Resend.
**Fix:** `express-rate-limit` por IP/e-mail em rotas de auth e nas rotas públicas de criação.

### 1.6 Senha padrão de admin de plataforma com fallback fraco
`api/prisma/seed.ts:52` — `PLATFORM_ADMIN_PASSWORD ?? MASTER_PASSWORD ?? "Admin123!"`
Se a env não for definida em produção, é criado (ou repopulado) um `admin` com senha fixa e documentada no código-fonte.
**Fix:** falhar o seed em produção se a variável não estiver definida.

### 1.7 bcrypt com custo 8 para senhas de login (vs. custo 10 usado no código de encomenda)
`auth-controller.ts:184,278`, `users-controller.ts:71,396`, `staff-invites-controller.ts:108`, `resident-invites-controller.ts:109`, `condominium-requests-controller.ts:39`, `condominiums-controller.ts:21`
**Fix:** elevar para 10-12.

---

## 2. CRÍTICOS DE CONTROLE DE ACESSO FÍSICO (pacotes/visitantes)

### 2.1 Pacote cancelado ainda pode ser retirado
`api/src/controllers/packages-controller.ts:309-345` (`retrieve`)
O guard só bloqueia `status === "retrieved"`; o `updateMany` final usa `status: { not: "retrieved" }` (linha 334), que deixa passar `"cancelled"`. Se o código antigo não expirou, alguém pode retirar um pacote já cancelado.
**Fix:** bloquear explicitamente `cancelled`; trocar o filtro para `status: { in: ["pending", "delayed"] }`.

### 2.2 Código de retirada não é invalidado ao trocar o morador do pacote
`api/src/controllers/packages-controller.ts:213-277` (`update`)
Ao editar `residentId` de um pacote, `codeHash`/`codeExpiresAt` não mudam nem o novo morador é notificado. O morador antigo (que já recebeu o SMS) continua com um código válido que agora libera a encomenda de outra pessoa.
**Fix:** ao trocar `residentId`, gerar novo código, invalidar o antigo e notificar o novo morador.

### 2.3 `resendCode` destrói o código antigo mesmo quando a notificação falha
`api/src/controllers/packages-controller.ts:138-174`
O `updateMany` que sobrescreve o código roda antes do envio da notificação. Se `notifyResident` falhar (telefone ausente, erro do provedor), o morador fica sem nenhum código válido — comportamento já coberto (e assumido) pelo próprio teste em `packages-controller.test.ts:113-143`.
**Fix:** só persistir o novo código se a notificação tiver sucesso, ou reverter em caso de falha.

### 2.4 `cancel()` de pacote não verifica status atual
`api/src/controllers/packages-controller.ts:398-437`
Um pacote já `retrieved` pode ser marcado `cancelled`, corrompendo o histórico.
**Fix:** bloquear cancelamento de pacote já retirado.

### 2.5 Geração do código de retirada usa `Math.random()` (PRNG não criptográfico)
`api/src/utils/generate-code.ts:1-8`
Controla acesso físico a um bem, mas não usa CSPRNG.
**Fix:** `crypto.randomInt`/`crypto.randomBytes`.

### 2.6 Corrida real gera duas "entradas" simultâneas para o mesmo visitante de acesso ilimitado
`api/src/controllers/visitors-controller.ts:104-151` (`entry`) + `344-410` (`markUnlimitedEntry`)
A checagem de "entrada já aberta" roda fora da transação que cria o `VisitLog`. Dois cliques/porteiros simultâneos no mesmo visitante (após um `left` anterior) passam ambos pela checagem e criam dois registros de entrada abertos ao mesmo tempo.
**Fix:** mover a checagem para dentro da mesma transação/serializable, como já é feito em `packages-controller.retrieve()`.

### 2.7 Aprovação de visita nunca expira
`api/src/controllers/visitors-controller.ts:300-342` (`markAuthorizedEntry`)
Não existe validade para a aprovação em si. Um visitante aprovado hoje pode se apresentar (ou ter seu documento reapresentado por outra pessoa) semanas depois e ainda ser liberado.
**Fix:** adicionar campo de expiração da aprovação (`authorizedUntil`) e checar no check-in.

### 2.8 `register()` de visitante sobrescreve identidade via `upsert` sem alertar conflito
`api/src/controllers/visitors-controller.ts:44-69`
Documento é chave única por condomínio; um segundo cadastro com o mesmo documento sobrescreve nome/status silenciosamente — inclusive resetando `status` para `pending` enquanto um `VisitLog` anterior ainda está aberto (`exitTime: null`), fazendo a tela mostrar "pendente" para alguém fisicamente dentro do condomínio.
**Fix:** bloquear/alertar em conflito de dados ou visita já em andamento.

### 2.9 Sem job de expiração para visitas `pending` ou entradas órfãs
Não existe equivalente ao `package-status-service.ts` (que roda a cada hora para pacotes) para `Visitor`/`VisitLog`. Pedidos pendentes nunca respondidos e entradas sem saída registrada (porteiro esqueceu) ficam abertos para sempre, sem alerta.
**Fix:** job periódico de expiração/alerta.

### 2.10 Múltiplos hosts convidando o mesmo documento geram registros pendentes órfãos
`api/src/controllers/visitors-controller.ts:23-85,206-298`
Se dois moradores convidam o mesmo prestador (mesmo documento), a aprovação de um marca o `Visitor.status` global como resolvido, mascarando que o pedido do outro morador continua pendente.

---

## 3. RACE CONDITIONS E MÁQUINAS DE ESTADO INCOMPLETAS (reservas/eventos)

### 3.1 `approve()` de reserva não revalida conflito de horário — double-booking real
`api/src/controllers/reservations-controller.ts:207-227`
`create()` roda em transação `Serializable` com checagem de overlap, mas `approve()` não repete essa checagem. Duas reservas `pending` sobrepostas (que passam na criação, pois nenhuma é `approved` ainda) podem ambas ser aprovadas pelo síndico, gerando dois `approved` conflitantes.
**Fix:** repetir a checagem de overlap dentro de `approve()`, em transação serializável.

### 3.2 Transições de status de reserva sem máquina de estados
`api/src/controllers/reservations-controller.ts:207-271`
`approve`/`reject`/`cancel` não checam o status atual antes de alterar — dá para "reaprovar" uma `rejected`, ou cancelar uma já `rejected`.
**Fix:** validar transição permitida (ex.: só a partir de `pending`) antes de cada update.

### 3.3 Morador não tem como cancelar a própria reserva
`api/src/routes/reservations-routes.ts:16` restringe `PATCH /:id/cancel` a `admin|manager|doorman`; não existe `cancelReservation` em nenhum client do frontend.
Combinado com 3.4, uma reserva `pending` esquecida trava o horário para sempre.

### 3.4 Reserva `pending` bloqueia o slot indefinidamente (sem expiração automática)
`api/src/controllers/areas-controller.ts:243,344` considera `pending`/`approved` como indisponível; sem cancelamento pelo morador nem expiração, um pedido nunca respondido trava o horário permanentemente.

### 3.5 Aprovação não revalida se o slot referenciado ainda está ativo
`api/src/controllers/reservations-controller.ts:219-224` — se o síndico reconfigurar a agenda da área (desativando slots antigos), reservas `pending` antigas ainda podem ser aprovadas para um horário que não existe mais na grade atual.

### 3.6 Exclusão de área apaga todo o histórico de reservas (cascade sem aviso real)
`api/prisma/schema.prisma:421` — `AreaReservation.area` é `onDelete: Cascade`. Apagar uma `CommonArea` destrói reservas passadas já aprovadas/canceladas (potencialmente necessárias para relatórios/cobrança). O modal de confirmação no front não menciona essa consequência (`web/src/components/areas/delete-modal.tsx:53-58`).
**Fix:** trocar para `Restrict`/soft-delete e avisar explicitamente no modal.

### 3.7 Timezone: cálculo de data/horário depende do timezone do processo Node, não de um fuso fixo
`api/src/utils/datetime.ts:3-32` usa `Date.setHours()` (timezone local do servidor); não há `TZ` configurada em lugar nenhum do projeto.
**Cenário:** se o servidor rodar em UTC mas o condomínio for em `America/Sao_Paulo`, um slot "14:00" é persistido como 14:00 UTC = 11:00 local — erro de 3h silencioso. `getTodayStart()` também pode calcular "hoje" errado perto da meia-noite.
Front-end reforça o problema: `web/src/components/areas/schedule-modal.tsx:193` usa `date.toISOString()` (conversão para UTC), e as telas de listagem convertem de volta usando o timezone do **navegador** (`upcoming-reservations.tsx:129-130`, `pending-reservations.tsx:141-142`, `reservations-table.tsx:78-82`) — funciona "por acidente" hoje só porque cliente e servidor operam de forma compatível.
**Fix:** fixar timezone explícita (ex. `America/Sao_Paulo` por condomínio) com `date-fns-tz`/`luxon`.

### 3.8 Badge de conflito no front é só heurística client-side, facilmente burlável
`web/src/components/reservations/pending-reservations.tsx:191-224` só desabilita "Aprovar" quando há conflito com reserva já `approved` — conflito entre duas `pending` só gera aviso. Junto com 3.1, essa é a única barreira contra aprovar reservas sobrepostas, e é trivial de contornar.

### 3.9 Evento: inscrição aceita mesmo após o evento já ter terminado
`api/src/controllers/events-controller.ts:127-202` (`book`) nunca compara `endDate` com a data atual. Front também não impõe `min` de data ao criar eventos (`web/src/components/events/add-modal.tsx:288-309`), permitindo cadastrar eventos no passado.

### 3.10 `like()`/`unlike()` de evento sem tratamento de corrida do duplo-clique
`api/src/controllers/events-controller.ts:204-234` não trata `P2002` (diferente de `book()`, que trata corretamente) — dois cliques rápidos no "curtir" geram um 500 cru em vez de resposta graciosa.

### 3.11 Redução de capacidade de evento não valida inscrições já existentes
`api/src/controllers/events-controller.ts:77-125` — dá para editar `capacity` para um valor menor que o número de inscritos atuais, deixando o evento "sobrelotado" sem aviso.

### 3.12 Cobertura de teste insuficiente na área de maior risco
`reservations-controller.test.ts` só cobre janela de datas; não há nenhum teste para overlap, `approve`/`reject`/`cancel`, transições inválidas, ou `events-controller.ts` inteiro.

---

## 4. INTEGRIDADE DE DADOS (multi-tenancy, condominium requests, estrutura)

### 4.1 Corrida em aprovação/rejeição de CondominiumRequest sem lock otimista
`api/src/controllers/condominium-requests-controller.ts:83-225` — `approve`/`reject` leem `status` fora da transação e fazem `update` sem recondicionar ao status atual (deveria ser `updateMany` com `where: { status: "pending" }` + checar `count === 1`).
**Cenário:** dois admins clicam "aprovar" e "rejeitar" quase simultaneamente → resultado pode ser um condomínio + manager criados e funcionais, mas o pedido mostrando "rejeitado" (e-mail de rejeição já disparado).

### 4.2 Envio de e-mail após commit pode gerar 500 mesmo com o recurso já criado
`condominium-requests-controller.ts:112-159`, `staff-invites-controller.ts:111-192`, `resident-invites-controller.ts:115-213`, `users-controller.ts:73-136`, `auth-controller.ts:230-250` — envio de e-mail sem try/catch após a transação já ter comitado. Falha do provedor de e-mail (Resend) gera 500 mesmo com o recurso já persistido, e retry subsequente falha com "already exists" sem indicar que já deu certo.
**Fix:** try/catch isolado no envio, sem falhar a request principal.

### 4.3 `apartment` fica dessincronizado ao mudar papel de resident para outro papel
`api/src/controllers/users-controller.ts:368,391-393` — ao desconectar `residence` por mudança de papel, `apartment` só é limpo se vier explicitamente no body; senão, texto antigo permanece órfão.

### 4.4 Exclusão de Block não sincroniza dados denormalizados
`api/src/controllers/blocks-controller.ts:100-116` — cascade apaga `Residence`s e faz `SetNull` em `User.residenceId`, mas não limpa `User.apartment`/`ResidentInfo.building`, deixando o morador exibindo unidade "fantasma".

### 4.5 Renomear um Block não propaga para `ResidentInfo.building`
`api/src/controllers/blocks-controller.ts:58-98` — diferente de `residences-controller.ts:193-201` (que sincroniza corretamente ao mover residência), renomear um bloco não atualiza `building` dos moradores associados.

### 4.6 Nenhuma validação de formato de placa de veículo
`api/src/utils/vehicle.ts:1-19` + `api/src/validators/auth-schemas.ts:25-35` — aceita qualquer alfanumérico de 1-7 caracteres como placa, sem exigir padrão antigo (`ABC1234`) ou Mercosul (`ABC1D23`). Mesma lacuna no front (`web/src/utils/vehicle-plate.ts`).

### 4.7 Placas duplicadas entre moradores diferentes não são detectadas
`ResidentVehicle.plate` só tem índice, não `@unique`; nenhum controller checa duplicidade antes de criar — duas famílias podem cadastrar a mesma placa sem aviso.

### 4.8 `parkingSpot` obrigatório no validador Zod mas opcional no schema do banco
`api/src/validators/auth-schemas.ts:29-32` exige `min(1)` enquanto `schema.prisma:248` é `String?` — inconsistência que impede condomínios sem vaga fixa por unidade.

### 4.9 Sem limite de sanidade no campo `year` do veículo
`api/src/validators/auth-schemas.ts:33` aceita qualquer inteiro (negativo, 0, 99999).

### 4.10 `RetrievalLog.method` é string livre, não enum
`api/prisma/schema.prisma:330` — hoje só recebe `"codigo"`, mas nada impede valores arbitrários no futuro, prejudicando relatórios.

---

## 5. ESCALA / RISCO DE CRASH POR VOLUME

### 5.1 Listagem de Packages sem paginação
`api/src/controllers/packages-controller.ts:179-209` — retorna **todo** o histórico de encomendas do condomínio de uma vez, cada uma podendo carregar `imageUrl` em base64. Provavelmente o pior ponto de escala do sistema.

### 5.2 Listagem de Blocks/Residences sem paginação
`api/src/controllers/blocks-controller.ts:16-24`, `residences-controller.ts:76-83` — `findMany` sem `take/skip`, incluindo `imageUrl` de cada morador de cada residência.

### 5.3 Visit logs limitados a `take: 100` sem paginação real nem aviso na UI
`api/src/controllers/visitors-controller.ts:90-99` — hardcoded, sem `skip`/contagem total; staff não sabe que a lista foi truncada.

### 5.4 Upload de imagem sem limite de tamanho real nem validação de conteúdo no servidor
`api/src/validators/image-schemas.ts:3-9` só checa prefixo `data:image/`; único limite real é `express.json({ limit: "10mb" })` global (`api/src/app.ts:12`). Imagens ficam armazenadas como base64 direto no Postgres (sem storage externo/CDN), o que agrava os itens 5.1-5.3.

### 5.5 `PayloadTooLargeError` cai como 500 genérico
`api/src/middlewares/error-handling.ts:11-20` só trata `AppError`/`ZodError`; erros com `statusCode` próprio (como 413) perdem essa informação e viram 500 sem explicação para o usuário.

---

## 6. FRONTEND — ROBUSTEZ GERAL

### 6.1 Nenhum React ErrorBoundary em toda a árvore
Confirmado ausente em `main.tsx`, `app.tsx`, `routes/index.tsx`, `components/layout/app.tsx`. Qualquer exceção de render (acesso a propriedade de `undefined`, erro de biblioteca) derruba a aplicação inteira → tela branca sem fallback.
**Fix:** ErrorBoundary de nível superior envolvendo as rotas.

### 6.2 Sessão expirada (401) não força redirecionamento reativo
`web/src/lib/axios.ts:19-28` + `web/src/contexts/auth-provider.tsx:82-91` — ao expirar, o estado de sessão é limpo silenciosamente, mas nada navega o usuário para o login; ele fica preso na tela atual vendo chamadas falharem em loop até recarregar manualmente.

### 6.3 Exclusão de Block/Residence sem diálogo de confirmação
`web/src/pages/app/blocks.tsx:241-248`, `web/src/pages/app/residences.tsx:341-348` — clique direto chama a mutação, sem `AlertDialog` (ao contrário de `residents/delete-modal.tsx`). Um clique acidental apaga em cascata residências e desvincula moradores (ver 4.4).

### 6.4 Timezone: horário exibido pode divergir entre tela de agendamento e listagens
Ver item 3.7 — consequência direta é visível ao usuário final.

### 6.5 Um único estado de "pending" de mutação compartilhado por todos os itens do feed de eventos
`web/src/components/events/feed.tsx:47-52,232,253` — curtir/inscrever em um evento desabilita os botões de todos os outros eventos da lista enquanto a requisição está em voo.

### 6.6 UI de retirada de pacote não diferencia erro de "bloqueio por tentativas" (429) dos demais erros
`web/src/components/packages/retrieve-modal.tsx:78-86` — mensagens do backend chegam corretamente via toast, mas não há tratamento visual específico (contagem regressiva, desabilitar botão) para o 429.

### 6.7 Ações de editar/excluir pacote disponíveis mesmo após retirado/cancelado
`web/src/components/packages/table-row-packages.tsx:65-84` — `canManage` depende só do papel do usuário, não do status do pacote, espelhando os gaps 2.2/2.4 no back-end.

---

## 7. OBSERVAÇÕES / HARDENING MENOR

- **CORS totalmente aberto** (`api/src/app.ts:11` — `cors()` sem `origin` configurado): reflete qualquer origem em produção.
- **Login com múltiplas contas no mesmo e-mail** (`auth-controller.ts:107-125`): retorna JWT pronto para cada conta candidata em vez de um token de seleção intermediário — funcionalmente correto, mas expõe múltiplas sessões válidas num único payload.
- **`deleteUserWithRelations`** (`api/src/services/user-deletion-service.ts`) é uma lista manual de tabelas relacionadas; qualquer relação nova de `User` adicionada no futuro sem atualizar esse serviço causa erro de FK não tratado (500) ao excluir usuário.
- **Papel "manager" criado na aprovação de CondominiumRequest** (`condominiums-controller.ts:9-59`, `condominium-requests-controller.ts:83-170`): o gestor do condomínio recebe `role: manager`, não `admin` — condizente com o design (admin é reservado à plataforma), mas vale confirmar que é intencional dado o nome do fluxo.
- **Pastas `web/src/components/blocks/` vazias**: código morto/scaffold não usado.

---

## 8. LACUNAS DE COBERTURA DE TESTES

Não existe nenhum arquivo `*.test.ts` para os controllers onde estão os achados mais críticos:
- `auth-controller.ts`, `users-controller.ts`, `admin-users-controller.ts`, `condominium-requests-controller.ts`, `condominiums-controller.ts` (achados 1.1-1.7, 4.1, 4.2)
- `events-controller.ts` inteiro (achados 3.9-3.11)
- `reservations-controller.ts`: só testa janela de datas, não overlap/transições de status (achados 3.1-3.2)

Testes existentes cobrem apenas: `packages`, `reservations` (parcial), `resident-invites`, `staff-invites`, `visitors`.

---

## RESUMO POR PRIORIDADE DE CORREÇÃO

**Corrigir primeiro (segurança ativa/exploração trivial):**
1.1, 1.2, 1.3 (escalação de privilégio e account takeover via `/auth/users/:id`)
2.1, 2.2 (retirada de pacote cancelado / código não invalidado ao trocar morador)
3.1 (double-booking na aprovação de reserva)
1.5 (rate limiting, especialmente na rota pública de condominium-requests)

**Corrigir em seguida (integridade de dados / race conditions):**
4.1 (corrida em aprovação de condominium request), 2.6 (dupla entrada de visitante), 3.2/3.5/3.6 (máquina de estados de reservas), 2.3/2.4 (estados de pacote)

**Débito técnico / hardening (agendar):**
Timezone (3.7), paginação (5.1-5.3), ErrorBoundary (6.1), convites sem revogação (1.4), bcrypt cost (1.7), cobertura de testes (seção 8).
