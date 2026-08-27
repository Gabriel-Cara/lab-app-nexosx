# Roadmap de Evolução — NexosX

Data: 2026-08-16
Escopo: oportunidades de produto para `app/api` e `app/web`, levantadas após a auditoria de segurança/bugs de 2026-08-15 (todos os ~67 itens daquela auditoria já corrigidos — ver `docs/desenvolvimento/tecnico/auditoria-seguranca-2026-08-15.md`). Com o sistema estabilizado, este documento olha para frente: o que melhorar, o que construir dentro dos módulos existentes, e onde faz sentido abrir módulo novo.

> **Status: majoritariamente implementado.** Este é o documento de origem do roadmap — a maioria dos itens abaixo já foi entregue ao longo das Fases 0-13 de `checklist-implementacao.md` (fonte da verdade sobre o que está feito hoje). Mantido como registro do raciocínio original por trás de cada escolha ("por que importa"), não como lista de pendências.

Método: levantamento dirigido em 3 frentes — inventário de módulos de backend (controllers + schema Prisma), inventário de telas por papel no frontend, e leitura da documentação institucional (`docs/corporativo/apresentacao/`) para checar alinhamento com a visão de produto declarada. Cada item cita o módulo/arquivo real por trás da observação, não é uma lista genérica de "features que todo SaaS tem".

Companion visual: `melhorias-nexosx.canvas` (abre no Obsidian, mesmo vault deste diretório).

---

## Contexto rápido do produto

NexosX é um SaaS multi-tenant de gestão de portaria/condomínio para o mercado brasileiro, com 4 papéis (`admin` da plataforma, `manager`/síndico, `doorman`/porteiro, `resident`/morador) e onboarding self-service (solicitação pública → aprovação do admin → condomínio e gestor criados automaticamente). A arquitetura já suporta bem os fluxos operacionais do dia a dia (encomendas, visitantes, reservas de área, eventos). As oportunidades abaixo são sobre completar o que existe, estender módulos com funcionalidades que moradores/síndicos esperariam de um produto maduro, e abrir a porta para os módulos que normalmente definem a diferenciação comercial desse tipo de produto (financeiro, comunicação, manutenção).

---

## 1. Melhorias em funcionalidades existentes

Itens de polimento/completude — coisas que já existem mas estão incompletas, mockadas, ou faltando um recurso óbvio.

| Item | Onde | Por que importa |
|---|---|---|
| **Editar perfil de verdade** | `web/src/pages/app/profile.tsx:141-151` | O `handleSubmit` hoje só faz `console.log(...)` e mostra um toast mockado ("sucesso (mock)!") — não existe endpoint de `PATCH`/`PUT` de perfil chamado pelo frontend. É a única tela do sistema fingindo que funciona; qualquer usuário que tentar editar o próprio telefone/veículos vai achar que salvou e não salvou nada. |
| **Dashboard do admin da plataforma** | `web/src/pages/admin/*.tsx` | O admin (operador da plataforma) não tem Home/métricas agregadas — só 3 telas isoladas de gestão (solicitações, condomínios, usuários). Sem visão de quantos condomínios estão ativos, taxa de aprovação de solicitações, crescimento no tempo. |
| **Configurações por condomínio (tenant-level)** | `api/src/env.ts` | TTLs e políticas hoje são env vars globais do processo: `VISITOR_AUTHORIZATION_TTL_HOURS`, `VISITOR_PENDING_TTL_HOURS`, `RESERVATION_PENDING_TTL_HOURS`, `PACKAGE_CODE_MAX_ATTEMPTS`. Cada condomínio tem regras internas diferentes na prática — isso deveria ser configurável por tenant, não fixo pro sistema inteiro. |
| **Alerta real de visita aberta há muito tempo** | `api/src/services/visitor-status-service.ts` (`flagStaleOpenVisits`) | Hoje só vira `console.warn` no log do servidor — ninguém no condomínio fica sabendo que uma entrada ficou aberta (porteiro esqueceu de dar saída). Precisa virar notificação de verdade pro síndico/portaria. |
| **Central de convites pendentes** | `api/src/controllers/staff-invites-controller.ts`, `resident-invites-controller.ts` | Hoje só dá pra criar/consultar um convite por token e revogar individualmente — não existe uma tela/endpoint de listagem de "convites em aberto" pro síndico ver o que já foi enviado e ainda não foi usado. |
| **Reenviar convite ainda não utilizado** | mesmo módulo acima | Distinto de revogar: o link continuaria válido, só seria reenviado por outro canal (o morador perdeu o e-mail/link original). |
| **Filtro por status/morador em Encomendas** | `api/src/controllers/packages-controller.ts:list` | A listagem já pagina (fix de 2026-08-15), mas não filtra por `status` nem `residentId` — útil pra portaria em condomínios com volume alto de encomendas. |
| **Relatórios com exportação (CSV)** | módulos de Encomendas, Visitantes, Reservas | Todos já têm paginação real — exportação é o próximo passo natural pra síndicos que precisam levar dado pra fora do sistema (assembleia, prestação de contas informal). |

---

## 2. Novas funcionalidades dentro de módulos existentes

Ideias que estendem um módulo atual sem precisar virar módulo novo.

### 📅 Reservas / Áreas comuns
- **Recorrência**: reservar o mesmo horário toda semana (ex.: aula fixa na quadra), sem repetir o cadastro manualmente.
- **Limite de reservas por morador/período**: evitar que um único morador monopolize a agenda de uma área concorrida.
- **Antecedência mínima configurável**: impedir reserva de última hora quando a área precisa de preparo (salão de festas, por exemplo).
- **Notificação de aprovação/rejeição**: hoje o morador só descobre olhando a tela; devia ser avisado ativamente.
- **Visão de calendário mensal consolidada**: hoje é lista/modal (`reservations-table.tsx`, `schedule-modal.tsx`); uma visão de calendário ajudaria o síndico a enxergar ocupação de todas as áreas de uma vez.

### 🎉 Eventos
- **Lista de espera** quando o evento atinge a capacidade máxima.
- **Cancelamento de inscrição pelo próprio morador** — hoje existe `book()` mas não existe `unbook()` para o morador desistir sozinho.
- **Lembrete automático** antes do evento começar.
- **Check-in de presença** no dia, distinto de "inscrito".

### 📦 Encomendas
- **Retirada por terceiro autorizado** (procurador cadastrado pelo morador).
- **Assinatura ou foto no ato da retirada** — reforço de segurança/prova de entrega além do código.
- **Dashboard de volume/histórico** por período, tipo de encomenda, transportadora.

### 🚪 Visitantes / Portaria
- **Pré-cadastro com QR code** gerado pelo próprio morador e escaneado na portaria — acelera a entrada e reduz erro de digitação de documento.
- **Lista de visitantes frequentes/recorrentes** (prestadores de serviço fixos: diarista, professor particular) sem precisar recadastrar toda visita.
- **Blocklist** de visitantes indesejados por condomínio.

### 👥 Moradores / Usuários
- **Desativação temporária** (viagem/afastamento longo) em vez de só exclusão definitiva — hoje `deleteUserWithRelations` é a única saída além de manter o cadastro ativo.
- **Import em massa** de moradores no onboarding de um condomínio inteiro, em vez de cadastro um a um.

### 🏢 Blocos / Residências
- **Histórico de ocupação**: quem morou em qual unidade e quando — útil pra síndico/administradora em disputas ou auditorias.
- **Distinção proprietário/inquilino** — hoje o modelo trata todo morador da mesma forma.

### ✉️ Convites
- **Estender o fluxo de convite para manager/admin** — hoje só `doorman`/`resident` têm fluxo de convite por link; um novo síndico ou administrador de plataforma precisa ser criado de outra forma.

### 🏗️ Solicitação de condomínio
- **Anexos/documentos no formulário público** (contrato social, ata de eleição do síndico) — hoje a solicitação é só texto, sem prova documental pro admin da plataforma avaliar.

### 🖼️ Imagens
- **Galeria com múltiplas imagens por entidade** — hoje o schema tem um único campo `imageUrl` fixo por registro (pacote, área, evento, visita); uma área de lazer ou evento se beneficiaria de várias fotos.

---

## 3. Novos módulos

Capacidades hoje totalmente ausentes do sistema que, pela natureza do produto, mereceriam módulo próprio. Ordenados aproximadamente por relação valor percebido / esforço de construção.

### 1. 📢 Mural de comunicados
Broadcast do síndico para todos os moradores, ou filtrado por bloco. Esta foi a lacuna citada de forma independente pelas três frentes de pesquisa (backend, frontend e docs institucionais) — é provavelmente o item de maior consenso deste roadmap.

### 2. 🔔 Central de notificações in-app
Sino, contador de não lidas, histórico. Hoje o sistema só notifica via SMS/WhatsApp (Twilio) e apenas no fluxo de encomendas (`api/src/services/notification-service.ts`) — nenhum outro módulo tem canal de notificação ativa. **Isto é fundação técnica**: praticamente todo item deste roadmap que menciona "avisar o morador"/"notificação" (chegada de visitante, reserva aprovada, comunicado novo, chamado respondido) depende de uma central de notificações para ter valor de verdade. Vale considerar cedo, não como "mais um módulo entre outros".

### 3. 💰 Financeiro / Taxas condominiais
Emissão de boleto, controle de inadimplência, prestação de contas. Provavelmente o módulo de maior valor comercial percebido por síndicos e administradoras — também o de maior complexidade e risco, por envolver integração com gateway de pagamento/banco e questões contábeis/fiscais que vão além do domínio atual do sistema.

### 4. 🔧 Chamados de manutenção / suporte
Morador abre um chamado (elevador quebrado, vazamento na área comum), portaria/síndico acompanha e atualiza o status. Reaproveita quase diretamente o mesmo padrão de máquina de estados já usado em `Package`/`Visitor` (pendente → em andamento → resolvido) — implementação relativamente rápida dado o que já existe no sistema.

### 5. 📄 Documentos / Atas
Repositório de regimento interno, atas de assembleia, convenção do condomínio. Complexidade técnica baixa (upload + listagem, reaproveitando a infraestrutura de imagens/arquivos já existente), mas alto valor percebido pelo morador — é um dos pedidos mais comuns em produtos de gestão condominial.

### 6. 🗳️ Assembleias / Votação digital
Quórum e votação remota para decisões do condomínio. Maior complexidade (regras de quórum, prova de identidade do voto), mas resolve uma dor real e recorrente de gestão condominial presencial.

### 7. 📊 Relatórios / BI agregados
Ocupação de áreas comuns ao longo do tempo, volume de encomendas/visitantes por período, taxa de aprovação de reservas, etc. Os dados para isso já existem no banco (todos os módulos operacionais já persistem histórico) — falta apenas a camada de agregação e visualização, não a captura de dado em si.

### 8. 🔌 Integração com hardware de portaria
Interfone IP, catraca, leitor de placa, câmeras de segurança. Maior complexidade técnica e depende de parcerias com fabricantes de hardware, mas é o "próximo nível" natural para um produto cujo núcleo já é controle de acesso físico (visitantes, encomendas).

### 9. 🕵️ Auditoria centralizada
Hoje cada módulo tem seu próprio rastro implícito e isolado (`RetrievalLog` em encomendas, `decidedById`/`decidedAt` em `CondominiumRequest`), mas não existe um log de auditoria unificado e pesquisável ("quem fez o quê, quando, em qual condomínio"). **Também é fundação técnica**: fica consideravelmente mais barato construir isso agora, com o número atual de módulos, do que depois de adicionar financeiro/chamados/assembleias — cada módulo novo aumenta o custo de retrofit de uma trilha de auditoria unificada.

### 10. 📲 Push notifications nativas (Web Push)
O frontend já é um PWA — falta a camada de push de verdade além de SMS/WhatsApp. Funciona em conjunto direto com a Central de notificações in-app (item 2): a central guarda o histórico, o push é o canal de entrega imediata mesmo com o app fechado.

---

## Nota de fechamento: fundação técnica primeiro

Dois itens deste roadmap — **Central de notificações in-app** (novo módulo #2) e **Auditoria centralizada** (novo módulo #9) — não são "só mais uma ideia na lista". Praticamente todo outro item que envolve avisar alguém ou rastrear uma decisão depende de um desses dois. Vale avaliar se faz sentido priorizá-los antes de expandir para os módulos de maior superfície (financeiro, chamados, assembleias), para não ter que retrofitar notificação/auditoria em cada módulo novo separadamente.
