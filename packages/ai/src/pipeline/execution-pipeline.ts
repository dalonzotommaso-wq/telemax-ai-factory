/**
 * {@link ExecutionPipeline} — runs a prepared request through the resilience
 * stack (rate limiter → circuit breaker → retry → provider) and records provider
 * health. It never performs I/O itself; the provider does the (here, stubbed)
 * work.
 */
import { err, isErr, type Result } from "@telemax/core";
import type { PreparedRequest } from "../domain/request.js";
import type { AIResponse } from "../domain/response.js";
import { ResiliencyError, type AIError } from "../errors.js";
import type {
  AIProvider,
  CircuitBreaker,
  HealthMonitor,
  RateLimiter,
  RetryPolicy,
} from "../interfaces.js";

/** Collaborators for {@link ExecutionPipeline}. */
export interface ExecutionPipelineDeps {
  readonly retry: RetryPolicy;
  readonly breaker: CircuitBreaker;
  readonly rateLimiter: RateLimiter;
  readonly health: HealthMonitor;
}

export class ExecutionPipeline {
  public constructor(private readonly deps: ExecutionPipelineDeps) {}

  public async execute(
    provider: AIProvider,
    request: PreparedRequest,
  ): Promise<Result<AIResponse, AIError>> {
    if (!this.deps.rateLimiter.tryAcquire()) {
      return err(new ResiliencyError("Rate limit exceeded."));
    }
    const result = await this.deps.breaker.execute(() =>
      this.deps.retry.execute(() => provider.complete(request)),
    );
    this.deps.health.report(provider.id, !isErr(result));
    return result;
  }
}
