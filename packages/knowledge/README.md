# @telemax/knowledge

Knowledge Base engine for **Telemax AI Factory**. It is the shared substrate that
AI agents and generators use to store, version, organize, validate, search and
exchange knowledge documents. This package ships the **infrastructure only** — no
real content — and depends exclusively on [`@telemax/core`](../../core).

## Highlights

- **Documents** with immutable value semantics, checksums and versioning.
- **Formats:** Markdown, JSON and YAML are fully supported today; **PDF and images
  are prepared** (registered, but extraction is not yet implemented).
- **Metadata:** title, description, author, language, source, **categories**,
  **tags** (normalized to slugs) and an open `custom` map.
- **Repository** with per-document **version history**.
- **Indexing:** a working in-memory **full-text** index, plus a **prepared**
  embedding index that activates once an `EmbeddingProvider` is injected.
- **Import/Export** to a portable, versioned bundle.
- **Event-driven:** a typed event bus announces lifecycle changes.
- **SOLID + Dependency Injection:** every collaborator is a port; the default
  wiring is provided but fully replaceable.
- **Strict TypeScript, zero `any`.**

## Installation

Within the monorepo the package is available as a workspace dependency:

```jsonc
{
  "dependencies": {
    "@telemax/knowledge": "workspace:*",
  },
}
```

## Quick start

```ts
import { ServiceContainer } from "@telemax/core";
import { registerKnowledge } from "@telemax/knowledge";

const container = new ServiceContainer();
const knowledge = registerKnowledge(container, { defaultLanguage: "it" });

// Ingest a Markdown document (front-matter becomes metadata).
await knowledge.ingest({
  ref: "guides/setup.md",
  format: "markdown",
  content: "---\ntitle: Setup\ntags: [guide]\n---\nInstall the broadcast tool.\n",
});

// Full-text search.
const hits = await knowledge.search({ text: "broadcast", tags: ["guide"] });
```

Every operation returns a Core `Result<T, KnowledgeError>` — no throwing on
expected failures.

## Architecture

The engine follows the **Dependency-Inversion Principle**: the high-level
`KnowledgeService` depends only on abstractions (ports) declared in
[`interfaces.ts`](src/interfaces.ts); concrete adapters implement them.

```
                +---------------------+
   events <-----|   KnowledgeService  |-----> logger
                +----------+----------+
                           | depends on ports
   +-----------+-----------+-----------+-------------+-------------+
   |           |           |           |             |             |
KnowledgeRegistry  KnowledgeRepository  KnowledgeIndex  KnowledgeValidator  Import/Export
(loaders/sources)  (docs + versions)    (search)        (rules)             (bundles)
   |
KnowledgeLoader (Markdown / JSON / YAML | PDF / Image prepared)
```

### Modules

| Module                                                            | File                                                                                | Responsibility                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| `Document`                                                        | `domain/document.ts`                                                                | Immutable document value object.            |
| `DocumentMetadata`                                                | `domain/metadata.ts`                                                                | Metadata record + builder.                  |
| `KnowledgeVersion`                                                | `domain/version.ts`                                                                 | Version snapshot.                           |
| `KnowledgeCategory`                                               | `domain/category.ts`                                                                | Normalized category value object.           |
| `KnowledgeTag`                                                    | `domain/tag.ts`                                                                     | Normalized tag value object.                |
| `KnowledgeLoader`                                                 | `loaders/loader.ts` + `interfaces.ts`                                               | Raw → `Document` (Template Method base).    |
| `MarkdownLoader`                                                  | `loaders/markdown-loader.ts`                                                        | Markdown + YAML front-matter.               |
| `JsonLoader`                                                      | `loaders/json-loader.ts`                                                            | JSON documents.                             |
| `YamlLoader`                                                      | `loaders/yaml-loader.ts`                                                            | YAML documents (subset parser).             |
| `PdfLoader` / `ImageLoader`                                       | `loaders/binary-loaders.ts`                                                         | Prepared (not yet implemented).             |
| `KnowledgeRepository`                                             | `repository/in-memory-repository.ts`                                                | Persistence + version history.              |
| `KnowledgeIndex`                                                  | `indexing/*`                                                                        | Full-text (default) / embedding (prepared). |
| `KnowledgeValidator`                                              | `validator.ts`                                                                      | Composable validation rules.                |
| `KnowledgeRegistry`                                               | `registry.ts`                                                                       | Loader/source registration.                 |
| `KnowledgeSource`                                                 | `source.ts` + `interfaces.ts`                                                       | Provider of raw documents.                  |
| `KnowledgeService`                                                | `service.ts`                                                                        | Facade tying it all together.               |
| `ExportManager` / `ImportManager`                                 | `export-manager.ts` / `import-manager.ts`                                           | Portable bundles.                           |
| `Config` / `Errors` / `Events` / `Interfaces` / `Types` / `Utils` | `config.ts` / `errors.ts` / `events.ts` / `interfaces.ts` / `types.ts` / `utils.ts` | Cross-cutting building blocks.              |

## Supported formats

| Format   | Status    | Notes                                                 |
| -------- | --------- | ----------------------------------------------------- |
| Markdown | Supported | YAML front-matter is parsed into metadata.            |
| JSON     | Supported | `JSON.parse`; known top-level keys become metadata.   |
| YAML     | Supported | Built-in **subset** parser; injectable for full YAML. |
| PDF      | Prepared  | Loader registered; returns `NotImplementedError`.     |
| Image    | Prepared  | Loader registered; returns `NotImplementedError`.     |

The built-in YAML parser supports nested maps, block/flow sequences of scalars,
and scalar typing (null, booleans, numbers, quoted/plain strings). It does **not**
support sequences of maps, flow maps, anchors, multi-line scalars or inline
comments. Because YAML parsing is a `StructuredTextParser` port, a full parser can
be injected without changing the loader.

## Extensibility

- **New format:** implement `KnowledgeLoader` and register it with
  `KnowledgeRegistry.registerLoader`.
- **New storage:** implement `KnowledgeRepository`.
- **New search:** implement `KnowledgeIndex` (e.g. a vector store).
- **Embeddings:** implement `EmbeddingProvider` and use `EmbeddingKnowledgeIndex`.
- **New source:** implement `KnowledgeSource`.

## Events

`document.registered`, `document.updated`, `document.removed`, `document.indexed`,
`version.created`, `import.completed`, `export.completed`, `knowledge.error`.

## Scripts

```bash
pnpm --filter @telemax/knowledge build      # emit dist/
pnpm --filter @telemax/knowledge typecheck  # tsc --noEmit
pnpm --filter @telemax/knowledge lint       # eslint
pnpm --filter @telemax/knowledge test       # vitest
```

## License

MIT — see the repository [LICENSE](../../LICENSE).
