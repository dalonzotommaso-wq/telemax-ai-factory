/** Per-step resilience policies (data). */
import type { StructuredValue } from "@telemax/knowledge";

/** Retry policy for a step. */
export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs?: number;
}

/** Timeout policy for a step. */
export interface TimeoutPolicy {
  readonly timeoutMs: number;
}

/** Compensating action to run when rolling back a step. */
export interface RollbackSpec {
  readonly handler: string;
  readonly input?: Readonly<Record<string, StructuredValue>>;
}

/** Workflow-level rollback policy. */
export interface RollbackPolicy {
  readonly mode: "rollback" | "halt";
}
