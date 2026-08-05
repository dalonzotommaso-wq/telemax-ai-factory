/**
 * {@link DefaultCircuitBreaker} — trips open after `failureThreshold` consecutive
 * failures and transitions to half-open after `resetTimeoutMs`. The clock is
 * injectable for tests.
 */
import { err, isOk, type Result } from "@telemax/core";
import { ResiliencyError, type AIError } from "../errors.js";
import type { CircuitBreaker } from "../interfaces.js";
import type { CircuitState } from "../types.js";

export class DefaultCircuitBreaker implements CircuitBreaker {
  private failures = 0;
  private current: CircuitState = "closed";
  private openedAt = 0;

  public constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeoutMs = 30_000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  public state(): CircuitState {
    if (this.current === "open" && this.now() - this.openedAt >= this.resetTimeoutMs) {
      this.current = "half-open";
    }
    return this.current;
  }

  public async execute<T>(fn: () => Promise<Result<T, AIError>>): Promise<Result<T, AIError>> {
    if (this.state() === "open") {
      return err(new ResiliencyError("Circuit breaker is open."));
    }
    const result = await fn();
    if (isOk(result)) {
      this.failures = 0;
      this.current = "closed";
    } else {
      this.failures += 1;
      if (this.failures >= this.failureThreshold) {
        this.current = "open";
        this.openedAt = this.now();
      }
    }
    return result;
  }
}
