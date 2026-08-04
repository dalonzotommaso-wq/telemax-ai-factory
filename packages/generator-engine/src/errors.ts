/**
 * Generator Engine error hierarchy. All errors extend the Core
 * {@link FrameworkError} and form the {@link GeneratorError} union used as the
 * `E` channel of `Result`.
 */
import { FrameworkError, type FrameworkErrorOptions } from "@telemax/core";

/** A generator definition failed validation. */
export class GeneratorValidationError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_VALIDATION";
  public readonly issues: readonly string[];

  public constructor(message: string, issues: readonly string[], options?: FrameworkErrorOptions) {
    super(message, options);
    this.issues = issues;
  }
}

/** A requested generator or version was not found. */
export class GeneratorNotFoundError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_NOT_FOUND";
}

/** Registering something that already exists. */
export class GeneratorDuplicateError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_DUPLICATE";
}

/** A pipeline step failed. */
export class GeneratorStepError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_STEP";
  public readonly stepId: string;

  public constructor(message: string, stepId: string, options?: FrameworkErrorOptions) {
    super(message, options);
    this.stepId = stepId;
  }
}

/** A referenced template was not found. */
export class TemplateNotFoundError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_TEMPLATE_NOT_FOUND";
}

/** A referenced transform was not found. */
export class TransformNotFoundError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_TRANSFORM_NOT_FOUND";
}

/** A definition could not be compiled. */
export class GeneratorCompilationError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_COMPILATION";
}

/** A step needs a coordinator (workflow/ai/prompt/knowledge) that is not configured. */
export class GeneratorNotImplementedError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_NOT_IMPLEMENTED";
}

/** An import/export problem. */
export class GeneratorIoError extends FrameworkError {
  public readonly code = "ERR_GENERATOR_IO";
}

/** Union of all Generator Engine errors — the `E` in `Result<T, GeneratorError>`. */
export type GeneratorError =
  | GeneratorValidationError
  | GeneratorNotFoundError
  | GeneratorDuplicateError
  | GeneratorStepError
  | TemplateNotFoundError
  | TransformNotFoundError
  | GeneratorCompilationError
  | GeneratorNotImplementedError
  | GeneratorIoError;
