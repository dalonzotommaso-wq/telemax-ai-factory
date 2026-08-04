# ADR-0007 — AI Orchestrator architecture

- **Status:** Accepted
- **Date:** 2026-07-28
- **Context:** SPEC-004 — AI Orchestrator (`@telemax/ai`)

## Context

The framework needs a coordination layer that turns a request into a standardized
response by composing the Knowledge and Prompt engines and dispatching to an AI
provider. It must be provider-agnostic, must not depend on any specific provider,
and — for this sprint — must be infrastructure only: no HTTP, no API keys, no
external connections. It must stay consistent with the foundation (strict
TypeScript, SOLID, Clean Architecture, DI, event-driven, `Result`-based errors).

## Decision

1. **Ports + Dependency Injection (Clean Architecture).** The `AIOrchestrator`
   façade depends only on abstractions (provider, selectors, knowledge gateway,
   token counter, cost calculator, cache, metrics, resilience). Concrete adapters
   implement them and are composed by `registerAIOrchestrator`.
2. **Depend only on core + knowledge + prompt-engine.** The orchestrator composes
   the other engines and reuses their primitives (checksum, clock, id,
   `StructuredValue`, the `EventBus` contract, the `PromptEngine`). It never
   duplicates their logic and never learns about a provider.
3. **Provider-agnostic SPI.** Providers implement a single `AIProvider` port and
   register into `AIProviderRegistry`; the orchestrator selects by strategy and
   never branches on a provider identity. Foreseen providers (Anthropic, OpenAI,
   Gemini, OpenRouter, Ollama, Azure OpenAI, Bedrock, …) are not implemented.
4. **Local deterministic stub, no I/O.** A `StubProvider` synthesizes a reply
   from the request so the full flow is testable with no HTTP and no credentials.
5. **`Result`-based errors.** An `AIError` union of `FrameworkError` subclasses;
   no exceptions for expected failures.
6. **Resilience stack.** Rate limiter → circuit breaker → retry → provider, with
   a health monitor, shapes execution like production without external calls.
7. **Deterministic request signature.** `signature = SHA-256(canonical(prepared))`
   is the cache key, independent of object key ordering.
8. **Capabilities-driven feature discovery.** Streaming, tools, function calling,
   vision and JSON mode are declared via `ProviderCapabilities`; behavior is added
   when real providers arrive.

## Consequences

- **Positive:** provider-agnostic and composable; adapters (real providers,
  persistent caches, distributed rate limiters, real knowledge retrieval) swap in
  without touching the façade; small, testable units; safe to ship with no
  external dependencies or secrets.
- **Negative / trade-offs:** without real providers the shipped behavior is the
  stub; streaming, tools and structured output are prepared, not active; retry
  attempts are internal and not surfaced per-attempt in the result. These are
  isolated behind ports and do not affect the flow's shape.
