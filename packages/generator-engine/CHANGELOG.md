# @telemax/generator-engine

## [0.1.0] - Unreleased

### Added

- `FileSystemArtifactWriter` (SPRINT-009): an `ArtifactWriter` that persists
  artifacts to disk under a fixed root, refusing path-traversal. Uses only Node
  built-ins; the default writer remains `InMemoryArtifactWriter`.

- Initial Generator Engine foundation (SPEC-006): generic, target-agnostic
  infrastructure to register generators, run generation pipelines and produce
  artifacts, coordinating the Workflow Engine, AI Orchestrator, Prompt Engine and
  Knowledge Engine. Depends on `@telemax/core`, `@telemax/knowledge`,
  `@telemax/prompt-engine`, `@telemax/ai` and `@telemax/workflow`; no cycles.
- `GeneratorEngine` façade: register/compile/validate/version, generate, cache,
  import/export, events, and `useWorkflow`/`useAI`/`usePrompt`/`useKnowledge`
  coordination wiring.
- Declarative pipeline model: `GeneratorDefinition`, `GeneratorPipeline`,
  `GeneratorStep` (`template`, `emit`, `transform`, `workflow`, `prompt`, `ai`),
  compiled into an immutable `Generator` (checksum + signature) by
  `GeneratorFactory`.
- Artifacts: `GeneratorArtifact`, `ArtifactCollection`, `GeneratorOutput`,
  `InMemoryArtifactWriter`; templates: `GeneratorTemplate`,
  `GeneratorTemplateRepository`, `DefaultTemplateRenderer` (`{{var}}`).
- Services: `GeneratorValidator`, `GeneratorRegistry` (version history),
  `GeneratorTransformRegistry` + built-ins, `InMemoryResultCache`,
  `GeneratorEventBus`, metrics, `ExportManager`/`ImportManager`, DI
  (`registerGeneratorEngine`).
- Coordination adapters: `workflowRunner`, `aiRunner`, `promptRunner`,
  `knowledgeRunner`.
- Foreseen targets (`GENERATOR_TARGETS`: WordPress, React, Next.js, Laravel,
  Flutter, Desktop, API, SaaS, CRM, ERP) prepared as conventions only.
- Unit tests (15 files, 39 tests).
