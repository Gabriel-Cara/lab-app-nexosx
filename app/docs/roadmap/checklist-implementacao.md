# Checklist de Implementação — Roadmap NexosX

Data de início: 2026-08-16
Referências: `melhorias-nexosx.md` (detalhe de cada item) · `sequencia-implementacao.canvas` (visão visual da ordem)

## Como usar este arquivo

- Marque `[x]` quando o item estiver implementado **e verificado** (não basta o código existir — testar como nas sessões anteriores: DB local, servidor, e quando fizer sentido, navegador).
- Siga a ordem das fases de cima para baixo. Dentro de uma fase, a ordem dos itens não importa — mas não pule de fase sem fechar (ou conscientemente adiar) a anterior, porque as fases seguintes assumem que a fundação já existe.
- Ao concluir um item, adicione a data entre parênteses, ex: `- [x] Editar perfil de verdade (2026-08-20)`.
- Se um item for adiado ou descartado, não apague a linha — troque `[ ]` por `[~]` e escreva o motivo ao lado, pra manter o histórico de decisão.

## Progresso geral

**6 / 40 itens concluídos (15%)**

| Fase | Foco | Itens | Status |
|---|---|---|---|
| 0 | Fundação técnica | 3 | ✅ Concluído (2026-08-16) |
| 1 | Ativar notificações existentes | 3 | ✅ Concluído (2026-08-16) |
| 2 | Completar Reservas/Áreas | 4 | 🔲 Não iniciado |
| 3 | Completar Eventos | 3 | 🔲 Não iniciado |
| 4 | Completar Encomendas | 4 | 🔲 Não iniciado |
| 5 | Portaria avançada/Visitantes | 3 | 🔲 Não iniciado |
| 6 | Estrutura, moradores e convites | 7 | 🔲 Não iniciado |
| 7 | Ferramentas de gestão/admin | 5 | 🔲 Não iniciado |
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

- [ ] Recorrência de reserva (reservar o mesmo horário toda semana)
- [ ] Limite de reservas por morador/período
- [ ] Antecedência mínima configurável
- [ ] Calendário mensal consolidado (visão de todas as áreas)

## Fase 3 — Completar Eventos 🟢

- [ ] Cancelamento de inscrição pelo morador (`unbook`, hoje só existe `book`)
- [ ] Lista de espera quando o evento atinge capacidade máxima
- [ ] Check-in de presença no dia do evento

## Fase 4 — Completar Encomendas 🟢

- [ ] Filtro por status/morador na listagem (`api/src/controllers/packages-controller.ts:list`)
- [ ] Retirada por terceiro autorizado (procurador cadastrado pelo morador)
- [ ] Assinatura ou foto no ato da retirada
- [ ] Dashboard de volume/histórico

## Fase 5 — Portaria avançada / Visitantes 🟢

- [ ] Pré-cadastro com QR code gerado pelo morador
- [ ] Lista de visitantes frequentes/recorrentes (prestadores fixos)
- [ ] Blocklist de visitantes indesejados por condomínio

## Fase 6 — Estrutura, moradores e convites 🟢

- [ ] Desativação temporária de morador (viagem/afastamento, distinto de exclusão definitiva)
- [ ] Import em massa de moradores no onboarding de um condomínio inteiro
- [ ] Histórico de ocupação de blocos/unidades
- [ ] Distinção proprietário/inquilino
- [ ] Estender fluxo de convite para manager/admin (hoje só doorman/resident)
- [ ] Anexos/documentos no formulário público de solicitação de condomínio
- [ ] Galeria com múltiplas imagens por entidade (hoje é 1 `imageUrl` fixo)

## Fase 7 — Ferramentas de gestão e admin 🟢

- [ ] Dashboard do admin da plataforma (métricas agregadas)
- [ ] Configurações por condomínio (tenant-level: TTLs e políticas hoje são env vars globais)
- [ ] Central de convites pendentes (listagem de convites em aberto)
- [ ] Reenvio de convite ainda não utilizado
- [ ] Relatórios com exportação CSV (Encomendas, Visitantes, Reservas)

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
