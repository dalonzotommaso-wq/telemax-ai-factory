import { describe, expect, it, vi } from "vitest";
import { WorkflowEventBus } from "./events.js";
import { asWorkflowId } from "./types.js";

describe("WorkflowEventBus", () => {
  it("delivers events and supports unsubscribe", () => {
    const bus = new WorkflowEventBus();
    const handler = vi.fn();
    const off = bus.on("workflow.started", handler);
    bus.emit("workflow.started", { workflowId: asWorkflowId("w"), runId: "r1" });
    expect(handler).toHaveBeenCalledTimes(1);
    off();
    bus.emit("workflow.started", { workflowId: asWorkflowId("w"), runId: "r2" });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
