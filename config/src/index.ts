/**
 * Public API of `@telemax/config`.
 */
export type { PlatformConfig, TelemetryConfig } from "./config-schema.js";
export type { Environment } from "./validation.js";
export { asEnvironment, asLogLevel, asBoolean } from "./validation.js";
export { DEFAULT_CONFIG } from "./defaults.js";
export { EnvConfigProvider } from "./config-loader.js";
export type { EnvConfigSource } from "./config-loader.js";
