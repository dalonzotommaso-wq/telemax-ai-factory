import { describe, expect, it } from "vitest";
import { InMemoryResultCache } from "./cache.js";
import { ArtifactCollection } from "./domain/artifact.js";
import type { GeneratorResult } from "./domain/result.js";
import { asGeneratorId } from "./types.js";

function result(id: string): GeneratorResult {
  return {
    generatorId: asGeneratorId(id),
    runId: id,
    state: "completed",
    artifacts: new ArtifactCollection(),
    variables: {},
    durationMs: 1,
  };
}

describe("InMemoryResultCache", () => {
  it("stores, retrieves and evicts FIFO", () => {
    const cache = new InMemoryResultCache(2);
    cache.set("a", result("a"));
    cache.set("b", result("b"));
    cache.set("c", result("c"));
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")?.runId).toBe("c");
    cache.clear();
    expect(cache.get("b")).toBeUndefined();
  });
});
