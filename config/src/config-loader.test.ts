import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { EnvConfigProvider } from "./config-loader.js";

describe("EnvConfigProvider", () => {
  it("applies defaults when the source is empty", () => {
    const result = new EnvConfigProvider({}).load();
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.environment).toBe("development");
      expect(result.value.logLevel).toBe("info");
      expect(result.value.telemetry.enabled).toBe(false);
    }
  });

  it("reads and validates provided values", () => {
    const result = new EnvConfigProvider({
      TELEMAX_ENV: "production",
      TELEMAX_LOG_LEVEL: "warn",
      TELEMAX_TELEMETRY_ENABLED: "true",
    }).load();
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.environment).toBe("production");
      expect(result.value.logLevel).toBe("warn");
      expect(result.value.telemetry.enabled).toBe(true);
    }
  });

  it("returns a ConfigError for an invalid log level", () => {
    const result = new EnvConfigProvider({ TELEMAX_LOG_LEVEL: "verbose" }).load();
    expect(isErr(result)).toBe(true);
  });
});
