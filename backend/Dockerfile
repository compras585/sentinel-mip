FROM node:22-bookworm-slim

WORKDIR /app

# Instalar OpenSSL para el motor de Prisma
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV DATABASE_URL=postgresql://sentinel_build:sentinel_build@localhost:5432/sentinel_build?schema=public

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
