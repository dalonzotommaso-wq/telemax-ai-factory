/**
 * AI Orchestrator error hierarchy. All errors extend the Core
 * {@link FrameworkError} (stable `code`, `cause` chaining) and form the
 * {@link AIError} union used as the `E` channel of `Result`.
 */
import { FrameworkError, type FrameworkErrorOptions } from "@telemax/core";

/** No provider/model available or selectable for the request. */
export class ProviderUnavailableError extends FrameworkError {
  public readonly code = "ERR_AI_PROVIDER_UNAVAILABLE";
}

/** A requested provider/model was not found in a registry. */
export class RegistryLookupError extends FrameworkError {
  public readonly code = "ERR_AI_REGISTRY_LOOKUP";
}

/** The request failed validation (missing model, empty messages, …). */
export class InvalidRequestError extends FrameworkError {
  public readonly code = "ERR_AI_INVALID_REQUEST";
  public readonly issues: readonly string[];

  public constructor(message: string, issues: readonly string[], options?: FrameworkErrorOptions) {
    super(message, options);
    this.issues = issues;
  }
}

/** A resilience policy tripped (circuit open, rate limit exceeded, retries exhausted). */
export class ResiliencyError extends FrameworkError {
  public readonly code = "ERR_AI_RESILIENCY";
}

/** A provider reported an execution failure. */
export class ProviderExecutionError extends FrameworkError {
  public readonly code = "ERR_AI_PROVIDER_EXECUTION";
}

/** A prepared-but-unimplemented capability was invoked. */
export class OrchestratorNotImplementedError extends FrameworkError {
  public readonly code = "ERR_AI_NOT_IMPLEMENTED";
}

/** Union of all orchestrator errors — the `E` in `Result<T, AIError>`. */
export type AIError =
  | ProviderUnavailableError
  | RegistryLookupError
  | InvalidRequestError
  | ResiliencyError
  | ProviderExecutionError
  | OrchestratorNotImplementedError;
