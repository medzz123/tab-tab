FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS builder
COPY . .
RUN npx turbo prune @template/api --docker

FROM base AS installer
WORKDIR /app

ARG DATABASE_URL

ENV DATABASE_URL=$DATABASE_URL

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .


RUN npx turbo run build --filter=@template/api

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml .
RUN pnpm install --prod --frozen-lockfile

COPY --from=installer /app/apps/api/dist ./apps/api/dist/

USER nodejs

CMD ["node", "apps/api/dist/main.cjs"]