/**
 * Prepared data types for advanced capabilities: Human Approval, Tool/Function
 * calling, MCP, Multi-Agent and Distributed workflows. Shapes only — no behavior.
 */
import type { StructuredObject } from "@telemax/knowledge";

/** Prepared: a human-approval request. */
export interface ApprovalRequest {
  readonly stepId: string;
  readonly prompt: string;
}

/** Prepared: a tool/MCP invocation. */
export interface ToolCall {
  readonly tool: string;
  readonly input: StructuredObject;
}

/** Prepared: a function call. */
export interface FunctionCall {
  readonly name: string;
  readonly arguments: StructuredObject;
}

/** Prepared: a reference to an agent in a multi-agent workflow. */
export interface AgentRef {
  readonly agentId: string;
  readonly role?: string;
}

/** Prepared: a distributed execution plan. */
export interface DistributedPlan {
  readonly nodes: readonly string[];
}
