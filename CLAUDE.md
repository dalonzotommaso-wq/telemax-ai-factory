# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Telemax AI Factory — a plugin-first TypeScript monorepo for AI-driven generation of
websites, landing pages, apps and other digital products. It ships the **framework
primitives plus two concrete generators** (`generator-wordpress`, `generator-landing`);
it is not a demo project.

## Environment note (important on this machine)

The Windows username contains an apostrophe (`TommasoD'Alonzo`), which crashes the
**Bash tool** (`add_item ... failed`). Use the **PowerShell tool** for all shell
work here. PowerShell 5.1 rules apply: no `&&`/`||` chaining, no ternary, use
`Get-Content`/`Test-Path` etc.

## Commands

Run from the repo root. Turborepo orders tasks by the dependency graph and caches
unchanged packages.

```
pnpm install              # frozen-lockfile install (Node >=22, pnpm >=9 via corepack)
pnpm build                # tsc build of every package, dependencies first
pnpm typecheck            # tsc --noEmit across the workspace
pnpm lint                 # ESLint (type-aware). NOTE: eslint.config.js ignores apps/** —
                          #   apps are linted by their own `pnpm --filter <app> lint`
pnpm test                 # Vitest (`vitest run`) in every package
pnpm format:check         # Prettier check (format owns all formatting; ESLint never fights it)
pnpm dev                  # run api (3001) + dashboard (3000) + worker together
```

The five CI gates (`.github/workflows/ci.yml`) are exactly: `format:check`, `lint`,
`typecheck`, `test`, `build`. Run all before proposing a PR.

### Single package / single test

```
pnpm --filter @telemax/ai test                      # one package's tests
pnpm --filter @telemax/ai test -- orchestrator      # filter by file/name substring
pnpm --filter @telemax/ai test -- -t "circuit breaker opens"   # single test by title
pnpm --filter @telemax/ai build                     # build just this package (+ its deps via turbo)
```

Tests are Vitest, co-located as `*.test.ts` (integration tests as `*.integration.test.ts`).
There is no root vitest config; each package runs `vitest run` directly.

### WordPress generator CLI

```
pnpm telemax generate wordpress-news [--out <dir>] [--name <site>] [--url <url>]
# writes a full theme into output/wordpress-news/<themeSlug>/ + .telemax/manifest.json (SHA-256 per file)
```

### Changesets

Any change to a published package's behavior needs a changeset (`pnpm changeset`),
committed with the change. Commits follow Conventional Commits (commitlint enforced
via Husky; `lint-staged` formats/lints staged files on commit).

## Architecture

### The one-way dependency rule (do not break)

```
@telemax/config          @telemax/generator-kit
        \                        /
         \                      /
          --->  @telemax/core  <---   (depends on nothing internal)
```

`core` depends on nothing internal. Feature packages and generators depend on
`core` (and on each other along a strictly acyclic, linear layering); **never the
reverse**. Functionality is added/removed as plugins without modifying `core`.
See `docs/architecture/adr/0003`, `0004` and `CONTRIBUTING.md`.

### Package layering (each depends only on those above it)

```
core → config
core → knowledge → prompt-engine → ai → workflow → generator-engine → generator-wordpress
                                                                    → generator-landing
generator-kit → core        (abstract SDK, separate branch)
```

| Package                        | Role                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@telemax/core`                | Kernel: `Kernel` (composition root), `ServiceContainer` (DI, `createToken`), `PluginRegistry`, `ConsoleLogger`, `FrameworkError` hierarchy, `Result` type, branded types. Single barrel: `src/index.ts`.                                                                                                                                          |
| `@telemax/config`              | Centralized, validated, strongly-typed platform config. Single source of truth.                                                                                                                                                                                                                                                                   |
| `@telemax/knowledge`           | Knowledge Engine infrastructure (knowledge packs).                                                                                                                                                                                                                                                                                                |
| `@telemax/prompt-engine`       | Prompt templating / assembly infrastructure.                                                                                                                                                                                                                                                                                                      |
| `@telemax/ai`                  | AI Orchestrator: provider registry, model registry, execution pipeline, cost/token tracking, resilience (circuit breaker, retry, rate limiter, health monitor), streaming, telemetry. Providers: `StubProvider` (default) + `OpenAIProvider`. **No real provider is wired by default.**                                                           |
| `@telemax/workflow`            | Workflow Engine: step orchestration over knowledge/prompt/ai.                                                                                                                                                                                                                                                                                     |
| `@telemax/generator-engine`    | Generic, target-agnostic Generator Engine: `GeneratorEngine`, `Generator`, pipelines/steps, `ArtifactCollection`, template renderer, `ArtifactWriter` port (`InMemoryArtifactWriter` default, `FileSystemArtifactWriter` rejects path traversal), coordination runners for workflow/ai/prompt/knowledge. Knows nothing about WordPress/React/etc. |
| `@telemax/generator-kit`       | Abstract SDK for building generators on top of `core` (separate dependency branch from the engine).                                                                                                                                                                                                                                               |
| `@telemax/generator-wordpress` | Concrete generator. Blueprint (design tokens, layout, SEO, a11y, web-vitals) + templates → theme files rendered **through the engine** (no static template copying). `.php` output is still scaffold-level by design.                                                                                                                             |
| `@telemax/generator-landing`   | Concrete generator. Single-page static HTML/CSS "vetrina"; AI copy via the same **Content Plan** mechanism as `generator-wordpress`; minimal design-tokens module (no full blueprint). `apps/api` picks a generator via the `GeneratorAdapter` registry in `apps/api/src/services/generators/`.                                                   |

### Apps (`apps/*`) — not covered by root ESLint

| App                  | Stack                            | Port | Notes                                                                                                                                                                                                                                                                                                      |
| -------------------- | -------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@telemax/api`       | Fastify 5 + better-sqlite3       | 3001 | REST + Swagger UI at `/docs`. Routes in `src/routes/*`, services in `src/services/*` (`repository-service` scans the repo live, `workspace-service` materialises project dirs, `generation-service` drives the generator), repos in `src/repositories/*`. Fastify type augmentation in `src/fastify.d.ts`. |
| `@telemax/dashboard` | Next.js 15 App Router + React 19 | 3000 | Control plane. Many pages are still placeholders; `src/lib` holds API clients.                                                                                                                                                                                                                             |
| `@telemax/worker`    | BullMQ 5 + ioredis               | —    | Background worker; **not yet connected** to the Generator Engine.                                                                                                                                                                                                                                          |

`docker-compose.yml` runs redis + all three apps. Env: copy `.env.example`.

Creating a project persists to SQLite **and** creates `workspace/<slug>/{docs,assets,prompts,output,logs,uploads,build}` with `project.json` on disk. The "new project" wizard reads installed generators / knowledge packs / AI providers live from `GET /system/status` — nothing is hard-coded.

## Code conventions (tooling can't fully enforce these)

- **ESM only.** Relative imports carry the `.js` extension (`NodeNext`). `import type` / `export type` for types (`verbatimModuleSyntax`).
- **`any` is banned** as an ESLint _error_. A real exception needs an inline `// eslint-disable-next-line @typescript-eslint/no-explicit-any` **plus** a justifying comment. Prefer `unknown` + narrowing.
- **`Result<T,E>` for expected failures** (validation, lookups); **throw `FrameworkError` subclasses** for programmer errors / exceptional conditions. Catch clauses treat the error as `unknown`.
- Error classes end in `Error`, extend `FrameworkError`, carry a stable `ERR_*` `UPPER_SNAKE_CASE` `code`.
- One public entry point per package (`src/index.ts`); **no deep imports** into another package. `tsconfig.base.json` path aliases resolve `@telemax/*` to each package's built `dist/`, so a dependency must be built before a dependent typechecks.
- `readonly` / `const` by default; explicit return types on exported functions.
- kebab-case files (`plugin-registry.ts`), PascalCase types/classes (no `I` prefix), camelCase functions, `UPPER_SNAKE_CASE` module constants and DI tokens.
- TSDoc on public types/functions explains intent; config/tooling files carry a header comment.
- Max-safety TS is on (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, …). Project references are deliberately **not** used — Turborepo handles build ordering.

## Docs

`docs/SPEC-00X-*.md` (one per engine) and `docs/architecture/adr/*` are the design
record. `REPOSITORY-STATUS.md` and `SPRINT-00X-REPORT.md` track state and known
debt (real AI providers absent, `.php` output scaffold-level, worker not wired,
dashboard auth is a placeholder).
