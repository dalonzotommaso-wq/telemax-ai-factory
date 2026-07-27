/**
 * Configuration contract consumed by the Core.
 *
 * The Core never reads environment variables or files directly. Instead it
 * depends on this small interface, and a concrete provider (see the
 * `@telemax/config` package) supplies validated configuration. This keeps the
 * Core decoupled from any particular schema or configuration source.
 */
import type { ConfigError } from "../errors/errors.js";
import type { Result } from "../result/result.js";

/**
 * Supplies validated, strongly-typed configuration to the framework.
 *
 * @typeParam TConfig - The concrete, validated configuration shape.
 */
export interface ConfigProvider<TConfig extends object> {
  /** Load and validate configuration, returning a typed {@link Result}. */
  load(): Result<TConfig, ConfigError>;
}
