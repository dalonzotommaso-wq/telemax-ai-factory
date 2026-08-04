# SPEC-003 — Prompt Engine

- **Package:** `@telemax/prompt-engine`
- **Status:** Delivered (SPRINT-003)
- **Depends on:** `@telemax/core`, `@telemax/knowledge` (only)
- **ADR:** [ADR-0006](architecture/adr/0006-prompt-engine-architecture.md)

> SPEC roadmap: **SPEC-001** Foundation · **SPEC-002** Knowledge Engine ·
> **SPEC-003** Prompt Engine (this document) · **SPEC-004** AI Orchestrator.

## 1. Purpose

The Prompt Engine is the shared substrate that every AI agent, the Knowledge
Engine and the AI Orchestrator use to manage, version, validate, render and
compose prompts. It is **reusable infrastructure**: it contains no concrete
prompts and is **provider-agnostic** — it knows nothing about any AI provider.

## 2. Scope

**In scope:** template management, variables and placeholders, validation,
versioning, rendering, prompt composition, multi-level prompts
(`system`/`developer`/`user`/`assistant`), import/export, metadata, categories,
tags, dependencies, template inheritance, extensions, i18n localization, cache,
logging, metrics, events, serialization, version signature, checksum and schema
validation.

**Prepared (not yet implemented):** Prompt Chains, RAG, Tool Calling, Function
Calling, MCP, Structured Output, JSON Schema, XML prompt, Markdown prompt.

**Out of scope:** provider integrations, concrete prompt content, model
invocation.

## 3. Architecture

Clean Architecture with Dependency Inversion and an event-driven core. The
`PromptEngine` façade depends only on ports; concrete adapters implement them and
are composed by DI (`registerPromptEngine`). Expected failures travel through the
Core `Result` type.

Layers:

- **Base:** `types`, `errors`, `config`, `utils`, `events`, `interfaces`.
- **Domain:** `template`, `variable`, `metadata`, `version`, `message`,
  `composition`, `advanced` (prepared types).
- **Adapters:** `rendering/*` (renderer, inheritance, formatters, locale),
  `schema/*`, `cache/*`, `metrics/*`, `repository/*`.
- **Application:** `service` (façade), `registry`, `validator`, `export-manager`,
  `import-manager`, `predisposition`.
- **Composition root:** `di`.

The rendering engine is dependency-free and supports interpolation (dotted
paths, `{{this}}`, `{{@index}}`), `if/else`, `unless`, `each`, partials
(`{{> name}}`), block wrappers and comments. Template inheritance is resolved
before rendering by merging named blocks along the `extends` chain
(most-derived wins).

## 4. Public interfaces (ports)

`TemplateRenderer`, `SchemaValidator`, `JsonSchemaValidator` (prepared),
`RenderCache`, `MetricsSink`, `TemplateRepository`, `PromptExtension`,
`LocaleResolver`, `PromptFormatter`, `PromptChainRunner` (prepared),
`RagAugmentor` (prepared). The façade `PromptEngine` exposes `registerTemplate`,
`getTemplate`, `listTemplates`, `getVersions`, `removeTemplate`, `render`,
`renderComposition`, `exportBundle`, `importBundle`, `runChain` (prepared),
`augmentWithRag` (prepared) and `on`.

## 5. Key decisions

| Decision                                              | Rationale                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| Depend only on `@telemax/core` + `@telemax/knowledge` | Reuse checksum/slugify/labels/clock/StructuredValue/EventBus; no dup logic |
| Ports + DI (Clean Architecture)                       | Swap renderer, cache, repository, validators without touching the engine   |
| `Result`-based errors                                 | Consistent, exception-free control flow across the platform                |
| Dependency-free render engine                         | No third-party template lib; smaller supply chain, full control            |
| Signature = SHA-256 over canonical template           | Deterministic version signature independent of key ordering                |
| Advanced capabilities prepared, not faked             | Honest `NotImplemented` behind stable ports; future adapters plug in       |
| Provider-agnostic                                     | The engine is reusable by all agents and by the AI Orchestrator            |

## 6. Error handling

All errors extend the Core `FrameworkError` with a stable `code`:
`PromptValidationError`, `PromptNotFoundError`, `PromptDuplicateError`,
`PromptRenderError`, `PromptResolutionError`, `PromptNotImplementedError`,
`PromptIoError`. They form the `PromptError` union used as the `E` channel.

## 7. Logging, metrics, events

Optional Core `Logger`; a `MetricsSink` port (noop default, in-memory sink for
tests) records render counts, cache hits/misses and render sizes; a typed
`PromptEventBus` emits template, render, composition, cache, import/export and
error events.

## 8. Security & performance

No code execution in templates (no `eval`); the engine only interpolates data.
Partial recursion is bounded. Rendering results are cached by a signature +
locale + variable hash key; the default cache is bounded (FIFO).

## 9. Future compatibility

Prepared ports and types allow adding Prompt Chains, RAG (bridging to
`@telemax/knowledge` search), Tool/Function calling, MCP and Structured Output
(JSON Schema, XML/JSON formats) without changing the façade or the domain.

## 10. Testing

Unit tests cover the renderer, inheritance, formatters, schema validation,
templates, metadata, repository, cache, events, validator, the service façade
and DI wiring. Result: 12 files, 45 tests, all green; coverage ≈ 88% lines.
