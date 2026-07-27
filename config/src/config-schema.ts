/**
 * The platform configuration schema.
 *
 * This is the single, centralized description of everything the platform can
 * be configured with. It is intentionally small at the foundation stage and is
 * expected to grow as features land.
 */
import type { LogLevel } from "@telemax/core";
import type { Environment } from "./validation.js";

/** Telemetry-related settings. */
export interface TelemetryConfig {
  /** Whether anonymous usage telemetry is enabled. */
  readonly enabled: boolean;
}

/** The fully-validated platform configuration object. */
export interface PlatformConfig {
  /** Active deployment environment. */
  readonly environment: Environment;
  /** Global minimum log level. */
  readonly logLevel: LogLevel;
  /** Telemetry configuration. */
  readonly telemetry: TelemetryConfig;
}
