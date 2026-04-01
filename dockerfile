# =========================
# 1. Build stage
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Устанавливаем зависимости (с кэшем)
COPY package*.json ./
RUN npm ci

# Копируем код
COPY . .

# Сборка
RUN npm run build

# =========================
# 2. Production stage
# =========================
FROM node:20-alpine

WORKDIR /app

# Только production зависимости
COPY package*.json ./
RUN npm ci --omit=dev

# Копируем билд
COPY --from=build /app/dist ./dist

# Порт (NestJS по умолчанию 3000)
EXPOSE 3000

# Запуск
CMD ["node", "dist/main.js"]
