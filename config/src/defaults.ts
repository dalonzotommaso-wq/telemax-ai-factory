/**
 * Default configuration values.
 *
 * These are applied whenever a corresponding source value is absent, giving
 * the platform sensible, safe-by-default behavior with zero configuration.
 */
import type { PlatformConfig } from "./config-schema.js";

export const DEFAULT_CONFIG: PlatformConfig = {
  environment: "development",
  logLevel: "info",
  telemetry: { enabled: false },
};
