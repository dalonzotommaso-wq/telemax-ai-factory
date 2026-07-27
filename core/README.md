# @telemax/core

The framework kernel of Telemax AI Factory. It provides the primitives every
other package builds on and **depends on no other internal package**.

## Responsibilities

- **Kernel** (`Kernel`) — the composition root that owns the logger, the
  dependency container and the plugin registry, and drives the start/stop
  lifecycle.
- **Plugin system** (`Plugin`, `PluginRegistry`) — registration, dependency
  resolution (topological order), and lifecycle orchestration.
- **Dependency injection** (`ServiceContainer`, `Token`, `createToken`) — a
  minimal, type-safe, lazily-memoized service container.
- **Configuration contract** (`ConfigProvider`) — the interface the kernel uses
  to obtain validated configuration, implemented by `@telemax/config`.
- **Logging** (`Logger`, `ConsoleLogger`) — a structured logging interface with
  a dependency-free default implementation.
- **Errors** (`FrameworkError` and subclasses) — a coded error hierarchy.
- **Result** (`Result`, `ok`, `err`, …) — explicit success/failure values.
- **Branded types** (`Brand`, `Branded`) — nominal typing helpers.

## Installation

```bash
pnpm add @telemax/core
```

## Usage

```ts
import { Kernel } from "@telemax/core";

const kernel = new Kernel();
// kernel.use(somePlugin);
await kernel.start();
// ... application runs ...
await kernel.stop();
```

## Public API

Import everything from the package root (`@telemax/core`); deep imports are not
supported and internal structure may change.

## License

MIT © Gruppo AIR srl
