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

# Устанавливаем зависимости (все, включая dev)
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

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем только production зависимости
RUN pnpm install --prod

# Копируем билд и Prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Порт NestJS
EXPOSE 3000

# Запуск
CMD ["node", "dist/main.js"]
