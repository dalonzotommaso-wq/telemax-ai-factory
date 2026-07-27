/**
 * Plugin registry.
 *
 * Owns the set of registered plugins and orchestrates their lifecycle. The
 * activation order is derived from declared dependencies via a depth-first
 * topological sort, which also detects missing dependencies and cycles.
 */
import { PluginError, RegistryError } from "../errors/errors.js";
import type { Plugin, PluginContext } from "./plugin.js";

export class PluginRegistry {
  private readonly plugins = new Map<string, Plugin>();
  /** Names of plugins whose `setup` completed, in activation order. */
  private readonly active: string[] = [];

  /**
   * Register a plugin.
   *
   * @throws {RegistryError} when a plugin with the same name already exists.
   */
  public register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new RegistryError(`A plugin named "${plugin.name}" is already registered.`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Remove a plugin that is not currently active.
   *
   * @throws {RegistryError} when the plugin is unknown or still active.
   */
  public unregister(name: string): void {
    if (!this.plugins.has(name)) {
      throw new RegistryError(`Cannot unregister unknown plugin "${name}".`);
    }
    if (this.active.includes(name)) {
      throw new RegistryError(`Plugin "${name}" is active; tear it down before unregistering.`);
    }
    this.plugins.delete(name);
  }

  /** Whether a plugin with the given name is registered. */
  public has(name: string): boolean {
    return this.plugins.has(name);
  }

  /** Snapshot of all registered plugins in insertion order. */
  public list(): readonly Plugin[] {
    return [...this.plugins.values()];
  }

  /**
   * Compute a dependency-respecting activation order.
   *
   * @throws {RegistryError} on a missing dependency or a dependency cycle.
   */
  public resolveOrder(): readonly Plugin[] {
    const ordered: Plugin[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (name: string, trail: readonly string[]): void => {
      if (visited.has(name)) {
        return;
      }
      if (visiting.has(name)) {
        throw new RegistryError(
          `Circular plugin dependency detected: ${[...trail, name].join(" -> ")}.`,
        );
      }
      const plugin = this.plugins.get(name);
      if (plugin === undefined) {
        throw new RegistryError(`Plugin "${name}" is not registered.`);
      }
      visiting.add(name);
      for (const dependency of plugin.dependsOn ?? []) {
        if (!this.plugins.has(dependency)) {
          throw new RegistryError(`Plugin "${name}" depends on missing plugin "${dependency}".`);
        }
        visit(dependency, [...trail, name]);
      }
      visiting.delete(name);
      visited.add(name);
      ordered.push(plugin);
    };

    for (const name of this.plugins.keys()) {
      visit(name, []);
    }
    return ordered;
  }

  /**
   * Run `setup` for every plugin in dependency order.
   *
   * @throws {PluginError} wrapping the first plugin that fails to set up.
   */
  public async setupAll(context: PluginContext): Promise<void> {
    for (const plugin of this.resolveOrder()) {
      try {
        await plugin.setup(context);
        this.active.push(plugin.name);
      } catch (cause) {
        throw new PluginError(`Plugin "${plugin.name}" failed during setup.`, { cause });
      }
    }
  }

  /**
   * Run `teardown` in reverse activation order. Every teardown is attempted
   * even if some fail; failures are aggregated and thrown at the end.
   *
   * @throws {PluginError} aggregating any teardown failures.
   */
  public async teardownAll(context: PluginContext): Promise<void> {
    const failures: PluginError[] = [];
    for (const name of [...this.active].reverse()) {
      const plugin = this.plugins.get(name);
      if (plugin?.teardown === undefined) {
        this.removeActive(name);
        continue;
      }
      try {
        await plugin.teardown(context);
      } catch (cause) {
        failures.push(new PluginError(`Plugin "${name}" failed during teardown.`, { cause }));
      } finally {
        this.removeActive(name);
      }
    }
    if (failures.length > 0) {
      throw new PluginError(`One or more plugins failed during teardown (${failures.length}).`, {
        cause: failures,
      });
    }
  }

  /** Remove a name from the active list, if present. */
  private removeActive(name: string): void {
    const index = this.active.indexOf(name);
    if (index >= 0) {
      this.active.splice(index, 1);
    }
  }
}
