/**
 * Plugin contract.
 *
 * A plugin is the unit of extensibility in the framework. It can be added or
 * removed without modifying the Core: the Core only ever interacts with a
 * plugin through this interface and the {@link PluginContext} it passes in.
 */
import type { ServiceContainer } from "../di/container.js";
import type { Logger } from "../logging/logger.js";

/**
 * The runtime surface handed to a plugin during its lifecycle callbacks. It is
 * deliberately minimal to keep plugins loosely coupled from the kernel.
 */
export interface PluginContext {
  /** A logger, typically already scoped to the plugin. */
  readonly logger: Logger;
  /** The shared dependency container for registering/resolving services. */
  readonly services: ServiceContainer;
}

/**
 * A composable unit of functionality.
 *
 * Plugins declare a unique {@link Plugin.name}, a {@link Plugin.version} and an
 * optional list of other plugins they depend on; the registry uses those to
 * compute a safe activation order.
 */
export interface Plugin {
  /** Unique plugin identifier within a single registry. */
  readonly name: string;
  /** Semantic version of the plugin, for diagnostics and compatibility. */
  readonly version: string;
  /** Names of plugins that must be set up before this one. */
  readonly dependsOn?: readonly string[];
  /** Called once, in dependency order, to initialize the plugin. */
  setup(context: PluginContext): void | Promise<void>;
  /** Called once, in reverse order, to release the plugin's resources. */
  teardown?(context: PluginContext): void | Promise<void>;
}
