# =========================
# 1. Build stage
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Для нативных зависимостей
RUN apk add --no-cache bash python3 make g++

# Устанавливаем pnpm
RUN npm install -g pnpm

# Копируем зависимости
COPY package.json pnpm-lock.yaml ./

# Устанавливаем все зависимости (dev + prod)
RUN pnpm install

# Копируем весь код
COPY . .

# Генерация Prisma Client
RUN pnpm prisma generate

# Сборка NestJS
RUN pnpm build

# =========================
# 2. Production stage
# =========================
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/generated ./generated
COPY package.json ./
COPY prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && pnpm start:prod"]
