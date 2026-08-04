/**
 * {@link TokenBucketRateLimiter} — a classic token bucket implementing the
 * {@link RateLimiter} port. The clock is injectable for tests.
 */
import type { RateLimiter } from "../interfaces.js";

export class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefill: number;

  public constructor(
    private readonly capacity = 60,
    private readonly refillPerSecond = 60,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.tokens = capacity;
    this.lastRefill = now();
  }

  public tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  private refill(): void {
    const nowMs = this.now();
    const elapsedSeconds = (nowMs - this.lastRefill) / 1000;
    if (elapsedSeconds > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillPerSecond);
      this.lastRefill = nowMs;
    }
  }
}
