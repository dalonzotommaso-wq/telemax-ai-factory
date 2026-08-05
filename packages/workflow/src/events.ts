/**
 * Event-driven layer. Reuses the generic {@link EventBus} contract from
 * `@telemax/knowledge` and provides a typed in-memory bus for workflow events.
 */
import type { EventBus, EventHandler } from "@telemax/knowledge";
import type { WorkflowError } from "./errors.js";
import type { StepKind, WorkflowId, WorkflowState } from "./types.js";

/** Map of workflow event name to payload type. */
export interface WorkflowEvents {
  "workflow.registered": { readonly workflowId: WorkflowId; readonly version: number };
  "workflow.started": { readonly workflowId: WorkflowId; readonly runId: string };
  "workflow.completed": {
    readonly workflowId: WorkflowId;
    readonly runId: string;
    readonly state: WorkflowState;
  };
  "workflow.failed": {
    readonly workflowId: WorkflowId;
    readonly runId: string;
    readonly error: WorkflowError;
  };
  "workflow.rolledback": { readonly workflowId: WorkflowId; readonly runId: string };
  "step.started": { readonly runId: string; readonly stepId: string; readonly kind: StepKind };
  "step.completed": { readonly runId: string; readonly stepId: string };
  "step.failed": { readonly runId: string; readonly stepId: string; readonly error: WorkflowError };
  "step.retried": { readonly runId: string; readonly stepId: string; readonly attempt: number };
  "branch.evaluated": { readonly runId: string; readonly stepId: string; readonly result: boolean };
  "loop.iteration": { readonly runId: string; readonly stepId: string; readonly iteration: number };
  "parallel.joined": { readonly runId: string; readonly stepId: string; readonly branches: number };
  "import.completed": { readonly imported: number };
  "export.completed": { readonly exported: number };
  "workflow.scheduled": { readonly workflowId: WorkflowId; readonly scheduleId: string };
}

export type { EventBus, EventHandler } from "@telemax/knowledge";

/** In-memory, typed workflow event bus. */
export class WorkflowEventBus implements EventBus<WorkflowEvents> {
  private readonly handlers = new Map<keyof WorkflowEvents, Set<EventHandler<unknown>>>();

  public on<K extends keyof WorkflowEvents>(
    event: K,
    handler: EventHandler<WorkflowEvents[K]>,
  ): () => void {
    const set = this.handlers.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.handlers.set(event, set);
    return (): void => {
      this.off(event, handler);
    };
  }

  public off<K extends keyof WorkflowEvents>(
    event: K,
    handler: EventHandler<WorkflowEvents[K]>,
  ): void {
    this.handlers.get(event)?.delete(handler as EventHandler<unknown>);
  }

  public emit<K extends keyof WorkflowEvents>(event: K, payload: WorkflowEvents[K]): void {
    const set = this.handlers.get(event);
    if (set === undefined) {
      return;
    }
    for (const handler of set) {
      handler(payload);
    }
  }
}
