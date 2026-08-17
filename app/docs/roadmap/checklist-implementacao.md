# Checklist de Implementação — Roadmap NexosX

Data de início: 2026-08-16
Referências: `melhorias-nexosx.md` (detalhe de cada item) · `sequencia-implementacao.canvas` (visão visual da ordem)

## Como usar este arquivo

- Marque `[x]` quando o item estiver implementado **e verificado** (não basta o código existir — testar como nas sessões anteriores: DB local, servidor, e quando fizer sentido, navegador).
- Siga a ordem das fases de cima para baixo. Dentro de uma fase, a ordem dos itens não importa — mas não pule de fase sem fechar (ou conscientemente adiar) a anterior, porque as fases seguintes assumem que a fundação já existe.
- Ao concluir um item, adicione a data entre parênteses, ex: `- [x] Editar perfil de verdade (2026-08-20)`.
- Se um item for adiado ou descartado, não apague a linha — troque `[ ]` por `[~]` e escreva o motivo ao lado, pra manter o histórico de decisão.

## Progresso geral

**32 / 40 itens concluídos (80%)**

| Fase | Foco | Itens | Status |
|---|---|---|---|
| 0 | Fundação técnica | 3 | ✅ Concluído (2026-08-16) |
| 1 | Ativar notificações existentes | 3 | ✅ Concluído (2026-08-16) |
| 2 | Completar Reservas/Áreas | 4 | ✅ Concluído (2026-08-16) |
| 3 | Completar Eventos | 3 | ✅ Concluído (2026-08-16) |
| 4 | Completar Encomendas | 4 | ✅ Concluído (2026-08-16) |
| 5 | Portaria avançada/Visitantes | 3 | ✅ Concluído (2026-08-17) |
| 6 | Estrutura, moradores e convites | 7 | ✅ Concluído (2026-08-17) |
| 7 | Ferramentas de gestão/admin | 5 | ✅ Concluído (2026-08-17) |
| 8 | Comunicação e engajamento | 2 | 🔲 Não iniciado |
| 9 | Novos módulos (baixa/média complexidade) | 3 | 🔲 Não iniciado |
| 10 | Módulos de alto valor/complexidade | 2 | 🔲 Não iniciado |
| 11 | Fronteira tecnológica | 1 | 🔲 Não iniciado |

Atualize a tabela acima e o contador de progresso conforme os itens forem fechados.

---

## Fase 0 — Fundação técnica 🔴

**Por que primeiro:** corrige o único mock visível do sistema e constrói a infraestrutura (notificação + auditoria) que praticamente todo o resto do roadmap vai usar. Construir isso depois de já ter 10 módulos novos custaria muito mais caro (retrofit).

- [x] Editar perfil de verdade (2026-08-16) — `PUT /auth/profile` (telefone, veículos, contato de emergência); nome/e-mail/apartamento/bloco viraram somente-leitura na tela (gerenciados pela administração); campo "Documento", que nunca foi persistido, foi removido.
- [x] Central de notificações in-app (2026-08-16) — tabela `notifications`, endpoints (`list`/`unread-count`/`mark-as-read`/`mark-all-read`), sino no header com badge e histórico. Ainda sem gatilho automático — isso é a Fase 1.
- [x] Auditoria centralizada (2026-08-16) — tabela `audit-logs`, `recordAudit()` integrado em 4 ações sensíveis (aprovação/rejeição de solicitação de condomínio, retirada de encomenda, mudança de role, exclusão de usuário), endpoint `GET /audit-logs` restrito a admin/manager. Testado ao vivo (DB local + servidor + navegador): perfil edita e persiste de verdade, sino mostra/marca notificações reais, e as 4 ações sensíveis geram entrada de auditoria correta.

## Fase 1 — Ativar notificações no que já existe 🔴

**Por que agora:** com a central pronta na Fase 0, liga os avisos que hoje morrem em `console.warn` ou simplesmente não existem — ganho de valor imediato sem precisar de módulo novo.

- [x] Alerta real de visita aberta há muito tempo (2026-08-16) — `flagStaleOpenVisits` notifica manager/doorman do condomínio, com dedup (só uma vez por visita, não a cada execução horária do job).
- [x] Notificação de aprovação/rejeição de reserva (2026-08-16) — `approve()`/`reject()` e o job de expiração automática (`expireStalePendingReservations`) notificam o morador com nome da área e data.
- [x] Lembrete automático de evento (2026-08-16) — novo `event-reminder-service.ts`, job horário, notifica moradores inscritos quando o evento entra na janela de `EVENT_REMINDER_HOURS_BEFORE` (24h por padrão), com dedup por evento. Testado ao vivo (DB local + servidor): as 3 notificações foram geradas com conteúdo correto e nenhuma duplicou ao rodar o job de novo.

## Fase 2 — Completar Reservas / Áreas comuns 🟢

**Por que agora:** é o módulo mais maduro do sistema — fechar as lacunas dele antes de abrir módulo novo mantém o foco em profundidade antes de amplitude.

- [x] Antecedência mínima configurável (2026-08-16) — `RESERVATION_MIN_LEAD_HOURS` (2h padrão), validada contra o horário real do slot, não só a data.
- [x] Limite de reservas por morador/período (2026-08-16) — `RESERVATION_ACTIVE_LIMIT_PER_RESIDENT` (4 padrão), conta reservas pendentes/aprovadas futuras do morador.
- [x] Recorrência de reserva (2026-08-16) — `recurrenceWeeks` no `POST /reservations`, cria em série (melhor esforço: semanas com conflito ou fora da janela de 1 mês são puladas e reportadas, não derrubam a série inteira); checkbox + seletor de semanas no modal de agendamento.
- [x] Calendário mensal consolidado (2026-08-16) — nova visão em `reservations.tsx` com todas as áreas, dias marcados por status (verde = aprovada, âmbar = só pendente), lista do dia selecionado.

Testado ao vivo (DB local + servidor + navegador): antecedência mínima rejeitada corretamente, limite de 4 bloqueou a 5ª reserva, série de 5 semanas criou 4 e pulou 1 (limite atingido) reportando o motivo, calendário mostrou e atualizou as cores certas após aprovar uma reserva pelo painel.

## Fase 3 — Completar Eventos 🟢

- [x] Lista de espera quando o evento atinge capacidade máxima (2026-08-16) — `EventBooking.status` (booked/waitlisted/attended); evento cheio não rejeita mais a inscrição, entra em espera.
- [x] Cancelamento de inscrição pelo morador (2026-08-16) — `DELETE /events/:id/book`; ao cancelar uma vaga confirmada, promove automaticamente o primeiro da lista de espera e notifica.
- [x] Check-in de presença no dia do evento (2026-08-16) — `PATCH /events/:id/check-in`, restrito a admin/manager/doorman; não permite check-in de quem está na lista de espera.

Testado ao vivo (DB local + servidor + navegador): evento com capacidade 2, 3º inscrito foi pra lista de espera, cancelamento do 1º promoveu o da fila com notificação real, check-in confirmado por dois residentes diferentes refletindo "Presença confirmada" na hora tanto pro morador quanto pro painel do gestor.

## Fase 4 — Completar Encomendas 🟢

- [x] Filtro por status/morador na listagem (2026-08-16) — `status`/`residentId` como query params reais (não mais filtro só no cliente); moradores nunca conseguem sobrescrever o próprio escopo.
- [x] Retirada por terceiro autorizado (2026-08-16) — moradores cadastram procuradores (nome + documento opcional) no próprio perfil; na retirada, a portaria escolhe entre "o próprio morador", um procurador cadastrado (nome/documento vêm do registro, não do que for digitado) ou "outra pessoa" com nome livre.
- [x] Assinatura ou foto no ato da retirada (2026-08-16) — campo `proofImageUrl` no `RetrievalLog`; captura por canvas de assinatura no modal de retirada, reaproveitando a mesma validação de imagem (magic-byte + tamanho) já usada no resto do sistema.
- [x] Dashboard de volume/histórico (2026-08-16) — `GET /packages/stats`: volume recebido/retirado por dia (30 dias por padrão), tempo médio até retirada, principais transportadoras, contagem por status/tipo.

Testado ao vivo (DB local + servidor + navegador): filtro por status e por morador refletindo corretamente na lista e ignorando tentativa de um morador ver encomendas de outro; retirada via procurador cadastrado (nome/documento herdados do registro) e via "outra pessoa" com nome livre + assinatura desenhada na hora, ambas persistidas no `RetrievalLog` e conferidas direto no banco; cadastro e remoção de procurador pela tela de perfil; dashboard atualizando em tempo real após uma retirada.

Corrigido de quebra (2026-08-17, achado numa bateria de regressão pós-Fase 7): o limite de tentativas do código de retirada (`PACKAGE_CODE_MAX_ATTEMPTS`) nunca travava de verdade — o incremento de `codeAttempts` acontecia dentro da mesma `$transaction` que em seguida dava `throw` pro código inválido, e o `throw` desfazia (rollback) o próprio incremento junto. Bug pré-existente desde a implementação original da Fase 4, não introduzido pela Fase 7 (que só trocou a fonte do limite de `env` fixo pra configuração por condomínio). Corrigido em `PackagesController.retrieve()` (`packages-controller.ts`): o incremento agora retorna do bloco da transação em vez de lançar erro dentro dele, e o `AppError` de "código inválido" é lançado só depois da transação já ter persistido. Adicionados 2 testes de regressão (`packages-controller.test.ts`) e verificado ao vivo: 3 tentativas erradas incrementaram `code-attempts` pra 3 no banco, a 4ª tentativa retornou `429 "Número máximo de tentativas atingido!"`.

## Fase 5 — Portaria avançada / Visitantes 🟢

- [x] Pré-cadastro com QR code gerado pelo morador (2026-08-17) — morador gera um código (8 caracteres, hash SHA-256 como os tokens de convite — bcrypt não permite busca por hash) com nome/documento opcional/motivo, exibido como QR code (gerado 100% no cliente, sem chamada de rede) e mostrado só uma vez. Porteiro resgata em `/visitor-pre-registrations/redeem`: valida não-encontrado/revogado/já usado/expirado, exige documento se o morador não informou, cria a visita já como entrada direta (sem etapa de aprovação) dentro de uma transação com reconferência para evitar resgate duplo em corrida, e notifica o morador.
- [x] Lista de visitantes frequentes/recorrentes (prestadores fixos) (2026-08-17) — `GET /visitors/frequent` lista os `Visitor` com `unlimitedAccess` (opção "VIP" já existente no formulário de cadastro), escopado ao próprio morador quando ele é quem consulta; entrada rápida reaproveita o endpoint de entrada já existente.
- [x] Blocklist de visitantes indesejados por condomínio (2026-08-17) — `Visitor.blocked/blockReason/blockedAt/blockedById`; `PATCH /visitors/:id/block` e `/unblock` (staff), com auditoria; bloqueio é checado tanto no cadastro comum (`register()`) quanto no resgate de pré-cadastro, antes de criar qualquer registro.

Corrigido de quebra: `visitLogInclude` em `visitors-controller.ts` fazia `include` bruto de `host`/`handledBy` (relações para `User`), vazando o hash bcrypt da senha em toda resposta de registro/entrada/saída/aprovação/rejeição de visitante — bug pré-existente, não introduzido nesta sessão. Corrigido trocando para `{ select: userSelect }` (util já usado no resto do projeto). Verificado ao vivo via curl que a resposta não contém mais o campo `password`.

Testado ao vivo (DB local + servidor + navegador, como morador e como porteiro): pré-cadastro gerado com QR e código exibidos, copiado, listado, cancelado; resgate pelo porteiro com documento preenchido na hora (quando o morador não informou), criando a visita como "Entrou" direto na lista principal; visitante VIP aparecendo na lista de frequentes (escopado por morador) com entrada rápida corretamente bloqueada quando já há visita aberta; bloqueio de visitante com e sem motivo, badge "Bloqueado" refletido na tabela principal, nova tentativa de cadastro do mesmo documento rejeitada, desbloqueio limpando o badge — corrigido um bug de cache do React Query em que o desbloqueio só atualizava o card de bloqueados e não a tabela principal (invalidação de query estava restrita demais).

## Fase 6 — Estrutura, moradores e convites 🟢

- [x] Desativação temporária de morador (2026-08-17) — `User.active/deactivatedAt/deactivatedReason/deactivatedById`; login bloqueado com mensagem clara quando a única conta com senha correta está inativa (checado depois do match de senha, pra nunca revelar existência de conta inativa por senha errada); `POST /auth/users/:id/deactivate` e `/reactivate` (admin/manager), cadastro/histórico/unidade preservados — distinto de exclusão.
- [x] Import em massa de moradores (2026-08-17) — `POST /auth/users/bulk`, melhor esforço linha a linha (uma duplicata não derruba o lote), reaproveita a mesma resolução de residência/convite por e-mail do cadastro individual; UI cola uma lista (nome, e-mail, apartamento, torre, proprietário/inquilino) num textarea.
- [x] Histórico de ocupação de blocos/unidades (2026-08-17) — nova tabela `ResidenceOccupancyLog` (um registro por estadia, fecha com `movedOutAt` e abre um novo ao trocar de residência), alimentada em todo ponto que muda `residenceId` (criação, edição, autocadastro por convite); `GET /residences/:id/occupancy-history`.
- [x] Distinção proprietário/inquilino (2026-08-17) — `ResidentInfo.ownershipType` (owner/tenant, opcional — moradores antigos não têm valor definido).
- [x] Estender fluxo de convite para manager (2026-08-17) — `StaffInvite.role`, validado com `canAssignRole` (mesma hierarquia que já existia pra `/auth/users`); "admin" continua de fora de propósito — é papel de plataforma, nunca atribuível por convite de tenant (documentado em `role-hierarchy.ts`). UI só mostra a opção "Gerente" pra quem tem permissão de convidar um.
- [x] Anexos no formulário público de solicitação de condomínio (2026-08-17) — `CondominiumRequestAttachment`, até 5 imagens reaproveitando a mesma validação de magic-byte já usada no resto do sistema (documentos como PDF ficariam sem essa validação, por isso o escopo é só fotos de documentos).
- [x] Galeria com múltiplas imagens por entidade (2026-08-17) — nova tabela `EntityImage`, endpoints `/entity-images` (list/upload/delete), escopada a `event` e `area` (onde uma galeria faz sentido de verdade) — `imageUrl` único continua sendo a capa, a galeria é aditiva.

Corrigido de quebra: um doorman tentando uma ação restrita a admin/manager (ex: desativar morador) recebia 401 do backend — e o interceptor global do axios trata qualquer 401 como sessão expirada, deslogando o usuário em vez de mostrar "sem permissão". Comportamento pré-existente em toda a aplicação (não introduzido nesta sessão, `authorize()` sempre devolveu 401 pra role insuficiente); descoberto testando a desativação como doorman. Fora do escopo desta fase corrigir — anotado para uma futura revisão do middleware de autorização.

Testado ao vivo (DB local + servidor + navegador, como morador/gestor/porteiro/admin): desativação com motivo bloqueando login (mensagem clara) e reativação liberando de novo; import colando 2 linhas com 1 duplicata proposital (criou 2, pulou 1, motivo exibido); troca de unidade de um morador mostrando `movedOutAt` na unidade antiga e "Atual" na nova; badges "Proprietário"/"Inquilino" no cadastro e na listagem; seletor de cargo no convite de portaria escondendo "Gerente" pra um gestor e permitindo pra um admin (confirmado também via curl: manager convidando manager rejeitado, admin convidando manager e o convidado assumindo o cargo certo no cadastro); anexo de solicitação pública aparecendo como miniatura clicável na tela do admin; galeria de evento listando a imagem existente e removendo com sucesso pela UI (upload múltiplo e purga de staff-only validados via curl).

## Fase 7 — Ferramentas de gestão e admin 🟢

- [x] Dashboard do admin da plataforma (2026-08-17) — `GET /admin/dashboard`: total de condomínios, usuários por cargo, solicitações por status/taxa de aprovação, crescimento de condomínios por mês (12 meses) e as 5 solicitações pendentes mais recentes. Nova tela `admin/dashboard` virou o destino padrão do admin ao logar (antes era `admin/requests`).
- [x] Configurações por condomínio (2026-08-17) — nova tabela `CondominiumSettings` (1:1 com `Condominium`, campos nulos = usa o padrão global do `env.ts`): `visitorAuthorizationTtlHours`, `visitorPendingTtlHours`, `reservationPendingTtlHours`, `packageCodeMaxAttempts`. `GET/PUT /condominium-settings` (gestor), resolvidos via `getEffectiveCondominiumSettings()`/`getEffectiveSettingsByCondominium()` nos pontos que antes liam a env var direto (aprovação de visita, retirada de encomenda, e os dois jobs de expiração — que agora comparam cada registro pendente contra o TTL do seu próprio condomínio em vez de um deadline global único). Nova tela `condominium-settings` para o gestor.
- [x] Central de convites pendentes (2026-08-17) — `GET /auth/doorman-invites` e `GET /auth/resident-invites` listam os convites do condomínio com status calculado (pendente/usado/revogado/expirado). Precisou de um campo novo `usedAt` em `StaffInvite`/`ResidentInvite` (antes o "uso" não era registrado em lugar nenhum — setado dentro da mesma transação do `signUp()`). Nova tela `invites`.
- [x] Reenvio de convite ainda não utilizado (2026-08-17) — `POST /auth/doorman-invites/:id/resend` e `/auth/resident-invites/:id/resend`. Como só o hash SHA-256 do token é armazenado (nunca o token em texto puro), o link original é irrecuperável por design — "reenviar" gera um token novo na mesma linha do convite (revoga implicitamente o link anterior) e devolve o novo link pra copiar/compartilhar. Documentado no código como limitação técnica intencional, não lacuna.
- [x] Relatórios com exportação CSV (2026-08-17) — `GET /packages/export`, `/visitors/export`, `/reservations/export` (staff apenas), reaproveitando os mesmos filtros da listagem. Botão "Exportar CSV" nas telas de Encomendas, Visitantes e Agendamentos.

Testado ao vivo (DB local + servidor + navegador, como gestor e como admin da plataforma): dashboard do admin mostrando métricas reais e gráfico de crescimento com a barra do mês atual; configurações do condomínio salvando um override (testado com tentativas do código de encomenda) e voltando a mostrar o placeholder do padrão da plataforma depois de limpo; central de convites listando os 3 convites de portaria/gerência pendentes; reenvio de um convite de porteiro gerando novo link com aviso claro de que o anterior parou de funcionar; exportação CSV testada nas 3 telas (Encomendas, Visitantes, Agendamentos) com os arquivos baixados e conferidos.

## Fase 8 — Comunicação e engajamento 🟣

**Por que agora:** depende diretamente da central de notificações construída na Fase 0 pra ter valor de verdade.

- [ ] Mural de comunicados (broadcast do síndico, geral ou por bloco)
- [ ] Push notifications nativas (Web Push, além de SMS/WhatsApp)

## Fase 9 — Novos módulos operacionais (baixa/média complexidade) 🟣

- [ ] Documentos/Atas (regimento interno, atas de assembleia)
- [ ] Chamados de manutenção/suporte (reaproveita a máquina de estados de Package/Visitor)
- [ ] Relatórios/BI agregados (ocupação, volume, taxa de aprovação — dados já existem)

## Fase 10 — Módulos de alto valor / alta complexidade 🟣

**Por que por último entre os módulos:** se beneficiam diretamente da auditoria centralizada (Fase 0) e envolvem maior complexidade/risco (gateway de pagamento, regras de quórum).

- [ ] Financeiro/Taxas condominiais (boleto, inadimplência, prestação de contas)
- [ ] Assembleias/Votação digital (quórum e votação remota)

## Fase 11 — Fronteira tecnológica 🟣

- [ ] Integração com hardware de portaria (interfone IP, catraca, leitor de placa, câmeras)

---

## Notas de acompanhamento

_(espaço livre para registrar decisões, adiamentos ou mudanças de escopo conforme o roadmap avança — mantenha entradas datadas, ex: "2026-09-01: Fase 3 adiada, priorizamos Financeiro por pedido de cliente-piloto".)_
