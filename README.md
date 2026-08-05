# Telemax AI Factory

A plugin-first TypeScript framework and platform foundation for AI-driven
generation of websites, landing pages, applications, software and other digital
products.

This repository contains the **foundation**: a strict, modular monorepo with a
framework kernel, centralized configuration, and an abstract generator SDK.
It deliberately ships **no example or demo generators** — only the primitives on
top of which concrete capabilities are built.

> Status: `0.1.0` — foundation. APIs are not yet stable.

## Design principles

- **Plugin-first.** Functionality is added or removed as plugins without
  modifying the Core.
- **One-way dependencies.** The Core depends on nothing internal; generators and
  feature packages depend on the Core, never the reverse.
- **Centralized configuration.** A single typed configuration package is the
  source of truth for platform settings.
- **Strictness by default.** Maximum-safety TypeScript, type-aware linting, and
  a ban on `any` (documented exceptions only).
- **Everything documented.** Architecture decisions and conventions live in
  `docs/`, in technical English.

## Packages

| Package                  | Path                      | Responsibility                                                        |
| ------------------------ | ------------------------- | --------------------------------------------------------------------- |
| `@telemax/core`          | `core/`                   | Kernel: plugins, DI container, lifecycle, logging, errors, contracts. |
| `@telemax/config`        | `config/`                 | Centralized, validated, strongly-typed platform configuration.        |
| `@telemax/generator-kit` | `packages/generator-kit/` | Abstract SDK for building generators on top of the Core.              |

The dependency direction is strictly one-way:

```
@telemax/config          @telemax/generator-kit
        \                        /
         \                      /
          --->  @telemax/core  <---   (depends on nothing internal)
```

## Repository layout

```
apps/        Runnable applications (CLI, services) — placeholder.
core/        @telemax/core
config/      @telemax/config
packages/    Feature packages and SDKs (@telemax/generator-kit, …)
tools/       Internal developer tooling — placeholder.
knowledge/   Knowledge-base assets for generation — placeholder.
prompts/     Prompt library — placeholder.
templates/   Generation templates — placeholder.
workflows/   Generation/orchestration workflow definitions — placeholder.
scripts/     Repository automation scripts — placeholder.
tests/       Cross-package integration tests — placeholder.
docs/        Architecture (SPEC + ADRs) and conventions.
```

## Requirements

- Node.js `>= 22` (see `.nvmrc`)
- pnpm `>= 9` (via Corepack: `corepack enable`)

## Getting started

```bash
pnpm install       # install all workspace dependencies
pnpm build         # build every package (Turborepo orders by dependency)
pnpm typecheck     # type-check every package
pnpm lint          # ESLint (type-aware) across the workspace
pnpm test          # run unit tests (Vitest)
pnpm format        # apply Prettier formatting
```

## Applications

| App                 | Path              | Responsibility                                            |
| ------------------- | ----------------- | --------------------------------------------------------- |
| `@telemax/api`      | `apps/api/`       | Fastify REST API — projects and live system status.       |
| `@telemax/dashboard`| `apps/dashboard/` | Next.js control plane — Projects, wizard and System page. |
| `@telemax/worker`   | `apps/worker/`    | BullMQ background worker.                                  |

## Project Manager Engine

Creating a project persists it to SQLite **and materialises a real workspace on
disk**:

```
workspace/<slug>/
  docs/  assets/  prompts/  output/  logs/  uploads/  build/
  project.json   # full project configuration
```

The "New project" wizard reads the installed generators, knowledge packs and AI
providers live from the repository scan (`GET /system/status`) — nothing is
hard-coded.

### API endpoints

```
GET    /health | /version | /stats           # system probes and live stats
GET    /system/status | /packages | /apps | /git   # repository scan
GET    /projects            POST   /projects
GET    /projects/:id        PUT    /projects/:id     DELETE /projects/:id
POST   /projects/:id/archive        POST   /projects/:id/duplicate
GET    /docs                                    # Swagger UI (OpenAPI)
```

Run the full stack with `pnpm dev`, then open `http://localhost:3000`
(dashboard) and `http://localhost:3001/docs` (API).

## Documentation

- Architecture specification: [`docs/SPEC-001-Foundation.md`](docs/SPEC-001-Foundation.md)
- Architecture Decision Records: [`docs/architecture/`](docs/architecture/)
- Contribution conventions: [`docs/conventions/`](docs/conventions/)
- How to contribute: [`CONTRIBUTING.md`](CONTRIBUTING.md)

## License

[MIT](LICENSE) © Gruppo AIR srl
