/**
 * Behavioral contracts (ports) for the AI Orchestrator.
 *
 * Following Dependency Inversion, the orchestrator and its pipelines depend only
 * on these abstractions; concrete adapters implement them. Real AI providers
 * implement {@link AIProvider} in future sprints — this package ships only a
 * local, deterministic stub. No port performs HTTP or reads credentials.
 */
import type { Result } from "@telemax/core";
import type { ProviderCapabilities } from "./domain/capabilities.js";
import type { ContextSnippet } from "./domain/context.js";
import type { Message } from "./domain/message.js";
import type { ModelDescriptor, ModelPricing } from "./domain/model.js";
import type { PreparedRequest } from "./domain/request.js";
import type { AIResponse, AIResponseChunk, TokenUsage } from "./domain/response.js";
import type { AIError } from "./errors.js";
import type { CircuitState, HealthState, ModelId, ProviderId } from "./types.js";

/** An AI provider. Concrete providers live outside this package. */
export interface AIProvider {
  readonly id: ProviderId;
  capabilities(): ProviderCapabilities;
  complete(request: PreparedRequest): Promise<Result<AIResponse, AIError>>;
  stream?(request: PreparedRequest): AsyncIterable<AIResponseChunk>;
}

/** Chooses a provider from the registered set, honoring an optional hint. */
export interface ProviderSelector {
  select(providers: readonly AIProvider[], hint?: string): Result<AIProvider, AIError>;
}

/** Chooses a model for a provider, honoring an optional hint. */
export interface ModelSelector {
  select(
    models: readonly ModelDescriptor[],
    providerId: ProviderId,
    hint?: string,
  ): Result<ModelDescriptor, AIError>;
}

/** Retrieves context snippets from the Knowledge Engine. */
export interface KnowledgeGateway {
  retrieve(query: string, limit?: number): Promise<Result<readonly ContextSnippet[], AIError>>;
}

/** Counts tokens for text and message lists (heuristic by default). */
export interface TokenCounter {
  count(text: string): number;
  countMessages(messages: readonly Message[]): number;
}

/** Computes cost from usage and model pricing. */
export interface CostCalculator {
  cost(usage: TokenUsage, pricing: ModelPricing): number;
}

/** A synchronous response cache keyed by a request signature. */
export interface ResponseCache {
  get(key: string): AIResponse | undefined;
  set(key: string, value: AIResponse): void;
  clear(): void;
}

/** A metrics sink for counters and observations. */
export interface MetricsSink {
  increment(name: string, value?: number): void;
  observe(name: string, value: number): void;
}

/** A token-bucket rate limiter. */
export interface RateLimiter {
  tryAcquire(): boolean;
}

/** A circuit breaker guarding provider calls. */
export interface CircuitBreaker {
  execute<T>(fn: () => Promise<Result<T, AIError>>): Promise<Result<T, AIError>>;
  state(): CircuitState;
}

/** A retry policy with backoff. */
export interface RetryPolicy {
  execute<T>(fn: () => Promise<Result<T, AIError>>): Promise<Result<T, AIError>>;
}

/** Tracks and exposes provider health. */
export interface HealthMonitor {
  report(providerId: ProviderId, healthy: boolean): void;
  state(providerId: ProviderId): HealthState;
}

/** Manages streaming sessions (prepared; default simulates a single chunk). */
export interface StreamingManager {
  stream(provider: AIProvider, request: PreparedRequest): AsyncIterable<AIResponseChunk>;
}

/** Accumulates spend per provider/model. */
export interface CostSink {
  track(providerId: ProviderId, modelId: ModelId, cost: number): void;
  total(): number;
}
