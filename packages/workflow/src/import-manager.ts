/** {@link ImportManager} — re-registers workflows from a {@link WorkflowBundle}. */
import { err, isErr, ok, type Result } from "@telemax/core";
import type { Workflow, WorkflowDefinition } from "./domain/definition.js";
import { WorkflowIoError, type WorkflowError } from "./errors.js";
import type { WorkflowBundle } from "./export-manager.js";

export class ImportManager {
  public constructor(
    private readonly register: (definition: WorkflowDefinition) => Result<Workflow, WorkflowError>,
  ) {}

  public import(bundle: WorkflowBundle): Result<readonly Workflow[], WorkflowError> {
    if (bundle.version !== 1) {
      return err(new WorkflowIoError(`Unsupported bundle version: ${String(bundle.version)}.`));
    }
    const saved: Workflow[] = [];
    for (const definition of bundle.workflows) {
      const result = this.register(definition);
      if (isErr(result)) {
        return result;
      }
      saved.push(result.value);
    }
    return ok(saved);
  }
}
