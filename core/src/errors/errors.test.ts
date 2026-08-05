import { describe, expect, it } from "vitest";
import {
  ConfigError,
  ContainerError,
  FrameworkError,
  KernelError,
  PluginError,
  RegistryError,
} from "./errors.js";

describe("framework errors", () => {
  it("assigns a stable code and the concrete subclass name", () => {
    const cases: readonly [FrameworkError, string, string][] = [
      [new ConfigError("m"), "ERR_CONFIG", "ConfigError"],
      [new PluginError("m"), "ERR_PLUGIN", "PluginError"],
      [new RegistryError("m"), "ERR_REGISTRY", "RegistryError"],
      [new ContainerError("m"), "ERR_CONTAINER", "ContainerError"],
      [new KernelError("m"), "ERR_KERNEL", "KernelError"],
    ];
    for (const [error, code, name] of cases) {
      expect(error).toBeInstanceOf(FrameworkError);
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(code);
      expect(error.name).toBe(name);
      expect(error.message).toBe("m");
    }
  });

  it("forwards a cause when provided and omits it otherwise", () => {
    const cause = new Error("root");
    expect(new PluginError("wrapped", { cause }).cause).toBe(cause);
    expect(new PluginError("bare").cause).toBeUndefined();
  });
});
