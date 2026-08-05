/**
 * {@link WorkflowRegistry} — stores compiled {@link Workflow}s with version
 * history; resolves subworkflow references.
 */
import { err, ok, type Result } from "@telemax/core";
import type { Workflow } from "./domain/definition.js";
import { WorkflowNotFoundError, type WorkflowError } from "./errors.js";
import type { WorkflowId } from "./types.js";
import { systemClock, type Clock } from "./utils.js";

/** A version snapshot of a workflow. */
export interface WorkflowVersion {
  readonly workflowId: WorkflowId;
  readonly version: number;
  readonly signature: string;
  readonly checksum: string;
  readonly createdAt: string;
}

export class WorkflowRegistry {
  private readonly workflows = new Map<string, Workflow>();
  private readonly history = new Map<string, WorkflowVersion[]>();

  public constructor(
    private readonly enableVersioning = true,
    private readonly clock: Clock = systemClock,
  ) {}

  public save(workflow: Workflow): void {
    if (this.enableVersioning) {
      const snapshots = this.history.get(workflow.id) ?? [];
      snapshots.push({
        workflowId: workflow.id,
        version: workflow.version,
        signature: workflow.signature,
        checksum: workflow.checksum,
        createdAt: this.clock.now().toISOString(),
      });
      this.history.set(workflow.id, snapshots);
    }
    this.workflows.set(workflow.id, workflow);
  }

  public get(id: WorkflowId): Result<Workflow, WorkflowError> {
    const found = this.workflows.get(id);
    return found === undefined
      ? err(new WorkflowNotFoundError(`Workflow "${id}" not found.`))
      : ok(found);
  }

  public has(id: WorkflowId): boolean {
    return this.workflows.has(id);
  }

  public resolve(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  public list(): readonly Workflow[] {
    return [...this.workflows.values()];
  }

  public versions(id: WorkflowId): readonly WorkflowVersion[] {
    return this.history.get(id) ?? [];
  }
}
