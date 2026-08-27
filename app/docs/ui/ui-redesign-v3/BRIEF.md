# NexosX — Redesign v3 (bloco Operacional: Chamados, Portaria, Áreas de Lazer, Agendamentos)

Isto é uma continuação do porte v2, que já foi aprovado e portado para o app
real. O design system (`shared/tokens.css`, `shared/base.css`,
`shared/components.css`, `shared/icons.svg`-equivalente já embutido em cada
página, `shared/app.js`) já está validado — **não invente componentes ou
cores novas**. Sua tarefa é só compor páginas novas com o vocabulário que já
existe.

## Passo a passo obrigatório

1. **Leia `docs/ui-redesign-v2/pages/visitantes.html` inteiro** — é o modelo
   de referência mais completo: sidebar, topbar, page-header com ações,
   `stat-grid` de 4 `stat-card`s, `filter-bar` (busca + `segmented`), `card`
   com `table` (`identity-cell`, `avatar`, `badge` com variantes
   `badge-warning/success/info/danger/neutral`, `cell-actions` com botões
   `btn-sm`), um modal de criação (`modal-scrim` + `.modal`), e o sprite SVG
   completo de ícones (`<symbol id="...">`) colado no `<body>`. **Copie essa
   estrutura HTML como ponto de partida** — não redesenhe do zero.
2. Os 3 `<link rel="stylesheet">` devem apontar para
   `../shared/tokens.css`, `../shared/base.css`, `../shared/components.css`
   (mesmo caminho relativo de dentro de `docs/ui-redesign-v3/pages/`).
   Fonte: Montserrat (mesmo link do Google Fonts do arquivo de referência).
3. **Cole o sprite `<svg>` inteiro** (todos os `<symbol>`) do
   `visitantes.html` no topo do `<body>` — ele já tem praticamente todos os
   ícones necessários (wrench, user-cog, activity, calendar, clock,
   check-circle, x-circle, edit, trash, plus, search, filter, mail, link,
   phone, map-pin, shield-check, download, upload etc.). Se faltar algum
   ícone muito específico, reutilize o mais próximo semanticamente já
   existente em vez de inventar um `<symbol>` novo.
4. Sidebar: copie a lista de navegação inteira do `visitantes.html`, só
   trocando qual `<li>` tem a classe `active` (a página atual) e ajustando
   os `href` para os arquivos desta pasta (`chamados.html`, `portaria.html`,
   `areas-lazer.html`, `agendamentos.html`) — mantenha os outros como `#`
   como já está no exemplo.
5. **Dados fictícios**: use SOMENTE os campos reais listados na seção da sua
   página abaixo — eles vêm do schema real da API. Não invente campos como
   "bloco" (a API só tem `apartment`), nem datas de criação onde a doc diz
   que não existem. Os números dos `stat-card` devem ser somas/contagens
   plausíveis dos itens de exemplo que você colocar na tabela/lista logo
   abaixo — ou seja, se a tabela tem 3 chamados pendentes, o stat-card
   "Pendentes" mostra 3, não um número solto.
6. Português do Brasil em tudo. Sem gírias, sem emoji.
7. Responsivo: siga os mesmos breakpoints/`@media` já usados no arquivo de
   referência (a classe `.filter-bar`, `.stat-grid`, `.table.stack-mobile`
   já cuidam disso — só copie o padrão).
8. No fim, salve o arquivo em `docs/ui-redesign-v3/pages/<nome>.html`
   (nome exato indicado na seção da sua página).

## Vocabulário disponível (não crie nada fora disso)

- `.stat-grid` + `.stat-card` (com `.top`, `.stat-icon.tone-{accent,success,warning,danger,info}`, `.stat-value`, `.stat-label`, `.stat-foot`)
- `.filter-bar` com `.input-group` (busca) + `.segmented[data-segmented]` (pills de status)
- `.card` / `.card-header` / `.section-title` / `.card-body`
- `.table.stack-mobile` com `.identity-cell` (`.avatar` + `.lines .primary/.secondary`), `.badge.badge-{warning,success,info,danger,neutral}`, `.cell-actions`, `.cell-muted`
- `.btn.btn-{primary,secondary,ghost,danger}` + `.btn-sm` + `.btn-icon`
- `.modal` / `.modal-scrim` / `.modal-header` / `.modal-body` / `.modal-footer` / `.field` / `.field-label` / `.input` / `.select.select-native`
- `.empty-state` (comentado como exemplo no `visitantes.html`, reaproveite se sua página tiver uma seção que pode ficar vazia)
- `.two-col-grid` (grid de 2 colunas responsivo, vira 1 coluna no mobile)

Se precisar de algo pontual que não existe, adicione no `<style>` do
`<head>` da própria página **compondo com os tokens existentes**
(`var(--space-4)`, `var(--radius-md)`, `var(--text-secondary)` etc.) — nunca
com hex/rgb direto. É exatamente assim que `visitantes.html` faz nos estilos
pontuais dele (`.filter-bar`, `.blocked-card` etc.) — use como exemplo.
