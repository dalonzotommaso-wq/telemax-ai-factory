/** The immutable execution context threaded through a workflow run. */
import type { StructuredValue } from "@telemax/knowledge";
import type { WorkflowId, WorkflowState } from "../types.js";

export interface WorkflowContext {
  readonly workflowId: WorkflowId;
  readonly runId: string;
  readonly state: WorkflowState;
  readonly variables: Readonly<Record<string, StructuredValue>>;
  readonly outputs: Readonly<Record<string, StructuredValue>>;
  readonly metadata: Readonly<Record<string, string>>;
}

/** Create an initial context. */
export function createContext(
  workflowId: WorkflowId,
  runId: string,
  variables: Readonly<Record<string, StructuredValue>> = {},
): WorkflowContext {
  return { workflowId, runId, state: "pending", variables, outputs: {}, metadata: {} };
}

/** Return a copy with a variable set. */
export function withVariable(
  context: WorkflowContext,
  key: string,
  value: StructuredValue,
): WorkflowContext {
  return { ...context, variables: { ...context.variables, [key]: value } };
}

/** Return a copy with a step output recorded. */
export function withOutput(
  context: WorkflowContext,
  key: string,
  value: StructuredValue,
): WorkflowContext {
  return { ...context, outputs: { ...context.outputs, [key]: value } };
}

/** Return a copy with a new lifecycle state. */
export function withState(context: WorkflowContext, state: WorkflowState): WorkflowContext {
  return { ...context, state };
}
