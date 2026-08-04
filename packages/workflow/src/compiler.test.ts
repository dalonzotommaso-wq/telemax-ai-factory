import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { WorkflowCompiler } from "./compiler.js";
import type { WorkflowDefinition } from "./domain/definition.js";

const compiler = new WorkflowCompiler();

const good: WorkflowDefinition = {
  id: "wf",
  name: "WF",
  root: { id: "root", kind: "task", handler: "noop" },
};

describe("WorkflowCompiler", () => {
  it("compiles a valid definition with checksum and signature", () => {
    const result = compiler.compile(good);
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.id).toBe("wf");
    expect(result.value.version).toBe(1);
    expect(result.value.signature.length).toBeGreaterThan(0);
    expect(result.value.checksum.length).toBeGreaterThan(0);
  });

  it("fails to compile an invalid definition", () => {
    expect(isErr(compiler.compile({ id: "", name: "", root: good.root }))).toBe(true);
  });
});
