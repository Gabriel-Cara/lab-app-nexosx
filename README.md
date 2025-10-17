# Condo Guardian – Gestão de Portaria Condominial

SaaS completo para administração de portarias, moradores, visitantes e eventos condominiais. O projeto está estruturado em dois serviços (`backend/` e `frontend/`) e foi pensado para rodar tanto em ambiente local quanto em contêineres Docker.

## Principais funcionalidades

- **Autenticação JWT** com perfis `ADMIN`, `PORTEIRO` e `MORADOR`.
- **Gestão de usuários**: cadastro de moradores, porteiros e administradores (porteiros/admins).
- **Portal do morador**: visualização de perfil, encomendas e agendamento em eventos.
- **Controle de encomendas**: registro, notificação automática via serviço de notificação pluggable e retirada com validação de código.
- **Controle de visitantes**: registro de entradas, saídas e histórico com morador anfitrião.
- **Agenda de eventos**: criação e reserva de vagas com controle de capacidade.
- **Dashboard responsivo** com métricas em tempo real.
- **Swagger** disponível em `/docs` para documentação da API.

## Tecnologias utilizadas

| Camada     | Tecnologias                                                                 |
|------------|------------------------------------------------------------------------------|
| Front-end  | React + Vite, TypeScript, TailwindCSS, ShadCN UI, React Hook Form, Zod, TanStack Query, Sonner, Lucide Icons |
| Back-end   | Node.js, Express, TypeScript, Prisma ORM, Zod, JWT, Swagger                 |
| Infra      | PostgreSQL, Docker, Docker Compose                                          |

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker e Docker Compose (opcional para containerização)

## Variáveis de ambiente

Copie os exemplos e ajuste conforme necessário:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Campos principais:

- `DATABASE_URL`: string de conexão do PostgreSQL.
- `JWT_SECRET`: segredo utilizado para assinar tokens JWT.
- `VITE_API_URL`: endereço base da API para o front-end.

## Banco de dados & Prisma

1. Ajuste `backend/.env` com a URL do banco.
2. Gere o cliente Prisma e execute as migrações:

   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run prisma:migrate
   ```

Isso criará o schema `condo_manager` com todas as tabelas necessárias.

## Executando em modo desenvolvimento

### Back-end

```bash
cd backend
npm install
npm run dev
```

- API disponível em `http://localhost:4000`.
- Documentação Swagger em `http://localhost:4000/docs`.

### Front-end

```bash
cd frontend
npm install
npm run dev
```

- Aplicação disponível em `http://localhost:5173`.

### Usuário inicial

Crie um usuário administrador usando a rota `/api/auth/users` (via Swagger ou cURL). Exemplo de payload:

```json
{
  "name": "Admin",
  "email": "admin@condo.com",
  "password": "123456",
  "phone": "11999999999",
  "role": "ADMIN"
}
```

Em seguida, autentique-se em `/api/auth/login` para obter o token JWT e utilizar as demais rotas.

## Executando com Docker Compose

```bash
docker compose build
docker compose up -d
```

Serviços expostos:

- **API**: `http://localhost:4000`
- **Swagger**: `http://localhost:4000/docs`
- **Front-end** (Nginx): `http://localhost:5173`
- **PostgreSQL**: `localhost:5432`

> O container do back-end executa `prisma migrate deploy` automaticamente ao subir.

## Pipeline de build

- `backend/Dockerfile`: multi-stage com etapa de build e runtime enxuta.
- `frontend/Dockerfile`: build Vite + Nginx com roteamento SPA preparado.
- `docker-compose.yml`: orquestração completa (db, backend, frontend).

## Boas práticas e notas importantes

- O serviço de notificação (`src/services/notificationService.ts`) está desacoplado para facilitar a troca por Twilio, AWS SNS etc.
- Validações de entrada com **Zod** garantem contratos fortes entre front e back.
- Camadas separadas (`controllers`, `routes`, `middlewares`, `validators`) permitem manutenção e escalabilidade.
- Tailwind + ShadCN garantem identidade visual consistente e suporte nativo a temas claro/escuro.
- Utilize `npm run build` em `backend/` e `frontend/` antes de implantar em produção.
- Sugestões de deploy: Render, Railway ou Fly.io para o back-end; Vercel ou Netlify para o front-end; Supabase ou Neon para o banco Postgres.

## Scripts úteis

| Diretório | Comando                 | Descrição                                 |
|-----------|-------------------------|-------------------------------------------|
| backend   | `npm run dev`           | API em modo desenvolvimento (ts-node-dev) |
| backend   | `npm run build`         | Compila TypeScript para `dist/`           |
| backend   | `npm run start`         | Executa versão compilada                  |
| backend   | `npm run prisma:studio` | Abre Prisma Studio                        |
| frontend  | `npm run dev`           | Vite dev server                           |
| frontend  | `npm run build`         | Build de produção                         |
| frontend  | `npm run preview`       | Pré-visualização do build                 |

---

Sinta-se à vontade para adaptar o projeto às regras do seu condomínio ou evoluir com integrações externas (biometria, catracas, provedores de SMS/WhatsApp e mais).
