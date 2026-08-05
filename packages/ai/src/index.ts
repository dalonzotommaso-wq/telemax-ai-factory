/**
 * Public API of `@telemax/ai` — the provider-agnostic AI Orchestrator.
 *
 * Coordinates the Knowledge and Prompt engines, provider/model registries,
 * requests/responses, conversations, pipelines, resilience, cost and telemetry.
 * Infrastructure only: no HTTP, no API keys, no external calls. Depends only on
 * `@telemax/core`, `@telemax/knowledge` and `@telemax/prompt-engine`.
 */

// Types
export { KNOWN_PROVIDERS, asProviderId, asModelId } from "./types.js";
export type {
  ProviderId,
  ModelId,
  MessageRole,
  FinishReason,
  Modality,
  HealthState,
  CircuitState,
} from "./types.js";

// Errors
export {
  ProviderUnavailableError,
  RegistryLookupError,
  InvalidRequestError,
  ResiliencyError,
  ProviderExecutionError,
  OrchestratorNotImplementedError,
} from "./errors.js";
export type { AIError } from "./errors.js";

// Config
export { DEFAULT_ORCHESTRATOR_CONFIG, resolveOrchestratorConfig } from "./config.js";
export type {
  OrchestratorConfig,
  OrchestratorConfigInput,
  RetryConfig,
  CircuitBreakerConfig,
  RateLimitConfig,
  OrchestratorCacheConfig,
} from "./config.js";

// Utils
export {
  canonicalize,
  hashValue,
  checksum,
  slugify,
  systemClock,
  uuidIdGenerator,
} from "./utils.js";
export type { Clock, IdGenerator } from "./utils.js";

// Events
export { AIEventBus } from "./events.js";
export type { AIEvents, EventBus, EventHandler } from "./events.js";

// Interfaces (ports)
export type {
  AIProvider,
  ProviderSelector,
  ModelSelector,
  KnowledgeGateway,
  TokenCounter,
  CostCalculator,
  CostSink,
  ResponseCache,
  MetricsSink,
  RateLimiter,
  CircuitBreaker,
  RetryPolicy,
  HealthMonitor,
  StreamingManager,
} from "./interfaces.js";

// Domain
export { message } from "./domain/message.js";
export type { Message } from "./domain/message.js";
export { DEFAULT_CAPABILITIES } from "./domain/capabilities.js";
export type { ProviderCapabilities } from "./domain/capabilities.js";
export type { ModelDescriptor, ModelPricing } from "./domain/model.js";
export type { AIRequest, PreparedRequest, GenerationParams } from "./domain/request.js";
export type { AIResponse, AIResponseChunk, TokenUsage } from "./domain/response.js";
export { appendMessage } from "./domain/conversation.js";
export type { Conversation } from "./domain/conversation.js";
export { EMPTY_CONTEXT } from "./domain/context.js";
export type { Context, ContextSnippet } from "./domain/context.js";
export type { ExecutionContext, ExecutionResult } from "./domain/execution.js";

// Providers
export { AIProviderRegistry } from "./providers/provider-registry.js";
export { ModelRegistry } from "./providers/model-registry.js";
export { DefaultProviderSelector, DefaultModelSelector } from "./providers/selection.js";
export { StubProvider } from "./providers/stub-provider.js";
export type { StubProviderOptions } from "./providers/stub-provider.js";

// Conversation
export { ConversationManager } from "./conversation/conversation-manager.js";
export { ContextBuilder } from "./conversation/context-builder.js";
export type { ContextBuildInput } from "./conversation/context-builder.js";

// Pipelines
export {
  KnowledgePipeline,
  NullKnowledgeGateway,
  StaticKnowledgeGateway,
} from "./pipeline/knowledge-pipeline.js";
export { PromptPipeline } from "./pipeline/prompt-pipeline.js";
export type { PromptBuildInput } from "./pipeline/prompt-pipeline.js";
export { ExecutionPipeline } from "./pipeline/execution-pipeline.js";
export type { ExecutionPipelineDeps } from "./pipeline/execution-pipeline.js";

// Resilience
export { DefaultRetryPolicy } from "./resilience/retry-policy.js";
export type { SleepFn } from "./resilience/retry-policy.js";
export { DefaultCircuitBreaker } from "./resilience/circuit-breaker.js";
export { TokenBucketRateLimiter } from "./resilience/rate-limiter.js";
export { DefaultHealthMonitor } from "./resilience/health-monitor.js";

// Cost / telemetry
export { HeuristicTokenCounter } from "./cost/token-counter.js";
export { DefaultCostCalculator, CostTracker } from "./cost/cost-tracker.js";
export { NoopMetricsSink, MetricsCollector } from "./telemetry/telemetry.js";
export type { Telemetry } from "./telemetry/telemetry.js";

// Cache / streaming
export { InMemoryResponseCache } from "./cache/cache-manager.js";
export { DefaultStreamingManager } from "./streaming/streaming-manager.js";

// Orchestrator
export { AIOrchestrator } from "./orchestrator.js";
export type { AIOrchestratorDeps } from "./orchestrator.js";

// Dependency injection
export {
  registerAIOrchestrator,
  AI_CONFIG,
  AI_EVENTS,
  AI_PROVIDER_REGISTRY,
  AI_MODEL_REGISTRY,
  AI_COST_TRACKER,
  AI_ORCHESTRATOR,
} from "./di.js";
