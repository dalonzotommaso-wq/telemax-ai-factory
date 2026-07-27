/**
 * Application kernel.
 *
 * The Kernel is the composition root: it owns the {@link Logger}, the
 * {@link ServiceContainer} and the {@link PluginRegistry}, and drives the
 * start/stop lifecycle. Application code registers plugins and calls
 * {@link Kernel.start}; everything else is wired through the container, so the
 * Kernel never depends on any concrete feature or generator.
 */
import { ServiceContainer } from "../di/container.js";
import { KernelError } from "../errors/errors.js";
import { ConsoleLogger, type Logger } from "../logging/logger.js";
import { PluginRegistry } from "../plugins/plugin-registry.js";
import type { Plugin, PluginContext } from "../plugins/plugin.js";

/** Construction options for the {@link Kernel}. */
export interface KernelOptions {
  /** Logger to use. Defaults to a {@link ConsoleLogger}. */
  readonly logger?: Logger;
}

/** Lifecycle states the kernel moves through, in order. */
type KernelState = "created" | "started" | "stopped";

export class Kernel {
  private readonly logger: Logger;
  private readonly services: ServiceContainer;
  private readonly registry: PluginRegistry;
  private state: KernelState = "created";

  public constructor(options?: KernelOptions) {
    this.logger = options?.logger ?? new ConsoleLogger();
    this.services = new ServiceContainer();
    this.registry = new PluginRegistry();
  }

  /** The shared dependency container. */
  public get container(): ServiceContainer {
    return this.services;
  }

  /** The plugin registry backing this kernel. */
  public get plugins(): PluginRegistry {
    return this.registry;
  }

  /**
   * Register a plugin. Must be called before {@link Kernel.start}.
   *
   * @returns `this`, to allow fluent chaining.
   * @throws {KernelError} if called after the kernel has started.
   */
  public use(plugin: Plugin): this {
    if (this.state !== "created") {
      throw new KernelError(
        `Plugins must be registered before start (current state: "${this.state}").`,
      );
    }
    this.registry.register(plugin);
    return this;
  }

  /** Start the kernel, setting up all plugins in dependency order. */
  public async start(): Promise<void> {
    if (this.state === "started") {
      throw new KernelError("Kernel is already started.");
    }
    this.logger.info("Kernel starting", { plugins: this.registry.list().length });
    await this.registry.setupAll(this.pluginContext());
    this.state = "started";
    this.logger.info("Kernel started");
  }

  /** Stop the kernel, tearing down all plugins in reverse order. */
  public async stop(): Promise<void> {
    if (this.state !== "started") {
      throw new KernelError(`Kernel is not started (current state: "${this.state}").`);
    }
    this.logger.info("Kernel stopping");
    await this.registry.teardownAll(this.pluginContext());
    this.state = "stopped";
    this.logger.info("Kernel stopped");
  }

  /** Build the context passed to plugin lifecycle callbacks. */
  private pluginContext(): PluginContext {
    return { logger: this.logger, services: this.services };
  }
}
