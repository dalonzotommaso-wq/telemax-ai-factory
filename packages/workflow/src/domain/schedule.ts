/** Schedule entry (basic in-memory scheduling; cron/distributed prepared). */
import type { StructuredObject } from "@telemax/knowledge";
import type { WorkflowId } from "../types.js";

export interface ScheduleEntry {
  readonly id: string;
  readonly workflowId: WorkflowId;
  readonly input?: StructuredObject;
  /** ISO timestamp for a one-shot run; omit for manual trigger. */
  readonly runAt?: string;
  /** Prepared: cron expression for recurring/distributed scheduling. */
  readonly cron?: string;
}
