/** {@link ExportManager} — serializes workflow definitions into a portable bundle. */
import type { WorkflowDefinition } from "./domain/definition.js";
import { systemClock, type Clock } from "./utils.js";

/** A portable workflow bundle (schema version 1). */
export interface WorkflowBundle {
  readonly version: 1;
  readonly exportedAt: string;
  readonly workflows: readonly WorkflowDefinition[];
}

export class ExportManager {
  public constructor(private readonly clock: Clock = systemClock) {}

  public export(definitions: readonly WorkflowDefinition[]): WorkflowBundle {
    return {
      version: 1,
      exportedAt: this.clock.now().toISOString(),
      workflows: [...definitions],
    };
  }
}
