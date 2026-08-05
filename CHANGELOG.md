# Changelog

All notable changes to the workspace tooling and repository-level configuration
are documented here. Per-package changes live in each package's own
`CHANGELOG.md` and are managed by [Changesets](./.changeset/README.md).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-04

Second milestone. The dashboard becomes the real control plane and Projects become
operational end-to-end: create → workspace → generate. No new packages; the existing
framework is wired into the platform apps.

### Added

- **Platform System integration.** `RepositoryService` performs a real scan of the
  monorepo (packages, apps, generators, knowledge packs, workflow, AI providers, tests,
  build artifacts, git) exposed via `GET /system/status | /system/packages | /system/apps |
  /system/git`. New Dashboard System page and live Home stat cards; all previously
  hard-coded statistics removed.
- **Project Manager Engine v1.** The full Project model (uuid, slug, name, description,
  client, category, type, stack, generator, workflow, knowledge pack, AI provider, version,
  status, workspace, timestamps). On creation each project persists to SQLite **and**
  materialises a real workspace on disk (`workspace/<slug>/{docs,assets,prompts,output,logs,
  uploads,build}` + `project.json`). Six-step "New project" wizard populated live from the
  repository scan. New endpoints `POST /projects/:id/archive` and
  `POST /projects/:id/duplicate`. Recent projects on the Home page.
- **Project Generation Engine.** `GenerationService` connects the Project Manager to the
  existing Generator Engine — the "Generate" button really produces a project into
  `workspace/<slug>/output/`. Phased run (preparation → knowledge → workflow → AI →
  generator → writing → completed) with per-file records (name, path, size, sha256,
  timestamp). Endpoints `POST /projects/:id/generate`, `GET /projects/:id/generation`,
  `GET /projects/:id/logs`; a Generation Details page with a live timeline.

### Changed

- Repository hygiene: ignore build output, runtime workspaces and generated artifacts.

## [0.1.0] - 2026-08-03

> **Repository baseline.** All completed work through SPRINT-012 — foundation, engines, the
> WordPress generator and the platform apps — was committed to `main` as a sequence of
> logical Conventional Commits and tagged `v0.1.0-foundation`. This tag marks the first
> fully version-controlled snapshot of the codebase; it is a foundation checkpoint.

### Added

- Project Management Engine v1 (SPRINT-012): real SQLite persistence (better-sqlite3) in @telemax/api with a Project model and full CRUD (`/projects` GET/POST/PUT/DELETE, `/projects/:id`) plus `/stats`; the dashboard Projects page is now functional (list, search, sort, create wizard, edit, delete) and the home stats read the live database. API tests 9, dashboard tests 7.

- Initial monorepo foundation: pnpm workspaces + Turborepo pipeline.
- Strict TypeScript (NodeNext, ESM) base configuration.
- ESLint 9 flat config, Prettier, Vitest, commitlint, Husky, lint-staged.
- GitHub Actions CI and Changesets-based release workflow.
- Framework packages `@telemax/core`, `@telemax/config`, `@telemax/generator-kit`.
- Architecture documentation (SPEC-001), ADRs and contribution conventions.
- `@telemax/knowledge` package: Knowledge Base engine (documents, metadata,
  versioning, categories, tags, loaders, repository, indexing, import/export).
- Knowledge Engine specification (SPEC-002) and ADR-0005.
- `@telemax/prompt-engine` package: enterprise Prompt Engine (templates,
  variables, validation, versioning, rendering, composition, multi-role prompts,
  inheritance, extensions, i18n, cache, metrics, events, import/export;
  provider-agnostic; depends only on `@telemax/core` and `@telemax/knowledge`).
- Prompt Engine specification (SPEC-003) and ADR-0006.
- `@telemax/ai` package: provider-agnostic AI Orchestrator (orchestration flow,
  provider/model registries and SPI, request/response, conversations, context,
  prompt/knowledge/execution pipelines, resilience, cost, telemetry, streaming,
  cache; infrastructure only, no HTTP/keys; depends only on `@telemax/core`,
  `@telemax/knowledge` and `@telemax/prompt-engine`).
- AI Orchestrator specification (SPEC-004) and ADR-0007.
- `@telemax/workflow` package: the Workflow Engine (reusable, composable
  workflows coordinating the AI Orchestrator, Prompt and Knowledge engines and the
  future Generator Engine; sequential/parallel/branch/loop, retry, rollback,
  timeout, events, versioning, validation, import/export; infrastructure only,
  advanced capabilities prepared). Depends on `@telemax/core`,
  `@telemax/knowledge`, `@telemax/prompt-engine` and `@telemax/ai`; no cycles.
- Workflow Engine specification (SPEC-005) and ADR-0008.
- `@telemax/generator-engine` package: the generic, target-agnostic Generator
  Engine (register generators, run generation pipelines and produce artifacts,
  coordinating the Workflow, AI, Prompt and Knowledge engines; templates,
  variables, validation, versioning, cache, events, import/export; infrastructure
  only, foreseen targets prepared as conventions). Depends on `@telemax/core`,
  `@telemax/knowledge`, `@telemax/prompt-engine`, `@telemax/ai` and
  `@telemax/workflow`; no cycles.
- Generator Engine specification (SPEC-006) and ADR-0009.
- `@telemax/generator-wordpress` package: the first real generator — produces the
  complete WordPress News theme project as versioned, validated artifacts via the
  Generator Engine, integrating the Workflow, Prompt and Knowledge engines
  (scaffolding only, no plugin). Ten blueprints (project, design tokens, layout,
  components, SEO, accessibility, Core Web Vitals, advertising, performance,
  validation). Depends on all six engine-stack packages; no cycles.
- WordPress News Generator specification (SPEC-007) and ADR-0010.
- WordPress News Generator validation (SPRINT-010): validated the generator across
  5 heterogeneous editorial profiles (TV news portal, national daily, lifestyle
  magazine, sports portal, corporate blog). Fixed a real WCAG contrast bug — the
  brand `primary` colour was wrongly held to the 4.5:1 normal-text threshold; it now
  uses the correct 3:1 large-text/UI threshold (WCAG 1.4.3 / 1.4.11), while body
  text keeps 4.5:1 — with richer contrast diagnostics and regression tests.
- WordPress News Generator v1 (SPRINT-009): the generator now writes a complete
  WordPress News project to disk via the engine's new `FileSystemArtifactWriter`,
  driven by a demo CLI (`pnpm telemax generate wordpress-news`). Added the missing
  page templates (home/search/author/404), generated assets, a screenshot
  placeholder and a per-artifact manifest with version + checksum. ADR-0011.
- Release Candidate 0.2 quality review (SPRINT-008): full architecture, code,
  test, performance, security and documentation review. Raised `@telemax/core`
  line coverage from 50.7% to 95.9% (kernel, logger, plugin-registry lifecycle,
  errors) and added the first tests for `@telemax/generator-kit` (0 → 90%).
  Normalized all package CHANGELOG version headers to the Keep a Changelog format.
  No API or behavior changes.
- Dev dependency `@vitest/coverage-v8` for coverage reporting.
