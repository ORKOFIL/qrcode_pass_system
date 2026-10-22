FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma7.config.ts ./
# generate не підключається до БД, але конфіг читає DATABASE_URL
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate --config prisma7.config.ts

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npx", "tsx", "src/server.ts"]
