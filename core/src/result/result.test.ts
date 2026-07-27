import { describe, expect, it } from "vitest";
import { err, isErr, isOk, map, ok, unwrapOr, type Result } from "./result.js";

describe("Result", () => {
  it("constructs and narrows an Ok value", () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (isOk(result)) {
      expect(result.value).toBe(42);
    }
  });

  it("constructs and narrows an Err value", () => {
    const result = err(new Error("boom"));
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe("boom");
    }
  });

  it("maps over the success branch", () => {
    const mapped = map(ok(2), (n: number) => n * 2);
    expect(unwrapOr(mapped, 0)).toBe(4);
  });

  it("passes the error branch through map unchanged", () => {
    const input: Result<number, Error> = err(new Error("x"));
    const mapped = map(input, (n: number) => n * 2);
    expect(unwrapOr(mapped, 7)).toBe(7);
  });
});
