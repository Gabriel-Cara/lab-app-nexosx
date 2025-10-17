FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile || npm install
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.cjs postcss.config.cjs index.html ./
COPY src ./src
COPY public ./public 2>/dev/null || true
RUN npm run build

FROM nginx:1.27-alpine AS production
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
