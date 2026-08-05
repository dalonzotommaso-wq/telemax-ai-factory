/**
 * Workflow Engine error hierarchy. All errors extend the Core
 * {@link FrameworkError} (stable `code`, `cause` chaining) and form the
 * {@link WorkflowError} union used as the `E` channel of `Result`.
 */
import { FrameworkError, type FrameworkErrorOptions } from "@telemax/core";

/** A workflow definition failed validation. */
export class WorkflowValidationError extends FrameworkError {
  public readonly code = "ERR_WORKFLOW_VALIDATION";
  public readonly issues: readonly string[];

  public constructor(message: string, issues: readonly string[], options?: FrameworkErrorOptions) {
    super(message, options);
    this.issues = issues;
  }
}

/** A requested workflow or version was not found. */
export class WorkflowNotFoundError extends FrameworkError {
  public readonly code = "ERR_WORKFLOW_NOT_FOUND";
}

/** Registering something that already exists. */
export class WorkflowDuplicateError extends FrameworkError {
  public readonly code = "ERR_WORKFLOW_DUPLICATE";
}

/** A step failed during execution. */
export class StepExecutionError extends FrameworkError {
  public readonly code = "ERR_WORKFLOW_STEP_EXECUTION";
  public readonly stepId: string;

  public constructor(message: string, stepId: string, options?: FrameworkErrorOptions) {
    super(message, options);
    this.stepId = stepId;
  }
}

/** A step exceeded its timeout. */
export class WorkflowTimeoutError extends FrameworkError {
  public readonly code = "ERR_WORKFLOW_TIMEOUT";
}

/** A definition could not be compiled. */
export class WorkflowCompilationError extends FrameworkError {
  public readonly code = "ERR_WORKFLOW_COMPILATION";
}

/** A prepared-but-unimplemented capability was invoked. */
export class WorkflowNotImplementedError extends FrameworkError {
  public readonly code = "ERR_WORKFLOW_NOT_IMPLEMENTED";
}

/** An import/export problem. */
export class WorkflowIoError extends FrameworkError {
  public readonly code = "ERR_WORKFLOW_IO";
}

/** Union of all Workflow Engine errors — the `E` in `Result<T, WorkflowError>`. */
export type WorkflowError =
  | WorkflowValidationError
  | WorkflowNotFoundError
  | WorkflowDuplicateError
  | StepExecutionError
  | WorkflowTimeoutError
  | WorkflowCompilationError
  | WorkflowNotImplementedError
  | WorkflowIoError;
