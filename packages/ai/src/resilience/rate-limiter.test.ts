import { describe, expect, it } from "vitest";
import { TokenBucketRateLimiter } from "./rate-limiter.js";

describe("TokenBucketRateLimiter", () => {
  it("exhausts capacity and refills over time", () => {
    let t = 0;
    const limiter = new TokenBucketRateLimiter(2, 1, () => t);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
    t = 1000;
    expect(limiter.tryAcquire()).toBe(true);
  });
});
