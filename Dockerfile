FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/extension/package.json ./apps/extension/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/ui/package.json ./packages/ui/package.json

FROM manifests AS deps
RUN pnpm install --frozen-lockfile --filter loomark...

FROM manifests AS prod-deps
RUN pnpm install --frozen-lockfile --prod --filter loomark...

FROM base AS builder
COPY --from=deps /app/ ./
COPY . .
RUN pnpm run build && rm -rf apps/web/.next/cache

FROM base AS runner
ARG APP_VERSION=dev
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV APP_VERSION=${APP_VERSION}
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV ARCHIVE_DIR=/data/archives
ENV HOME=/home/loomark

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      font-noto \
      font-noto-emoji

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S loomark -G nodejs \
  && mkdir -p /data/archives /home/loomark \
  && chown -R loomark:nodejs /data /home/loomark

COPY --from=prod-deps --chown=loomark:nodejs /app/ ./
COPY --from=builder --chown=loomark:nodejs /app/packages ./packages
COPY --from=builder --chown=loomark:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=loomark:nodejs /app/apps/web/lib/generated ./apps/web/lib/generated
COPY --from=builder --chown=loomark:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=loomark:nodejs /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=builder --chown=loomark:nodejs /app/apps/web/prisma.config.ts ./apps/web/prisma.config.ts
COPY --from=builder --chown=loomark:nodejs /app/apps/web/prisma ./apps/web/prisma
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh

VOLUME ["/data/archives"]

USER loomark
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["entrypoint.sh"]
CMD ["pnpm", "--filter", "loomark", "start"]
