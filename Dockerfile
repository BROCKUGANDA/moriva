FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./db/build.db"
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S moriva && adduser -S moriva -G moriva
COPY --from=build --chown=moriva:moriva /app/.next/standalone ./
COPY --from=build --chown=moriva:moriva /app/.next/static ./.next/static
COPY --from=build --chown=moriva:moriva /app/public ./public
COPY --from=build --chown=moriva:moriva /app/prisma ./prisma
RUN mkdir -p /app/db && chown -R moriva:moriva /app/db
USER moriva
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health | grep -q '"status":"ready"' || exit 1
CMD ["node", "server.js"]
