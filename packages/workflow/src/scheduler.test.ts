import { describe, expect, it } from "vitest";
import { WorkflowScheduler } from "./scheduler.js";
import { asWorkflowId } from "./types.js";

describe("WorkflowScheduler", () => {
  it("schedules, lists, filters due and removes", () => {
    const scheduler = new WorkflowScheduler();
    scheduler.schedule({
      id: "s1",
      workflowId: asWorkflowId("wf"),
      runAt: "2026-01-01T00:00:00.000Z",
    });
    scheduler.schedule({
      id: "s2",
      workflowId: asWorkflowId("wf"),
      runAt: "2999-01-01T00:00:00.000Z",
    });
    expect(scheduler.list()).toHaveLength(2);
    expect(scheduler.get("s1")).toBeDefined();
    const due = scheduler.due("2026-06-01T00:00:00.000Z");
    expect(due).toHaveLength(1);
    expect(due[0]?.id).toBe("s1");
    scheduler.remove("s1");
    expect(scheduler.get("s1")).toBeUndefined();
  });
});
