# Mapa de Usuários do Sistema — NexosX

Data: 2026-08-26
Escopo: quem são todas as pessoas que tocam o NexosX, o que cada uma precisa, e como elas se relacionam entre si e com o modelo de dados. Levantado a pedido do founder como base para reorganizar a experiência da Administradora — não repete o levantamento de gaps já feito em `gaps-administradoras-multi-condominio.md`, mas se apoia nele.
Método: cruzamento do `enum Role` e do model `Organization` (`api/prisma/schema.prisma`) com os limites de permissão confirmados nas explorações desta sessão (`requireCondominiumId()`, `authorize()`, `organizations-controller.ts`), mais a nova diretriz do founder sobre como a Administradora deveria se relacionar com o sistema.
Companion visual: `mapa-usuarios-sistema.canvas`

---

## Contexto: dois nomes parecidos, dois conceitos diferentes

O sistema tem um problema de nomenclatura que vale desfazer antes de qualquer outra coisa: **"Administrador" e "Administradora" não são a mesma coisa**, e são fáceis de confundir só pelo nome.

- **Administrador** = o papel `admin` do enum `Role`. É o founder, operando a própria plataforma SaaS. Existe desde o início do sistema.
- **Administradora** = uma empresa ou profissional que administra **mais de um condomínio**. Não é um valor do enum `Role` — é o model `Organization` (criado nesta sessão), e a pessoa por trás dela é um usuário com `role: manager` e `organizationId` preenchido.

Este documento nomeia cada papel com precisão pra nunca mais confundir os dois.

---

## 1. Administrador (plataforma)

`role: admin`. `condominiumId` sempre `null`. `organizationId` sempre `null` — o papel `admin` nunca pertence a uma `Organization`, ele está acima de todas.

É o founder. Não opera um condomínio específico — opera o **negócio** de vender o NexosX para administradoras e síndicos.

**O que ele vê hoje**: dashboard agregado da plataforma (`admin/dashboard.tsx` — total de condomínios, usuários por papel, funil bruto de solicitações pending/approved/rejected, gráfico de crescimento), fila de solicitações de novo condomínio (`admin/condominium-requests.tsx`), lista plana de condomínios (`admin/condominiums.tsx`), lista de usuários da plataforma (`admin/users.tsx`).

**O que falta**: exatamente o Ângulo A do `gaps-administradoras-multi-condominio.md` — visão comercial/CRM sobre quem são seus clientes reais (administradoras, não condomínios isolados), qualificação de lead, funil de vendas, status de assinatura. Continua pendente, sem depender de nada do que este documento propõe.

---

## 2. Administradora (empresa/profissional multi-condomínio)

**Não é um papel do enum.** É o model `Organization`, e o humano por trás dela é um usuário com `role: manager` + `organizationId` preenchido — a mesma pessoa, tecnicamente, que também pode ser um Síndico "standalone" (seção 3) se não tiver organização.

**Hoje** (o que acabou de ser entregue nesta sessão): a tela principal da Administradora é "Minha Carteira" — uma lista dos condomínios do portfólio, cada um com 4 indicadores operacionais (encomendas pendentes, visitantes ativos, moradores cadastrados, reservas aprovadas) e um botão pra "entrar" naquele condomínio. Existe também um seletor de condomínio ativo no menu de conta, disponível em qualquer tela.

**A nova direção do founder** (ainda não implementada — proposta de reframing, detalhada em `arquitetura-administradora.md`): a tela principal da Administradora não deveria ser primariamente operacional. O founder foi explícito — "a parte da administradora é mais 'gerir' os síndicos de cada condomínio... sinto que deve ser uma visão mais de 'gestão'". Ou seja:
- **Visão primária proposta**: gestão de portfólio — quem é o síndico de cada condomínio, contato, talvez indicadores de saúde/operação em nível mais alto (não o detalhe operacional dia-a-dia).
- **Visão secundária, sob demanda**: "olhar por dentro" de um condomínio específico — exatamente o que "Minha Carteira" já entrega hoje. Continua existindo, só deixa de ser a tela principal.

**Um fork de modelo que este reframing expõe** (não resolvido aqui, é uma decisão do founder — mesmo espírito do Fork §0 do doc de gaps): hoje **não existe um "síndico do condomínio X" como pessoa distinta do gestor da organização**. Cada condomínio continua tendo exatamente um usuário `manager` vinculado via `condominiumId` — seja esse usuário um síndico standalone, seja o próprio gestor da administradora "vestindo o chapéu" daquele condomínio ao trocar de condomínio ativo. Se a Administradora vai "gerir síndicos", a pergunta que falta responder é: **esses síndicos são pessoas diferentes (funcionários/prepostos da administradora, um por condomínio) ou é sempre a mesma pessoa da administradora trocando de contexto?** O modelo atual só suporta bem o segundo caso. O primeiro caso (uma administradora com vários síndicos-funcionários, cada um só enxergando o(s) condomínio(s) dele) exigiria uma nova camada de permissão dentro da própria `Organization` — não foi construído, e não é uma decisão técnica, é uma decisão de como a Administradora realmente opera no mundo real.

---

## 3. Síndico (condomínio único)

`role: manager`, `organizationId: null`. O caso "standalone" — hoje o persona mais bem atendido do sistema.

**O que ele faz**: essencialmente tudo que é operacional dentro do seu único condomínio — moradores, encomendas, visitantes, financeiro (cobranças via Asaas), chamados de manutenção, assembleias/votação, mural, documentos, convites de porteiro/morador, configurações do condomínio.

É funcionalmente idêntico a um usuário `manager` de uma Administradora que, no momento, está com aquele condomínio como ativo — a diferença é só a ausência de `organizationId` e, portanto, a ausência do seletor de condomínio e da tela "Minha Carteira".

---

## 4. Porteiro

`role: doorman`. Sempre vinculado a exatamente um `condominiumId`, nunca a uma `Organization`.

Escopo operacional/portaria: encomendas, visitantes, chamados. Não tem acesso a financeiro nem a configurações do condomínio. Convidado por um Síndico ou Administrador via `StaffInvitesController`.

---

## 5. Morador

`role: resident`. Vinculado a um `condominiumId` e a um `residenceId` (unidade específica).

O usuário final do condomínio: reserva áreas comuns, acompanha encomendas, pré-cadastra visitantes, abre chamados, participa de assembleias, acessa mural e documentos, paga cobranças.

---

## Hierarquia e relacionamento

```
Administrador (plataforma)
  │  opera o negócio, não um condomínio
  │
  ├── supervisiona todas as Administradoras e Síndicos standalone (via admin/*)
  │
  ▼
Administradora (Organization) ──┐         Síndico standalone (role=manager, sem org)
  │  gerencia N condomínios      │           │  gerencia 1 condomínio
  │                              │           │
  ▼                              │           ▼
Condomínio 1 ... Condomínio N ◄──┘      Condomínio único
  │
  ├── Síndico ativo (hoje: o próprio gestor da org, "vestindo o chapéu" daquele condomínio)
  ├── Porteiro(s)
  └── Morador(es)
```

O ponto que este diagrama deixa explícito: **Administradora não é um nó paralelo aos papéis — é uma camada que agrupa condomínios, e o "síndico" de cada condomínio dentro dela continua sendo, tecnicamente, a mesma pessoa/conta da Administradora.** Não há hoje um relacionamento "Administradora → vários Síndicos-pessoas distintas → cada um seu condomínio". Ver a seção 2 para o porquê isso importa pro reframing pedido.

---

## Tabela-resumo

| Papel | `Role` enum | `organizationId`? | Escopo de dados | Tela principal hoje | O que falta |
| --- | --- | --- | --- | --- | --- |
| Administrador (plataforma) | `admin` | nunca | Toda a plataforma | Dashboard admin + gestão de solicitações/condomínios/usuários | Visão comercial/CRM (Ângulo A) |
| Administradora (Organization) | `manager` | sempre | N condomínios do portfólio | Minha Carteira (drill-in operacional) | Reframe pra visão de gestão de síndicos (ver `arquitetura-administradora.md`) |
| Síndico standalone | `manager` | nunca | 1 condomínio | Dashboard do condomínio | — (persona mais completo hoje) |
| Porteiro | `doorman` | nunca | 1 condomínio (operacional) | Dashboard do condomínio (escopo restrito) | — |
| Morador | `resident` | nunca | 1 condomínio + 1 residência | Dashboard do morador | — |

---

## Nota de fechamento

A confusão de nomes entre Administrador (papel de plataforma) e Administradora (empresa multi-condomínio) não é só uma questão de rótulo — ela reflete que esses dois conceitos moram em camadas completamente diferentes do sistema (um é `Role`, o outro é uma entidade separada, `Organization`, carregada por um usuário `manager`). Qualquer decisão de produto ou de arquitetura daqui pra frente que envolva a palavra "administradora" deveria, antes de mais nada, confirmar qual das duas está em jogo. O reframing da experiência da Administradora (visão de gestão de síndicos como tela principal) está detalhado em `arquitetura-administradora.md`; a visão comercial pendente do Administrador de plataforma continua registrada em `gaps-administradoras-multi-condominio.md`.
