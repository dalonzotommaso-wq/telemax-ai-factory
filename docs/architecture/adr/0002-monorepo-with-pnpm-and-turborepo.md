# ADR-0002 — Monorepo with pnpm and Turborepo

- **Status:** Accepted
- **Date:** 2026-01-01

## Context

The platform is composed of several packages (kernel, configuration, generator
SDK, future generators and applications) that evolve together and share strict
tooling. We need consistent dependency management, fast incremental tasks, and
enforced build ordering that respects internal dependencies.

## Decision

We use a single repository managed with **pnpm workspaces** for dependency
linking and **Turborepo** for task orchestration and caching. Internal
dependencies are declared with `workspace:*`. Task ordering (e.g. building the
Core before its dependents) is expressed via Turborepo's `dependsOn: ["^build"]`
rather than TypeScript project references.

## Consequences

- One install, one lockfile, atomic cross-package changes.
- Fast, cache-aware `build`/`lint`/`typecheck`/`test` pipelines.
- Because ordering is handled by Turborepo, packages avoid TypeScript
  `composite`/project references, which keeps `--noEmit` type-checks simple.
- Contributors must have pnpm (via Corepack) and understand workspace protocols.

## Alternatives considered

- **Multiple repositories.** Rejected: cross-cutting changes and shared tooling
  become expensive to coordinate at this stage.
- **npm/yarn workspaces without a task runner.** Rejected: no first-class task
  graph or caching.
- **TypeScript project references for ordering.** Rejected: `composite`
  conflicts with `--noEmit` type-checking and adds friction; Turborepo already
  provides ordering.
