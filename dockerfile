# =========================
# 1. Build stage
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Для нативных зависимостей (Prisma, bcrypt и т.д.)
RUN apk add --no-cache bash python3 make g++

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

# Копируем файлы зависимостей
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

# Устанавливаем pnpm
RUN npm install -g pnpm

# Копируем node_modules, билд и Prisma из build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Порт NestJS
EXPOSE 3000

# Запуск через pnpm start:prod
CMD ["pnpm", "start:prod"]