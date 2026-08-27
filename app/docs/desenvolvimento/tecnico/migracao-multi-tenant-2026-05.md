# Migração multi-tenant (2026-05)

> **Status: aplicado e em produção há muito tempo.** Documento histórico de arquitetura — descreve a migração `20260519000000_roles_blocks_residences` (renomeação de roles, criação de Blocos/Residências) que fundou o modelo atual do sistema. Renomeado de `MIGRATION_MULTI_TENANT.md` (2026-08-27). Não confundir com a fundação multi-**condomínio**/`Organization` mais recente (2026-08-25), documentada em `gaps-administradoras-multi-condominio.md` §0 — são duas migrações diferentes, com nomes parecidos.

Esta versão adapta a aplicação para operação com múltiplos condomínios e altera o modelo de autorização.

## Hierarquia nova

- `Condominium` possui vários `Block`.
- `Block` possui várias `Residence`.
- `Residence` pode estar vinculada a nenhum, um ou vários moradores (`User`).
- Os campos legados `apartment` e `ResidentInfo.building` foram preservados para compatibilidade com módulos existentes e são sincronizados quando a residência é criada/alterada pelos fluxos novos.

## Roles

- `admin`: administrador da plataforma, sem condomínio fixo no token. Pode selecionar o condomínio em rotas multi-tenant usando `condominiumId` no body/query ou `x-condominium-id` no header.
- `manager`: antigo `admin`, gestor/síndico vinculado a um condomínio.
- `doorman`: antigo `staff`, portaria vinculada a um condomínio.
- `resident`: morador vinculado a um condomínio.

## Novos módulos

- Backend: rotas `/blocks` e `/residences`.
- Frontend: páginas `Blocos` e `Residências` adicionadas ao menu.
- `Blocos`: acesso para `admin` e `manager`.
- `Residências`: leitura para `admin`, `manager`, `doorman` e `resident`; criação/edição/remoção para `admin` e `manager`.

## Compatibilidade

- Convites novos da portaria usam `/cadastro-portaria` e `/auth/doorman-*`.
- Rotas antigas `/cadastro-equipe` e `/auth/staff-*` foram mantidas como aliases para não invalidar links já enviados.
- Variáveis de seed antigas (`MASTER_*`, `SEED_ADMIN_*`) continuam aceitas como fallback, mas os nomes novos são `PLATFORM_ADMIN_*` e `SEED_MANAGER_*`.

## Aplicação da migração

Depois de atualizar o código, rode no backend:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

A migração `20260519000000_roles_blocks_residences` renomeia os valores do enum `Role`, cria `blocks` e `residences`, adiciona `users.residence-id` e faz backfill usando `users.apartment` + `resident-infos.building`.
