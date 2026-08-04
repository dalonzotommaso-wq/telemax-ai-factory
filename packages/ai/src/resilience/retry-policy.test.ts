import { err, isErr, isOk, ok, type Result } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { DefaultRetryPolicy } from "./retry-policy.js";
import { ResiliencyError, type AIError } from "../errors.js";

const noSleep = (): Promise<void> => Promise.resolve();

describe("DefaultRetryPolicy", () => {
  it("returns immediately on success", async () => {
    const policy = new DefaultRetryPolicy(3, 1, noSleep);
    let calls = 0;
    const result = await policy.execute(() => {
      calls += 1;
      return Promise.resolve<Result<string, AIError>>(ok("done"));
    });
    expect(isOk(result)).toBe(true);
    expect(calls).toBe(1);
  });

  it("retries until success", async () => {
    const policy = new DefaultRetryPolicy(3, 1, noSleep);
    let calls = 0;
    const result = await policy.execute(() => {
      calls += 1;
      return Promise.resolve<Result<string, AIError>>(
        calls < 2 ? err(new ResiliencyError("x")) : ok("done"),
      );
    });
    expect(isOk(result)).toBe(true);
    expect(calls).toBe(2);
  });

  it("returns the last error when attempts are exhausted", async () => {
    const policy = new DefaultRetryPolicy(3, 1, noSleep);
    let calls = 0;
    const result = await policy.execute(() => {
      calls += 1;
      return Promise.resolve<Result<string, AIError>>(err(new ResiliencyError("x")));
    });
    expect(isErr(result)).toBe(true);
    expect(calls).toBe(3);
  });
});
