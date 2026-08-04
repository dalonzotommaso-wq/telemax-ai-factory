/**
 * Core value types for the Workflow Engine. Pure data only; behavioral contracts
 * live in {@link file://./interfaces.ts}.
 */
import type { Branded } from "@telemax/core";

/** Nominal identifier for a workflow. */
export type WorkflowId = Branded<string, "WorkflowId">;

/** Lifecycle state of a workflow run. */
export type WorkflowState =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "rolled-back"
  | "cancelled";

/** Lifecycle state of a single step. */
export type StepState = "pending" | "running" | "completed" | "failed" | "skipped" | "rolled-back";

/** Kinds of workflow step. `approval` and `tool` are prepared. */
export type StepKind =
  | "task"
  | "sequence"
  | "parallel"
  | "branch"
  | "loop"
  | "subworkflow"
  | "approval"
  | "tool";

/** Kinds of condition supported by the evaluator. */
export type ConditionKind = "always" | "var-truthy" | "var-equals" | "not" | "all" | "any";

/** What to do when a workflow step fails. */
export type FailureMode = "rollback" | "halt";

/** Brand a raw string as a {@link WorkflowId}. */
export function asWorkflowId(value: string): WorkflowId {
  return value as WorkflowId;
}
