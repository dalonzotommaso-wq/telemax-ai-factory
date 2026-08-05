import { describe, expect, it } from "vitest";
import { Kernel } from "./kernel.js";
import { ServiceContainer } from "../di/container.js";
import { PluginRegistry } from "../plugins/plugin-registry.js";
import { KernelError } from "../errors/errors.js";
import type { Logger } from "../logging/logger.js";
import type { Plugin, PluginContext } from "../plugins/plugin.js";

function silentLogger(): Logger {
  const logger: Logger = {
    debug: (): void => undefined,
    info: (): void => undefined,
    warn: (): void => undefined,
    error: (): void => undefined,
    child: (): Logger => logger,
  };
  return logger;
}

class FakePlugin implements Plugin {
  public setupCalls = 0;
  public teardownCalls = 0;
  public lastContext: PluginContext | undefined;
  public readonly version = "1.0.0";
  public constructor(public readonly name: string) {}
  public setup(context: PluginContext): void {
    this.setupCalls += 1;
    this.lastContext = context;
  }
  public teardown(): void {
    this.teardownCalls += 1;
  }
}

function kernel(): Kernel {
  return new Kernel({ logger: silentLogger() });
}

describe("Kernel", () => {
  it("exposes a container and a plugin registry", () => {
    const instance = kernel();
    expect(instance.container).toBeInstanceOf(ServiceContainer);
    expect(instance.plugins).toBeInstanceOf(PluginRegistry);
  });

  it("registers plugins fluently before start", () => {
    const instance = kernel();
    const plugin = new FakePlugin("alpha");
    expect(instance.use(plugin)).toBe(instance);
    expect(instance.plugins.has("alpha")).toBe(true);
  });

  it("sets up plugins on start with a context carrying logger and services", async () => {
    const instance = kernel();
    const plugin = new FakePlugin("alpha");
    instance.use(plugin);
    await instance.start();
    expect(plugin.setupCalls).toBe(1);
    expect(plugin.lastContext?.services).toBe(instance.container);
    expect(plugin.lastContext?.logger).toBeDefined();
  });

  it("tears down plugins on stop", async () => {
    const instance = kernel();
    const plugin = new FakePlugin("alpha");
    instance.use(plugin);
    await instance.start();
    await instance.stop();
    expect(plugin.teardownCalls).toBe(1);
  });

  it("rejects registering a plugin after start", async () => {
    const instance = kernel();
    await instance.start();
    expect(() => instance.use(new FakePlugin("late"))).toThrow(KernelError);
  });

  it("rejects starting twice and stopping before start", async () => {
    const instance = kernel();
    await instance.start();
    await expect(instance.start()).rejects.toBeInstanceOf(KernelError);
    const fresh = kernel();
    await expect(fresh.stop()).rejects.toBeInstanceOf(KernelError);
  });
});
