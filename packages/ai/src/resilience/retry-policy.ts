/**
 * {@link DefaultRetryPolicy} — retries a `Result`-returning operation with linear
 * backoff, up to `maxAttempts`. The sleep function is injectable for tests.
 */
import { err, isOk, type Result } from "@telemax/core";
import { ResiliencyError, type AIError } from "../errors.js";
import type { RetryPolicy } from "../interfaces.js";

export type SleepFn = (ms: number) => Promise<void>;

const defaultSleep: SleepFn = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export class DefaultRetryPolicy implements RetryPolicy {
  public constructor(
    private readonly maxAttempts = 3,
    private readonly baseDelayMs = 50,
    private readonly sleep: SleepFn = defaultSleep,
  ) {}

  public async execute<T>(fn: () => Promise<Result<T, AIError>>): Promise<Result<T, AIError>> {
    let last: Result<T, AIError> | undefined;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const result = await fn();
      if (isOk(result)) {
        return result;
      }
      last = result;
      if (attempt < this.maxAttempts) {
        await this.sleep(this.baseDelayMs * attempt);
      }
    }
    return last ?? err(new ResiliencyError("Retry policy executed no attempts."));
  }
}
