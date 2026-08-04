# ADR-0005 — Knowledge Engine architecture

- **Status:** Accepted
- **Date:** 2026-07-27

## Context

Agents and generators need a shared way to store, version, organize, validate,
search and exchange knowledge. It must be modular, strictly typed, free of `any`,
and must depend only on `@telemax/core` while remaining open to future providers
(formats, storages, indexes, embeddings) without changing the monorepo structure.

## Decision

We introduce `@telemax/knowledge`, built on ports and dependency injection. The
`KnowledgeService` facade depends only on abstractions (`KnowledgeLoader`,
`KnowledgeSource`, `KnowledgeRepository`, `KnowledgeIndex`, `EmbeddingProvider`,
`StructuredTextParser`); default in-memory adapters are provided and wired via a
`registerKnowledge` helper over the Core DI container. Markdown/JSON/YAML are
supported now (YAML via a built-in subset parser behind an injectable port); PDF,
images and embeddings are prepared but return `NotImplementedError` or require an
injected provider. The service owns version numbering; the repository stores an
ordered history. Lifecycle changes are published through a typed event bus.
Expected failures use the Core `Result` type.

## Consequences

- Positive: highly modular and testable; new capabilities plug in via ports;
  zero third-party runtime dependencies; honest "prepared" states.
- Positive: consistent error and logging model shared with the Core.
- Negative: more indirection; the built-in YAML parser covers a subset only;
  in-memory defaults are not durable (persistent adapters come later).

## Alternatives considered

- **Concrete implementations without ports.** Rejected: harder to extend/test and
  would couple the engine to specific storage/search choices.
- **Add third-party parsers/vector stores now.** Rejected: violates the
  "depends only on `@telemax/core`" constraint for this foundation; deferred to
  future adapters injected through the existing ports.
