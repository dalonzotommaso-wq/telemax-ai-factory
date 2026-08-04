/**
 * Prompt Engine error hierarchy. All errors extend the Core {@link FrameworkError}
 * (stable `code`, `cause` chaining). Expected failures travel via the Core
 * `Result` type; these classes are its `E` channel.
 */
import { FrameworkError, type FrameworkErrorOptions } from "@telemax/core";

/** Raised when a template or variable set fails validation. */
export class PromptValidationError extends FrameworkError {
  public readonly code = "ERR_PROMPT_VALIDATION";
  public readonly issues: readonly string[];

  public constructor(message: string, issues: readonly string[], options?: FrameworkErrorOptions) {
    super(message, options);
    this.issues = issues;
  }
}

/** Raised when a requested template/composition/version does not exist. */
export class PromptNotFoundError extends FrameworkError {
  public readonly code = "ERR_PROMPT_NOT_FOUND";
}

/** Raised when registering something that already exists. */
export class PromptDuplicateError extends FrameworkError {
  public readonly code = "ERR_PROMPT_DUPLICATE";
}

/** Raised when template rendering fails (syntax, unbalanced blocks, …). */
export class PromptRenderError extends FrameworkError {
  public readonly code = "ERR_PROMPT_RENDER";
}

/** Raised when template inheritance/dependencies cannot be resolved (cycles, …). */
export class PromptResolutionError extends FrameworkError {
  public readonly code = "ERR_PROMPT_RESOLUTION";
}

/** Raised by prepared-but-unimplemented capabilities (chains, RAG, tools, …). */
export class PromptNotImplementedError extends FrameworkError {
  public readonly code = "ERR_PROMPT_NOT_IMPLEMENTED";
}

/** Raised for import/export problems. */
export class PromptIoError extends FrameworkError {
  public readonly code = "ERR_PROMPT_IO";
}

/** Union of all Prompt Engine errors — the `E` in `Result<T, PromptError>`. */
export type PromptError =
  | PromptValidationError
  | PromptNotFoundError
  | PromptDuplicateError
  | PromptRenderError
  | PromptResolutionError
  | PromptNotImplementedError
  | PromptIoError;
