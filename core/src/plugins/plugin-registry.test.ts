import { describe, expect, it } from "vitest";
import { ServiceContainer } from "../di/container.js";
import { RegistryError } from "../errors/errors.js";
import { ConsoleLogger } from "../logging/logger.js";
import { PluginRegistry } from "./plugin-registry.js";
import type { Plugin, PluginContext } from "./plugin.js";

function context(): PluginContext {
  return {
    logger: new ConsoleLogger({ sink: () => undefined }),
    services: new ServiceContainer(),
  };
}

function plugin(name: string, dependsOn: readonly string[], onSetup: () => void): Plugin {
  return {
    name,
    version: "1.0.0",
    dependsOn,
    setup(): void {
      onSetup();
    },
  };
}

describe("PluginRegistry", () => {
  it("rejects duplicate registration", () => {
    const registry = new PluginRegistry();
    registry.register(plugin("a", [], () => undefined));
    expect(() => registry.register(plugin("a", [], () => undefined))).toThrow(RegistryError);
  });

  it("activates plugins in dependency order", async () => {
    const registry = new PluginRegistry();
    const order: string[] = [];
    registry.register(plugin("b", ["a"], () => order.push("b")));
    registry.register(plugin("a", [], () => order.push("a")));

    await registry.setupAll(context());

    expect(order).toEqual(["a", "b"]);
  });

  it("detects circular dependencies", async () => {
    const registry = new PluginRegistry();
    registry.register(plugin("x", ["y"], () => undefined));
    registry.register(plugin("y", ["x"], () => undefined));

    await expect(registry.setupAll(context())).rejects.toThrow(RegistryError);
  });
});
