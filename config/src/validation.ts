/**
 * Primitive validators.
 *
 * Each validator parses a raw string into a strongly-typed value and returns a
 * {@link Result}. Reusing the framework's `Result`/`ConfigError` types keeps
 * validation logic centralized and free of duplicated error handling.
 */
import { ConfigError, err, ok, type LogLevel, type Result } from "@telemax/core";

/** Deployment environments the platform recognizes. */
const ENVIRONMENTS = ["development", "test", "production"] as const;

/** The validated environment type, derived from {@link ENVIRONMENTS}. */
export type Environment = (typeof ENVIRONMENTS)[number];

/** Accepted log levels, mirrored from the Core's `LogLevel`. */
const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

/** Parse a raw string into an {@link Environment}. */
export function asEnvironment(value: string): Result<Environment, ConfigError> {
  return (ENVIRONMENTS as readonly string[]).includes(value)
    ? ok(value as Environment)
    : err(
        new ConfigError(
          `Invalid environment "${value}". Expected one of: ${ENVIRONMENTS.join(", ")}.`,
        ),
      );
}

/** Parse a raw string into a {@link LogLevel}. */
export function asLogLevel(value: string): Result<LogLevel, ConfigError> {
  return (LOG_LEVELS as readonly string[]).includes(value)
    ? ok(value as LogLevel)
    : err(
        new ConfigError(`Invalid log level "${value}". Expected one of: ${LOG_LEVELS.join(", ")}.`),
      );
}

/** Parse a raw string into a boolean, accepting `true/false` and `1/0`. */
export function asBoolean(value: string): Result<boolean, ConfigError> {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return ok(true);
  }
  if (normalized === "false" || normalized === "0") {
    return ok(false);
  }
  return err(new ConfigError(`Invalid boolean "${value}". Expected true/false or 1/0.`));
}
