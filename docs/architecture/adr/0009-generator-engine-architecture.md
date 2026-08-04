# ADR-0009 — Generator Engine architecture

- **Status:** Accepted
- **Date:** 2026-07-28
- **Context:** SPEC-006 — Generator Engine (`@telemax/generator-engine`)

## Context

The framework needs a generation core that can eventually produce many kinds of
output (WordPress, React, Next.js, Laravel, Flutter, Desktop, API, SaaS, CRM,
ERP). For this sprint it must be infrastructure only — completely generic, with no
knowledge of any specific target and no real generators — while staying consistent
with the foundation: strict TypeScript, SOLID, Clean Architecture, DI,
event-driven, `Result`-based errors, and no circular dependencies.

## Decision

1. **Target-agnostic by construction.** The engine never inspects the target;
   `TargetKind` is a free-form string and `GENERATOR_TARGETS` is a naming
   convention only. Target-specific behavior lives in future generators authored
   _on top of_ the engine, never inside it.
2. **Declarative, serializable model.** A generator is a `GeneratorDefinition` — a
   pipeline of typed steps (`template`, `emit`, `transform`, `workflow`, `prompt`,
   `ai`). This enables validation, versioning and import/export without evaluating
   arbitrary code.
3. **Compile then execute.** `GeneratorFactory` validates a definition and
   produces an immutable `Generator` (checksum + SHA-256 signature) stored in a
   versioned `GeneratorRegistry`; `GeneratorExecution` runs the pipeline.
4. **Ports + Dependency Injection.** The engine depends on abstractions
   (`TemplateRenderer`, `ArtifactWriter`, `GeneratorTransform`, `MetricsSink`,
   `GeneratorResultCache`, and the coordination runners); adapters are composed by
   `registerGeneratorEngine`.
5. **Coordinate the other engines via runner adapters.** `workflowRunner`,
   `aiRunner`, `promptRunner` and `knowledgeRunner` turn the Workflow, AI, Prompt
   and Knowledge engines into runners the pipeline calls, so the Generator Engine
   composes them without embedding their logic. Tests use the AI Orchestrator's
   local stub — no HTTP, no keys.
6. **Deterministic caching.** Completed results are cached by
   `signature + variables hash`, making regeneration for identical inputs a cache
   hit.
7. **Dependency direction.** `generator-engine` depends on `workflow → ai →
prompt-engine → knowledge → core`, a linear graph with no cycles, and it does
   **not** depend on `@telemax/generator-kit` (the separate abstract authoring
   SDK) — the two are complementary, not coupled.

## Consequences

- **Positive:** one engine serves every future target; generators are declarative,
  serializable, versioned and cacheable; new engines/targets plug in as pipelines,
  transforms or runners; safe to ship with no external dependencies.
- **Negative / trade-offs:** with no real generators/providers the produced output
  is template/handler-driven; coordination steps report `NotImplemented` until
  their runners are wired; artifact persistence is in-memory by default (a real
  filesystem/remote writer is a future adapter). All are isolated behind ports.
