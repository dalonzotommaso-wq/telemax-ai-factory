# @telemax/config

Centralized, strongly-typed configuration for Telemax AI Factory. It implements
the `ConfigProvider` contract defined by `@telemax/core` and depends on the Core.

## Responsibilities

- Define the platform configuration schema (`PlatformConfig`).
- Provide safe defaults (`DEFAULT_CONFIG`).
- Load and validate configuration from an environment-like source
  (`EnvConfigProvider`), returning a typed `Result`.
- Expose primitive validators (`asEnvironment`, `asLogLevel`, `asBoolean`).

## Installation

```bash
pnpm add @telemax/config @telemax/core
```

## Usage

```ts
import { EnvConfigProvider } from "@telemax/config";
import { isOk } from "@telemax/core";

const result = new EnvConfigProvider().load();
if (isOk(result)) {
  const config = result.value; // fully typed PlatformConfig
}
```

## Recognized environment variables

| Variable                    | Maps to             | Default       |
| --------------------------- | ------------------- | ------------- |
| `TELEMAX_ENV`               | `environment`       | `development` |
| `TELEMAX_LOG_LEVEL`         | `logLevel`          | `info`        |
| `TELEMAX_TELEMETRY_ENABLED` | `telemetry.enabled` | `false`       |

## License

MIT © Gruppo AIR srl
