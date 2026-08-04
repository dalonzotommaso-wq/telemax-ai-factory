# Packages

Feature packages and SDKs published under the `@telemax/*` scope (`packages/*`).
Every package depends on `@telemax/core` — never the other way around — and has a
single, well-defined responsibility.

## Contents

- [`generator-kit/`](generator-kit) — `@telemax/generator-kit`: abstract SDK for
  building generators on top of the kernel. Defines the generator contract; ships
  no concrete generators.
- [`knowledge/`](knowledge) — `@telemax/knowledge`: the Knowledge Base engine
  (documents, metadata, versioning, categories, tags, loaders, repository,
  indexing, import/export) used by agents and generators.
- [`prompt-engine/`](prompt-engine) — `@telemax/prompt-engine`: the enterprise
  Prompt Engine (templates, variables, validation, versioning, rendering,
  composition, multi-role prompts, inheritance, extensions, i18n, cache, metrics,
  events, import/export). Provider-agnostic; depends only on `@telemax/core` and
  `@telemax/knowledge`.
- [`ai/`](ai) — `@telemax/ai`: the provider-agnostic AI Orchestrator that
  coordinates the Knowledge and Prompt engines, provider/model registries,
  requests/responses, conversations, pipelines, resilience, cost and telemetry.
  Infrastructure only (no HTTP, no API keys); depends only on `@telemax/core`,
  `@telemax/knowledge` and `@telemax/prompt-engine`.
- [`workflow/`](workflow) — `@telemax/workflow`: the Workflow Engine for defining
  reusable, composable workflows (sequential/parallel/branch/loop, retry,
  rollback, timeout, events, versioning, validation, import/export) that
  coordinate the AI Orchestrator, Prompt and Knowledge engines and the future
  Generator Engine. Infrastructure only; depends on `@telemax/core`,
  `@telemax/knowledge`, `@telemax/prompt-engine` and `@telemax/ai`.
- [`generator-engine/`](generator-engine) — `@telemax/generator-engine`: the
  generic, target-agnostic Generator Engine — register generators, run generation
  pipelines and produce artifacts, coordinating the Workflow, AI, Prompt and
  Knowledge engines. Foreseen targets (WordPress, React, Next.js, Laravel,
  Flutter, Desktop, API, SaaS, CRM, ERP) are conventions only. Infrastructure
  only; depends on `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`,
  `@telemax/ai` and `@telemax/workflow`.
- [`generator-wordpress/`](generator-wordpress) — `@telemax/generator-wordpress`:
  the first real generator — produces the complete WordPress News theme project as
  versioned, validated artifacts via the Generator Engine, integrating the
  Workflow, Prompt and Knowledge engines (scaffolding only, no plugin). Blueprint-
  driven (design tokens, layout, components, SEO, accessibility, Core Web Vitals,
  advertising, performance) with a pre-generation Validation Engine.
