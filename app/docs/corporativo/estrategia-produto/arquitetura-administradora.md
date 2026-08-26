# Arquitetura da Experiência da Administradora — NexosX

Data: 2026-08-26
Escopo: reformular o que a administradora (persona multi-condomínio) vê como tela principal do NexosX, a partir de uma correção de rumo do founder sobre o que foi entregue nesta mesma sessão (`portfolio.tsx`, "Minha Carteira"). Não repete o conteúdo de `gaps-administradoras-multi-condominio.md` — parte dele (B5, B6, B7) e o estende.
Método: cruzamento da fala do founder — "a parte da administradora é mais 'gerir' os síndicos de cada condomínio, mantendo a função de 'olhar por dentro' caso queira, mas sinto que deve ser uma visão mais de 'gestão'" — com o modelo de dados já implementado (`Organization`, `organizationId`) e as telas já entregues (`portfolio.tsx`, `condominium-switcher.tsx`).
Companion visual: `arquitetura-administradora.canvas`

---

## Contexto: o que foi entregue vs. o que o founder quer agora

"Minha Carteira" (item B6 do gaps doc, entregue nesta sessão) é hoje a tela inicial da administradora: um grid de cards, um por condomínio, cada um com 4 métricas operacionais (encomendas pendentes, visitantes ativos, moradores cadastrados, reservas aprovadas) e um botão "Acessar este condomínio" que troca o condomínio ativo e leva pro dashboard operacional completo daquele condomínio.

O founder gostou da capacidade de "olhar por dentro" de um condomínio específico, mas não concorda que essa deva ser a tela principal. A visão dele: o papel da administradora é **gerir os síndicos de cada condomínio** — uma visão de gestão/portfólio — e "olhar por dentro" deve continuar existindo, mas como ação secundária, não como a primeira coisa que a administradora vê ao entrar no sistema.

---

## 0. O fork conceitual — o que significa "gerir os síndicos" hoje

Antes de desenhar qualquer tela nova, existe uma pergunta que o modelo de dados atual força a responder: **hoje não existe um "síndico" como pessoa distinta de quem é dono da carteira.** Um usuário org-scoped (`organizationId` setado) *é* o síndico de cada condomínio, na hora em que troca o condomínio ativo — não existe uma segunda conta, subordinada, representando "o síndico daquele prédio especificamente". Isso já foi mapeado nos itens B1/B2 do gaps doc (ambos ✅ resolvidos): `organizationId` expressa "administra uma carteira", não "delega a operação para outra pessoa".

Isso significa que "gerir os síndicos" pode apontar pra duas coisas bem diferentes, com custos de implementação muito distintos — mesmo padrão do Fork original (`gaps-administradoras-multi-condominio.md` §0), e como lá, esta decisão é do founder, não algo que este documento resolve sozinho.

### Opção (a) — gestão relacional/operacional, sem uma segunda camada de contas

A "gestão de síndicos" vira, na prática, uma **visão de portfólio com sinais de saúde por condomínio** — inadimplência, chamados abertos, atividade recente, contato do síndico local (que pode ou não usar o sistema) — sem exigir uma conta separada por condomínio. O "síndico" de cada prédio, no sentido do sistema, continua sendo a própria administradora vestindo aquele chapéu quando necessário.

- **O que já existe pra isso**: o endpoint `GET /organizations/me/portfolio-summary` (`organizations-controller.ts`) já faz exatamente esse fan-out de métricas por condomínio — a mudança é *quais* métricas mostrar e *como* a tela se organiza (lista de gestão, não grid de cards operacionais).
- **Prós**: zero mudança de schema, zero mudança de auth, entrega rápida — é essencialmente re-priorizar B5/B6 do gaps doc com um recorte "gestão" em vez de "operação".
- **Contras**: não resolve literalmente "gerir os síndicos" no sentido de gerir *pessoas* — não há quem "gerir" de fato, é uma visão de dados sobre condomínios, não sobre pessoas.

### Opção (b) — síndico como pessoa distinta, gerida pela administradora

Um modelo genuinamente hierárquico: a administradora convida/atribui uma pessoa real (funcionário ou terceirizado) como síndico de um condomínio específico — conta própria, `role: manager`, vinculada a um único condomínio (não à organização) — enquanto a conta da administradora tem uma camada de supervisão sobre essas contas: ver atividade, métricas de desempenho, substituir/reatribuir síndicos, talvez agir em nome deles.

- **O que precisaria mudar**: um relacionamento explícito "quem é o síndico deste condomínio, atribuído por qual administradora" — hoje não existe (o `addMember` de `organizations-controller.ts` só anexa a própria conta org-scoped a um condomínio, não cria uma segunda pessoa). Toca fluxo de convite/staff, permissões (o que a administradora pode ver/fazer em nome do síndico), e é comparável em escopo ao próprio trabalho de criar `Organization` nesta sessão — não é um ajuste de tela, é um novo Fork.
- **Prós**: resolve "gerir os síndicos" no sentido literal — gestão de pessoas, não só de dados.
- **Contras**: esforço grande, não entra em MVP; levanta perguntas de produto ainda não respondidas (a administradora sempre tem um síndico local, ou às vezes ela mesma opera o condomínio diretamente? um síndico pode ser compartilhado por duas administradoras — não, isso não faz sentido — mas pode um condomínio ter zero síndico dedicado e ficar só com a administradora operando via troca de condomínio, como hoje?).

**Recomendação de sequenciamento (não é a decisão em si)**: opção (a) é um MVP honesto e evolutível — dá pra entregar rápido, valida se "visão de portfólio" já resolve a dor descrita, e não fecha a porta pra opção (b) depois (o "síndico" de opção (b), quando existir, encaixaria como uma nova camada sobre a mesma tela de portfólio, não como uma reescrita). Mas a escolha entre (a) e (b) — e se (b) vale a pena perseguir — é do founder.

---

## 1. Arquitetura de telas proposta (assumindo opção a, curto prazo)

| Tela | Papel | Substitui/relação com o que existe |
| --- | --- | --- |
| **Painel de Gestão** (nova, landing da administradora) | Visão de portfólio: lista de condomínios com colunas de gestão (nome/código, status de saúde, inadimplência, chamados abertos, contato local, última atividade) em vez do grid de 4 métricas operacionais | Substitui `portfolio.tsx` como landing page — a rota `/portfolio` (ou uma nova `/carteira`) passa a renderizar esta lista de gestão |
| **Minha Carteira / Ver por dentro** (rebaixada, não removida) | O grid de cards com as 4 métricas operacionais + botão de trocar condomínio — exatamente o que já existe hoje | Vira uma ação/aba secundária a partir do Painel de Gestão (ex: clicar numa linha da lista abre o card detalhado daquele condomínio, ou um toggle "ver como cards operacionais") — não é descartado, só deixa de ser a primeira tela |
| **Seletor "Trocar condomínio"** (menu de conta) | Trocar o condomínio ativo rapidamente, sem passar por nenhuma tela de portfólio | Fica exatamente como está (`condominium-switcher.tsx`) — é ortogonal a qual tela vence como landing; continua sendo o atalho rápido pra quem já sabe pra onde quer ir |

### O que entra na "visão de gestão" que hoje não existe

| Dado | Já existe no schema? | Fonte |
| --- | --- | --- |
| Inadimplência por condomínio | Sim | `Charge` (status `overdue`/`paid`/etc, já usado no módulo Financeiro — ver `melhorias-nexosx.md`) — precisa só de uma query agregada por condomínio, mesmo padrão do `portfolioSummary` |
| Chamados abertos por condomínio | Sim | `MaintenanceRequest` (status `pending`/`in_progress`) — mesma lógica de fan-out já usada pros contadores atuais |
| Contato do síndico local | Parcial | Se opção (a): não existe um campo dedicado — precisaria de um campo livre (nome/telefone de contato) no `Condominium` ou reaproveitar dados do `CondominiumRequest` original. Se opção (b): seria o próprio `User` do síndico |
| Última atividade / "condomínio esquecido" | Não | Precisaria de um sinal novo (ex: data do último login de qualquer usuário daquele condomínio, ou última ação registrada) — não existe hoje em nenhum lugar do sistema, nem no dashboard operacional |
| Status de saúde (ativo/atenção/crítico) | Não | Provavelmente derivado (regra simples: inadimplência alta + chamados acumulados = "atenção"), não um campo armazenado — decisão de produto em aberto, não uma pergunta técnica |

---

## Nota de fechamento

Este documento não substitui `gaps-administradoras-multi-condominio.md` — ele detalha e reprioriza especificamente os itens B5/B6/B7 daquele documento à luz da correção de rumo do founder, e abre um novo fork (§0) que é conceitualmente irmão do Fork original (Organization), mas ainda maior em ambiguidade de produto: "gerir síndicos" pode significar dado agregado (opção a, rápida) ou pessoas de verdade (opção b, um novo projeto). Nenhuma linha de código foi alterada a partir deste documento — é uma proposta de arquitetura para avaliação, não um plano de implementação aprovado.
