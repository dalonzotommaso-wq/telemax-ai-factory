import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { AIProviderRegistry } from "./provider-registry.js";
import { StubProvider } from "./stub-provider.js";
import { asProviderId } from "../types.js";

describe("AIProviderRegistry", () => {
  it("registers, resolves, checks and lists providers", () => {
    const registry = new AIProviderRegistry();
    registry.register(new StubProvider({ id: "a" }));
    expect(isOk(registry.get(asProviderId("a")))).toBe(true);
    expect(registry.has(asProviderId("a"))).toBe(true);
    expect(registry.list()).toHaveLength(1);
  });

  it("fails to resolve an unknown provider", () => {
    expect(isErr(new AIProviderRegistry().get(asProviderId("ghost")))).toBe(true);
  });
});
