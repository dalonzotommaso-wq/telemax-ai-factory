import { isErr, isOk, ok, type Result } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { withTimeout } from "./timeout.js";
import type { WorkflowError } from "../errors.js";

describe("withTimeout", () => {
  it("passes through when timeout is disabled", async () => {
    const value: Result<number, WorkflowError> = ok(1);
    const result = await withTimeout(Promise.resolve(value), 0, "s");
    expect(isOk(result)).toBe(true);
  });

  it("times out a slow operation", async () => {
    const slow = new Promise<Result<number, WorkflowError>>((resolve) => {
      setTimeout(() => resolve(ok(1)), 40);
    });
    const result = await withTimeout(slow, 5, "slow");
    expect(isErr(result)).toBe(true);
  });
});
