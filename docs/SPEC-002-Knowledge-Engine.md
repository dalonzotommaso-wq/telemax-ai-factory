# SPEC-002 — Knowledge Engine

- **Status:** Implemented (foundation)
- **Package:** `@telemax/knowledge`
- **Sprint:** SPRINT-002 — Knowledge Engine Foundation
- **Depends on:** `@telemax/core` only

> SPEC roadmap: **SPEC-001** Foundation · **SPEC-002** Knowledge Engine (this
> document) · **SPEC-003** Prompt Engine · **SPEC-004** AI Orchestrator. The AI
> Orchestrator design review is tracked as an Architecture Review (AR), not a SPEC.

## 1. Purpose

The Knowledge Engine is the shared substrate that every AI agent and generator in
Telemax AI Factory uses to store, version, organize, validate, search and exchange
knowledge. This specification describes the delivered **infrastructure** — no real
content is included.

## 2. Scope

In scope: documents; metadata; categories; tags; versioning; loaders for Markdown,
JSON and YAML; prepared loaders for PDF and images; a repository; full-text
indexing; a prepared embedding index; import/export; validation; an event bus; and
dependency-injection wiring.

Out of scope (future sprints): concrete PDF/image extraction, real embedding
providers, persistent/remote repositories, distributed indexes.

## 3. Architecture

The engine applies **Dependency Inversion**: the high-level `KnowledgeService`
depends only on ports (`interfaces.ts`), and concrete adapters implement them.
This keeps modules decoupled and lets future providers plug in without edits.

Layers:

1. **Types** (`types.ts`) — pure data (`DocumentId`, `ContentFormat`,
   `StructuredValue`, `RawDocument`, filters, search types).
2. **Domain** (`domain/*`) — `Document`, `DocumentMetadata`, `KnowledgeVersion`,
   `KnowledgeCategory`, `KnowledgeTag`.
3. **Ports** (`interfaces.ts`) — `KnowledgeLoader`, `KnowledgeSource`,
   `KnowledgeRepository`, `KnowledgeIndex`, `EmbeddingProvider`,
   `StructuredTextParser`.
4. **Adapters** — loaders, in-memory repository, in-memory full-text index,
   prepared embedding index, in-memory source.
5. **Application** — `KnowledgeService` (facade), `KnowledgeRegistry`,
   `KnowledgeValidator`, `ExportManager`, `ImportManager`.
6. **Cross-cutting** — `Config`, `Errors`, `Events`, `Utils`, DI wiring (`di.ts`).

## 4. Public interfaces

- `KnowledgeService` — `addDocument`, `ingest`, `ingestSource`, `getDocument`,
  `listDocuments`, `getVersions`, `removeDocument`, `search`, `exportBundle`,
  `importBundle`, `on`.
- Ports as listed above; every method returns `Result<T, KnowledgeError>`.

## 5. Design decisions

| #   | Decision                                                             | Rationale                                                   | Trade-off                                                       |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Ports + DI for every collaborator                                    | SOLID; testable; future providers plug in                   | More indirection                                                |
| 2   | `Result`-based error channel (no throws for expected failures)       | Consistent with Core; explicit handling                     | Verbosity at call sites                                         |
| 3   | In-memory defaults for repo/index                                    | Zero-dependency, usable now                                 | Not durable (by design; adapters later)                         |
| 4   | Built-in YAML **subset** parser behind a `StructuredTextParser` port | Support YAML now with zero deps; swap for full parser later | Limited YAML grammar today                                      |
| 5   | PDF/image loaders return `NotImplementedError`                       | Honest "prepared" state; pipeline already format-aware      | No extraction yet                                               |
| 6   | Embedding index requires an injected provider                        | True predisposition; no fake vectors                        | Unusable until a provider exists                                |
| 7   | Service owns version numbering; repository stores history            | Single source of truth for versioning policy                | Service/repository coordination                                 |
| 8   | Depends only on `@telemax/core`                                      | Keeps the dependency graph clean                            | Some utilities reimplemented (checksum, ids) via Node built-ins |

## 6. Error handling

All errors extend Core `FrameworkError` with stable codes:
`ERR_KNOWLEDGE_VALIDATION`, `ERR_KNOWLEDGE_NOT_FOUND`, `ERR_KNOWLEDGE_DUPLICATE`,
`ERR_KNOWLEDGE_UNSUPPORTED_FORMAT`, `ERR_KNOWLEDGE_PARSE`,
`ERR_KNOWLEDGE_NOT_IMPLEMENTED`, `ERR_KNOWLEDGE_IO`. Expected failures are returned
as the `E` channel of `Result`; validation errors carry an `issues` list.

## 7. Logging & telemetry

The service accepts an optional Core `Logger` and emits lifecycle events through a
typed event bus, giving observers a telemetry hook without coupling. No secrets or
document bodies are logged.

## 8. Security

The package performs no I/O beyond Node built-ins (`crypto` for hashing/ids) and
never evaluates content. Content size is bounded by `maxContentBytes`. Untrusted
input flows only through parsers that fail closed with `KnowledgeParseError`.

## 9. Performance & scalability

The default repository and index are in-memory and suitable for moderate volumes.
Both are ports: persistent/distributed adapters (filesystem, database, vector
store) can be introduced without touching the service. Full-text scoring is a
naive term-frequency model intended to be replaced by a stronger index later.

## 10. Future compatibility

New formats, storages, indexes, sources and embedding providers are added by
implementing the corresponding port and registering it — no changes to the engine
or the monorepo structure are required.

## 11. Testing

Unit tests cover the domain, parsers, loaders, repository, full-text index,
validator, events, service (including versioning and events), import/export
round-trip, and DI wiring.
