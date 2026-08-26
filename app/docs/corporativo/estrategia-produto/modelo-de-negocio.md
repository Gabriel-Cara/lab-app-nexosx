# Modelo de Negócio — NexosX

Data: 2026-08-26
Escopo: Business Model Canvas (Osterwalder, os 9 blocos clássicos) aplicado ao NexosX como negócio — não ao produto como sistema. Complementa, não repete, `gaps-administradoras-multi-condominio.md` (que já mapeia gaps funcionais/técnicos específicos citados aqui como evidência).
Método: síntese do que já se sabe sobre o produto, o mercado-alvo e as decisões tomadas nesta e nas sessões anteriores — sem inventar números ou fatos não confirmados. Onde a informação não existe ainda no produto ou não foi declarada pelo founder, o bloco diz isso explicitamente em vez de supor.
Companion visual: `modelo-de-negocio.canvas`

---

## Contexto

O founder deixou claro (2026-08-26): *"para mim como dono do projeto não vai ser meu objetivo ficar olhando e gerindo os dados de cada condomínio, mas sim ter uma visão administrativa dos clientes e etc."* Esse é o ponto de partida deste Canvas — ele separa dois papéis que o produto até aqui tratava de forma confusa: o founder **administra o negócio SaaS** (clientes = administradoras/síndicos que pagam), enquanto **administradoras/síndicos administram condomínios** (moradores/porteiros = usuários finais do dia a dia). O Canvas abaixo é a ferramenta pra deixar essa distinção explícita antes de continuar evoluindo o produto.

---

## 1. Segmentos de clientes

Dois segmentos pagantes distintos, com necessidades diferentes:

- **Síndico de condomínio único** — hoje o segmento mais maduro do produto (papel `manager` sem `organizationId`). Usa o NexosX pra rodar a operação de um prédio: encomendas, visitantes, reservas, financeiro, chamados.
- **Administradora multi-condomínio** — empresa ou profissional que gerencia a operação de vários condomínios ao mesmo tempo (papel `manager` com `organizationId`, modelo `Organization`, shipado nesta sessão). É o segmento que o founder está priorizando prospectar agora — maior LTV por conta, mas exige uma experiência de portfólio que só começou a existir (Minha Carteira).

**Não são clientes pagantes, mas usuários do sistema**: porteiros e moradores — usam o produto porque o síndico/administradora contratou, não porque decidiram comprar.

---

## 2. Proposta de valor

O que o NexosX resolve, por módulo já em produção: gestão de encomendas (código de retirada, proxy autorizado), controle de visitantes e portaria, reservas de áreas comuns com agenda, financeiro com cobrança real via Asaas, chamados de manutenção, assembleias com votação digital, mural de comunicados, repositório de documentos, notificações push. Nenhum módulo core é mockado — confirmado na triagem de produção de 2026-08-20.

Para o segmento **administradora multi-condomínio** especificamente, a proposta de valor incremental (shipada nesta sessão) é: uma conta só pra toda a carteira, troca de condomínio ativo sem logout, e uma tela de portfólio ("Minha Carteira") com indicadores por condomínio — em vez do modelo anterior, que exigia uma conta separada por condomínio sem nenhuma visão consolidada.

**Gap ainda aberto nessa proposta de valor** (ver `gaps-administradoras-multi-condominio.md`, itens B5-B7): a visão de portfólio hoje é só de leitura/drill-down (`Minha Carteira`) — falta a camada de **gestão** que o founder acabou de pedir (administradora gerindo síndicos, não só espiando dados operacionais). Esse é o próximo incremento de valor a desenhar pra esse segmento.

---

## 3. Canais

- **Formulário público "Solicitar condomínio"** (`CondominiumRequest`) — o único canal de aquisição self-service que existe hoje no produto: alguém preenche nome do condomínio, dados do administrador e envia; o founder aprova manualmente.
- **Prospecção direta do founder** — mencionada como intenção ("quero fazer prospecção para administradoras de condomínio"), mas o produto não tem hoje nenhuma ferramenta de apoio a esse canal (sem CRM, sem funil — ver bloco 4 e item A4 do doc de gaps).

**Em aberto**: quais outros canais o founder pretende usar (indicação, parcerias com contadores/advogados condominiais, anúncios, eventos do setor) — não foi declarado ainda, não deve ser suposto aqui.

---

## 4. Relacionamento com clientes

Hoje o relacionamento é puramente transacional e manual: solicitação → aprovação → conta criada → suporte ad-hoc quando necessário. Não existe:
- Qualificação de lead no intake (o formulário não pergunta quantos condomínios o solicitante administra, nem captura nome de empresa — item **A2** do doc de gaps).
- Vínculo entre múltiplas solicitações da mesma administradora (item **A3**) — hoje 4 pedidos de uma administradora de 4 prédios parecem 4 clientes desconexos pro founder.
- Qualquer funil comercial (contatado → negociação → proposta → fechado) — o "pipeline" do admin dashboard hoje é só `pending/approved/rejected` (item **A4**).

Essa é exatamente a "visão administrativa dos clientes" que o founder pediu — ainda não existe como ferramenta, é hoje só planilha/memória do próprio founder (presumido, não confirmado).

---

## 5. Fontes de receita

**Não definido no produto ainda.** `Condominium` não tem nenhum campo de plano, tier ou status de assinatura (item **A5** do doc de gaps) — o único modelo de billing que existe (`Charge`) é condomínio→morador (taxa condominial via Asaas), sem nenhuma relação com o que o founder cobraria da administradora pelo uso do NexosX.

Perguntas em aberto pro founder, não respondidas neste documento:
- Cobrança por condomínio, por administradora (carteira), ou por usuário?
- Plano único ou tiers (ex: por nº de moradores, por módulos habilitados)?
- Cobrança recorrente (assinatura) ou setup + mensalidade?

---

## 6. Recursos principais

- A plataforma NexosX em si — dois codebases (`api`/backend Express+Prisma+Postgres, `web`/frontend React) mantidos como repositórios separados, mais o repositório raiz que versiona os dois como submódulos junto com a documentação.
- O modelo de dados multi-tenant (isolamento por `condominiumId`, e agora por `organizationId` pra portfólios).
- Integração com Asaas (gateway de pagamento) já validada em sandbox.
- O tempo e conhecimento técnico do próprio founder, que hoje acumula os papéis de desenvolvedor e operador do negócio.

---

## 7. Atividades-chave

- Desenvolvimento e manutenção do produto (as duas frentes de código, `api` e `web`).
- Segurança e prontidão de produção — auditoria completa em 2026-08-15 (~67 itens corrigidos) e triagem de carga/concorrência em 2026-08-20 (veredito: pronto pra vender).
- Prospecção e vendas — hoje majoritariamente manual, sem ferramenta de apoio (ver bloco 4).
- Suporte ao cliente — sem processo formal definido neste documento.

---

## 8. Parcerias principais

- **Asaas** — gateway de pagamento, já integrado e testado em sandbox para cobrança condomínio→morador.
- Provedores de infraestrutura (hosting, banco de dados, e-mail/SMS — Twilio/Resend aparecem no código para notificações) — detalhes de fornecedor específico não confirmados aqui.

**Em aberto**: parcerias comerciais (ex: com administradoras estabelecidas, contadores, síndicos profissionais como canal de indicação) — não declaradas pelo founder até este ponto.

---

## 9. Estrutura de custos

Qualitativamente, os custos conhecidos são: infraestrutura (hosting do banco Postgres e dos serviços `api`/`web`), custos variáveis de integração (Asaas, Twilio/Resend, web push), e o tempo de desenvolvimento do founder. Não há números declarados neste documento — este bloco é intencionalmente qualitativo até que o founder decida compartilhar ou definir uma estrutura de custos formal.

---

## Nota de fechamento: o que este Canvas implica pro produto

O founder ocupa, neste Canvas, o papel de dono das **Atividades-chave** e do relacionamento com os **Segmentos de clientes** — ele roda o negócio, não os condomínios. Isso tem uma implicação direta e imediata pro produto: os dois documentos irmãos deste ("mapa de usuários do sistema" e "arquitetura da experiência da administradora") precisam refletir essa separação — uma visão administrativa de clientes para o founder (que hoje não existe — blocos 3 e 4 acima, itens A2-A6 do doc de gaps), e uma experiência de **gestão** (não só operação) para a administradora multi-condomínio olhar os síndicos que ela supervisiona, mantendo o drill-down operacional ("Minha Carteira") como capacidade secundária, não primária.
