# Telemax AI Factory — Dashboard (Next.js)
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @telemax/dashboard build
EXPOSE 3000
CMD ["pnpm", "--filter", "@telemax/dashboard", "start"]
