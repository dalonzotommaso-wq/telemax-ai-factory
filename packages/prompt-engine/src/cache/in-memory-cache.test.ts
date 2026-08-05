import { describe, expect, it } from "vitest";
import { InMemoryRenderCache } from "./in-memory-cache.js";

describe("InMemoryRenderCache", () => {
  it("stores and retrieves values", () => {
    const cache = new InMemoryRenderCache(4);
    cache.set("k", "v");
    expect(cache.get("k")).toBe("v");
    expect(cache.get("missing")).toBeUndefined();
  });

  it("evicts the oldest entry when full (FIFO)", () => {
    const cache = new InMemoryRenderCache(2);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });

  it("clears all entries", () => {
    const cache = new InMemoryRenderCache(2);
    cache.set("a", "1");
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
  });
});
