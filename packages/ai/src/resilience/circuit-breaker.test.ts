import { err, isErr, isOk, ok, type Result } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { DefaultCircuitBreaker } from "./circuit-breaker.js";
import { ResiliencyError, type AIError } from "../errors.js";

const fail = (): Promise<Result<string, AIError>> => Promise.resolve(err(new ResiliencyError("x")));
const succeed = (): Promise<Result<string, AIError>> => Promise.resolve(ok("y"));

describe("DefaultCircuitBreaker", () => {
  it("opens after the failure threshold and half-opens after reset", async () => {
    let t = 0;
    const breaker = new DefaultCircuitBreaker(2, 100, () => t);
    await breaker.execute(fail);
    await breaker.execute(fail);
    expect(breaker.state()).toBe("open");

    const blocked = await breaker.execute(succeed);
    expect(isErr(blocked)).toBe(true);

    t = 100;
    expect(breaker.state()).toBe("half-open");
    const recovered = await breaker.execute(succeed);
    expect(isOk(recovered)).toBe(true);
    expect(breaker.state()).toBe("closed");
  });
});
