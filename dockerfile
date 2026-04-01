# =========================
# 1. Build stage
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Если есть нативные зависимости для Prisma
RUN apk add --no-cache bash python3 make g++

# Устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем весь код
COPY . .

# Генерация Prisma Client
RUN npx prisma generate

# Сборка NestJS
RUN npm run build

# =========================
# 2. Production stage
# =========================
FROM node:20-alpine

WORKDIR /app

# Только prod зависимости
COPY package*.json ./
RUN npm install --omit=dev

# Копируем билд
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Порт приложения
EXPOSE 3000

# Запуск
CMD ["node", "dist/main.js"]
