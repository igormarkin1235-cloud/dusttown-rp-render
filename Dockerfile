FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
RUN npm install -g tsx
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["tsx", "server.ts"]
