/**
 * Workflow step tree. A step is a discriminated union enabling sequential,
 * parallel, conditional and iterative composition, plus subworkflow references
 * (composability). `approval` and `tool` are prepared.
 */
import type { StructuredObject } from "@telemax/knowledge";
import type { Condition } from "./condition.js";
import type { RetryPolicy, RollbackSpec, TimeoutPolicy } from "./policy.js";

/** Fields shared by every step. */
export interface BaseStep {
  readonly id: string;
  readonly name?: string;
  readonly retry?: RetryPolicy;
  readonly timeout?: TimeoutPolicy;
  readonly rollback?: RollbackSpec;
}

/** Runs a registered handler; optionally stores its output in a variable. */
export interface TaskStep extends BaseStep {
  readonly kind: "task";
  readonly handler: string;
  readonly input?: StructuredObject;
  readonly output?: string;
}

/** Runs child steps in order. */
export interface SequenceStep extends BaseStep {
  readonly kind: "sequence";
  readonly steps: readonly WorkflowStep[];
}

/** Runs child branches concurrently and joins them. */
export interface ParallelStep extends BaseStep {
  readonly kind: "parallel";
  readonly branches: readonly WorkflowStep[];
}

/** Evaluates a condition and runs `then` or `otherwise`. */
export interface BranchStep extends BaseStep {
  readonly kind: "branch";
  readonly condition: Condition;
  readonly then: readonly WorkflowStep[];
  readonly otherwise?: readonly WorkflowStep[];
}

/** Repeats a body while a condition holds, bounded by `maxIterations`. */
export interface LoopStep extends BaseStep {
  readonly kind: "loop";
  readonly maxIterations: number;
  readonly body: readonly WorkflowStep[];
  readonly condition?: Condition;
}

/** Runs another registered workflow (composability). */
export interface SubworkflowStep extends BaseStep {
  readonly kind: "subworkflow";
  readonly workflowId: string;
  readonly input?: StructuredObject;
  readonly output?: string;
}

/** Prepared: waits for human approval. */
export interface ApprovalStep extends BaseStep {
  readonly kind: "approval";
  readonly prompt: string;
}

/** Prepared: invokes a tool / function / MCP endpoint. */
export interface ToolStep extends BaseStep {
  readonly kind: "tool";
  readonly tool: string;
  readonly input?: StructuredObject;
  readonly output?: string;
}

/** Any workflow step. */
export type WorkflowStep =
  | TaskStep
  | SequenceStep
  | ParallelStep
  | BranchStep
  | LoopStep
  | SubworkflowStep
  | ApprovalStep
  | ToolStep;
