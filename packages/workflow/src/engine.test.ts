import { isErr } from "@telemax/core";
import {
  AIOrchestrator,
  StubProvider,
  DEFAULT_CAPABILITIES,
  asModelId,
  asProviderId,
} from "@telemax/ai";
import { describe, expect, it } from "vitest";
import { WorkflowEngine } from "./engine.js";
import type { WorkflowDefinition } from "./domain/definition.js";

function seqDef(): WorkflowDefinition {
  return {
    id: "wf-seq",
    name: "Seq",
    root: {
      id: "root",
      kind: "sequence",
      steps: [{ id: "s1", kind: "task", handler: "echo", input: { a: 1 }, output: "first" }],
    },
  };
}

describe("WorkflowEngine", () => {
  it("registers and runs a sequential workflow", async () => {
    const engine = new WorkflowEngine();
    const registered = engine.registerWorkflow(seqDef());
    if (isErr(registered)) {
      throw registered.error;
    }
    const result = await engine.run("wf-seq");
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.state).toBe("completed");
    expect(result.value.output["first"]).toEqual({ a: 1 });
  });

  it("bumps the version when a workflow is re-registered", () => {
    const engine = new WorkflowEngine();
    engine.registerWorkflow(seqDef());
    const second = engine.registerWorkflow(seqDef());
    if (isErr(second)) {
      throw second.error;
    }
    expect(second.value.version).toBe(2);
    expect(engine.getVersions("wf-seq")).toHaveLength(2);
  });

  it("round-trips workflows through export/import", () => {
    const source = new WorkflowEngine();
    source.registerWorkflow(seqDef());
    const bundle = source.exportBundle();
    expect(bundle.workflows).toHaveLength(1);

    const target = new WorkflowEngine();
    const imported = target.importBundle(bundle);
    if (isErr(imported)) {
      throw imported.error;
    }
    expect(isErr(target.getWorkflow("wf-seq"))).toBe(false);
  });

  it("coordinates the AI Orchestrator through a task handler", async () => {
    const engine = new WorkflowEngine();
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
    engine.registerAI("ai", orch);
    engine.registerWorkflow({
      id: "wf-ai",
      name: "AI",
      root: { id: "call", kind: "task", handler: "ai", input: { input: "hi" }, output: "reply" },
    });
    const result = await engine.run("wf-ai");
    if (isErr(result)) {
      throw result.error;
    }
    const reply = result.value.output["reply"];
    expect(typeof reply === "string" && reply.includes("hi")).toBe(true);
  });

  it("errors when running an unknown workflow", async () => {
    expect(isErr(await new WorkflowEngine().run("ghost"))).toBe(true);
  });
});
