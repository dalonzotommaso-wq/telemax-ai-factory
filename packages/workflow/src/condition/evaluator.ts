/**
 * {@link DefaultConditionEvaluator} — evaluates declarative conditions against a
 * {@link WorkflowContext}, resolving variables from variables then outputs.
 */
import type { StructuredValue } from "@telemax/knowledge";
import { canonicalize } from "../utils.js";
import type { Condition } from "../domain/condition.js";
import type { WorkflowContext } from "../domain/context.js";
import type { ConditionEvaluator } from "../interfaces.js";

export class DefaultConditionEvaluator implements ConditionEvaluator {
  public evaluate(condition: Condition, context: WorkflowContext): boolean {
    switch (condition.kind) {
      case "always":
        return true;
      case "var-truthy":
        return truthy(this.lookup(condition.variable, context));
      case "var-equals": {
        const current = this.lookup(condition.variable, context);
        return current !== undefined && canonicalize(current) === canonicalize(condition.value);
      }
      case "not":
        return !this.evaluate(condition.condition, context);
      case "all":
        return condition.conditions.every((entry) => this.evaluate(entry, context));
      case "any":
        return condition.conditions.some((entry) => this.evaluate(entry, context));
      default:
        return false;
    }
  }

  private lookup(name: string, context: WorkflowContext): StructuredValue | undefined {
    return context.variables[name] ?? context.outputs[name];
  }
}

function truthy(value: StructuredValue | undefined): boolean {
  if (value === undefined || value === null || value === false || value === "" || value === 0) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}
