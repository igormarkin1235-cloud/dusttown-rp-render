FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run lint && npm run build

FROM node:22-slim AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/scripts ./scripts

ENV NODE_ENV=production
ENV PORT=10000
ENV PATH="/app/node_modules/.bin:$PATH"
EXPOSE 10000

CMD ["npm", "start"]
