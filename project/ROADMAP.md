# ROADMAP — Telemax AI Factory

> Milestone-based roadmap. **Every milestone ships software that is actually usable** — not an internal checkpoint. Versions follow SemVer; v1.0 is General Availability.

Each milestone lists the backlog items it delivers (see [BACKLOG.md](BACKLOG.md)) and the concrete, user-facing outcome it produces.

## SPEC track — delivery status

Delivery is currently driven by the **SPEC track** (higher-level than the milestone
plan below):

| SPEC     | Title                                                    | Sprint     |    Status    |
| -------- | -------------------------------------------------------- | ---------- | :----------: |
| SPEC-001 | Foundation                                               | SPRINT-001 | ✅ delivered |
| SPEC-002 | Knowledge Engine                                         | SPRINT-002 | ✅ delivered |
| SPEC-003 | Prompt Engine                                            | SPRINT-003 | ✅ delivered |
| SPEC-004 | AI Orchestrator                                          | SPRINT-004 | ✅ delivered |
| SPEC-005 | Workflow Engine                                          | SPRINT-005 | ✅ delivered |
| SPEC-006 | Generator Engine                                         | SPRINT-006 | ✅ delivered |
| SPEC-007 | WordPress News Generator (MVP)                           | SPRINT-007 | ✅ delivered |
| SPEC-007 | WordPress News Generator v1 (disk output + CLI)          | SPRINT-009 | ✅ delivered |
| SPEC-007 | WordPress News Generator — field validation (5 profiles) | SPRINT-010 | ✅ delivered |

> The milestone plan (M0–M7) and the 20-sprint schedule below predate this SPEC
> re-sequencing (which delivers the Knowledge and Prompt engines before the AI
> Orchestrator). They remain the detailed backlog and will be re-baselined against
> the SPEC track in a later planning step.

## Milestones at a glance

| Milestone | Theme                                | Version | Backlog items | Story points |    Status    |
| --------- | ------------------------------------ | :-----: | ------------: | -----------: | :----------: |
| **M0**    | Foundation                           |  v0.1   |             0 |            0 | ✅ delivered |
| **M1**    | AI Gateway                           |  v0.2   |            45 |          222 |   planned    |
| **M2**    | Generation Engine + first web output |  v0.3   |            20 |          108 |   planned    |
| **M3**    | Web breadth                          |  v0.4   |            14 |           87 |   planned    |
| **M4**    | Backend, API & automations           |  v0.5   |            14 |           83 |   planned    |
| **M5**    | Applications                         |  v0.6   |             7 |           41 |   planned    |
| **M6**    | Business platforms & SaaS            |  v0.7   |            13 |          115 |   planned    |
| **M7**    | Specialized & Marketplace (GA)       |  v1.0   |            12 |           70 |   planned    |

## Delivery timeline (indicative)

Assuming ~24 SP/sprint (2-week sprints). This is an **ideal-velocity projection**; the detailed,
authoritative near-term schedule is in [`SPRINTS/`](SPRINTS/), which spreads work across 20 sprints
with buffers and dependency serialization — so M1 releases at **Sprint 15 (v0.2)** and M2 at
**Sprint 20 (v0.3)**, later than the pure-velocity numbers below.

| Milestone                                 |  SP | Cumulative SP | Approx. sprint reached |
| ----------------------------------------- | --: | ------------: | :--------------------: |
| M0 — Foundation                           |   0 |             0 |           —            |
| M1 — AI Gateway                           | 222 |           222 |          S10           |
| M2 — Generation Engine + first web output | 108 |           330 |          S14           |
| M3 — Web breadth                          |  87 |           417 |          S18           |
| M4 — Backend, API & automations           |  83 |           500 |          S21           |
| M5 — Applications                         |  41 |           541 |          S23           |
| M6 — Business platforms & SaaS            | 115 |           656 |          S28           |
| M7 — Specialized & Marketplace (GA)       |  70 |           726 |          S31           |

## M0 — Foundation · v0.1

_DELIVERED (SPEC-001)_

The strict monorepo: @telemax/core, @telemax/config, @telemax/generator-kit; tooling, CI, docs.

**Usable software: the framework foundation builds, lints, type-checks and tests green — a solid base to build on.**

**Scope:** delivered in SPEC-001.

**Exit criteria:** all scoped items Done (per Definition of Done); the milestone's usable outcome demonstrated end-to-end; release notes published under `RELEASES/`.

## M1 — AI Gateway · v0.2

_Orchestrator + all providers_

Additive Core ports, the AI Orchestrator, resilience, telemetry, and all five providers.

**Usable software: a production-grade multi-provider AI gateway — call Claude, ChatGPT, Gemini, OpenRouter or Ollama through one API/CLI/SDK with routing, retries, fallback, streaming and cost tracking.**

**Scope (45 items, 222 SP):** `FND-01`, `FND-02`, `FND-03`, `FND-04`, `FND-05`, `FND-06`, `FND-07`, `FND-08`, `CFG-01`, `CFG-03`, `SEC-01`, `SEC-02`, `SEC-03`, `ORC-01`, `ORC-02`, `ORC-03`, `ORC-04`, `ORC-05`, `ORC-06`, `ORC-07`, `ORC-08`, `ORC-09`, `PRV-01`, `PRV-02`, `PRV-03`, `PRV-04`, `PRV-05`, `PRV-06`, `PRV-07`, `PRV-08`, `RES-01`, `RES-02`, `RES-03`, `RES-04`, `RES-05`, `RES-07`, `OBS-01`, `OBS-03`, `CACHE-01`, `CACHE-02`, `DX-01`, `DX-02`, `QA-01`, `QA-03`, `QA-04`

**Exit criteria:** all scoped items Done (per Definition of Done); the milestone's usable outcome demonstrated end-to-end; release notes published under `RELEASES/`.

## M2 — Generation Engine + first web output · v0.3

_Brief to real website_

The generation engine (project/artifact model, pipeline, templates, prompt library, quality gates) and the first concrete generators.

**Usable software: turn a brief into a real, validated Landing Page and static Website — previewable, git-initialized and exportable.**

**Scope (20 items, 108 SP):** `GEN-01`, `GEN-02`, `GEN-03`, `GEN-04`, `GEN-05`, `GEN-06`, `GEN-08`, `ASSET-01`, `ASSET-02`, `ASSET-03`, `QGATE-01`, `QA-02`, `WEB-01`, `WEB-02`, `WEB-06`, `DEPLOY-01`, `DEPLOY-02`, `DEPLOY-03`, `DX-05`, `DX-06`

**Exit criteria:** all scoped items Done (per Definition of Done); the milestone's usable outcome demonstrated end-to-end; release notes published under `RELEASES/`.

## M3 — Web breadth · v0.4

_News, WordPress, React_

Broaden web targets and add incremental generation and stronger quality gates.

**Usable software: generate news portals, WordPress themes/plugins and React applications, with build verification and auto-repair.**

**Scope (14 items, 87 SP):** `WEB-03`, `WEB-04`, `WEB-05`, `REACT-01`, `REACT-02`, `REACT-03`, `REACT-04`, `GEN-07`, `QGATE-02`, `QGATE-04`, `DEPLOY-04`, `CFG-02`, `CFG-04`, `CFG-05`

**Exit criteria:** all scoped items Done (per Definition of Done); the milestone's usable outcome demonstrated end-to-end; release notes published under `RELEASES/`.

## M4 — Backend, API & automations · v0.5

_Laravel, APIs, automations_

Backends, API-first generation, client SDKs and automations, plus deeper tracing.

**Usable software: generate Laravel apps, OpenAPI specs, REST servers, typed client SDKs and automation workflows.**

**Scope (14 items, 83 SP):** `LARA-01`, `LARA-02`, `API-01`, `API-02`, `API-03`, `AUTO-01`, `AUTO-02`, `DEPLOY-05`, `OBS-02`, `OBS-04`, `OBS-05`, `ORC-10`, `ORC-11`, `ORC-12`

**Exit criteria:** all scoped items Done (per Definition of Done); the milestone's usable outcome demonstrated end-to-end; release notes published under `RELEASES/`.

## M5 — Applications · v0.6

_Flutter & Desktop_

Cross-platform application generators and output security scanning.

**Usable software: generate Flutter mobile apps and desktop apps (Electron/Tauri) with packaging.**

**Scope (7 items, 41 SP):** `FLUT-01`, `FLUT-02`, `DESK-01`, `DESK-02`, `QGATE-03`, `ASSET-04`, `ASSET-05`

**Exit criteria:** all scoped items Done (per Definition of Done); the milestone's usable outcome demonstrated end-to-end; release notes published under `RELEASES/`.

## M6 — Business platforms & SaaS · v0.7

_CRM, ERP, SaaS, governance_

Business systems plus the governance and scale features they require.

**Usable software: scaffold CRM, ERP and SaaS products with multi-tenancy, auth/RBAC, quotas, a hosted API and a web console.**

**Scope (13 items, 115 SP):** `CRM-01`, `ERP-01`, `SAAS-01`, `SAAS-02`, `GOV-01`, `GOV-02`, `GOV-03`, `GOV-04`, `GOV-05`, `DX-03`, `DX-04`, `RES-06`, `CACHE-05`

**Exit criteria:** all scoped items Done (per Definition of Done); the milestone's usable outcome demonstrated end-to-end; release notes published under `RELEASES/`.

## M7 — Specialized & Marketplace (GA) · v1.0

_HbbTV, marketplace, hardening_

Specialized broadcast targets, an extensibility marketplace, and production hardening.

**Usable software: HbbTV applications plus a plugin marketplace; the platform reaches General Availability.**

**Scope (12 items, 70 SP):** `HBB-01`, `HBB-02`, `MKT-01`, `MKT-02`, `MKT-03`, `CACHE-03`, `CACHE-04`, `SEC-04`, `SEC-05`, `SEC-06`, `SEC-07`, `QA-05`

**Exit criteria:** all scoped items Done (per Definition of Done); the milestone's usable outcome demonstrated end-to-end; release notes published under `RELEASES/`.
