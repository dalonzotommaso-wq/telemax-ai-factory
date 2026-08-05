import { describe, expect, it } from "vitest";
import { PluginRegistry } from "./plugin-registry.js";
import { ServiceContainer } from "../di/container.js";
import { PluginError, RegistryError } from "../errors/errors.js";
import type { Logger } from "../logging/logger.js";
import type { Plugin, PluginContext } from "./plugin.js";

function context(): PluginContext {
  const logger: Logger = {
    debug: (): void => undefined,
    info: (): void => undefined,
    warn: (): void => undefined,
    error: (): void => undefined,
    child: (): Logger => logger,
  };
  return { logger, services: new ServiceContainer() };
}

function plugin(
  name: string,
  overrides: Partial<Plugin> = {},
): Plugin & { setupCalls: number; teardownCalls: number } {
  const state = { setupCalls: 0, teardownCalls: 0 };
  return {
    name,
    version: "1.0.0",
    ...overrides,
    setup(ctx: PluginContext): void | Promise<void> {
      state.setupCalls += 1;
      return overrides.setup?.(ctx);
    },
    teardown(ctx: PluginContext): void | Promise<void> {
      state.teardownCalls += 1;
      return overrides.teardown?.(ctx);
    },
    get setupCalls(): number {
      return state.setupCalls;
    },
    get teardownCalls(): number {
      return state.teardownCalls;
    },
  };
}

describe("PluginRegistry lifecycle", () => {
  it("resolves order and rejects a missing dependency", () => {
    const registry = new PluginRegistry();
    registry.register({ name: "a", version: "1", dependsOn: ["missing"], setup: () => undefined });
    expect(() => registry.resolveOrder()).toThrow(RegistryError);
  });

  it("unregisters an inactive plugin and rejects unknown/active ones", async () => {
    const registry = new PluginRegistry();
    registry.register(plugin("a"));
    registry.unregister("a");
    expect(registry.has("a")).toBe(false);
    expect(() => registry.unregister("ghost")).toThrow(RegistryError);

    registry.register(plugin("b"));
    await registry.setupAll(context());
    expect(() => registry.unregister("b")).toThrow(RegistryError);
  });

  it("sets up in dependency order and activates each plugin", async () => {
    const registry = new PluginRegistry();
    const order: string[] = [];
    registry.register(
      plugin("child", { dependsOn: ["parent"], setup: () => void order.push("child") }),
    );
    registry.register(plugin("parent", { setup: () => void order.push("parent") }));
    await registry.setupAll(context());
    expect(order).toEqual(["parent", "child"]);
  });

  it("wraps a failing setup in a PluginError", async () => {
    const registry = new PluginRegistry();
    registry.register(
      plugin("boom", {
        setup: () => {
          throw new Error("nope");
        },
      }),
    );
    await expect(registry.setupAll(context())).rejects.toBeInstanceOf(PluginError);
  });

  it("tears down in reverse order and aggregates failures", async () => {
    const registry = new PluginRegistry();
    const order: string[] = [];
    registry.register(plugin("first", { teardown: () => void order.push("first") }));
    registry.register(plugin("second", { teardown: () => void order.push("second") }));
    const ctx = context();
    await registry.setupAll(ctx);
    await registry.teardownAll(ctx);
    expect(order).toEqual(["second", "first"]);
  });

  it("skips a plugin without a teardown and aggregates teardown errors", async () => {
    const registry = new PluginRegistry();
    registry.register({ name: "noTeardown", version: "1", setup: () => undefined });
    registry.register(
      plugin("failing", {
        teardown: () => {
          throw new Error("teardown failed");
        },
      }),
    );
    const ctx = context();
    await registry.setupAll(ctx);
    await expect(registry.teardownAll(ctx)).rejects.toBeInstanceOf(PluginError);
  });
});
