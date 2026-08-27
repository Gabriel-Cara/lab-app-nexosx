# NexosX — Redesign v2 (fiel ao design system real do projeto)

Isto é um **PORTE**, não um redesenho do zero. O dono do projeto aprovou o
layout/composição da v1 (`docs/ui-redesign/pages/*.html`) mas achou as cores
"com muita cara de IA" — queria roxo/indigo genérico de dashboard gerado por
IA, quando o produto real é neutro (quase preto/branco) com Montserrat. Sua
tarefa: pegar a página v1 correspondente e portá-la para os tokens/componentes
reais do projeto, **mantendo a mesma estrutura, composição e conteúdo** — só a
"pele" muda.

## Passo a passo obrigatório

1. **Leia a página v1 inteira** em `docs/ui-redesign/pages/<nome-v1>.html`
   (veja a tabela na seção 4 para o nome exato) — é a sua base. Não é
   referência solta, é o ponto de partida: copie a estrutura HTML dela.
2. Leia `docs/ui-redesign-v2/shared/tokens.css`, `base.css`, `components.css`
   — são as MESMAS classes/variáveis do v1 (mesmos nomes: `.card`, `.badge`,
   `.stat-card`, `.btn-primary`, `--text-primary`, `--accent-500` etc.), só
   que agora com os VALORES reais do projeto (cores OKLCH do shadcn, fonte
   Montserrat, raio 0.65rem). Isso significa que a maior parte do HTML da v1
   funciona **sem alteração nenhuma** — o trabalho real é:
   - Trocar os 3 `<link rel="stylesheet">` para apontar para
     `docs/ui-redesign-v2/shared/` (mesmo padrão de caminho relativo
     `../shared/...`, só que agora dentro da pasta v2).
   - Trocar o `<link>` do Google Fonts de **Inter** para **Montserrat**:
     ```html
     <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
     ```
   - Colar o sprite de `docs/ui-redesign-v2/shared/icons.svg` (não o da v1 —
     a versão v2 tem um ícone novo, `#sandwich`, usado no lugar do ícone de
     comida antigo).
   - Se a página v1 tinha um `<style>` pontual no `<head>` com alguma cor
     "chumbada" (hex direto, não `var(--...)`), troque por um token real
     (veja a lista de tokens disponíveis no `tokens.css` v2 — inclui
     `--stat-sky-*`, `--stat-emerald-*`, `--stat-indigo-*`, `--stat-amber-*`,
     `--info-*` etc.). **Não invente cor nova.**
3. **NÃO redesenhe a página.** Mesma ordem de seções, mesmos textos, mesmos
   dados fictícios, mesmo comportamento responsivo. O objetivo é "essa tela
   parece o app de verdade", não uma variação criativa.
4. Aplique as mudanças pontuais listadas na tabela da seção 4 (a maioria das
   páginas não tem nenhuma — só Encomendas tem 2 ajustes de conteúdo).

## O que mudou de verdade entre v1 → v2 (para você reconhecer se algo saiu errado)

- **Cor primária**: era roxo/indigo (`#5b5ff2`) → agora é neutro quase-preto
  no claro / quase-branco no escuro (`var(--accent-500)`, que é literalmente
  `--primary` do shadcn). Botões primários, item ativo do menu, etc. não têm
  mais tom de roxo em lugar nenhum.
- **Fonte**: Inter → **Montserrat**.
- **Badges**: não têm mais aquela bolinha (`•`) antes do texto — é uma
  pílula de texto simples, igual ao `Badge` real do projeto. E o badge de
  status "vencida/negado/cancelado" (`.badge-danger`) agora é **vermelho
  sólido com texto branco**, não mais um tom clarinho — é assim que o
  `variant="destructive"` real funciona.
- **Sidebar**: no v1 era uma faixa colada na borda esquerda da tela. Agora é
  **flutuante** (`variant="floating"` do shadcn Sidebar) — tem uma margem
  pequena, cantos arredondados, borda e sombra próprias, não encosta na
  borda da janela. Isso já está pronto no `base.css` v2, só reaproveite a
  mesma marcação HTML da sidebar do v1.
- **Item ativo do menu**: não tem mais fundo colorido roxo — é só um cinza
  neutro (`--sidebar-accent` real) + texto um pouco mais forte. Isso também
  já vem pronto via `.nav-item.active` no `base.css` v2.
- **Stat cards** (cards de KPI no topo do Financeiro/Encomendas/Visitantes):
  o layout mudou para bater com o componente real `overview-cards.tsx` — tem
  um "blob" de gradiente sutil no canto superior direito do card e um chip
  de ícone colorido (sky azul / emerald verde / indigo roxo-azulado / amber
  laranja — só essas 4 cores existem no componente real, não invente uma 5ª).
  A marcação HTML (`.stat-card > .top > .stat-icon.tone-*` + `.stat-value` +
  `.stat-label` + `.stat-foot`) é a mesma da v1 — o CSS compartilhado já
  desenha o blob sozinho via `::before`, você não precisa adicionar nada
  extra no HTML da página além de manter essas classes.
- **Cards genéricos**: raio um pouco maior (`rounded-xl` real) e sombra um
  pouco mais perceptível (`shadow-sm` real) — já vem do `components.css` v2,
  nenhuma ação sua necessária.
- **Tabelas**: cabeçalho não é mais uppercase/espaçado — é texto normal,
  peso médio, cor `--text-secondary`. Já vem pronto, não recrie.

## O que NÃO mudou (mantenha exatamente como na v1)

- Campos de busca (`.input-group`) — o padrão visual que ele elogiou.
- Filtros de "tipo"/status como pills/abas (`.segmented`) — nunca volte a
  usar `<select>` para isso.
- Faixa/aviso de morador desativado em Moradores.
- Composição da Home (cards de Encomendas, Visitantes, Áreas de Lazer,
  Próximas Reservas).
- Composição inteira do Financeiro (cards no topo + tabela dinâmica de
  Cobranças com filtros).
- Composição inteira de Assembleias (quórum + votação, cards de pauta,
  barra de votação, pills de voto).
- Composição de Visitantes e Moradores.

## Checklist antes de entregar

- [ ] Estrutura/conteúdo idênticos à página v1 correspondente (mesmas
      seções, mesmos dados fictícios).
- [ ] Os 3 CSS apontam para `docs/ui-redesign-v2/shared/` (não para a v1).
- [ ] Google Fonts trocado para Montserrat.
- [ ] Sprite de ícones é o de `docs/ui-redesign-v2/shared/icons.svg`.
- [ ] Nenhuma cor hex/roxa "chumbada" sobrando de um `<style>` pontual da v1
      — tudo usa `var(--...)`.
- [ ] Sidebar com o item de nav correto marcado `active` (mesma lista de 18
      itens da v1).
- [ ] Se for a página de Encomendas: aplicou os 2 ajustes da seção 4.
- [ ] Arquivo salvo em `docs/ui-redesign-v2/pages/<mesmo-nome-do-v1>.html`.

## 4. Mapeamento de páginas e ajustes pontuais

| Origem (v1) | Destino (v2) | Ajustes pontuais |
|---|---|---|
| `docs/ui-redesign/pages/dashboard.html` | `docs/ui-redesign-v2/pages/dashboard.html` | Nenhum além da re-pele geral. |
| `docs/ui-redesign/pages/financeiro.html` | `docs/ui-redesign-v2/pages/financeiro.html` | Nenhum além da re-pele geral. |
| `docs/ui-redesign/pages/assembleias.html` | `docs/ui-redesign-v2/pages/assembleias.html` | Nenhum além da re-pele geral. |
| `docs/ui-redesign/pages/visitantes.html` | `docs/ui-redesign-v2/pages/visitantes.html` | Nenhum além da re-pele geral. |
| `docs/ui-redesign/pages/moradores.html` | `docs/ui-redesign-v2/pages/moradores.html` | Nenhum além da re-pele geral. |
| `docs/ui-redesign/pages/encomendas.html` | `docs/ui-redesign-v2/pages/encomendas.html` | **(1)** Remova por completo a seção/card "Tipos de encomenda" do rodapé da página (a legenda com Caixa/Envelope/Alimento/Outros). **(2)** Em todo lugar onde o tipo "Alimento" (ex.: "iFood Marmita") usava um ícone genérico de caixa, troque para `<svg class="icon"><use href="#sandwich"></use></svg>` — é o novo símbolo já disponível no sprite v2. |
