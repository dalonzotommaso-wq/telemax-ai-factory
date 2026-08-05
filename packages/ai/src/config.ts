/**
 * Centralized configuration for the AI Orchestrator (typed object + safe
 * defaults). No secrets, endpoints or API keys ever live here.
 */

/** Retry settings. */
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
}

/** Circuit-breaker settings. */
export interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly resetTimeoutMs: number;
}

/** Rate-limiter settings (token bucket). */
export interface RateLimitConfig {
  readonly capacity: number;
  readonly refillPerSecond: number;
}

/** Response cache settings. */
export interface OrchestratorCacheConfig {
  readonly enabled: boolean;
  readonly maxEntries: number;
}

/** The resolved orchestrator configuration. */
export interface OrchestratorConfig {
  readonly defaultProvider?: string;
  readonly defaultModel?: string;
  readonly retry: RetryConfig;
  readonly circuitBreaker: CircuitBreakerConfig;
  readonly rateLimit: RateLimitConfig;
  readonly cache: OrchestratorCacheConfig;
  readonly streamingEnabled: boolean;
}

/** Partial configuration input accepted by {@link resolveOrchestratorConfig}. */
export interface OrchestratorConfigInput {
  readonly defaultProvider?: string;
  readonly defaultModel?: string;
  readonly retry?: Partial<RetryConfig>;
  readonly circuitBreaker?: Partial<CircuitBreakerConfig>;
  readonly rateLimit?: Partial<RateLimitConfig>;
  readonly cache?: Partial<OrchestratorCacheConfig>;
  readonly streamingEnabled?: boolean;
}

/** Safe, zero-configuration defaults. */
export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  retry: { maxAttempts: 3, baseDelayMs: 50 },
  circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30_000 },
  rateLimit: { capacity: 60, refillPerSecond: 60 },
  cache: { enabled: true, maxEntries: 256 },
  streamingEnabled: false,
};

/** Merge a partial input over {@link DEFAULT_ORCHESTRATOR_CONFIG}. */
export function resolveOrchestratorConfig(input?: OrchestratorConfigInput): OrchestratorConfig {
  const base = DEFAULT_ORCHESTRATOR_CONFIG;
  return {
    ...(input?.defaultProvider !== undefined ? { defaultProvider: input.defaultProvider } : {}),
    ...(input?.defaultModel !== undefined ? { defaultModel: input.defaultModel } : {}),
    retry: {
      maxAttempts: input?.retry?.maxAttempts ?? base.retry.maxAttempts,
      baseDelayMs: input?.retry?.baseDelayMs ?? base.retry.baseDelayMs,
    },
    circuitBreaker: {
      failureThreshold:
        input?.circuitBreaker?.failureThreshold ?? base.circuitBreaker.failureThreshold,
      resetTimeoutMs: input?.circuitBreaker?.resetTimeoutMs ?? base.circuitBreaker.resetTimeoutMs,
    },
    rateLimit: {
      capacity: input?.rateLimit?.capacity ?? base.rateLimit.capacity,
      refillPerSecond: input?.rateLimit?.refillPerSecond ?? base.rateLimit.refillPerSecond,
    },
    cache: {
      enabled: input?.cache?.enabled ?? base.cache.enabled,
      maxEntries: input?.cache?.maxEntries ?? base.cache.maxEntries,
    },
    streamingEnabled: input?.streamingEnabled ?? base.streamingEnabled,
  };
}
