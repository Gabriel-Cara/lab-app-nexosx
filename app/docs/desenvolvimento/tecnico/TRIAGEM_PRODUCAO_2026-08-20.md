# Triagem de Prontidão para Produção — 2026-08-20

Escopo: com o roadmap de produto em 98% (ver `checklist-implementacao.md`) e a auditoria de segurança de 15/08 fechada (`ANALISE_GAPS_SISTEMA.md`), o usuário pediu uma triagem completa do sistema — back e front, dentro e fora do navegador, com **carga e concorrência reais** (nunca testadas antes; todo teste anterior foi manual, um usuário/uma ação por vez) — pra decidir se já vale prospectar venda/aluguel do produto ou se é melhor melhorar antes.

Método: 3 sub-agentes em paralelo, cada um contra o mesmo ambiente local (Postgres via Docker, API em `:3333` com `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`RESEND_API_KEY` propositalmente vazios pra não disparar SMS/e-mail reais durante os testes, `lab` em `:5173`):

1. **Carga/concorrência no backend** — semeou ~180 moradores/900 encomendas/360 cobranças-chamados-visitantes em 4 condomínios sintéticos ("LoadTest..."), rodou testes de carga reais (`Promise.all`, não sequencial) contra os pontos protegidos por transação.
2. **E2E no frontend** — percorreu fluxos completos pelos 4 papéis via `claude-in-chrome`, checando console, estados vazios, validação, e reproduzindo bugs já suspeitos.
3. **Auditoria estática de código** — revisão read-only dos módulos construídos depois da auditoria de 15/08 (Fases 7-10: configurações, convites, mural, push, documentos, chamados, relatórios, financeiro, assembleias) + investigação de causa raiz de dois gaps que constavam como "conhecidos e não corrigidos" na memória do projeto.

---

## Veredito

**Pode começar a prospectar.** O produto que síndico/porteiro/morador usam no dia a dia é sólido — funcionalmente completo, seguro, correto sob concorrência real, rápido. Os dois problemas que valem corrigir antes do primeiro cliente pagante não são bugs no produto que se vende, são limitações na ferramenta que **o operador da plataforma** usa pra rodar o negócio (painel admin e importação de moradores) — e ambos são correções pequenas (1-2 dias), não um projeto novo. Ver "Próximos passos" no fim.

---

## O que já está pronto pra vender

- **Funcionalidade**: 98% do roadmap de produto (`checklist-implementacao.md`) — reservas, encomendas, visitantes, financeiro com gateway de pagamento real (Asaas, testado em sandbox), chamados, assembleias/votação digital, mural, documentos, notificações push. Nenhum módulo core mockado.
- **Segurança**: os ~67 itens da auditoria de 15/08 seguem corrigidos; a auditoria estática desta rodada não achou **nenhum item explorável** nos módulos mais novos (Financeiro, Assembleias, Chamados, Documentos, Convites, Push). Multi-tenant scoping (nenhum condomínio vê dado de outro) checado e limpo nos controllers revisados. Webhook do Asaas corretamente protegido por segredo compartilhado e idempotente.
- **Concorrência real — o achado mais importante desta rodada**: forçadas condições de corrida de verdade (requisições simultâneas via `Promise.all`, não em sequência) nos 4 pontos mais sensíveis do sistema:
  - Duas aprovações simultâneas da mesma reserva → exatamente 1 aprovada, 1 rejeitada com 409.
  - 10 tentativas simultâneas de código de retirada de encomenda no mesmo pacote → protegido por isolamento `Serializable`, sem burlar o limite de tentativas.
  - 8 resgates simultâneos do mesmo código de pré-cadastro de visitante → exatamente 1 aceito.
  - 5 criações simultâneas de reserva no mesmo horário → exatamente 1 criada.

  Isso é proteção real a nível de banco (transação `Serializable` + reconferência), não só checagem de aplicação — é exatamente a classe de bug que nunca aparece em teste manual e que corrompe dado real assim que dois usuários de verdade competem pelo mesmo recurso ao mesmo tempo. **Passou limpo em todos os casos testados.**
- **Performance**: 500 requisições simultâneas nas listagens principais (com ~1000-1500 linhas por tabela, 5 condomínios) — p50 de 300-560ms, p99 abaixo de 1s, zero erro, zero exceção não tratada no servidor ao longo de ~2000+ requisições. Folga confortável pro uso real de um condomínio (dezenas a poucas centenas de moradores, não 500 requisições simultâneas o tempo todo).
- **Frontend**: nenhum erro de console, nenhuma tela em branco, nenhum crash em nenhum dos 4 papéis testados. Perfil do morador confirmado como persistência real (dúvida antiga fechada). Hierarquia de botões (trabalho desta sessão) consistente nas telas visitadas.
- **Dois gaps que constavam como "conhecidos e não corrigidos" na memória do projeto já foram corrigidos numa sessão anterior não rastreada**: o bug do 401 tratado como sessão expirada (`api/src/middlewares/auth-middlewares.ts` já devolve 403 pra erro de permissão desde o commit `99f1f3d`) e a falta de teste em `auth-controller.ts` (o arquivo de teste já existe). A memória do projeto (`nexosx-security-hardening-2026-08-15.md`) precisa ser atualizada pra não reabrir esses itens à toa numa próxima sessão.

---

## Bloqueantes — corrigir antes do primeiro cliente pagante

### 1. Painel do admin não aguenta escala (`admin/users`)

`GET /admin/users` devolve **todos** os usuários da plataforma numa lista sem paginação, busca ou filtro por condomínio (`api/src/controllers/admin-users-controller.ts`). Isso só ficou visível porque o teste de carga desta rodada populou 192 usuários sintéticos durante a auditoria — e o admin é a tela que o **operador da plataforma** (você) usa pra gerenciar clientes. Com alguns condomínios reais cadastrados, a tela vira impraticável. Inconsistente com Moradores/Encomendas/Visitantes, que já paginam desde a auditoria de 15/08.

**Status**: ✅ CORRIGIDO (2026-08-20) — ver `checklist-implementacao.md` Fase 12. `GET /admin/users` ganhou paginação/busca/filtro (mesmo padrão header-based do resto do app); a tela ganhou busca, filtro por perfil/condomínio e paginação. Bônus: corrigido no caminho um bug pré-existente mais amplo — os headers de paginação (`total-count` etc.) nunca estavam expostos via CORS (`exposedHeaders` ausente em `api/src/app.ts`), então **toda** listagem paginada do sistema (não só admin) tinha o total real invisível pro frontend, só nunca detectado porque nenhum dataset de teste excedeu uma página até esta triagem.

### 2. Importação em massa de moradores é lenta demais pro caso de uso que ela existe pra resolver

`POST /auth/users/bulk` levou **95,8 segundos pra 200 linhas** (~480ms/linha) num teste de carga real — é um `for` sequencial, com bcrypt custo-12 (deliberadamente lento) + múltiplas idas ao banco por linha, uma linha de cada vez. Essa é exatamente a ferramenta usada no onboarding de um cliente novo (importar os 200-500 moradores de um prédio de uma vez) — nesse tamanho a experiência é de "travou", não de "está processando". Também: a UI atual pede que o gestor **cole texto separado por vírgula numa textarea**, um formato hostil pra quem só tem os dados numa planilha (Excel/Google Sheets) — que é o formato real que qualquer administradora de condomínio já usa.

**Status**: ✅ CORRIGIDO (2026-08-20) — ver `checklist-implementacao.md` Fase 12. Import agora lê upload de planilha `.xlsx`/`.csv` (parse 100% client-side, com modelo pra baixar e preview das linhas reconhecidas antes de confirmar) em vez de colar texto numa textarea. Backend: 200 linhas caiu de 95,8s pra ~15,6s (pré-fetch de e-mails existentes numa única query + processamento em lote paralelo com limite de concorrência, em vez de sequencial linha a linha) — validado sob concorrência real, inclusive duplicata de e-mail dentro do mesmo arquivo sendo detectada corretamente mesmo em paralelo.

---

## Achados menores (não bloqueantes)

| Achado                                                                                                                                                                                                                  | Onde                                                                    | Severidade                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Formulário "Novo chamado" não marca "Descrição" como obrigatório visualmente, mas bloqueia o envio com toast genérico sem destacar o campo                                                                              | `web/src/pages/app/maintenance-requests.tsx`                            | Baixa — UX confusa, não bloqueia o uso                                       |
| Porteiro tentando ação restrita a gestor (ex: desativar morador) não é mais deslogado (já corrigido), mas o botão continua visível e o erro é um toast genérico sem indicar que é falta de permissão                    | `web/src/components/residents/deactivate-button.tsx` e pontos similares | Baixa — o backend já bloqueia corretamente, é só polimento de UX             |
| Painel admin (Dashboard/Solicitações/Condomínios/Usuários) nunca passou pelo trabalho de redesign visual feito nas outras telas nesta sessão — funciona, mas visualmente cru comparado ao resto do app                  | `web/src/pages/admin/*.tsx`                                             | Baixa — cosmético, não afeta função                                          |
| Rate-limit de login é por IP, não por conta — correto e não contornável, mas num condomínio com Wi-Fi/NAT compartilhado, vários logins legítimos simultâneos da mesma rede podem levar 429 junto, sem ser ataque nenhum | `api/src/middlewares/rate-limit.ts`                                     | Observacional — monitorar depois do lançamento, não corrigir preventivamente |
| Falta teste dedicado pra `condominios-controller.ts` (única rota de provisionamento direto condomínio+gestor pelo admin, fora do fluxo de solicitação já auditado)                                                      | `api/src/controllers/condominios-controller.ts`                         | Baixa — item de higiene de teste, não risco de segurança ativo               |

---

## Fora do escopo desta triagem técnica

**Conformidade com LGPD** — o sistema guarda CPF, telefone e endereço de pessoas reais (moradores). Vender pra terceiros/administradoras exige checar com alguém que entenda de compliance de dados pessoais no Brasil (base legal de tratamento, retenção, direito de exclusão, etc.) — isso não foi avaliado nesta triagem técnica.

---

## Próximos passos (depois de corrigidos os dois bloqueantes)

1. Prospectar com confiança — o produto sustenta o pitch e uso real.
2. Se quiser, um passe de polimento visual no painel admin (mesmo padrão de `PageHeader`/stat cards já aplicado no resto do app) — não é bloqueante, é о único canto do sistema que nunca recebeu esse tratamento.
3. Checar LGPD antes de formalizar contrato com o primeiro cliente.
4. Limpar o dado sintético "LoadTest..." do banco local quando não precisar mais dele (é local, descartável, não afeta produção).
