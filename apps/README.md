# Telemax AI Factory — Applications

Runnable applications built on the `@telemax/*` engine packages.

| App                  | Stack                                                       | Port | Purpose                                   |
| -------------------- | ----------------------------------------------------------- | ---- | ----------------------------------------- |
| `@telemax/dashboard` | Next.js (App Router), TypeScript, Tailwind, shadcn-style UI | 3000 | Control-plane UI                          |
| `@telemax/api`       | Fastify, TypeScript, Swagger                                | 3001 | HTTP API (`/health`, `/version`, `/docs`) |
| `@telemax/worker`    | BullMQ, ioredis                                             | —    | Background job worker                     |

## Run everything (dev)

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000 — the top bar shows **ONLINE**/**OFFLINE** from a
live `GET /health` against the API (default `http://localhost:3001`).

## Endpoints

**System**

- `GET /health` → `{ "status": "ok", "uptime": <s> }`
- `GET /version` → `{ "name", "version", "node" }`
- `GET /stats` → `{ "projects", "generators", "packages", "tests" }` (project count is live from the DB)
- Swagger UI: `/docs`

**Project management** (SQLite persistence via better-sqlite3, DB at `apps/api/data/telemax.db`)

- `GET /projects` — list, with `?q=`, `?sort=name|createdAt|status|type`, `?order=asc|desc`
- `GET /projects/:id`
- `POST /projects` — `{ name, type, description?, status?, stack?, version? }`
- `PUT /projects/:id`
- `DELETE /projects/:id`

Types: `wordpress-news`, `landing-page`, `react`, `flutter`, `laravel`.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

The worker connects to Redis; without Redis running it logs a connection warning and
keeps retrying (it does not crash the dev stack).
