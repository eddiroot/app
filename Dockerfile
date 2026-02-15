FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build
RUN npm prune --prod

FROM node:22-alpine AS deployer

WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/package.json .
COPY --from=builder /app/drizzle.config.ts .
COPY --from=builder /app/migrations migrations/
RUN npm install drizzle-kit
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]