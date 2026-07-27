# ADR-0004 — Dependency direction between Core and generators

- **Status:** Accepted
- **Date:** 2026-01-01

## Context

Generators are a primary capability of the platform, but they are numerous and
volatile. If the Core depended on generators (or on any feature package), every
new capability would risk destabilizing the foundation.

## Decision

Dependencies flow in exactly one direction: **generators (and all feature
packages) depend on `@telemax/core`; the Core depends on none of them.** The
generator SDK (`@telemax/generator-kit`) imports from the Core and provides a
`BaseGenerator` that implements the Core's `Plugin` contract. This direction is
reinforced by the workspace dependency declarations and by the fact that the
Core's package has no internal dependencies.

## Consequences

- The Core stays stable and reusable regardless of how many generators exist.
- Generators can be developed, versioned and removed independently.
- Any attempt to import a generator from the Core is an immediate design smell
  and is caught in review (and by the absence of such a dependency).

## Alternatives considered

- **Bidirectional dependencies / Core aware of generators.** Rejected: couples
  the foundation to volatile capabilities and invites cycles.
- **A separate mediator package depending on both.** Deferred: unnecessary at
  the foundation stage; the plugin contract already decouples them.
