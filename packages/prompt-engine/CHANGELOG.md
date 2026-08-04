# @telemax/prompt-engine

## [0.1.0] - Unreleased

### Added

- Initial Prompt Engine foundation (SPEC-003), provider-agnostic infrastructure
  depending only on `@telemax/core` and `@telemax/knowledge`.
- `PromptTemplate` entity with variables, metadata, categories, tags,
  dependencies, localization, checksum and a stable version signature.
- Dependency-free `DefaultTemplateRenderer` (interpolation, dotted paths,
  `if/else`, `unless`, `each` with `this`/`@index`, partials, blocks, comments).
- Template inheritance via named blocks (`resolveInheritance`).
- `DefaultSchemaValidator` for typed variable validation (string/number/boolean/
  list/object/enum, required, defaults, enum).
- Multi-role composition (`system`/`developer`/`user`/`assistant`) and
  `DefaultPromptFormatter` (`text`, `markdown`; `xml`/`json` prepared).
- `InMemoryTemplateRepository` with version history, `PromptRegistry` for
  extensions/partials, `PromptValidator` with composable rules.
- `InMemoryRenderCache`, `MetricsSink` (noop/in-memory), typed `PromptEventBus`.
- Import/export via portable JSON bundles (`ExportManager`/`ImportManager`).
- Dependency-injection wiring (`registerPromptEngine`) and full public barrel.
- Prepared ports/types for Prompt Chains, RAG, Tool/Function calling, MCP and
  Structured Output (JSON Schema).
- Unit tests (12 files, 45 tests).
