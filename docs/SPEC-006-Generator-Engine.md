# SPEC-006 — Generator Engine

- **Package:** `@telemax/generator-engine`
- **Status:** Delivered (SPRINT-006)
- **Depends on:** `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`, `@telemax/ai`, `@telemax/workflow`
- **ADR:** [ADR-0009](architecture/adr/0009-generator-engine-architecture.md)

## 1. Purpose

The Generator Engine is the framework's generation core. It registers generators,
runs generation pipelines and produces artifacts, coordinating the Workflow
Engine, AI Orchestrator, Prompt Engine and Knowledge Engine. It is **completely
target-agnostic** and ships **no real generators** — infrastructure only.

## 2. Scope

**In scope (infrastructure):** `GeneratorEngine`, `Generator`,
`GeneratorRegistry`, `GeneratorContext`, `GeneratorConfiguration`,
`GeneratorTemplate`, `GeneratorTemplateRepository`, `GeneratorExecution`,
`GeneratorPipeline`, `GeneratorStep`, `GeneratorValidator`, `GeneratorOutput`,
`GeneratorArtifact`, `ArtifactWriter`, `ArtifactCollection`, `GeneratorEvents`,
`GeneratorMetadata`, `GeneratorVersion`, `GeneratorFactory`, `GeneratorResult`,
configuration, errors, interfaces, types and utils. Features: generator
registration, pipeline execution, artifact generation, template management,
variable management, validation, logging, metrics, events, versioning,
serialization, cache and import/export.

**Foreseen targets (conventions only, `GENERATOR_TARGETS`):** WordPress, React,
Next.js, Laravel, Flutter, Desktop, API, SaaS, CRM, ERP. No specific generator is
implemented.

**Out of scope:** real generators, target-specific logic, external I/O.

## 3. Architecture

Clean Architecture with Dependency Inversion and an event-driven core. A
`GeneratorDefinition` is a declarative, serializable pipeline. The
`GeneratorFactory` validates it and produces an immutable `Generator` (checksum +
SHA-256 version signature), stored in a versioned `GeneratorRegistry`. The
`GeneratorEngine` façade runs a generator by building a per-run merged template
repository and delegating to a `GeneratorExecution`, which executes each step
against an immutable `GeneratorContext`:

- **template** — render a `GeneratorTemplate` and emit an artifact at an
  interpolated path.
- **emit** — emit an artifact from a literal or a variable.
- **transform** — run a registered transform and store the result in a variable.
- **workflow / prompt / ai** — coordinate the Workflow, Prompt and AI engines
  through injected runners and store the result in a variable; if the runner is
  not configured the step reports `NotImplemented`.

Artifacts accumulate in an `ArtifactCollection` and are persisted via an
`ArtifactWriter`. Completed results are cached by `signature + variables hash`.

## 4. Public interfaces (ports)

`TemplateRenderer`, `GeneratorTransform`, `ArtifactWriter`, `MetricsSink`,
`GeneratorResultCache`, and the coordination runners `WorkflowRunner`,
`AIRunner`, `PromptRunner`, `KnowledgeRunner`. The `GeneratorEngine` façade
exposes `registerGenerator`, `generate`, `registerTemplate`,
`registerTransform`, `useWorkflow`/`useAI`/`usePrompt`/`useKnowledge`,
`getGenerator`, `listGenerators`, `getVersions`, `exportBundle`, `importBundle`
and `on`.

## 5. Key decisions

| Decision                                                    | Rationale                                                                  |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Completely target-agnostic; targets are conventions only    | One engine serves every future target; no coupling to WordPress/React/etc. |
| Declarative, serializable pipeline & steps                  | Import/export, versioning and validation without evaluating code           |
| Ports + DI (Clean Architecture)                             | Swap renderer, writer, transforms, cache and coordination runners freely   |
| Coordinate engines via runner adapters                      | Reuse Workflow/AI/Prompt/Knowledge without embedding their logic           |
| Compile → signature = SHA-256 over the canonical definition | Stable version identity; deterministic cache keys                          |
| Result cache keyed by `signature + variables hash`          | Skip regeneration for identical inputs                                     |
| Depend on the four engines + core, no cycles                | Linear dependency graph; the Generator Engine sits on top                  |

## 6. Error handling

All errors extend the Core `FrameworkError`: `GeneratorValidationError`,
`GeneratorNotFoundError`, `GeneratorDuplicateError`, `GeneratorStepError`,
`TemplateNotFoundError`, `TransformNotFoundError`, `GeneratorCompilationError`,
`GeneratorNotImplementedError`, `GeneratorIoError` — unioned as `GeneratorError`.

## 7. Logging, metrics, events

Optional Core `Logger`; a `MetricsSink` port (noop default, `MetricsCollector`
for inspection); a typed `GeneratorEventBus` emits generator/generation/step/
artifact/cache/import/export events.

## 8. Security & performance

No secrets or network I/O. Artifact writing is abstracted behind a port (in-memory
by default); a bounded result cache avoids redundant work; the artifact count is
configurable (`maxArtifacts`).

## 9. Future compatibility

Real generators plug in as declarative pipelines and/or registered transforms and
coordination runners. The foreseen targets (WordPress, React, Next.js, Laravel,
Flutter, Desktop, API, SaaS, CRM, ERP) activate by authoring generators on top of
this engine — without changing the engine, which never becomes target-aware.

## 10. Testing

Unit tests cover the validator, factory, registry, template repository/renderer,
artifacts and writer, transforms, cache, metrics, events, utils, the execution
(template→artifact, emit literal/variable, transform, transform-not-found,
coordination NotImplemented, multi-step coordination, failing runner), the
coordination adapters (workflow/ai/prompt), the engine (generate, versioning,
import/export, cache hit, AI/Workflow/Prompt coordination) and DI. Result: 15
files, 39 tests, all green; coverage ≈ 92% lines.
