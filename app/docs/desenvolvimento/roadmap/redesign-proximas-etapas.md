# Redesign de UI — Próximas Etapas

Data: 2026-08-19 (última atualização: 2026-08-20, sessão 3)
Escopo: continuação do redesign visual das telas do `app/web` (síndico/portaria/morador), fora do roadmap de produto (`melhorias-nexosx.md`) — aqui é sobre aparência/composição, não sobre funcionalidade nova.

Companion visual: `redesign-proximas-etapas.canvas` (abre no Obsidian, mesmo vault).

---

## O fluxo que estamos seguindo (repetir para cada lote novo)

1. **Mockup estático em `docs/ui/ui-redesign-v3/pages/*.html`** — reaproveitar `docs/ui/ui-redesign-v3/shared/` (tokens/base/components CSS já vieram do v2, aprovados: neutro quase-preto/branco, Montserrat, raio 0.65rem — **não inventar cor nova**). Não é preciso repetir a etapa v1→v2 de antes: o design system já está validado, então já se pode desenhar o mockup final direto.
2. **Ler o brief `docs/ui/ui-redesign-v3/BRIEF.md`** — tem o vocabulário de componentes disponível (`stat-card`, `filter-bar` + `segmented`, `identity-cell`, `badge-*`, `modal`, sprite de ícones) e o passo a passo de como montar uma página nova a partir de `docs/ui/ui-redesign-v2/pages/visitantes.html` (o modelo mais completo).
3. **Aplicar em `app/lab`** (real React/TypeScript, nunca HTML fake) — sempre usando dados/endpoints que **já existem de verdade** na API. Nunca inventar campo ou funcionalidade que o backend não tem.
4. **Validar ao vivo no navegador** (`claude-in-chrome`, servidor dev do `lab` — normalmente já está rodando em `:5173` ou `:5174`, checar com `lsof -nP -iTCP -sTCP:LISTEN | grep 517`). Testar interações reais (mutations, filtros).
5. **Ir devagar, tela por tela, com aprovação explícita antes de avançar** — foi o pedido explícito do usuário nesta rodada ("quero ir devagar"). Não fazer lotes grandes sem check-in.
6. **Portar para `app/web`** só depois da aprovação: `diff -rq lab/src web/src` pra achar exatamente os arquivos que mudaram, copiar 1:1 (nunca reimplementar de memória), depois `npx tsc -b --force && npm run build && npm run lint` no `web`.
7. **Smoke test ao vivo no `web`** antes de reportar pronto — subir um servidor dev temporário em porta alternativa (ex. `:5180`) se o `:5173`/`:5174` já estiver ocupado pelo `lab`, logar como manager, conferir as telas mudadas, depois matar o processo.
8. **Commit + push só quando o usuário pedir explicitamente** ("commita e dá push") — nunca por conta própria. Stage por caminho explícito (nunca `git add -A`), nunca `--amend`.

---

## Onde as coisas estão fisicamente

- `docs/ui/ui-redesign/` — v1 (primeira exploração, cores rejeitadas — "ficou HORRIVEL", roxo/indigo genérico de IA)
- `docs/ui/ui-redesign-v2/` — v2 (fiel ao design system real, **aprovado**, é a fonte dos tokens/CSS reaproveitados em tudo depois)
- `docs/ui/ui-redesign-v3/` — v3 (mockups do lote atual: Chamados, Portaria, Áreas de Lazer, Agendamentos — todos os 4 arquivos HTML já existem lá, mesmo os que não viraram código ainda tipo Portaria, que ficou só como referência não usada)
- `docs/ui/imagens exemplos/` — screenshots de referência (`*-lab.png` = estado antigo, `*-v1.png` = alvo) usados nos primeiros lotes
- `app/lab/` — clone flat do `web` (não aninhado em `lab/web/`), onde tudo é validado antes de ir pro oficial
- **Nota**: a pasta `docs/` foi reorganizada (provavelmente via Obsidian, fora do Claude Code) em algum momento desta sessão — os caminhos acima já refletem a estrutura nova (`docs/ui/...`, `docs/desenvolvimento/roadmap/...`). Se um caminho antigo (`docs/ui-redesign-v2/...` sem o `ui/` no meio) não for encontrado, é por causa dessa reorganização — procurar pela versão atual antes de assumir que sumiu.

---

## Status atual (o que já foi portado pro `web`, commitado e com push feito)

### Lote 1 — núcleo de gestão (commit `d2bd817`)
Home, Financeiro, Moradores, Visitantes, Encomendas, Assembleias — 6 telas, redesenhadas com o design system real, revisadas por 6 agentes em paralelo, portadas e validadas.

### Lote 2 — operacional diário (commit `dbadb63`)
- **Chamados** (`maintenance-requests.tsx`) — stat cards (`OverviewCards`), filtro `SegmentedFilter` + título dentro do mesmo card, coluna "Atribuído a" nova (campo `assignedTo` que já existia na API mas não aparecia).
- **Áreas de Lazer** (`areas.tsx`) — stat cards (Áreas cadastradas / Disponíveis agora / Capacidade total) + título "Áreas cadastradas" dentro do card que envolve o grid (prop `withContainer` nova em `AreasAvailable`/`AreasAvailableSkeleton` pra evitar borda dupla quando aninhado num `Card`).
- **Agendamentos** (`reservations.tsx`) — stat cards reais, "Próximos agendamentos" removido, "Calendário mensal" + "Pendentes de aprovação" juntos na mesma seção lado a lado (proporção ajustada pelo usuário pra `2fr_2fr` — não `3fr_1fr` como uma versão intermediária chegou a ter), tabela "Todos os agendamentos" com filtro segmentado + avatares de morador.
- **Portaria** (`staff.tsx`) — **intencionalmente não alterada**. O usuário aprovou como já estava ("não vou querer mexer em nada, pra mim já está ótimo"). Existe um mockup de referência em `docs/ui/ui-redesign-v3/pages/portaria.html` caso um dia queiram revisitar, mas não há trabalho pendente aqui.

### Lote 3 — Grupo A, comunicação/registros (commit `105eee0`) — **Grupo A concluído**
Nesta rodada o usuário pediu explicitamente algo **mais criativo que o padrão genérico** de stat-cards+filtro — vale ter isso em mente para os próximos grupos, não assumir que o padrão de Lote 1/2 é sempre suficiente.

- **Mural** (`announcements.tsx`) — visual de mural de verdade: comunicados em grade dentro de uma "superfície" com borda tracejada (`bg-muted/40`), cada cartão com um "pin" colorido no topo (cicla entre as 4 cores do `OverviewCards`) e leve inclinação alternada (`rotate-1`/`-rotate-1`/`rotate-2`/`-rotate-2`, `hover:rotate-0` + `hover:-translate-y-1`). O formulário inline "Novo comunicado" virou modal (`Dialog`), acionado por botão no `PageHeader` — pedido explícito do usuário ("prefiro que seja um botão que abra um modal").
- **Documentos** (`documents.tsx`) — aplicado o padrão genérico normal (stat cards por categoria real: Regimento interno/Ata de assembleia/Outros + total, filtro `SegmentedFilter` dentro do card) — aqui o padrão-tabela fazia sentido, é literalmente uma biblioteca de arquivos.
- **Convites** (`invites.tsx`) — virou um **board Kanban por status** (Pendente/Utilizado/Revogado/Expirado como colunas, com ponto colorido + contador no cabeçalho de cada uma), substituindo as duas tabelas separadas (Portaria/Moradores) por um único conjunto de dados mesclado (`MergedInvite`, campo `kind: "staff" | "resident"` decide qual mutation chamar). Também: essa tela usava um `<header>` solto em vez do componente `PageHeader` compartilhado — corrigido para consistência.

### Lote 4 — Grupo B, estrutural/admin (commit `3bb1d38`) — **Grupo B concluído**
- **Blocos** (`blocks.tsx`) — padrão genérico: `PageHeader`, stat cards (Total de blocos / Total de residências / Média por bloco), "Novo bloco" virou modal. Edição inline na linha e confirm dialog de remoção mantidos (já funcionavam bem).
- **Residências** (`residences.tsx`) — mesmo padrão: `PageHeader`, 4 stat cards (Total / Ocupadas / Vagas / Total de moradores), "Nova residência" virou modal, filtro segmentado por ocupação (Todas/Ocupadas/Vagas) dentro do card, busca mantida separada acima. Também tinha `<header>` solto — corrigido.
- **Configurações do condomínio** (`condominium-settings.tsx`) — **pedido explícito do usuário por algo "mais disruptivo"**. Virou um painel de controle: cada uma das 4 regras (`visitorAuthorizationTtlHours`, `visitorPendingTtlHours`, `reservationPendingTtlHours`, `packageCodeMaxAttempts`) ganhou um `Slider` (shadcn/radix) com o valor padrão da plataforma marcado como um traço de referência no próprio trilho, um número grande em destaque, badge Personalizado/Padrão, botão de restaurar rápido, e uma frase em linguagem natural que atualiza ao vivo (ex.: "...por até 77 hora(s). (+29 horas em relação ao padrão)"). **Instalado `@radix-ui/react-slider` via `npx shadcn@latest add slider`** — atenção: o CLI não atualiza `package.json` sozinho (só `node_modules`+`package-lock.json`), foi preciso adicionar a linha manualmente em `package.json` nos dois projetos (`lab` e `web`) e rodar `npm install` no `web` pra sincronizar o lockfile.
- Esse grupo reforça a mesma lição do Lote 3: **nem toda tela pede o padrão genérico** — Blocos/Residências (listas reais) se beneficiam do padrão de stat-cards+modal, mas Configurações (formulário de poucas regras, não uma lista) pediu algo estruturalmente diferente. Antes de aplicar o padrão-molde, vale considerar a forma real dos dados da tela.

### Lote 5 — Perfil, revisitado por feedback do usuário (commit `e5912da`)

A sessão 2 tinha concluído que Perfil (Grupo C) não precisava de redesign, pela avaliação "já usa `PageHeader`, cards bem segmentados". Na sessão 3 o usuário revisitou a tela e discordou explicitamente: *"a página de perfil ainda nao gosto do layout, queria que tivesse um ar mais moderno, para mim está tudo muito 'engessado', quadrado"* — enquanto confirmou que Eventos e Relatórios (as outras duas telas do Grupo C) continuam bons como estão. **Lição: "já segue o padrão estabelecido" não é o mesmo que "o usuário gosta do resultado visual" — vale reconfirmar percepção subjetiva, não só aderência a um padrão técnico.**

Processo desta rodada, digno de nota porque fugiu do fluxo padrão (mockup único → lab → aprovação):
1. Duas direções foram propostas via `AskUserQuestion` (com preview ASCII): **A** — coluna de identidade fixa à esquerda + seções sem card repetido (divisores); **B** — header grande (hero) + navegação por abas.
2. O usuário escolheu "Outra ideia" (terceiro botão da pergunta) — **isso não significava que ele tinha uma ideia própria não descrita**; ele queria as duas opções construídas como páginas HTML separadas pra comparar lado a lado antes de decidir. **Lição: não presumir que "Outra ideia"/"Other" sempre significa um conceito novo do usuário — pode ser rejeição do formato de escolha única.**
3. Os dois mockups foram construídos em `docs/ui/ui-redesign-v3/pages/perfil-opcao-a-coluna.html` e `perfil-opcao-b-abas.html`, servidos localmente e revisados via `claude-in-chrome`. O usuário escolheu a **Opção B (header + abas)**.
4. Implementado em `app/lab/src/pages/app/profile.tsx`: hero com avatar grande, badge de papel, unidade/e-mail/telefone, botão Editar/Cancelar/Salvar; abas **Dados / Veículos / Notificações / Encomendas** (via novo componente `Tabs`, `npx shadcn@latest add tabs` — usa o pacote `radix-ui` meta-package já instalado, **não precisou de nova dependência no `package.json`**, diferente do `Slider` no Lote 4). Porteiro (sem seções estendidas) não mostra abas, só o card "Dados pessoais" direto — mesma lógica condicional de antes (`canShowExtendedSections`). Aba "Encomendas" só aparece para `role === "resident"`.
5. **Cor do hero corrigida após primeira validação**: a primeira versão usava `indigo-500/600` (escolha arbitrária minha). O usuário pediu explicitamente *"quero que adapte a cor da hero para a cor do sistema"* — a cor de marca real do sistema é o gradiente `from-lime-300 to-teal-600` (usado em **todos** os avatares do app: `account-menu.tsx`, `details-card.tsx`, `table-row-visitor.tsx`, `table-row-packages.tsx`, `activity-row.tsx`, `reservations-table.tsx`, `charges.tsx` — e no item ativo da sidebar via `bg-lime-200 text-lime-600`). **Lição: `--primary`/`--accent` no `index.css` deste projeto são tokens monocromáticos (viram quase-preto/quase-branco conforme o tema) — não são a "cor da marca". A cor de marca real é o gradiente lime→teal usado ad-hoc nos avatares, não um token CSS nomeado.** Validado nos dois temas (claro no `lab`, escuro no `web`) — o gradiente funciona bem em ambos.
6. Validado ao vivo com as 3 personas (`manager@nexosx.com.br`, `joao.silva@nexosx.com.br` como morador, `porteiro@nexosx.com.br`), modo de edição (máscara de telefone, cancelar restaura valores), troca de abas preservando estado do formulário (React Hook Form v7 não desregistra campos ao desmontar por padrão).
7. Portado pro `web` (`diff -rq lab/src web/src` → só `profile.tsx` + `tabs.tsx` novo), `tsc -b --force` + `build` + `lint` limpos, smoke test no tema escuro do `web` (porta `:5180`).

### Lote 6 — padronização de padding das tabelas (commit `242997c`)

Usuário notou inconsistência: algumas tabelas ficavam alinhadas com o `CardTitle` (padrão de Financeiro), outras coladas na borda do card. Causa: `<CardContent className="p-0">` em vez do `<CardContent>` padrão (`px-6`) — usado originalmente pra deixar hover/borda da `TableRow` sangrar até a borda do card, mas quebrava o alinhamento do texto com o título.

**Fix: remover `p-0`, deixar `CardContent` herdar o `px-6` padrão** (Card já dá `py-6`/`gap-6` verticalmente, então não precisa de padding extra) — em **Blocos, Residências, Documentos, Chamados, Visitantes (+ skeleton), Encomendas (+ skeleton) e Agendamentos**. Em `reservations-table.tsx` também removidos os `<div className="p-6">` que compensavam manualmente o `p-0` ao redor do `EmptyState` (agora redundante com o `px-6` do `CardContent`). Validado nos dois temas. **Se criar uma tabela nova: nunca usar `CardContent className="p-0"` — deixar o padrão herdado, é isso que alinha com o título.**

### Lote 7 — hierarquia de botões de ação (commit `b0d839b`)

Usuário notou que vários pares de botões de ação (ex. Chamados: "Iniciar atendimento" e "Marcar como resolvido") usavam `variant="outline"` genérico, indistinguível de qualquer outro botão neutro da tela, sem se destacar do "Cancelar" ao lado.

Fiz um levantamento em todo o app antes de mexer — a maioria dos pares já seguia uma convenção boa (`default` sólido pra ação principal + `outline`/`destructive` pra secundária): Aprovar/Rejeitar (reservas, solicitações de condomínio), Autorizar/Negar (visitantes), Editar/Deletar (eventos), Abrir/Encerrar votação (assembleias), botões de ícone com tint de cor (reativar/desativar morador, retirar/editar/excluir encomenda). **Só Chamados e Financeiro estavam com o par principal genérico.**

**Fix**: ação de progressão (`Iniciar atendimento`/`Marcar como resolvido` em Chamados, `Marcar paga` em Financeiro) virou `variant="default"` (sólido, com ícone) — vs `Cancelar` que virou `variant="outline"` + `className="text-destructive hover:text-destructive"` (era `ghost`, sutil demais pra uma ação que muda o status de um recurso real). O X de revogar convite em Convites ganhou o mesmo tint destructive. `Boleto/PIX` em Financeiro ficou como estava (`outline` neutro) — é uma ação utilitária, não uma decisão, não precisa competir visualmente com `Marcar paga`.

**Convenção pra próximos botões**: ação principal/recomendada da linha = `default`; ação secundária neutra (visualizar, exportar, boleto) = `outline`; ação que cancela/reverte um recurso real (não um dialog) = `outline` + `text-destructive`; ação irreversível (deletar, bloquear) = `destructive` sólido.

---

## Lição aprendida sobre o calendário (não repetir o mesmo erro)

Tentativa de reduzir a altura do "Calendário mensal" mexendo em `--cell-size`/`max-w-*` **quebrou a proporção visual 3x1** que tinha sido pedida — porque as células do `Calendar` (shadcn) são quadradas (`aspect-square`): largura cheia = altura enorme, e limitar a largura pra caber melhor faz a caixa do calendário parecer menor que sua coluna do grid. Uma correção via `DayButton` customizado (célula retangular, altura fixa desacoplada da largura) chegou a resolver tecnicamente, mas o usuário pediu pra reverter tudo isso e, em vez disso, resolver com `overflow-y-auto` na seção (mesmo padrão que "Pendentes de aprovação" já usava). **Se mexer nesse componente de novo: não tentar customizar `DayButton`/`--cell-size` — usar limitação de altura por `overflow-y-auto` no `Card` que envolve, é mais simples e é o que o usuário already validou.**

---

## Vocabulário de componentes reais já disponíveis (reaproveitar, não recriar)

- `OverviewCards` / `OverviewCard` (`web/src/components/dashboard/overview-cards.tsx`) — cards de estatística com ícone + tonalidade. **Só 4 cores disponíveis: `sky`, `emerald`, `indigo`, `amber`** (mapeadas em `colorClasses`) — se uma tela precisar de um 5º card, ou reaproveita uma cor ou reconsidera quais métricas realmente merecem card.
- `SegmentedFilter` (`web/src/components/ui/segmented-filter.tsx`) — pills de filtro genérico, `<T extends string>`. Padrão consolidado: fica dentro do `CardHeader` via `<CardAction>`, ao lado do `CardTitle`/`CardDescription` (não como barra separada acima do card) — foi pedido explicitamente assim em Chamados e replicado em Agendamentos.
- Padrão "avatar + nome + apartamento" (`identity-cell`): `<Avatar className="h-8 w-8"><AvatarFallback className="bg-linear-to-br from-lime-300 to-teal-600 text-background text-xs">{iniciais}</AvatarFallback></Avatar>` — usado em Visitantes, Encomendas, Agendamentos. Tem uma função local `getInitials(name)` repetida em cada arquivo (não foi extraída pra util compartilhado ainda).
- Prop `withContainer?: boolean` — padrão para componentes que às vezes rodam soltos (com borda própria) e às vezes precisam ficar sem borda dentro de um `Card` pai (evita moldura dupla). Já existe em `UpcomingReservations` e foi replicado em `AreasAvailable`/`AreasAvailableSkeleton`. Vale usar o mesmo padrão em qualquer componente novo que precise dessa dualidade.
- Ícones do sprite mockup (`docs/ui/ui-redesign-v2/shared/...` embutido em cada HTML): nem todo ícone "óbvio" existe — ex. não existe ícone de vôlei/esporte, usar `#map-pin` ou `#activity` como aproximação (mas cuidado: `#activity` em tamanho pequeno pode parecer um símbolo de "proibido" — já aconteceu, foi trocado por `#map-pin` no mockup de Áreas de Lazer).
- Classes `tone-*` do CSS de mockup (`stat-icon.tone-*`) só têm 4 variantes definidas: `tone-info`, `tone-success`, `tone-accent`, `tone-warning` — **não existe `tone-danger` nem `tone-neutral`**; usar essas classes inventadas quebra o estilo do ícone (ícone fica sem cor/fundo, já aconteceu 2x nos mockups gerados por agente).
- `Slider` (`web/src/components/ui/slider.tsx`, shadcn/radix) — disponível desde o Lote 4, usado em Configurações. Pra marcar um valor de referência (ex. o padrão da plataforma) no trilho, calcular a posição em `%` (`(valor - min) / (max - min) * 100`) e posicionar um elemento absoluto por cima — o componente não tem suporte nativo a "marks".
- `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (`web/src/components/ui/tabs.tsx`, shadcn/radix) — disponível desde o Lote 5, usado em Perfil. Diferente do `Slider`, o `npx shadcn@latest add tabs` **não precisou de nova entrada em `package.json`** porque já usa o pacote guarda-chuva `radix-ui` (que já estava instalado). O arquivo gerado pelo CLI exportava `tabsListVariants` junto dos componentes — isso quebra a regra de lint `react-refresh/only-export-components` (só `Badge`/`Button` etc. exportam 1 único símbolo); removido do `export` já que não era usado fora do arquivo.
- **Gradiente de marca real do sistema**: `bg-linear-to-br from-lime-300 to-teal-600` (Tailwind v4 usa `bg-linear-to-*`, não `bg-gradient-to-*`) — é o que preenche todo `AvatarFallback` do app (`account-menu.tsx`, `details-card.tsx`, `table-row-visitor.tsx`, `table-row-packages.tsx`, `activity-row.tsx`, `reservations-table.tsx`, `charges.tsx`) e o item ativo da sidebar (`bg-lime-200 text-lime-600` em `nav-link.tsx`). **Não é um token CSS nomeado** (`--primary`/`--accent` em `index.css` são monocromáticos, não a cor de marca) — é uma classe Tailwind ad-hoc repetida. Se precisar da "cor do sistema" de novo, usar este gradiente, não os tokens `--primary`/`--accent`.

---

## Grupo C avaliado — reavaliado na sessão 3, Perfil precisou de trabalho (2026-08-20)

Ao investigar pra começar o Grupo C (sessão 2), a estimativa original (baseada só no tamanho de `events.tsx`, `reports.tsx`, `profile.tsx`) estava **enganosa** — essas páginas delegam boa parte do trabalho pra componentes maiores que eu não tinha lido antes de estimar:

- **Eventos** (`events.tsx`, 32 linhas próprias, mas delega pra `components/events/admin.tsx` + `feed.tsx`, ~600 linhas juntos) — já usa `PageHeader`, já tem 4 stat-boxes reais (Eventos ativos/Agendáveis/Informativos/Inscrições), cards ricos com imagem, barra de progresso de ocupação, curtidas, modal de criação/edição. **Confirmado bom pelo usuário na sessão 3 — sem trabalho pendente.**
- **Relatórios/BI** (`reports.tsx`, 307 linhas) — já usa `PageHeader` + `OverviewCards` (4 stat cards reais: ocupação, aprovação de reservas, aprovação de visitantes, encomendas) + 4 gráficos de barra (recharts) + tabela detalhada + exportação CSV. **Confirmado bom pelo usuário na sessão 3 — sem trabalho pendente.**
- **Perfil** (`profile.tsx`, 542 linhas) — a avaliação técnica original ("já usa `PageHeader`, cards bem segmentados, formulário maduro") estava correta *tecnicamente*, mas o usuário discordou visualmente na sessão 3 ("muito engessado, quadrado") e pediu redesign. **Ver Lote 5 acima — redesenhado com header/hero + abas, commit `e5912da`.**

**Conclusão atualizada: Eventos e Relatórios/BI não precisam de trabalho (confirmado 2x). Perfil foi redesenhado no Lote 5.** Isso conclui o redesign visual planejado (Grupos A, B e C, incluindo a revisão do Perfil) — não há mais lote pendente. Ver seção "Se continuar de onde parou" no fim deste documento pra prováveis próximos passos fora do redesign.

## Próximas telas candidatas (histórico — já cobertas, ver conclusão acima)

Levantamento original, feito lendo `web/src/routes/config.tsx` (rótulo/papéis reais) e o tamanho de cada arquivo de página — mantido aqui só como referência histórica do que foi avaliado.

### Grupo C — Pessoal/analytics (avaliado, sem necessidade de redesign — ver acima)
| Tela | Arquivo | Papéis | Linhas |
|---|---|---|---|
| Perfil | `profile.tsx` | todos (não aparece na sidebar, acessado pelo menu do usuário) | 542 — a maior de todas |
| Relatórios/BI | `reports.tsx` | manager | 307 |
| Eventos | `events.tsx` | manager, doorman, resident | 32 — bem pequena, dá pra fazer junto de qualquer outro grupo como "extra rápido" |

### Fora de escopo por enquanto
- `admin/dashboard.tsx`, `admin/requests.tsx`, `admin/condominiums.tsx`, `admin/users.tsx` — telas do papel `admin` (operador da plataforma SaaS, não síndico/condomínio). Domínio visualmente/funcionalmente diferente do resto; não avaliado ainda se entra no mesmo fluxo de redesign ou é tratado à parte.

### Recomendação de ordem dentro do Grupo C
Começar por **Eventos** (32 linhas, tela pequena, bom pra abrir o grupo rápido), depois **Relatórios/BI** (dashboards/gráficos — provavelmente também pede tratamento fora do padrão genérico, como Configurações pediu), e deixar **Perfil** por último e isolado (542 linhas, a maior do sistema, é formulário de edição pessoal — não segue o padrão "lista + stat cards" das outras, então merece atenção própria, sem pressa de encaixar no molde).

---

## Ambiente local — pegadinhas já resolvidas (checar antes de assumir que algo está "quebrado")

- **Docker some entre sessões**: o Docker Desktop não fica rodando entre reinícios da máquina. Se `docker ps` vier vazio, rodar `open -a Docker` e aguardar o daemon subir (`docker info` volta a responder em ~10-20s) antes de qualquer `docker compose up`.
- **Porta do Postgres**: `api/docker-compose.yml` deve mapear `5434:5432` (não `5432:5432`) para bater com `DATABASE_URL` do `api/.env` (`localhost:5434`). Se o compose foi recriado do zero e a porta vier errada, editar o `docker-compose.yml` e rodar `docker compose down && docker compose up -d` de novo.
- **Banco novo = sem dados de teste**: depois de um container novo, rodar NESTA ORDEM: `npx prisma migrate deploy` → `npm run seed` (cria condomínio/áreas/gestor) → `npx tsx prisma/seed-fixtures.ts` (cria os moradores, visitantes, encomendas, comunicados, documentos, chamados etc. usados em todo teste ao vivo — **esse último não roda sozinho com `npm run seed`**, é local-only e precisa ser chamado à parte). Sem isso a Home/Moradores/etc. aparecem com zero em tudo mesmo com login funcionando.
- Login de teste: `manager@nexosx.com.br` / `Manager123!` (gestor); moradores em `<slug>@nexosx.com.br` / `Morador123!` (ex. `joao.silva@nexosx.com.br`); porteiro em `porteiro@nexosx.com.br` / `Porteiro123!`.

---

## Se continuar de onde parou

1. Confirmar que os dev servers ainda sobem — ver seção "Ambiente local" acima antes de investigar qualquer coisa como se fosse bug de código.
2. **O redesign visual planejado (Grupos A, B, C) está concluído.** Não presumir que ainda falta algo — reler a seção "Grupo C avaliado" acima antes de sugerir mais uma rodada de redesign genérico.
3. Próximos passos possíveis, a confirmar com o usuário:
   - Revisitar `melhorias-nexosx.md`/`.canvas` (roadmap de produto, funcionalidade nova — não é sobre aparência).
   - Avaliar as telas `admin/*` (papel de operador da plataforma SaaS — nunca avaliado se entra neste mesmo fluxo de redesign).
   - Um passe de polimento fino (micro-detalhes) nas telas já feitas, se o usuário quiser revisar tudo de novo com olhar mais crítico.
4. Se abrir um novo lote de redesign no futuro, **ler os componentes delegados antes de estimar linhas/escopo** — foi o erro desta rodada: `events.tsx`/`reports.tsx`/`profile.tsx` pareciam pequenos/genéricos isoladamente, mas delegavam pra componentes já maduros.
