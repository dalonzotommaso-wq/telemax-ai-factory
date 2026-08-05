# BACKLOG — Telemax AI Factory

> Product backlog for evolving Telemax AI Factory into a full AI platform for building websites, news portals, WordPress, landing pages, React, Laravel, Flutter, CRM, ERP, desktop apps, SaaS, HbbTV, APIs and automations.

The backlog is organized by **Epic** and ordered by delivery sequence (foundation and the AI core first, then the generation engine, then target-specific generators, then platform and governance features). Items are traced to milestones in [ROADMAP.md](ROADMAP.md).

## Delivery status

| Sprint     | SPEC     | Scope                                                                      |    Status    |
| ---------- | -------- | -------------------------------------------------------------------------- | :----------: |
| SPRINT-001 | SPEC-001 | Foundation (core / config / kit)                                           | ✅ delivered |
| SPRINT-002 | SPEC-002 | Knowledge Engine (`@telemax/knowledge`)                                    | ✅ delivered |
| SPRINT-003 | SPEC-003 | Prompt Engine (`@telemax/prompt-engine`)                                   | ✅ delivered |
| SPRINT-004 | SPEC-004 | AI Orchestrator (`@telemax/ai`)                                            | ✅ delivered |
| SPRINT-005 | SPEC-005 | Workflow Engine (`@telemax/workflow`)                                      | ✅ delivered |
| SPRINT-006 | SPEC-006 | Generator Engine (`@telemax/generator-engine`)                             | ✅ delivered |
| SPRINT-007 | SPEC-007 | WordPress News Generator (`@telemax/generator-wordpress`)                  | ✅ delivered |
| SPRINT-009 | SPEC-007 | WordPress News Generator v1 — disk output + CLI + FileSystemArtifactWriter | ✅ delivered |
| SPRINT-010 | SPEC-007 | WordPress News Generator validation (5 profiles) + WCAG contrast fix       | ✅ delivered |

SPRINT-002 delivers the Knowledge Base engine **infrastructure**, satisfying
`ASSET-04` (Knowledge base ingestion) at the infrastructure level — loaders
(Markdown/JSON/YAML; PDF/image prepared), repository with versioning, full-text
index (embeddings prepared), validation and import/export. `ASSET-01` (Prompt
library) is the seed of the upcoming **SPEC-003 — Prompt Engine**.

## Legend

- **Priority** — `P0` foundational/blocking · `P1` high · `P2` medium · `P3` later.
- **Complexity** — T-shirt size: `S` · `M` · `L` · `XL`.
- **Estimate** — story points (Fibonacci `1,2,3,5,8,13,21`). Planning velocity assumption: **~24 SP per 2-week sprint** for a small cross-functional team.
- **Dependencies** — other backlog IDs that should land first.

## Epics overview

| Epic      | Name                                                 |   Items | Story points |
| --------- | ---------------------------------------------------- | ------: | -----------: |
| `FND`     | Foundation & Core hardening (additive, non-breaking) |       8 |           34 |
| `CFG`     | Configuration                                        |       5 |           21 |
| `SEC`     | Security & secrets                                   |       7 |           32 |
| `ORC`     | AI Orchestrator                                      |      12 |           67 |
| `PRV`     | AI Providers                                         |       8 |           47 |
| `RES`     | Resilience & rate limiting                           |       7 |           36 |
| `OBS`     | Observability & telemetry                            |       5 |           26 |
| `CACHE`   | Caching                                              |       5 |           28 |
| `GEN`     | Generation Engine (core)                             |       8 |           49 |
| `ASSET`   | Prompts / Templates / Knowledge / Workflows          |       5 |           25 |
| `QGATE`   | Generated-artifact quality                           |       4 |           23 |
| `WEB`     | Website / News / Landing / WordPress                 |       6 |           42 |
| `REACT`   | React frontend                                       |       4 |           23 |
| `BE`      | Laravel / API / Automations                          |       7 |           44 |
| `APP`     | Flutter / Desktop                                    |       4 |           26 |
| `BIZ`     | CRM / ERP / SaaS                                     |       4 |           47 |
| `HBB`     | HBBTV                                                |       2 |           13 |
| `DEPLOY`  | Build / Preview / Deploy / Export                    |       5 |           29 |
| `DX`      | Developer experience                                 |       6 |           39 |
| `GOV`     | Governance                                           |       5 |           34 |
| `QA`      | Quality & CI                                         |       5 |           23 |
| `MKT`     | Extensibility / Marketplace                          |       3 |           18 |
| **Total** | **22 epics**                                         | **125** |      **726** |

> Indicative total effort: **726 SP** ≈ **31 sprints** at the assumed velocity (≈ 14.3 months at 2-week sprints). Estimates are for planning and will be refined at sprint planning.

## FND — Foundation & Core hardening (additive, non-breaking)

| ID       | Title                                   | Description                                                                         | Priority | Dependencies |   Complexity   | Estimate (SP) |
| -------- | --------------------------------------- | ----------------------------------------------------------------------------------- | :------: | ------------ | :------------: | ------------: |
| `FND-01` | Async & scoped DI container             | Add resolveAsync, per-scope resolution and disposal to ServiceContainer.            |    P0    | —            |       L        |             8 |
| `FND-02` | Disposable services & graceful shutdown | Disposable contract invoked on scope/kernel teardown (release HTTP agents/sockets). |    P0    | FND-01       |       M        |             5 |
| `FND-03` | Cancellation primitive                  | Standard AbortSignal convention on long ops + CancelledError.                       |    P0    | —            |       S        |             3 |
| `FND-04` | Error metadata                          | Add optional retryable/status/data to FrameworkError (backward compatible).         |    P0    | —            |       S        |             3 |
| `FND-05` | Result ergonomics                       | Add andThen, mapErr, fromPromise/tryCatch helpers for async flows.                  |    P1    | —            |       S        |             3 |
| `FND-06` | Plugin health/readiness                 | Optional health()/ready() hooks on Plugin.                                          |    P2    | —            |       S        |             2 |
| `FND-07` | Telemetry port in Core                  | TelemetrySink interface (counter/histogram/span/event) + no-op default.             |    P0    | —            |       M        |             5 |
| `FND-08` | Logger context & redaction hook         | correlationId/tenantId child bindings + pluggable redaction.                        |    P1    | —            |       M        |             5 |
|          |                                         |                                                                                     |          |              | **Epic total** |        **34** |

## CFG — Configuration

| ID       | Title                            | Description                                                             | Priority | Dependencies   |   Complexity   | Estimate (SP) |
| -------- | -------------------------------- | ----------------------------------------------------------------------- | :------: | -------------- | :------------: | ------------: |
| `CFG-01` | Nested/namespaced config schemas | Typed sub-schemas (e.g. ai.providers.\*).                               |    P0    | FND-04         |       M        |             5 |
| `CFG-02` | Async config sources             | File/remote config providers.                                           |    P1    | CFG-01         |       M        |             5 |
| `CFG-03` | Secret references                | Config carries handles resolved lazily via Secrets, never materialized. |    P0    | CFG-01, SEC-01 |       M        |             5 |
| `CFG-04` | Config validation reporting      | Aggregated, actionable validation errors.                               |    P2    | CFG-01         |       S        |             3 |
| `CFG-05` | Environment profiles             | dev/test/prod overlays.                                                 |    P2    | CFG-01         |       S        |             3 |
|          |                                  |                                                                         |          |                | **Epic total** |        **21** |

## SEC — Security & secrets

| ID       | Title                                 | Description                                          | Priority | Dependencies |   Complexity   | Estimate (SP) |
| -------- | ------------------------------------- | ---------------------------------------------------- | :------: | ------------ | :------------: | ------------: |
| `SEC-01` | SecretsProvider port                  | get(handle) -> Result contract.                      |    P0    | —            |       S        |             3 |
| `SEC-02` | Env & file secret stores              | Default secret adapters.                             |    P0    | SEC-01       |       S        |             3 |
| `SEC-03` | Redaction by default                  | Secrets/prompts redacted in logs, errors, telemetry. |    P0    | FND-08       |       M        |             5 |
| `SEC-04` | Vault/KMS adapter                     | External secret backend.                             |    P2    | SEC-01       |       L        |             8 |
| `SEC-05` | Provider allow-lists & data residency | Per-tenant egress policy.                            |    P1    | GOV-01       |       M        |             5 |
| `SEC-06` | Audit log                             | Record sensitive operations.                         |    P2    | OBS-01       |       M        |             5 |
| `SEC-07` | Supply-chain hardening                | Pinned deps, SBOM, provenance.                       |    P2    | —            |       S        |             3 |
|          |                                       |                                                      |          |              | **Epic total** |        **32** |

## ORC — AI Orchestrator

| ID       | Title                                     | Description                                           | Priority | Dependencies   |   Complexity   | Estimate (SP) |
| -------- | ----------------------------------------- | ----------------------------------------------------- | :------: | -------------- | :------------: | ------------: |
| `ORC-01` | Package scaffold @telemax/ai-orchestrator | Create package, wiring, plugin entry.                 |    P0    | FND-01         |       S        |             3 |
| `ORC-02` | Provider SPI                              | AIProvider / LanguageModel contracts.                 |    P0    | ORC-01         |       M        |             5 |
| `ORC-03` | Message & capability model                | Provider-agnostic Message/Content/ModelCapabilities.  |    P0    | ORC-01         |       M        |             5 |
| `ORC-04` | ProviderRegistry                          | Register/resolve by id and capability.                |    P0    | ORC-02         |       M        |             5 |
| `ORC-05` | Orchestrator facade                       | complete / stream / embed entry point.                |    P0    | ORC-02, ORC-04 |       M        |             5 |
| `ORC-06` | Middleware pipeline                       | Chain-of-Responsibility around every call.            |    P0    | ORC-05         |       L        |             8 |
| `ORC-07` | Routing strategy port + default           | Pluggable selection with a safe default.              |    P0    | ORC-04         |       M        |             5 |
| `ORC-08` | Cost-aware & failover routing             | Cost/latency-aware and failover strategies.           |    P1    | ORC-07, OBS-03 |       M        |             5 |
| `ORC-09` | Streaming pipeline                        | AsyncIterable stream() + cancellation + backpressure. |    P0    | ORC-05, FND-03 |       L        |             8 |
| `ORC-10` | Embeddings support                        | embed() path.                                         |    P2    | ORC-05         |       M        |             5 |
| `ORC-11` | Tool/function-calling model               | Provider-agnostic tool calls.                         |    P2    | ORC-03         |       L        |             8 |
| `ORC-12` | Structured/JSON output mode               | Schema-constrained outputs.                           |    P2    | ORC-03         |       M        |             5 |
|          |                                           |                                                       |          |                | **Epic total** |        **67** |

## PRV — AI Providers

| ID       | Title                            | Description                                        | Priority | Dependencies           |   Complexity   | Estimate (SP) |
| -------- | -------------------------------- | -------------------------------------------------- | :------: | ---------------------- | :------------: | ------------: |
| `PRV-01` | AIError taxonomy & normalization | Normalize vendor errors to categories + retryable. |    P0    | FND-04                 |       M        |             5 |
| `PRV-02` | Anthropic (Claude) adapter       | complete/stream/embed where applicable.            |    P0    | ORC-02, PRV-01, SEC-01 |       L        |             8 |
| `PRV-03` | OpenAI (ChatGPT) adapter         | Full adapter.                                      |    P0    | ORC-02, PRV-01         |       L        |             8 |
| `PRV-04` | Ollama (local) adapter           | Self-hosted/on-prem path.                          |    P1    | ORC-02, PRV-01         |       M        |             5 |
| `PRV-05` | OpenRouter adapter               | Aggregated provider access.                        |    P1    | ORC-02, PRV-01         |       M        |             5 |
| `PRV-06` | Gemini adapter                   | Full adapter.                                      |    P1    | ORC-02, PRV-01         |       L        |             8 |
| `PRV-07` | Provider contract test suite     | Capability/behavior conformance across providers.  |    P1    | PRV-02, PRV-03         |       M        |             5 |
| `PRV-08` | Provider capability matrix       | Documented and tested capability grid.             |    P2    | PRV-07                 |       S        |             3 |
|          |                                  |                                                    |          |                        | **Epic total** |        **47** |

## RES — Resilience & rate limiting

| ID       | Title                             | Description                             | Priority | Dependencies   |   Complexity   | Estimate (SP) |
| -------- | --------------------------------- | --------------------------------------- | :------: | -------------- | :------------: | ------------: |
| `RES-01` | Retry with backoff + jitter       | Bounded retries honoring Retry-After.   |    P0    | ORC-06, PRV-01 |       M        |             5 |
| `RES-02` | Timeout middleware                | Per-call deadlines tied to AbortSignal. |    P0    | ORC-06, FND-03 |       S        |             3 |
| `RES-03` | Circuit breaker                   | Per-provider breaker.                   |    P1    | ORC-06         |       M        |             5 |
| `RES-04` | Bulkhead & concurrency limits     | Isolate providers, cap concurrency.     |    P1    | ORC-06         |       M        |             5 |
| `RES-05` | Rate limiter port + local adapter | Token-bucket limiter.                   |    P1    | ORC-06         |       M        |             5 |
| `RES-06` | Distributed limiter (Redis)       | Cluster-wide limits.                    |    P2    | RES-05         |       L        |             8 |
| `RES-07` | Fallback across providers         | Route to alternates on failure.         |    P1    | ORC-07, RES-03 |       M        |             5 |
|          |                                   |                                         |          |                | **Epic total** |        **36** |

## OBS — Observability & telemetry

| ID       | Title                               | Description                           | Priority | Dependencies   |   Complexity   | Estimate (SP) |
| -------- | ----------------------------------- | ------------------------------------- | :------: | -------------- | :------------: | ------------: |
| `OBS-01` | Telemetry wired across orchestrator | Emit signals from pipeline/providers. |    P0    | FND-07         |       M        |             5 |
| `OBS-02` | OpenTelemetry adapter               | Metrics + traces exporter.            |    P1    | OBS-01         |       L        |             8 |
| `OBS-03` | Cost & token tracking               | CostTracker: usage x price -> Cost.   |    P0    | OBS-01, PRV-01 |       M        |             5 |
| `OBS-04` | Health/metrics endpoints            | Expose health and metrics.            |    P2    | OBS-01         |       S        |             3 |
| `OBS-05` | Structured request tracing          | Spans per attempt/fallback.           |    P1    | OBS-02         |       M        |             5 |
|          |                                     |                                       |          |                | **Epic total** |        **26** |

## CACHE — Caching

| ID         | Title                            | Description                                | Priority | Dependencies     |   Complexity   | Estimate (SP) |
| ---------- | -------------------------------- | ------------------------------------------ | :------: | ---------------- | :------------: | ------------: |
| `CACHE-01` | CacheStore port + memory adapter | Pluggable cache abstraction.               |    P1    | ORC-06           |       M        |             5 |
| `CACHE-02` | Exact-match response cache       | Deterministic request cache.               |    P1    | CACHE-01         |       M        |             5 |
| `CACHE-03` | Provider-native prompt caching   | Hooks for prompt caching (e.g. Anthropic). |    P2    | PRV-02           |       M        |             5 |
| `CACHE-04` | Semantic cache                   | Embedding-based near-duplicate cache.      |    P3    | CACHE-01, ORC-10 |       L        |             8 |
| `CACHE-05` | Redis cache adapter              | Shared cache backend.                      |    P2    | CACHE-01         |       M        |             5 |
|            |                                  |                                            |          |                  | **Epic total** |        **28** |

## GEN — Generation Engine (core)

| ID       | Title                                 | Description                               | Priority | Dependencies     |   Complexity   | Estimate (SP) |
| -------- | ------------------------------------- | ----------------------------------------- | :------: | ---------------- | :------------: | ------------: |
| `GEN-01` | Project & workspace model             | Logical project, settings, targets.       |    P0    | ORC-05           |       M        |             5 |
| `GEN-02` | Artifact/file model                   | Files/dirs, text/binary, diffs.           |    P0    | GEN-01           |       M        |             5 |
| `GEN-03` | Generation pipeline                   | plan -> generate -> assemble -> validate. |    P0    | GEN-02, ORC-05   |       L        |             8 |
| `GEN-04` | Generator SPI (extends generator-kit) | Contract for concrete generators.         |    P0    | GEN-03           |       M        |             5 |
| `GEN-05` | Template engine integration           | Deterministic templating layer.           |    P0    | GEN-02           |       M        |             5 |
| `GEN-06` | Deterministic file writer + formatter | Stable output, formatted on write.        |    P1    | GEN-02, QGATE-01 |       M        |             5 |
| `GEN-07` | Incremental/patch generation          | Update existing projects safely.          |    P2    | GEN-03           |       L        |             8 |
| `GEN-08` | Multi-step workflow runner            | Compose generators into workflows.        |    P1    | GEN-03, ASSET-03 |       L        |             8 |
|          |                                       |                                           |          |                  | **Epic total** |        **49** |

## ASSET — Prompts / Templates / Knowledge / Workflows

| ID         | Title                          | Description                              | Priority | Dependencies    |   Complexity   | Estimate (SP) |
| ---------- | ------------------------------ | ---------------------------------------- | :------: | --------------- | :------------: | ------------: |
| `ASSET-01` | Prompt library                 | Versioned, reviewable, testable prompts. |    P0    | ORC-05          |       M        |             5 |
| `ASSET-02` | Template repository & resolver | Discover/resolve generation templates.   |    P0    | GEN-05          |       M        |             5 |
| `ASSET-03` | Workflow definition format     | Declarative multi-step workflows.        |    P1    | GEN-08          |       M        |             5 |
| `ASSET-04` | Knowledge base ingestion       | Schemas/reference data for generation.   |    P2    | —               |       M        |             5 |
| `ASSET-05` | Prompt evaluation harness      | Score prompts against golden cases.      |    P2    | ASSET-01, QA-02 |       M        |             5 |
|            |                                |                                          |          |                 | **Epic total** |        **25** |

## QGATE — Generated-artifact quality

| ID         | Title                           | Description                               | Priority | Dependencies        |   Complexity   | Estimate (SP) |
| ---------- | ------------------------------- | ----------------------------------------- | :------: | ------------------- | :------------: | ------------: |
| `QGATE-01` | Artifact validators             | Format/lint/typecheck generated code.     |    P0    | GEN-02              |       M        |             5 |
| `QGATE-02` | Build verification              | Build generated projects in a sandbox.    |    P1    | QGATE-01, DEPLOY-01 |       M        |             5 |
| `QGATE-03` | Security scan of generated code | Static checks on output.                  |    P2    | QGATE-01            |       M        |             5 |
| `QGATE-04` | Auto-repair loop                | AI fixes failing checks and re-validates. |    P2    | QGATE-01, ORC-05    |       L        |             8 |
|            |                                 |                                           |          |                     | **Epic total** |        **23** |

## WEB — Website / News / Landing / WordPress

| ID       | Title                      | Description                          | Priority | Dependencies     |   Complexity   | Estimate (SP) |
| -------- | -------------------------- | ------------------------------------ | :------: | ---------------- | :------------: | ------------: |
| `WEB-01` | Static website generator   | Multi-page static site from a brief. |    P0    | GEN-03, ASSET-02 |       L        |             8 |
| `WEB-02` | Landing page generator     | High-converting single page.         |    P0    | GEN-03, ASSET-02 |       M        |             5 |
| `WEB-03` | News portal generator      | Category/article/portal layout.      |    P1    | WEB-01           |       L        |             8 |
| `WEB-04` | WordPress theme generator  | Standards-compliant theme.           |    P1    | WEB-01           |       L        |             8 |
| `WEB-05` | WordPress plugin generator | Custom plugin scaffold.              |    P2    | WEB-04           |       L        |             8 |
| `WEB-06` | SEO & accessibility pass   | Automated SEO/a11y hardening.        |    P1    | WEB-01, QGATE-01 |       M        |             5 |
|          |                            |                                      |          |                  | **Epic total** |        **42** |

## REACT — React frontend

| ID         | Title                        | Description                  | Priority | Dependencies |   Complexity   | Estimate (SP) |
| ---------- | ---------------------------- | ---------------------------- | :------: | ------------ | :------------: | ------------: |
| `REACT-01` | React app scaffold generator | Routed, typed React app.     |    P1    | GEN-03       |       L        |             8 |
| `REACT-02` | Component/library generator  | Reusable components/library. |    P1    | REACT-01     |       M        |             5 |
| `REACT-03` | Design-system/theming        | Tokens/theming integration.  |    P2    | REACT-01     |       M        |             5 |
| `REACT-04` | State/data-layer wiring      | Data fetching/state setup.   |    P2    | REACT-01     |       M        |             5 |
|            |                              |                              |          |              | **Epic total** |        **23** |

## BE — Laravel / API / Automations

| ID        | Title                              | Description                   | Priority | Dependencies |   Complexity   | Estimate (SP) |
| --------- | ---------------------------------- | ----------------------------- | :------: | ------------ | :------------: | ------------: |
| `LARA-01` | Laravel app scaffold generator     | Routed Laravel application.   |    P1    | GEN-03       |       L        |             8 |
| `LARA-02` | Models & migrations generator      | Eloquent models + migrations. |    P1    | LARA-01      |       M        |             5 |
| `API-01`  | API spec (OpenAPI) generator       | Generate OpenAPI from intent. |    P1    | GEN-03       |       M        |             5 |
| `API-02`  | REST API server generator          | Server from spec.             |    P1    | API-01       |       L        |             8 |
| `API-03`  | Client SDK generator               | Typed client from spec.       |    P2    | API-01       |       M        |             5 |
| `AUTO-01` | Automation/workflow generator      | Jobs, webhooks, schedulers.   |    P1    | GEN-08       |       L        |             8 |
| `AUTO-02` | Integration connectors scaffolding | Third-party connectors.       |    P2    | AUTO-01      |       M        |             5 |
|           |                                    |                               |          |              | **Epic total** |        **44** |

## APP — Flutter / Desktop

| ID        | Title                             | Description               | Priority | Dependencies       |   Complexity   | Estimate (SP) |
| --------- | --------------------------------- | ------------------------- | :------: | ------------------ | :------------: | ------------: |
| `FLUT-01` | Flutter app scaffold generator    | Cross-platform app shell. |    P2    | GEN-03             |       L        |             8 |
| `FLUT-02` | Flutter screens/widgets generator | UI screens and widgets.   |    P2    | FLUT-01            |       M        |             5 |
| `DESK-01` | Desktop app scaffold              | Electron/Tauri shell.     |    P2    | GEN-03             |       L        |             8 |
| `DESK-02` | Desktop packaging/installer       | Build installers.         |    P3    | DESK-01, DEPLOY-01 |       M        |             5 |
|           |                                   |                           |          |                    | **Epic total** |        **26** |

## BIZ — CRM / ERP / SaaS

| ID        | Title                            | Description                      | Priority | Dependencies     |   Complexity   | Estimate (SP) |
| --------- | -------------------------------- | -------------------------------- | :------: | ---------------- | :------------: | ------------: |
| `CRM-01`  | CRM scaffold                     | Entities, pipeline, UI, API.     |    P2    | API-02, REACT-01 |       XL       |            13 |
| `ERP-01`  | ERP module scaffold              | Inventory, invoicing modules.    |    P3    | API-02           |       XL       |            13 |
| `SAAS-01` | SaaS starter                     | Auth, billing, tenancy baseline. |    P2    | GOV-01, API-02   |       XL       |            13 |
| `SAAS-02` | Billing/subscription integration | Metered billing.                 |    P3    | SAAS-01          |       L        |             8 |
|           |                                  |                                  |          |                  | **Epic total** |        **47** |

## HBB — HBBTV

| ID       | Title                                  | Description                 | Priority | Dependencies |   Complexity   | Estimate (SP) |
| -------- | -------------------------------------- | --------------------------- | :------: | ------------ | :------------: | ------------: |
| `HBB-01` | HbbTV app generator                    | CE-HTML/HbbTV application.  |    P2    | WEB-01       |       L        |             8 |
| `HBB-02` | Broadcast/stream integration templates | HbbTV + stream integration. |    P3    | HBB-01       |       M        |             5 |
|          |                                        |                             |          |              | **Epic total** |        **13** |

## DEPLOY — Build / Preview / Deploy / Export

| ID          | Title                                    | Description                         | Priority | Dependencies |   Complexity   | Estimate (SP) |
| ----------- | ---------------------------------------- | ----------------------------------- | :------: | ------------ | :------------: | ------------: |
| `DEPLOY-01` | Export to zip/repo                       | Package artifacts for download.     |    P0    | GEN-02       |       S        |             3 |
| `DEPLOY-02` | Live preview (sandbox)                   | Preview generated output.           |    P1    | GEN-02       |       L        |             8 |
| `DEPLOY-03` | Git integration                          | init/commit/push generated project. |    P1    | DEPLOY-01    |       M        |             5 |
| `DEPLOY-04` | Deploy adapters                          | Static host/container/PaaS deploys. |    P2    | DEPLOY-01    |       L        |             8 |
| `DEPLOY-05` | CI/CD scaffolding for generated projects | Pipelines for output repos.         |    P2    | DEPLOY-03    |       M        |             5 |
|             |                                          |                                     |          |              | **Epic total** |        **29** |

## DX — Developer experience

| ID      | Title                        | Description                         | Priority | Dependencies   |   Complexity   | Estimate (SP) |
| ------- | ---------------------------- | ----------------------------------- | :------: | -------------- | :------------: | ------------: |
| `DX-01` | CLI (telemax ...)            | Command-line entry to the platform. |    P0    | ORC-05         |       M        |             5 |
| `DX-02` | TypeScript SDK               | Typed programmatic access.          |    P1    | ORC-05         |       M        |             5 |
| `DX-03` | HTTP API service (gateway)   | Hosted API over the orchestrator.   |    P1    | ORC-05, GOV-02 |       L        |             8 |
| `DX-04` | Web dashboard/console        | UI to run/manage generations.       |    P2    | DX-03          |       XL       |            13 |
| `DX-05` | Documentation site           | Docs for the platform.              |    P1    | —              |       M        |             5 |
| `DX-06` | Examples & starter templates | Ready-to-run examples.              |    P2    | WEB-02         |       S        |             3 |
|         |                              |                                     |          |                | **Epic total** |        **39** |

## GOV — Governance

| ID       | Title                       | Description                   | Priority | Dependencies   |   Complexity   | Estimate (SP) |
| -------- | --------------------------- | ----------------------------- | :------: | -------------- | :------------: | ------------: |
| `GOV-01` | Multi-tenancy model         | Tenant context and isolation. |    P1    | FND-01         |       L        |             8 |
| `GOV-02` | AuthN/AuthZ (RBAC)          | API auth and roles.           |    P1    | DX-03          |       L        |             8 |
| `GOV-03` | Quotas & cost guardrails    | Per-request/tenant budgets.   |    P1    | OBS-03, GOV-01 |       M        |             5 |
| `GOV-04` | Usage metering & reporting  | Consumption reports.          |    P2    | OBS-03         |       M        |             5 |
| `GOV-05` | Policy engine (content/PII) | Pre-dispatch content policy.  |    P2    | SEC-05         |       L        |             8 |
|          |                             |                               |          |                | **Epic total** |        **34** |

## QA — Quality & CI

| ID      | Title                              | Description                                | Priority | Dependencies |   Complexity   | Estimate (SP) |
| ------- | ---------------------------------- | ------------------------------------------ | :------: | ------------ | :------------: | ------------: |
| `QA-01` | Unit/integration test standards    | Testing conventions and coverage gates.    |    P0    | —            |       S        |             3 |
| `QA-02` | Golden/eval harness for generators | Deterministic generation regression tests. |    P1    | GEN-03       |       M        |             5 |
| `QA-03` | Provider mock/sandbox              | Deterministic provider fakes for tests.    |    P1    | PRV-07       |       M        |             5 |
| `QA-04` | CI matrix & release automation     | Changesets-based release pipeline.         |    P0    | —            |       M        |             5 |
| `QA-05` | Performance/load benchmarks        | Latency/throughput benchmarks.             |    P2    | OBS-02       |       M        |             5 |
|         |                                    |                                            |          |              | **Epic total** |        **23** |

## MKT — Extensibility / Marketplace

| ID       | Title                            | Description                           | Priority | Dependencies  |   Complexity   | Estimate (SP) |
| -------- | -------------------------------- | ------------------------------------- | :------: | ------------- | :------------: | ------------: |
| `MKT-01` | Runtime plugin discovery/loading | Load providers/generators at runtime. |    P2    | FND-01        |       M        |             5 |
| `MKT-02` | Marketplace registry             | Publish/discover plugins.             |    P3    | MKT-01        |       L        |             8 |
| `MKT-03` | Third-party plugin SDK & docs    | Enable external contributors.         |    P3    | MKT-01, DX-05 |       M        |             5 |
|          |                                  |                                       |          |               | **Epic total** |        **18** |
