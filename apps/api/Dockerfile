# Telemax AI Factory — API service
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @telemax/api... build
EXPOSE 3001
CMD ["pnpm", "--filter", "@telemax/api", "start"]
