# Telemax AI Factory — Worker
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @telemax/worker... build
CMD ["pnpm", "--filter", "@telemax/worker", "start"]
