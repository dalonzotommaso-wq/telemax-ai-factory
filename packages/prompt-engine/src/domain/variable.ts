/**
 * Template variables and their schema.
 *
 * A {@link VariableSchema} declares the variables a template expects; the
 * schema validator (see `schema/`) checks provided values against it and fills
 * defaults.
 */
import type { StructuredValue } from "@telemax/knowledge";
import type { VariableType } from "../types.js";

/** Declaration of a single template variable. */
export interface VariableDefinition {
  readonly name: string;
  readonly type: VariableType;
  readonly required: boolean;
  readonly description?: string;
  readonly default?: StructuredValue;
  /** Allowed values when `type` is `"enum"`. */
  readonly enumValues?: readonly string[];
}

/** An ordered set of variable declarations. */
export type VariableSchema = readonly VariableDefinition[];

/** Concrete values bound to variables at render time. */
export type VariableValues = Readonly<Record<string, StructuredValue>>;
