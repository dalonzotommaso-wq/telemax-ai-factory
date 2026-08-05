/** The execution context threaded through a generation run. */
import type { StructuredValue } from "@telemax/knowledge";
import type { GeneratorId } from "../types.js";

export interface GeneratorContext {
  readonly generatorId: GeneratorId;
  readonly runId: string;
  readonly target: string;
  readonly variables: Readonly<Record<string, StructuredValue>>;
  readonly metadata: Readonly<Record<string, string>>;
}

/** Create an initial context. */
export function createContext(
  generatorId: GeneratorId,
  runId: string,
  target: string,
  variables: Readonly<Record<string, StructuredValue>> = {},
): GeneratorContext {
  return { generatorId, runId, target, variables, metadata: {} };
}

/** Return a copy with a variable set. */
export function withVariable(
  context: GeneratorContext,
  key: string,
  value: StructuredValue,
): GeneratorContext {
  return { ...context, variables: { ...context.variables, [key]: value } };
}
