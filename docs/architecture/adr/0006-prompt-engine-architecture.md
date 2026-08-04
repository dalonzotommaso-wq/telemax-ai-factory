# ADR-0006 — Prompt Engine architecture

- **Status:** Accepted
- **Date:** 2026-07-28
- **Context:** SPEC-003 — Prompt Engine (`@telemax/prompt-engine`)

## Context

Every AI agent, the Knowledge Engine and the future AI Orchestrator need a
shared, reusable way to manage, version, validate, render and compose prompts.
We need infrastructure — not concrete prompts — that is provider-agnostic and
consistent with the foundation (strict TypeScript, SOLID, Clean Architecture,
DI, event-driven, `Result`-based errors).

## Decision

1. **Ports + Dependency Injection (Clean Architecture).** The `PromptEngine`
   façade depends only on abstractions (renderer, schema validator, cache,
   metrics, repository, formatter, locale resolver, extensions). Concrete
   adapters implement them and are composed by `registerPromptEngine`.
2. **Depend only on `@telemax/core` and `@telemax/knowledge`.** Cross-cutting
   primitives (`checksum`, `slugify`, `normalizeLabels`, `Clock`, `IdGenerator`,
   `StructuredValue`, the generic `EventBus` contract) are reused from
   `@telemax/knowledge` — no duplicated logic. The engine knows no AI provider.
3. **Dependency-free rendering.** A small, auditable engine (interpolation,
   `if/else`, `unless`, `each`, partials, blocks, comments) instead of a
   third-party template library, keeping the supply chain minimal.
4. **Deterministic version signature.** `signature = SHA-256(canonical(template))`
   with sorted keys; `checksum = SHA-256(body)`. Repository keeps version history.
5. **Errors via `Result`.** A `PromptError` union of `FrameworkError` subclasses;
   no exceptions for expected failures.
6. **Advanced capabilities are prepared, not faked.** Prompt Chains, RAG,
   Tool/Function calling, MCP and Structured Output (JSON Schema, XML/JSON) are
   exposed as stable ports/types returning `PromptNotImplementedError` until real
   adapters are provided.

## Consequences

- **Positive:** provider-agnostic and reusable across the platform; adapters are
  swappable (persistent repositories, distributed caches, JSON-Schema validators,
  real chain/RAG runners) without changing the façade or domain; small, testable
  units; no third-party template dependency.
- **Negative / trade-offs:** the built-in render engine covers a deliberate
  subset (no nested blocks, no helper functions yet); structured formats
  (`xml`/`json`) and advanced capabilities require future work. These are
  isolated behind ports, so they do not affect current consumers.
