import { isErr, ServiceContainer } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { registerWorkflowEngine, WORKFLOW_ENGINE, WORKFLOW_HANDLERS } from "./di.js";
import { WorkflowEngine } from "./engine.js";

describe("registerWorkflowEngine", () => {
  it("wires the engine into the container", () => {
    const container = new ServiceContainer();
    const engine = registerWorkflowEngine(container);
    expect(engine).toBeInstanceOf(WorkflowEngine);
    expect(container.resolve(WORKFLOW_ENGINE)).toBe(engine);
    expect(container.has(WORKFLOW_HANDLERS)).toBe(true);
  });

  it("runs a workflow through the wired engine", async () => {
    const engine = registerWorkflowEngine(new ServiceContainer());
    engine.registerWorkflow({
      id: "wf",
      name: "wf",
      root: { id: "t", kind: "task", handler: "echo", input: { ok: true }, output: "out" },
    });
    const result = await engine.run("wf");
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.output["out"]).toEqual({ ok: true });
  });
});
