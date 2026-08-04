---
"@telemax/generator-engine": minor
---

Initial Generator Engine foundation (SPEC-006): generic, target-agnostic
infrastructure to register generators, run generation pipelines and produce
artifacts, coordinating the Workflow Engine, AI Orchestrator, Prompt Engine and
Knowledge Engine. Includes a declarative pipeline (template/emit/transform/
workflow/prompt/ai), compiler/factory, validator, versioned registry, template
repository and renderer, artifact writer/collection, transforms, result cache,
events, metrics and DI. Foreseen targets (WordPress, React, Next.js, Laravel,
Flutter, Desktop, API, SaaS, CRM, ERP) are prepared as conventions only.
Infrastructure only; depends on `@telemax/core`, `@telemax/knowledge`,
`@telemax/prompt-engine`, `@telemax/ai` and `@telemax/workflow`, with no circular
dependencies.
