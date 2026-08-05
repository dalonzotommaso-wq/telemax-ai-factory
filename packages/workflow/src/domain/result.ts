/** Step and workflow result value objects. */
import type { StructuredValue } from "@telemax/knowledge";
import type { StepKind, StepState, WorkflowId, WorkflowState } from "../types.js";

/** The outcome of a single step. */
export interface StepResult {
  readonly stepId: string;
  readonly kind: StepKind;
  readonly state: StepState;
  readonly attempts: number;
  readonly durationMs: number;
  readonly output?: StructuredValue;
  readonly error?: string;
}

/** The outcome of a workflow run. */
export interface WorkflowResult {
  readonly workflowId: WorkflowId;
  readonly runId: string;
  readonly state: WorkflowState;
  readonly output: Readonly<Record<string, StructuredValue>>;
  readonly steps: readonly StepResult[];
  readonly durationMs: number;
  readonly error?: string;
}
