/**
 * Public API of `@telemax/core`.
 *
 * This barrel is the single supported entry point. Consumers should import
 * from `@telemax/core` and never reach into deep module paths, so internal
 * structure can evolve without breaking downstream packages.
 */

// Result type and helpers.
export { ok, err, isOk, isErr, map, unwrapOr } from "./result/result.js";
export type { Result, Ok, Err } from "./result/result.js";

// Error hierarchy.
export {
  FrameworkError,
  ConfigError,
  PluginError,
  RegistryError,
  ContainerError,
  KernelError,
} from "./errors/errors.js";
export type { FrameworkErrorOptions } from "./errors/errors.js";

// Logging.
export { ConsoleLogger } from "./logging/logger.js";
export type { Logger, LogLevel, LogFields, ConsoleLoggerOptions } from "./logging/logger.js";

// Dependency injection.
export { ServiceContainer, createToken } from "./di/container.js";
export type { Token, ServiceFactory } from "./di/container.js";

// Configuration contract.
export type { ConfigProvider } from "./config/config-contract.js";

// Plugin system.
export { PluginRegistry } from "./plugins/plugin-registry.js";
export type { Plugin, PluginContext } from "./plugins/plugin.js";

// Kernel.
export { Kernel } from "./kernel/kernel.js";
export type { KernelOptions } from "./kernel/kernel.js";

// Nominal typing helpers.
export type { Brand, Branded } from "./types/branded.js";
