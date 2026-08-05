# @telemax/ai

Provider-agnostic **AI Orchestrator** for Telemax AI Factory. It coordinates every
other module of the framework to turn a request into a standardized response:
retrieve context from the Knowledge Engine, build the prompt via the Prompt
Engine, select a provider and model, prepare the request, execute it through a
resilience stack, and return a normalized result.

It is **infrastructure only**: it performs **no HTTP calls**, uses **no API keys**
and connects to **no external service**. The single shipped provider is a local,
deterministic **stub**. Real providers (Anthropic Claude, OpenAI, Google Gemini,
OpenRouter, Ollama, Azure OpenAI, Amazon Bedrock, …) implement the same port in
future sprints. It depends only on `@telemax/core`, `@telemax/knowledge` and
`@telemax/prompt-engine`.

## Highlights

- **Orchestration flow** — request → knowledge context → prompt → provider →
  model → prepared request → standardized response.
- **Provider SPI & registries** — `AIProvider` port, `AIProviderRegistry`,
  `ModelRegistry`, `ProviderCapabilities`; selection strategies with hints and
  defaults. The orchestrator never branches on a specific provider.
- **Pipelines** — `KnowledgePipeline` (via a `KnowledgeGateway` port),
  `PromptPipeline` (via the Prompt Engine), `ExecutionPipeline` (resilience).
- **Resilience** — `RetryPolicy`, `CircuitBreaker`, `RateLimiter` (token bucket),
  `HealthMonitor`.
- **Cost & telemetry** — `TokenCounter` (heuristic), `CostCalculator`/`CostTracker`,
  `MetricsCollector`, event bus, optional Core logger.
- **Conversations & context** — `ConversationManager`, `ContextBuilder`.
- **Streaming & cache** — `StreamingManager`, `ResponseCache` (signature-keyed).
- **Standardized types** — `AIRequest`, `PreparedRequest`, `AIResponse`,
  `TokenUsage`, `ExecutionResult`.

## Install

```jsonc
// package.json
{
  "dependencies": {
    "@telemax/ai": "workspace:*",
  },
}
```

## Quick start

```ts
import {
  AIOrchestrator,
  StubProvider,
  DEFAULT_CAPABILITIES,
  asModelId,
  asProviderId,
} from "@telemax/ai";

const orchestrator = new AIOrchestrator();
orchestrator.registerProvider(new StubProvider());
orchestrator.registerModel({
  id: asModelId("m1"),
  providerId: asProviderId("stub"),
  displayName: "Stub M1",
  capabilities: DEFAULT_CAPABILITIES,
  contextWindow: 8192,
  pricing: { inputPer1kTokens: 1, outputPer1kTokens: 2 },
});

const result = await orchestrator.execute({ input: "Hello!" });
// result.value.response -> standardized AIResponse (content, usage, cost, …)
```

## Architecture

Clean Architecture with Dependency Inversion and an event-driven core. The
`AIOrchestrator` façade depends only on ports (`interfaces.ts`); concrete
adapters implement them.

```
   AIRequest
      │
┌─────▼───────────────────────────────────────────────┐
│                   AIOrchestrator                      │
│  KnowledgePipeline → ContextBuilder → PromptPipeline  │
│  → ProviderSelector → ModelSelector → PreparedRequest │
│  → ExecutionPipeline (RateLimiter→CircuitBreaker→     │
│     RetryPolicy→AIProvider) → Cost/Cache/Telemetry    │
└─────┬───────────────────────────────────────────────┘
      ▼
   ExecutionResult (standardized AIResponse)
```

### Ports (adapters are swappable)

`AIProvider`, `ProviderSelector`, `ModelSelector`, `KnowledgeGateway`,
`TokenCounter`, `CostCalculator`, `CostSink`, `ResponseCache`, `MetricsSink`,
`RateLimiter`, `CircuitBreaker`, `RetryPolicy`, `HealthMonitor`,
`StreamingManager`.

## Foreseen providers

Anthropic Claude · OpenAI · Google Gemini · OpenRouter · Ollama · Azure OpenAI ·
Amazon Bedrock · future providers. None are implemented in this package (no HTTP,
no keys); each will implement `AIProvider` and register into `AIProviderRegistry`.

## Events

`request.received` · `context.retrieved` · `prompt.built` · `provider.selected` ·
`model.selected` · `request.prepared` · `response.received` · `execution.failed` ·
`provider.health.changed` · `cache.hit` · `cache.miss` · `cost.tracked`.

## Scripts

```bash
pnpm --filter @telemax/ai build
pnpm --filter @telemax/ai typecheck
pnpm --filter @telemax/ai lint
pnpm --filter @telemax/ai test
pnpm --filter @telemax/ai test:coverage
```

## License

MIT © Gruppo AIR srl
