# ADR-0003 — Plugin-first Core

- **Status:** Accepted
- **Date:** 2026-01-01

## Context

The platform must support many capabilities (different generators, integrations,
services) that will be added over time and that should be composable and
independently removable. Hard-coding these into a central module would make the
Core a bottleneck and a source of coupling.

## Decision

The Core exposes a **plugin-first** architecture. A `Plugin` declares a name, a
version and optional dependencies, and implements `setup`/`teardown` lifecycle
hooks. A `PluginRegistry` resolves activation order from declared dependencies
and orchestrates the lifecycle. Plugins collaborate through a shared, type-safe
`ServiceContainer`. The Core interacts with capabilities _only_ through these
interfaces.

## Consequences

- Capabilities are added or removed without modifying the Core.
- Plugins are decoupled from one another (they share services, not classes).
- Startup ordering is explicit and validated (cycles and missing dependencies
  are detected early).
- A small indirection cost: capabilities must be expressed as plugins/services.

## Alternatives considered

- **Central service locator hard-wired in the Core.** Rejected: couples the Core
  to every capability.
- **Ad-hoc imports between features.** Rejected: creates a dependency web that
  is hard to reason about and to test.
