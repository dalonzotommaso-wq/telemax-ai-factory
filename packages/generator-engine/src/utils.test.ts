import { describe, expect, it } from "vitest";
import { canonicalize, hashValue, interpolate } from "./utils.js";

describe("utils", () => {
  it("interpolates {{var}} placeholders", () => {
    expect(interpolate("{{a}}-{{b}}", { a: "x", b: 2 })).toBe("x-2");
    expect(interpolate("{{missing}}", {})).toBe("");
  });

  it("canonicalizes independently of key order and hashes stably", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
    expect(hashValue({ a: 1 })).toBe(hashValue({ a: 1 }));
    expect(hashValue({ a: 1 })).not.toBe(hashValue({ a: 2 }));
  });
});
