# REPOSITORY STATUS — Telemax AI Factory

_Snapshot generato per TASK-013.0 (messa in sicurezza del repository) — 2026-08-03._

## Sintesi

| Voce | Valore |
|---|---|
| Package (workspace di libreria `@telemax/*`) | 9 (+1 root privato `@telemax/ai-factory`) |
| App eseguibili (`apps/*`) | 3 |
| Test | 285 casi in 94 file |
| Endpoint API REST | 8 (+ Swagger UI su `/docs`) |
| Stato build | Dichiarata verde in sviluppo — non ri-verificabile in questo ambiente (vedi sotto) |
| Stato git | Storia consolidata in commit logici su `main`, tag `v0.1.0-foundation` |

## Package (9)

`@telemax/core`, `@telemax/config`, `@telemax/knowledge`, `@telemax/prompt-engine`,
`@telemax/ai`, `@telemax/workflow`, `@telemax/generator-engine`,
`@telemax/generator-kit`, `@telemax/generator-wordpress`.

Tutti a versione `0.1.0`. Grafo delle dipendenze aciclico (layering lineare dal core).

## App (3)

- `@telemax/api` — Fastify 5 + better-sqlite3 (porta 3001).
- `@telemax/dashboard` — Next.js 15 App Router + React 19 (porta 3000).
- `@telemax/worker` — BullMQ 5 + ioredis 5.

## Endpoint API (8 + docs)

| Metodo | Path |
|---|---|
| GET | `/health` |
| GET | `/version` |
| GET | `/stats` |
| GET | `/projects` |
| POST | `/projects` |
| GET | `/projects/:id` |
| PUT | `/projects/:id` |
| DELETE | `/projects/:id` |
| GET | `/docs` (Swagger UI / OpenAPI) |

## Test

285 casi in 94 file. Ripartizione: core 27, config 3, knowledge 38, prompt-engine 45,
ai 42, workflow 35, generator-engine 42, generator-kit 5, generator-wordpress 30,
api 9, worker 2, dashboard 7.

## Stato build

La pipeline (`lint` / `typecheck` / `test` / `build`) è dichiarata verde sull'ambiente di
sviluppo originale e in CI (GitHub Actions, `.github/workflows/ci.yml`).

In questa operazione di messa in sicurezza la build **non è stata ri-eseguibile**: il
`node_modules` consegnato contiene solo binari nativi Windows (turbo, next-swc, esbuild,
rollup, sharp), `@types/node@22` non è presente nello store e una reinstallazione offline
non è possibile. La verifica di compilazione va rieseguita su un ambiente con toolchain
completa (`pnpm install` con rete) oppure lasciata alla CI.

## Stato git

- Prima di TASK-013.0: un solo commit (scaffold iniziale), tutto il resto non versionato.
- Dopo TASK-013.0: l'intero lavoro completato è suddiviso in commit logici (convenzione
  Conventional Commits) su `main`, con tag annotato `v0.1.0-foundation`.
- Esclusi dal versionamento (rigenerabili): `node_modules/`, `dist/`, `.next/`,
  `apps/api/data/` (DB SQLite runtime), `output/` e `validation/outputs/` (temi generati).

## Roadmap completata

| Milestone / Sprint | Contenuto | Stato |
|---|---|---|
| SPEC-001 — Foundation | Monorepo, `@telemax/core`, `@telemax/config`, `@telemax/generator-kit` | Completato |
| SPEC-002 — Knowledge Engine | `@telemax/knowledge` (infrastruttura) | Completato |
| SPEC-003 — Prompt Engine | `@telemax/prompt-engine` (infrastruttura) | Completato |
| SPEC-004 — AI Orchestrator | `@telemax/ai` (infrastruttura, solo StubProvider) | Completato |
| SPEC-005 — Workflow Engine | `@telemax/workflow` (infrastruttura) | Completato |
| SPEC-006 — Generator Engine | `@telemax/generator-engine` (generico) | Completato |
| SPEC-007 — WordPress News Generator | `@telemax/generator-wordpress` + CLI + FS writer | Completato |
| Release 0.2 — Quality Review + Field Validation | Review 6 dimensioni; 5 progetti validati | Completato |
| SPRINT-011 — Platform apps | dashboard + api + worker | Completato |
| SPRINT-012 — Project Management Engine v1 | CRUD Projects + persistenza SQLite | Completato |

### Non completato / debito noto (riferimento TASK-REVIEW-001)

Provider AI reali assenti (solo stub); output `.php` dei generatori ancora scaffold con
TODO; worker non collegato al Generator Engine; autenticazione dashboard placeholder;
`/stats` in parte statico; 10/15 pagine dashboard placeholder; release `0.2.0` non ancora
tagliata (6 changeset minor pendenti).
