/**
 * {@link WorkflowCompiler} — validates a {@link WorkflowDefinition} and compiles it
 * into an immutable {@link Workflow} (checksum + version signature). Compilation
 * is separate from execution.
 */
import { isErr, ok, type Result } from "@telemax/core";
import { createWorkflowMetadata } from "./domain/metadata.js";
import { Workflow, type WorkflowDefinition } from "./domain/definition.js";
import type { WorkflowError } from "./errors.js";
import { asWorkflowId } from "./types.js";
import { WorkflowValidator } from "./validator.js";
import { systemClock, type Clock } from "./utils.js";

export class WorkflowCompiler {
  public constructor(
    private readonly validator: WorkflowValidator = new WorkflowValidator(),
    private readonly clock: Clock = systemClock,
    private readonly defaultLanguage = "en",
  ) {}

  public compile(definition: WorkflowDefinition): Result<Workflow, WorkflowError> {
    const validated = this.validator.validate(definition);
    if (isErr(validated)) {
      return validated;
    }
    const now = this.clock.now().toISOString();
    const metadata = createWorkflowMetadata(definition.metadata ?? {}, now, this.defaultLanguage);
    const workflow = Workflow.create({
      id: asWorkflowId(definition.id),
      name: definition.name,
      version: definition.version ?? 1,
      root: definition.root,
      onFailure: definition.onFailure ?? "halt",
      metadata,
    });
    return ok(workflow);
  }
}
