/**
 * Declarative, serializable conditions evaluated against a {@link WorkflowContext}.
 * Recursive shapes use interfaces (per lint rules).
 */
import type { StructuredValue } from "@telemax/knowledge";

export interface AlwaysCondition {
  readonly kind: "always";
}
export interface VarTruthyCondition {
  readonly kind: "var-truthy";
  readonly variable: string;
}
export interface VarEqualsCondition {
  readonly kind: "var-equals";
  readonly variable: string;
  readonly value: StructuredValue;
}
export interface NotCondition {
  readonly kind: "not";
  readonly condition: Condition;
}
export interface AllCondition {
  readonly kind: "all";
  readonly conditions: readonly Condition[];
}
export interface AnyCondition {
  readonly kind: "any";
  readonly conditions: readonly Condition[];
}

/** A condition is one of the declarative shapes above. */
export type Condition =
  | AlwaysCondition
  | VarTruthyCondition
  | VarEqualsCondition
  | NotCondition
  | AllCondition
  | AnyCondition;
