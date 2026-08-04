import { describe, expect, it } from "vitest";
import { DefaultConditionEvaluator } from "./evaluator.js";
import { createContext, withVariable } from "../domain/context.js";
import { asWorkflowId } from "../types.js";

const base = createContext(asWorkflowId("w"), "r");
const evaluator = new DefaultConditionEvaluator();

describe("DefaultConditionEvaluator", () => {
  it("evaluates always/var-truthy/var-equals", () => {
    expect(evaluator.evaluate({ kind: "always" }, base)).toBe(true);
    const ctx = withVariable(withVariable(base, "flag", true), "n", 5);
    expect(evaluator.evaluate({ kind: "var-truthy", variable: "flag" }, ctx)).toBe(true);
    expect(evaluator.evaluate({ kind: "var-truthy", variable: "missing" }, ctx)).toBe(false);
    expect(evaluator.evaluate({ kind: "var-equals", variable: "n", value: 5 }, ctx)).toBe(true);
    expect(evaluator.evaluate({ kind: "var-equals", variable: "n", value: 6 }, ctx)).toBe(false);
  });

  it("evaluates not/all/any", () => {
    const ctx = withVariable(base, "flag", true);
    expect(evaluator.evaluate({ kind: "not", condition: { kind: "always" } }, ctx)).toBe(false);
    expect(
      evaluator.evaluate(
        { kind: "all", conditions: [{ kind: "always" }, { kind: "var-truthy", variable: "flag" }] },
        ctx,
      ),
    ).toBe(true);
    expect(
      evaluator.evaluate(
        {
          kind: "any",
          conditions: [{ kind: "var-truthy", variable: "missing" }, { kind: "always" }],
        },
        ctx,
      ),
    ).toBe(true);
  });
});
