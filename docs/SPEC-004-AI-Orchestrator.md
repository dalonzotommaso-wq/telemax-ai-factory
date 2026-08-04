# SPEC-004 — AI Orchestrator

- **Package:** `@telemax/ai`
- **Status:** Delivered (SPRINT-004)
- **Depends on:** `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine` (only)
- **ADR:** [ADR-0007](architecture/adr/0007-ai-orchestrator-architecture.md)

> This SPEC fulfills the AI Orchestrator whose design was previously tracked as an
> Architecture Review. It delivers infrastructure only — no provider APIs.

## 1. Purpose

The AI Orchestrator is the coordination layer of the framework. It receives a
request, retrieves context from the Knowledge Engine, builds the prompt via the
Prompt Engine, selects a provider and a model, prepares a normalized request,
executes it through a resilience stack and returns a standardized response. It is
**provider-agnostic** and knows nothing about any specific AI provider.

## 2. Scope

**In scope (infrastructure):** `AIOrchestrator`, provider SPI (`AIProvider`) and
registries (`AIProviderRegistry`, `ModelRegistry`), `ProviderCapabilities`,
standardized `AIRequest`/`PreparedRequest`/`AIResponse`, `Conversation` and
`ConversationManager`, `Message`, `Context` and `ContextBuilder`, the prompt,
knowledge and execution pipelines, `ExecutionContext`/`ExecutionResult`,
`RetryPolicy`, `CircuitBreaker`, `RateLimiter`, `HealthMonitor`, `CostTracker`,
`TokenCounter`, telemetry/`MetricsCollector`, logging, `StreamingManager`,
`CacheManager`, event-bus integration, configuration, errors, interfaces, types
and utils. A local deterministic `StubProvider` is included for tests.

**Explicitly out of scope:** real provider APIs, HTTP calls, API keys, and any
connection to external services.

**Foreseen providers (not implemented):** Anthropic Claude, OpenAI, Google
Gemini, OpenRouter, Ollama, Azure OpenAI, Amazon Bedrock, future providers.

## 3. Architecture

Clean Architecture with Dependency Inversion and an event-driven core. The
façade depends only on ports; adapters implement them and are composed by DI.
Expected failures travel through the Core `Result` type.

Orchestration flow:

1. **receive request** — `AIRequest` (raw input or messages, optional template,
   variables, knowledge query, provider/model hints, params).
2. **retrieve context** — `KnowledgePipeline` via a `KnowledgeGateway` port.
3. **build prompt** — `ContextBuilder` + `PromptPipeline` (Prompt Engine).
4. **select provider** — `ProviderSelector` over `AIProviderRegistry`.
5. **select model** — `ModelSelector` over `ModelRegistry`.
6. **prepare request** — `PreparedRequest` with a deterministic signature.
7. **execute** — `ExecutionPipeline`: rate limiter → circuit breaker → retry →
   provider; health recorded; cost and tokens tracked; response cached.
8. **return** — a standardized `ExecutionResult` (with `AIResponse`).

## 4. Public interfaces (ports)

`AIProvider`, `ProviderSelector`, `ModelSelector`, `KnowledgeGateway`,
`TokenCounter`, `CostCalculator`, `CostSink`, `ResponseCache`, `MetricsSink`,
`RateLimiter`, `CircuitBreaker`, `RetryPolicy`, `HealthMonitor`,
`StreamingManager`. The façade `AIOrchestrator` exposes `execute`, `stream`,
`registerProvider`, `registerModel`, `on`, and the `providers`, `models`,
`conversations` and `costs` accessors.

## 5. Key decisions

| Decision                                                | Rationale                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Ports + DI (Clean Architecture)                         | Swap providers, selectors, cache, resilience without touching the façade |
| Depend only on core + knowledge + prompt-engine         | Reuse primitives; the orchestrator composes the other engines, no dup    |
| Provider-agnostic; never branch on a provider           | Any provider plugs in via `AIProvider` + registry                        |
| Local deterministic `StubProvider`                      | Exercises the full flow with no HTTP and no credentials                  |
| `Result`-based errors                                   | Consistent, exception-free control flow                                  |
| Resilience stack (rate limit, breaker, retry, health)   | Production-shaped execution without external calls                       |
| Signature = SHA-256 over the canonical prepared request | Deterministic cache key independent of key ordering                      |
| Streaming/tools/vision/JSON declared via capabilities   | Feature discovery prepared; behavior added when real providers arrive    |

## 6. Error handling

All errors extend the Core `FrameworkError` with a stable `code`:
`ProviderUnavailableError`, `RegistryLookupError`, `InvalidRequestError`,
`ResiliencyError`, `ProviderExecutionError`, `OrchestratorNotImplementedError`.
They form the `AIError` union used as the `E` channel.

## 7. Logging, metrics, events

Optional Core `Logger`; a `MetricsSink` port (noop default, `MetricsCollector`
for inspection) records cache hits/misses, responses and token totals; a typed
`AIEventBus` emits request/context/prompt/provider/model/response/cost/health
events.

## 8. Security & performance

No secrets, endpoints or API keys anywhere; no network I/O. The resilience stack
bounds load (rate limiting), isolates failures (circuit breaker) and retries
transient errors. Responses are cached by request signature.

## 9. Future compatibility

Real providers implement `AIProvider` and register into `AIProviderRegistry`;
`KnowledgeGateway` bridges to `@telemax/knowledge` retrieval; streaming, tools,
function calling, MCP, vision and structured output activate as capabilities and
adapters are added — all without changing the façade or the domain.

## 10. Testing

Unit tests cover registries, selection, the stub provider, resilience (retry,
breaker, rate limiter, health), cost/token counting, cache, telemetry,
conversation manager, context builder, the three pipelines, events, the
orchestrator (end-to-end, cache, selection errors, knowledge retrieval, template
rendering, conversation append, streaming) and DI. Result: 17 files, 42 tests,
all green; coverage ≈ 95% lines.
