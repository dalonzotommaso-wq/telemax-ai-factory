/** Execution context and result value objects. */
import type { Context } from "./context.js";
import type { PreparedRequest } from "./request.js";
import type { AIResponse } from "./response.js";

/** Per-attempt execution context threaded through the execution pipeline. */
export interface ExecutionContext {
  readonly requestId: string;
  readonly startedAt: string;
  readonly attempt: number;
  readonly metadata: Readonly<Record<string, string>>;
}

/** The full outcome of an orchestrated request. */
export interface ExecutionResult {
  readonly response: AIResponse;
  readonly context: Context;
  readonly prepared: PreparedRequest;
  readonly durationMs: number;
  readonly attempts: number;
}
