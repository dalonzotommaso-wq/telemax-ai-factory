/**
 * Behavioral contracts (ports) for the Workflow Engine. The engine and executor
 * depend only on these abstractions; adapters implement them. Prepared ports
 * (approval, tools, distributed) return `NotImplemented` by default.
 */
import type { Result } from "@telemax/core";
import type { StructuredObject, StructuredValue } from "@telemax/knowledge";
import type { Condition } from "./domain/condition.js";
import type { WorkflowContext } from "./domain/context.js";
import type { ApprovalRequest, ToolCall } from "./domain/advanced.js";
import type { WorkflowError } from "./errors.js";

/** Executes a task step: maps an input object to a structured output. */
export type StepHandler = (
  input: StructuredObject,
  context: WorkflowContext,
) => Promise<Result<StructuredValue, WorkflowError>>;

/** Evaluates a declarative {@link Condition} against a context. */
export interface ConditionEvaluator {
  evaluate(condition: Condition, context: WorkflowContext): boolean;
}

/** A metrics sink for counters and observations. */
export interface MetricsSink {
  increment(name: string, value?: number): void;
  observe(name: string, value: number): void;
}

/** Prepared: gateway for human-approval steps. */
export interface HumanApprovalGateway {
  request(
    approval: ApprovalRequest,
    context: WorkflowContext,
  ): Promise<Result<boolean, WorkflowError>>;
}

/** Prepared: invoker for tool/function/MCP steps. */
export interface ToolInvoker {
  invoke(call: ToolCall, context: WorkflowContext): Promise<Result<StructuredValue, WorkflowError>>;
}

/** Prepared: submits a workflow for distributed execution. */
export interface DistributedExecutor {
  submit(workflowId: string, input: StructuredObject): Promise<Result<string, WorkflowError>>;
}
