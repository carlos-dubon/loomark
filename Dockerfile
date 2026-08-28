FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build && rm -rf .next/cache && pnpm prune --prod

FROM base AS runner
ARG APP_VERSION=dev
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV APP_VERSION=${APP_VERSION}
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S loomark -G nodejs
COPY --from=builder --chown=loomark:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=loomark:nodejs /app/.next ./.next
COPY --from=builder --chown=loomark:nodejs /app/lib/generated ./lib/generated
COPY --from=builder --chown=loomark:nodejs /app/public ./public
COPY --chown=loomark:nodejs package.json next.config.ts prisma.config.ts ./
COPY --chown=loomark:nodejs prisma ./prisma
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
USER loomark
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["entrypoint.sh"]
CMD ["node_modules/.bin/next", "start"]
