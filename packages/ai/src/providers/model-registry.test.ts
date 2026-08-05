import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { ModelRegistry } from "./model-registry.js";
import { DEFAULT_CAPABILITIES } from "../domain/capabilities.js";
import type { ModelDescriptor } from "../domain/model.js";
import { asModelId, asProviderId } from "../types.js";

function model(id: string, provider: string): ModelDescriptor {
  return {
    id: asModelId(id),
    providerId: asProviderId(provider),
    displayName: id,
    capabilities: DEFAULT_CAPABILITIES,
    contextWindow: 8192,
    pricing: { inputPer1kTokens: 1, outputPer1kTokens: 2 },
  };
}

describe("ModelRegistry", () => {
  it("registers, resolves and lists models", () => {
    const registry = new ModelRegistry();
    registry.register(model("m1", "p1"));
    registry.register(model("m2", "p2"));
    expect(isOk(registry.get(asModelId("m1")))).toBe(true);
    expect(registry.list()).toHaveLength(2);
    expect(registry.listByProvider(asProviderId("p1"))).toHaveLength(1);
  });

  it("fails to resolve an unknown model", () => {
    expect(isErr(new ModelRegistry().get(asModelId("ghost")))).toBe(true);
  });
});
