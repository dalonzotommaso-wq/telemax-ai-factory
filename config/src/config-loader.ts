/**
 * Environment-based configuration provider.
 *
 * Reads configuration from an environment-like key/value source (defaulting to
 * `process.env`), applies {@link DEFAULT_CONFIG} for anything absent, validates
 * every value, and returns a fully-typed {@link PlatformConfig}. It implements
 * the Core's {@link ConfigProvider} contract so it can be injected anywhere the
 * framework expects configuration.
 */
import { isErr, ok, type ConfigError, type ConfigProvider, type Result } from "@telemax/core";
import type { PlatformConfig } from "./config-schema.js";
import { DEFAULT_CONFIG } from "./defaults.js";
import { asBoolean, asEnvironment, asLogLevel } from "./validation.js";

/** A read-only environment-like source of string values. */
export type EnvConfigSource = Readonly<Record<string, string | undefined>>;

/** Recognized environment variable names. */
const KEYS = {
  environment: "TELEMAX_ENV",
  logLevel: "TELEMAX_LOG_LEVEL",
  telemetryEnabled: "TELEMAX_TELEMETRY_ENABLED",
} as const;

export class EnvConfigProvider implements ConfigProvider<PlatformConfig> {
  private readonly source: EnvConfigSource;

  public constructor(source?: EnvConfigSource) {
    this.source = source ?? process.env;
  }

  public load(): Result<PlatformConfig, ConfigError> {
    const environment = asEnvironment(this.readOr(KEYS.environment, DEFAULT_CONFIG.environment));
    if (isErr(environment)) {
      return environment;
    }

    const logLevel = asLogLevel(this.readOr(KEYS.logLevel, DEFAULT_CONFIG.logLevel));
    if (isErr(logLevel)) {
      return logLevel;
    }

    const rawTelemetry = this.source[KEYS.telemetryEnabled];
    const telemetryEnabled =
      rawTelemetry === undefined ? ok(DEFAULT_CONFIG.telemetry.enabled) : asBoolean(rawTelemetry);
    if (isErr(telemetryEnabled)) {
      return telemetryEnabled;
    }

    return ok({
      environment: environment.value,
      logLevel: logLevel.value,
      telemetry: { enabled: telemetryEnabled.value },
    });
  }

  /** Read a key, returning `fallback` when it is absent or empty. */
  private readOr(key: string, fallback: string): string {
    const value = this.source[key];
    return value === undefined || value.length === 0 ? fallback : value;
  }
}
