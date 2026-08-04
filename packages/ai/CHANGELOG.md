# @telemax/ai

## [0.1.0] - Unreleased

### Added

- Initial AI Orchestrator foundation (SPEC-004): provider-agnostic infrastructure
  depending only on `@telemax/core`, `@telemax/knowledge` and
  `@telemax/prompt-engine`. No HTTP, no API keys, no external calls.
- `AIOrchestrator` façade implementing the flow request → knowledge context →
  prompt → provider selection → model selection → prepared request → standardized
  response, with streaming preparation.
- Provider SPI (`AIProvider`) with `AIProviderRegistry`, `ModelRegistry`,
  `ProviderCapabilities`, selection strategies, and a local deterministic
  `StubProvider` (no network, no credentials).
- Standardized `AIRequest`/`PreparedRequest`/`AIResponse`/`TokenUsage`,
  `Conversation`/`ConversationManager`, `Context`/`ContextBuilder`.
- Pipelines: `KnowledgePipeline` (via `KnowledgeGateway`), `PromptPipeline` (via
  the Prompt Engine), `ExecutionPipeline` (resilience).
- Resilience: `RetryPolicy`, `CircuitBreaker`, `RateLimiter`, `HealthMonitor`.
- Observability & cost: `TokenCounter`, `CostCalculator`/`CostTracker`,
  `MetricsCollector`, `AIEventBus`, `ResponseCache`, `StreamingManager`.
- Typed configuration, error hierarchy, DI wiring (`registerAIOrchestrator`) and
  full public barrel.
- Unit tests (17 files, 42 tests).
