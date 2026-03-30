# =========================
# 1. Stage: Build
# =========================
FROM node:20-alpine AS builder

# Создаём рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --frozen-lockfile

# Копируем весь код
COPY . .

# Сборка NestJS
RUN npm run build

# =========================
# 2. Stage: Runtime
# =========================
FROM node:20-alpine

WORKDIR /app

# Копируем только необходимые файлы из builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Устанавливаем переменные окружения через docker-compose/env_file
ENV NODE_ENV=production
ENV PORT=3000

# Открываем порт
EXPOSE 3000

# Запуск приложения
CMD ["node", "dist/main.js"]
