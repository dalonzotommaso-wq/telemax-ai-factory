import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { DefaultModelSelector, DefaultProviderSelector } from "./selection.js";
import { StubProvider } from "./stub-provider.js";
import { DEFAULT_CAPABILITIES } from "../domain/capabilities.js";
import type { ModelDescriptor } from "../domain/model.js";
import { asModelId, asProviderId } from "../types.js";

const providers = [new StubProvider({ id: "a" }), new StubProvider({ id: "b" })];

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

describe("DefaultProviderSelector", () => {
  it("errors when no providers exist", () => {
    expect(isErr(new DefaultProviderSelector().select([]))).toBe(true);
  });

  it("honors a hint, then falls back to the first", () => {
    const selector = new DefaultProviderSelector();
    const hinted = selector.select(providers, "b");
    if (isErr(hinted)) {
      throw hinted.error;
    }
    expect(hinted.value.id).toBe("b");
    const first = selector.select(providers);
    if (isErr(first)) {
      throw first.error;
    }
    expect(first.value.id).toBe("a");
  });

  it("errors on an unknown hint", () => {
    expect(isErr(new DefaultProviderSelector().select(providers, "z"))).toBe(true);
  });
});

describe("DefaultModelSelector", () => {
  const models = [model("m1", "a"), model("m2", "a"), model("m3", "b")];

  it("selects models for a provider and honors a hint", () => {
    const selector = new DefaultModelSelector();
    const first = selector.select(models, asProviderId("a"));
    if (isErr(first)) {
      throw first.error;
    }
    expect(first.value.id).toBe("m1");
    expect(isOk(selector.select(models, asProviderId("a"), "m2"))).toBe(true);
  });

  it("errors when the provider has no models", () => {
    expect(isErr(new DefaultModelSelector().select(models, asProviderId("zzz")))).toBe(true);
  });
});
