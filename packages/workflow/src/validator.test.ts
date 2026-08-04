import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { WorkflowValidator } from "./validator.js";
import type { WorkflowDefinition } from "./domain/definition.js";

const validator = new WorkflowValidator();

function def(root: WorkflowDefinition["root"], id = "wf"): WorkflowDefinition {
  return { id, name: "WF", root };
}

describe("WorkflowValidator", () => {
  it("accepts a well-formed workflow", () => {
    const result = validator.validate(
      def({ id: "root", kind: "sequence", steps: [{ id: "t", kind: "task", handler: "noop" }] }),
    );
    expect(isOk(result)).toBe(true);
  });

  it("rejects duplicate step ids", () => {
    const result = validator.validate(
      def({
        id: "root",
        kind: "sequence",
        steps: [
          { id: "dup", kind: "task", handler: "noop" },
          { id: "dup", kind: "task", handler: "noop" },
        ],
      }),
    );
    expect(isErr(result)).toBe(true);
  });

  it("rejects a task without a handler and a loop without iterations", () => {
    expect(isErr(validator.validate(def({ id: "t", kind: "task", handler: "" })))).toBe(true);
    expect(
      isErr(
        validator.validate(
          def({
            id: "l",
            kind: "loop",
            maxIterations: 0,
            body: [{ id: "b", kind: "task", handler: "noop" }],
          }),
        ),
      ),
    ).toBe(true);
  });

  it("rejects an empty id", () => {
    expect(isErr(validator.validate(def({ id: "t", kind: "task", handler: "noop" }, "")))).toBe(
      true,
    );
  });
});
