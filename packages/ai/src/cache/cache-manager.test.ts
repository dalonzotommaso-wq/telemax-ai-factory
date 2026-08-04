import { describe, expect, it } from "vitest";
import { InMemoryResponseCache } from "./cache-manager.js";
import type { AIResponse } from "../domain/response.js";
import { asModelId, asProviderId } from "../types.js";

function response(id: string): AIResponse {
  return {
    requestId: id,
    providerId: asProviderId("stub"),
    modelId: asModelId("m1"),
    content: id,
    finishReason: "stop",
    usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    cost: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("InMemoryResponseCache", () => {
  it("stores, retrieves and evicts FIFO", () => {
    const cache = new InMemoryResponseCache(2);
    cache.set("a", response("a"));
    cache.set("b", response("b"));
    cache.set("c", response("c"));
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")?.content).toBe("b");
    expect(cache.get("c")?.content).toBe("c");
    cache.clear();
    expect(cache.get("b")).toBeUndefined();
  });
});
