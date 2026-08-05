import { isErr, ServiceContainer } from "@telemax/core";
import {
  AIOrchestrator,
  StubProvider,
  DEFAULT_CAPABILITIES,
  asModelId,
  asProviderId,
} from "@telemax/ai";
import { registerPromptEngine } from "@telemax/prompt-engine";
import { describe, expect, it } from "vitest";
import { aiStepHandler, promptStepHandler } from "./adapters.js";
import { createContext } from "../domain/context.js";
import { asWorkflowId } from "../types.js";

const ctx = createContext(asWorkflowId("w"), "r");

function orchestrator(): AIOrchestrator {
  const orch = new AIOrchestrator();
  orch.registerProvider(new StubProvider());
  orch.registerModel({
    id: asModelId("m1"),
    providerId: asProviderId("stub"),
    displayName: "M1",
    capabilities: DEFAULT_CAPABILITIES,
    contextWindow: 8192,
    pricing: { inputPer1kTokens: 1, outputPer1kTokens: 2 },
  });
  return orch;
}

describe("adapters", () => {
  it("aiStepHandler coordinates the AI Orchestrator", async () => {
    const handler = aiStepHandler(orchestrator());
    const result = await handler({ input: "hello" }, ctx);
    if (isErr(result)) {
      throw result.error;
    }
    const value = result.value;
    expect(typeof value === "string" && value.includes("hello")).toBe(true);
  });

  it("promptStepHandler renders a template", async () => {
    const engine = registerPromptEngine(new ServiceContainer());
    await engine.registerTemplate({ id: "greet", name: "greet", body: "Hi {{name}}" });
    const handler = promptStepHandler(engine);
    const result = await handler({ templateId: "greet", variables: { name: "Ada" } }, ctx);
    if (isErr(result)) {
      throw result.error;
    }
    const value = result.value;
    expect(typeof value === "string" && value.includes("Hi Ada")).toBe(true);
  });
});
