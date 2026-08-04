import { isErr, ServiceContainer } from "@telemax/core";
import {
  AIOrchestrator,
  StubProvider,
  DEFAULT_CAPABILITIES,
  asModelId,
  asProviderId,
} from "@telemax/ai";
import { registerPromptEngine } from "@telemax/prompt-engine";
import { WorkflowEngine } from "@telemax/workflow";
import { describe, expect, it } from "vitest";
import { aiRunner, promptRunner, workflowRunner } from "./adapters.js";

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

describe("runner adapters", () => {
  it("workflowRunner coordinates the Workflow Engine", async () => {
    const engine = new WorkflowEngine();
    engine.registerWorkflow({
      id: "wf",
      name: "wf",
      root: { id: "root", kind: "task", handler: "echo", input: { v: 1 }, output: "r" },
    });
    const result = await workflowRunner(engine).run("wf", {});
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value["r"]).toEqual({ v: 1 });
  });

  it("aiRunner coordinates the AI Orchestrator", async () => {
    const result = await aiRunner(orchestrator()).run({ input: "hello" });
    if (isErr(result)) {
      throw result.error;
    }
    const value = result.value;
    expect(typeof value === "string" && value.includes("hello")).toBe(true);
  });

  it("promptRunner coordinates the Prompt Engine", async () => {
    const engine = registerPromptEngine(new ServiceContainer());
    await engine.registerTemplate({ id: "greet", name: "greet", body: "Hi {{name}}" });
    const result = await promptRunner(engine).render("greet", { name: "Ada" });
    if (isErr(result)) {
      throw result.error;
    }
    const value = result.value;
    expect(typeof value === "string" && value.includes("Hi Ada")).toBe(true);
  });
});
