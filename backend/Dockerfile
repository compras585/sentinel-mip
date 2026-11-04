FROM node:22-bookworm-slim
WORKDIR /app
ENV DATABASE_URL=postgresql://sentinel_build:sentinel_build@localhost:5432/sentinel_build?schema=public
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
