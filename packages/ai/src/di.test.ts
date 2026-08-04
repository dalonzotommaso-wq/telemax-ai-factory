import { isErr, ServiceContainer } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { AI_ORCHESTRATOR, AI_PROVIDER_REGISTRY, registerAIOrchestrator } from "./di.js";
import { AIOrchestrator } from "./orchestrator.js";
import { StubProvider } from "./providers/stub-provider.js";
import { DEFAULT_CAPABILITIES } from "./domain/capabilities.js";
import { asModelId, asProviderId } from "./types.js";

describe("registerAIOrchestrator", () => {
  it("wires the orchestrator and collaborators into the container", () => {
    const container = new ServiceContainer();
    const orchestrator = registerAIOrchestrator(container);
    expect(orchestrator).toBeInstanceOf(AIOrchestrator);
    expect(container.resolve(AI_ORCHESTRATOR)).toBe(orchestrator);
    expect(container.has(AI_PROVIDER_REGISTRY)).toBe(true);
  });

  it("executes end-to-end once a provider and model are registered", async () => {
    const orchestrator = registerAIOrchestrator(new ServiceContainer());
    orchestrator.registerProvider(new StubProvider());
    orchestrator.registerModel({
      id: asModelId("m1"),
      providerId: asProviderId("stub"),
      displayName: "M1",
      capabilities: DEFAULT_CAPABILITIES,
      contextWindow: 8192,
      pricing: { inputPer1kTokens: 1, outputPer1kTokens: 2 },
    });
    const result = await orchestrator.execute({ input: "ping" });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.response.content).toContain("ping");
  });
});
