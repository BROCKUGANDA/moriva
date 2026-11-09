FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json ./
COPY bun.lock ./
RUN npm install --no-audit --no-fund || npm install --no-audit --no-fund --legacy-peer-deps

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S moriva && adduser -S moriva -G moriva
COPY --from=build --chown=moriva:moriva /app/.next/standalone ./
COPY --from=build --chown=moriva:moriva /app/.next/static ./.next/static
COPY --from=build --chown=moriva:moriva /app/public ./public
COPY --from=build --chown=moriva:moriva /app/prisma ./prisma
USER moriva
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health | grep -q '"status":"ready"' || exit 1
CMD ["node", "server.js"]
