import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { GeneratorValidator } from "./validator.js";
import type { GeneratorDefinition } from "./domain/definition.js";
import type { GeneratorStep } from "./domain/step.js";

const validator = new GeneratorValidator();

function def(steps: readonly GeneratorStep[], id = "gen"): GeneratorDefinition {
  return { id, name: "Gen", pipeline: { steps } };
}

describe("GeneratorValidator", () => {
  it("accepts a well-formed generator", () => {
    const result = validator.validate(
      def([{ id: "t", kind: "template", templateId: "tpl", path: "out.txt" }]),
    );
    expect(isOk(result)).toBe(true);
  });

  it("rejects an empty pipeline", () => {
    expect(isErr(validator.validate(def([])))).toBe(true);
  });

  it("rejects duplicate step ids", () => {
    const result = validator.validate(
      [
        { id: "d", kind: "emit", path: "a", content: "x" },
        { id: "d", kind: "emit", path: "b", content: "y" },
      ].reduce<GeneratorDefinition>((_acc, _s, _i, arr) => def(arr as GeneratorStep[]), def([])),
    );
    expect(isErr(result)).toBe(true);
  });

  it("rejects malformed steps", () => {
    expect(isErr(validator.validate(def([{ id: "e", kind: "emit", path: "" }])))).toBe(true);
    expect(
      isErr(validator.validate(def([{ id: "tr", kind: "transform", transform: "", output: "" }]))),
    ).toBe(true);
    expect(isErr(validator.validate(def([{ id: "a", kind: "ai", output: "" }])))).toBe(true);
  });
});
