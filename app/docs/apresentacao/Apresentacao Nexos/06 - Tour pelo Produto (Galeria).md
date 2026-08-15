---
tags: [nexos, apresentacao, telas, screenshots, galeria]
---

# 6. Tour pelo Produto — Telas Reais

⬅️ [[00 - Nexos (Início)]]

Capturas reais do sistema, feitas sobre um ambiente local com dados de demonstração seedados (condomínio "Condomínio Demo", 4 moradores, 1 porteiro, visitantes, encomendas, reservas e eventos de exemplo). Nenhuma comunicação real (e-mail/SMS) foi disparada durante a captura.

## Acesso

![[assets/01-login.jpg]]
*Tela de login — multi-tenant: o mesmo formulário atende qualquer papel de acesso.*

---

## 👑 Visão do Administrador da plataforma

O admin não pertence a um condomínio — ele opera a plataforma como um todo.

![[assets/02-admin-solicitacoes.jpg]]
*Fila de solicitações de novos condomínios aguardando aprovação.*

![[assets/03-admin-condominios.jpg]]
*Todos os condomínios cadastrados na plataforma, com opção de gerar link de convite para a portaria.*

![[assets/04-admin-usuarios.jpg]]
*Diretório global de usuários — visão cross-tenant, com papel e condomínio de cada um.*

---

## 🏢 Visão do Gestor (síndico)

Painel operacional completo do condomínio, com indicadores em tempo real.

![[assets/05-dashboard-gestor.jpg]]
*Dashboard do gestor: ações rápidas, KPIs (encomendas pendentes, visitantes ativos, moradores, reservas aprovadas) e gráfico de recebidas x retiradas dos últimos 7 dias.*

![[assets/06-blocos.jpg]]
*Cadastro de blocos/torres do condomínio.*

![[assets/07-residencias.jpg]]
*Unidades vinculadas a cada bloco, com os moradores associados.*

![[assets/08-moradores.jpg]]
*Diretório de moradores, com contato e informações adicionais (bloco, telefone).*

![[assets/09-portaria.jpg]]
*Equipe de portaria cadastrada, com turno de trabalho.*

![[assets/10-visitantes.jpg]]
*Painel de visitantes — cada card mostra status (Entrou / Pendente / Autorizado) e as ações disponíveis (autorizar, negar, marcar entrada/saída).*

![[assets/11-encomendas.jpg]]
*Encomendas por morador — badges de tipo (Caixa, Envelope, Comida) e status (Pendente, Atrasada, Retirada).*

![[assets/12-areas-lazer.jpg]]
*Cadastro das áreas comuns disponíveis para reserva, com capacidade e horário de funcionamento.*

![[assets/13-agendamentos.jpg]]
*Console de aprovação de reservas: KPIs da semana, fila de pendentes e próximos agendamentos confirmados.*

![[assets/14-eventos.jpg]]
*Gestão de eventos: estatísticas de inscrições/curtidas e lista de eventos ativos (agendáveis e informativos).*

---

## 🏠 Visão do Morador

Experiência mais enxuta, focada no que importa para quem mora no condomínio.

![[assets/15-dashboard-morador.jpg]]
*Dashboard do morador: mesmas seções do gestor, mas filtradas para os dados do próprio apartamento.*

![[assets/16-areas-morador.jpg]]
*Áreas de lazer disponíveis para reserva, com atalho direto para "Agendar".*

![[assets/18-modal-agendamento.jpg]]
*Fluxo de reserva: calendário + seleção de horário de início e fim a partir da grade de slots pré-configurada.*

![[assets/17-eventos-morador.jpg]]
*Feed de eventos do condomínio, no estilo rede social — curtidas e vagas disponíveis visíveis de cara.*

---

## O que essas telas confirmam sobre o produto

- A **mesma base de código** serve os quatro papéis — não há retrabalho de manutenção entre "app do morador" e "painel do síndico".
- O **dashboard é o centro de gravidade** do produto: tanto gestor quanto morador chegam nele após o login, com granularidade diferente.
- A reserva de área comum é a **interação mais rica** da interface (calendário + grade de horários), condizente com ser a funcionalidade com mais regras de concorrência no back-end.

---
⬅️ [[05 - Fluxos de Negócio]] | 🏠 [[00 - Nexos (Início)]]
