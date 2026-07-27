/**
 * Framework error hierarchy.
 *
 * Every error carries a stable, machine-readable `code` so callers and
 * telemetry can react programmatically without string-matching messages, and
 * supports the standard {@link ErrorOptions.cause} for error chaining.
 */

/** Options accepted by every framework error, mirroring the native shape. */
export interface FrameworkErrorOptions {
  readonly cause?: unknown;
}

/** Abstract base class shared by all errors thrown by the framework. */
export abstract class FrameworkError extends Error {
  /** Stable machine-readable identifier for this error kind. */
  public abstract readonly code: string;

  public constructor(message: string, options?: FrameworkErrorOptions) {
    // Only forward `cause` when provided to avoid setting it to `undefined`.
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    // Use the concrete subclass name rather than the abstract base name.
    this.name = new.target.name;
  }
}

/** Raised when configuration cannot be loaded or fails validation. */
export class ConfigError extends FrameworkError {
  public readonly code = "ERR_CONFIG";
}

/** Raised when a plugin misbehaves during its lifecycle callbacks. */
export class PluginError extends FrameworkError {
  public readonly code = "ERR_PLUGIN";
}

/** Raised for invalid plugin registry operations (duplicates, cycles, …). */
export class RegistryError extends FrameworkError {
  public readonly code = "ERR_REGISTRY";
}

/** Raised by the dependency container for unknown or invalid tokens. */
export class ContainerError extends FrameworkError {
  public readonly code = "ERR_CONTAINER";
}

/** Raised for invalid kernel state transitions. */
export class KernelError extends FrameworkError {
  public readonly code = "ERR_KERNEL";
}
