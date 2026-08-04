import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { WorkflowCompiler } from "./compiler.js";
import { WorkflowRegistry } from "./registry.js";
import type { WorkflowDefinition } from "./domain/definition.js";
import { asWorkflowId } from "./types.js";

function compiled(id: string) {
  const result = new WorkflowCompiler().compile({
    id,
    name: id,
    root: { id: "root", kind: "task", handler: "noop" },
  } satisfies WorkflowDefinition);
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
}

describe("WorkflowRegistry", () => {
  it("saves, resolves and lists workflows with version history", () => {
    const registry = new WorkflowRegistry();
    registry.save(compiled("wf"));
    expect(registry.has(asWorkflowId("wf"))).toBe(true);
    expect(isOk(registry.get(asWorkflowId("wf")))).toBe(true);
    expect(registry.resolve("wf")).toBeDefined();
    expect(registry.list()).toHaveLength(1);
    expect(registry.versions(asWorkflowId("wf"))).toHaveLength(1);
  });

  it("fails to resolve an unknown workflow", () => {
    expect(isErr(new WorkflowRegistry().get(asWorkflowId("ghost")))).toBe(true);
  });
});
