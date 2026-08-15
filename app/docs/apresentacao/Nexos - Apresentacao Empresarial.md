NEXOS — PLATAFORMA DE GESTÃO DE CONDOMÍNIOS
Apresentação Empresarial e Diagnóstico Técnico-Funcional
Documento gerado a partir da leitura integral do código-fonte (api/ e web/) em 12/08/2026.


================================================================
1. O QUE É O NEXOS
================================================================

Nexos (nome interno de código: "Porty") é um sistema SaaS multi-tenant de
gestão de portaria e operação condominial. Ele digitaliza o dia a dia da
portaria e da administração de condomínios residenciais: controle de
visitantes, recebimento e retirada de encomendas, reserva de áreas comuns,
gestão de moradores/blocos/unidades, eventos internos e onboarding de novos
condomínios na plataforma.

O produto é composto por duas aplicações que conversam entre si:

  - api/  → back-end (Node.js, Express, TypeScript, Prisma ORM, PostgreSQL)
  - web/  → front-end (React 19, TypeScript, Vite), PWA instalável, com a
            marca "nexos" e interface 100% em português (pt-BR)

É um produto claramente desenhado para o mercado brasileiro (máscaras de
telefone e placas de veículo no padrão Mercosul, RG, textos e e-mails em
português, fuso e formatação de datas locais).


================================================================
2. OBJETIVO DE NEGÓCIO
================================================================

Resolver, em um único painel, os três problemas operacionais mais comuns
de um condomínio:

  1. Segurança e controle de acesso — saber quem entra, quando, a convite
     de quem, e por quanto tempo.
  2. Logística de encomendas — evitar extravio e fila na portaria, com
     código de retirada seguro e rastreável.
  3. Uso de áreas comuns e vida em comunidade — reservas sem conflito de
     horário e comunicação de eventos/avisos aos moradores.

O modelo de negócio é SaaS multi-tenant: uma única instalação da
plataforma atende a múltiplos condomínios (tenants) isolados entre si,
com um operador de plataforma (administrador) responsável por aprovar a
entrada de novos condomínios e ter visão consolidada de toda a base.


================================================================
3. PÚBLICO-ALVO E PERFIS DE USUÁRIO (PAPÉIS)
================================================================

O sistema define 4 papéis, cada um com um recorte de tela e permissões
próprio:

  ADMIN (Administrador da plataforma)
    - Não pertence a nenhum condomínio específico (é "cross-tenant").
    - Aprova/rejeita solicitações de novos condomínios.
    - Visualiza todos os condomínios e todos os usuários da plataforma.
    - Pode criar um condomínio diretamente, sem passar por aprovação.

  MANAGER (Gestor / síndico do condomínio)
    - Administrador daquele condomínio específico.
    - Gerencia blocos, residências, moradores, portaria, áreas de lazer,
      aprova/rejeita reservas, cria eventos.
    - Criado automaticamente quando um condomínio é provisionado.

  DOORMAN (Portaria / concierge)
    - Operação do dia a dia: registra visitantes, controla entrada/saída,
      recebe e entrega encomendas, participa da aprovação de reservas.

  RESIDENT (Morador)
    - Autoatendimento: acompanha suas encomendas, autoriza seus próprios
      visitantes, reserva áreas comuns, participa de eventos (curte e
      confirma presença), mantém cadastro de veículos e perfil.

Cada papel vê apenas os módulos relevantes — o menu lateral e as rotas são
construídos dinamicamente a partir de uma única tabela de permissões por
papel (não é tela diferente por perfil, é a MESMA aplicação se adaptando).


================================================================
4. MODELO MULTI-TENANT (ISOLAMENTO ENTRE CONDOMÍNIOS)
================================================================

Praticamente toda tabela do banco carrega uma referência ao condomínio
(condominiumId). Um único ponto no código (utils/condominium.ts) decide,
a cada requisição, qual condomínio está sendo operado:

  - Para manager/doorman/resident: o condomínio vem "gravado" no próprio
    token de login — impossível de burlar via parâmetro de URL.
  - Para admin: como não pertence a nenhum condomínio, ele precisa
    escolher explicitamente qual condomínio está gerenciando no momento.

Um detalhe de identidade interessante: o mesmo e-mail pode existir em
condomínios diferentes (ex.: um síndico profissional que administra dois
prédios). No login, se o e-mail informado bater em mais de um
condomínio, o sistema não erra — ele devolve uma lista de "candidatos" e
o usuário escolhe em qual conta/condomínio quer entrar.


================================================================
5. MÓDULOS E REGRAS DE NEGÓCIO
================================================================

--- 5.1 Onboarding de Condomínios ---------------------------------------

Existem dois caminhos para um condomínio entrar na plataforma:

  a) Fluxo self-service (o caminho "comercial"): um prospect preenche um
     formulário público (nome do condomínio, código, dados do
     administrador) → isso cria uma "solicitação" pendente → o admin da
     plataforma analisa em uma fila e aprova ou rejeita (com motivo) →
     ao aprovar, o sistema cria automaticamente o condomínio E o usuário
     gestor, e envia e-mail de boas-vindas com link de acesso.
  b) Fluxo direto: o admin cria o condomínio manualmente, sem passar por
     aprovação (uso interno/comercial assistido).

--- 5.2 Convites de Moradores e Portaria ---------------------------------

Gestores/portaria geram um link de convite (válido por 7 dias) para um
novo morador ou um novo porteiro se cadastrar sozinho, sem precisar de
senha provisória. O convidado abre o link, o sistema confirma que ainda
é válido, e a pessoa define nome/telefone/senha (e, no caso de morador,
também os veículos). Isso reduz o trabalho manual de cadastro pela
administração.

--- 5.3 Controle de Visitantes -------------------------------------------

Regra central: cada visitante é identificado por documento dentro do
condomínio (não se duplica cadastro a cada visita).

Existem dois modos de acesso:
  - Acesso por tempo determinado: precisa de aprovação (do morador
    anfitrião ou da portaria) antes de poder entrar; ao registrar a
    entrada, o sistema calcula automaticamente o horário previsto de
    saída (entrada + horas liberadas).
  - Acesso ilimitado (ex.: prestador de serviço recorrente): pula a
    etapa de aprovação e já nasce autorizado.

Um morador só pode agir sobre visitas das quais ele é o anfitrião —
trava de segurança para impedir que um morador aprove/rejeite visitantes
de outro apartamento.

--- 5.4 Encomendas --------------------------------------------------------

Esta é a funcionalidade com a regra de negócio mais elaborada do sistema:

  - Ao registrar uma encomenda, o sistema gera um código de retirada de
    6 caracteres, que NUNCA é guardado em texto puro — apenas seu hash
    criptográfico. O morador recebe o código por SMS/WhatsApp (via
    Twilio) ou e-mail.
  - O código expira em 48 horas (configurável) e tem no máximo 5
    tentativas de digitação erradas antes de bloquear — proteção contra
    tentativa de adivinhação.
  - Um robô interno roda de hora em hora e marca automaticamente como
    "atrasada" qualquer encomenda de comida não retirada em 1 dia, e
    qualquer outro tipo não retirado em 30 dias — evita acúmulo
    silencioso na portaria.
  - Reenviar o código só é permitido se o sistema confirmar que a
    notificação anterior foi realmente entregue — evita reenviar "no
    escuro" sem o morador saber.

--- 5.5 Reserva de Áreas Comuns (Churrasqueira, Salão, Quadra etc.) ------

  - Cada área tem uma grade de horários fixos pré-configurada (ex.: slots
    de 30 em 30 minutos) gerada automaticamente a partir do horário de
    funcionamento cadastrado.
  - Reservas só podem ser feitas para o período entre hoje e 1 mês à
    frente — não é possível reservar com meses de antecedência nem em
    datas passadas.
  - O sistema impede conflito de horário (dupla reserva do mesmo espaço
    no mesmo intervalo) com verificação transacional — mesmo sob uso
    simultâneo por vários moradores, não há sobreposição.
  - Toda reserva nasce "pendente" e precisa ser aprovada pela portaria ou
    pelo gestor.

--- 5.6 Eventos do Condomínio ---------------------------------------------

  - Gestor/portaria cria eventos vinculados a uma área comum (ex.: "Festa
    Junina" no Salão de Festas), com capacidade máxima opcional.
  - Moradores podem "curtir" (like) e, se o evento permitir, confirmar
    presença (RSVP) — o sistema impede reserva duplicada da mesma pessoa
    e bloqueia inscrições acima da capacidade, mesmo com múltiplos
    moradores confirmando ao mesmo tempo.

--- 5.7 Estrutura Física (Blocos, Residências, Moradores, Portaria) ------

  - CRUD de blocos/torres e unidades (apartamentos), com vínculo direto
    aos moradores que ali residem.
  - Cadastro de moradores inclui dados adicionais como contato de
    emergência e lista de veículos (modelo, placa, vaga).
  - Cadastro de equipe de portaria com turno de trabalho.


================================================================
6. SEGURANÇA E CONTAS DE ACESSO
================================================================

  - Autenticação via login e senha (senhas armazenadas com hash), sessão
    baseada em token (JWT) válida por 8 horas.
  - Primeiro acesso e recuperação de senha usam links por e-mail válidos
    por apenas 1 hora e de uso único.
  - Toda ação sensível é revalidada no back-end por papel — a interface
    esconder um botão é só conveniência visual, a regra de verdade está
    protegida no servidor.
  - Nenhuma senha em texto puro é armazenada ou trafega em respostas da
    API.


================================================================
7. ARQUITETURA TÉCNICA (RESUMO EXECUTIVO)
================================================================

Back-end (api/)
  - Node.js + TypeScript + Express, arquitetura em camadas (rotas →
    validação → controller → serviço → banco de dados).
  - PostgreSQL via Prisma ORM, com mais de 30 migrações versionadas
    documentando a evolução do produto ao longo do tempo.
  - Validação de entrada com Zod em todas as rotas.
  - Envio de e-mail transacional via Resend; SMS/WhatsApp via Twilio
    (opcional, com fallback para log em console).
  - Documentação de API via Swagger.
  - Início de suíte de testes automatizados (Jest) cobrindo os módulos
    mais sensíveis (encomendas, reservas, visitantes, convites).

Front-end (web/)
  - React 19 + Vite + TypeScript, roteamento por papel com proteção de
    rotas.
  - Interface construída com shadcn/ui (Radix UI) + Tailwind CSS.
  - Formulários com React Hook Form + Zod; dados remotos via React
    Query (cache, atualização automática, estados de carregamento).
  - Gráficos e indicadores com Recharts.
  - Progressive Web App (PWA) — pode ser instalado como app no celular,
    reforçando o uso pela portaria e por moradores em dispositivos móveis.


================================================================
8. PONTOS DE ATENÇÃO IDENTIFICADOS (DÉBITO TÉCNICO)
================================================================

  - Documentação (README/TYPES.md) desatualizada em relação ao código
    atual — ainda descreve um modelo de papéis mais simples do que o
    implementado hoje.
  - Cobertura de testes automatizados ainda parcial (existe para os
    módulos mais críticos, mas não para a totalidade do sistema).
  - Sem indícios de rate-limiting ou trilha de auditoria formal nas
    rotas públicas (ex.: login, esqueci-senha), o que é recomendável
    para um produto que já lida com dados de acesso residencial.
  - Duas implementações praticamente idênticas do fluxo de login no
    front-end (arquivos duplicados) — limpeza de baixo risco.


================================================================
9. RESUMO EM UMA FRASE
================================================================

Nexos é uma plataforma SaaS multi-tenant que digitaliza a portaria e a
administração de condomínios — visitantes, encomendas, reservas de área
comum e eventos — com quatro níveis de acesso (plataforma, síndico,
portaria, morador) e isolamento de dados garantido por condomínio.
