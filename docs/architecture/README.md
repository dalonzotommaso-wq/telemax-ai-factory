# Architecture

This directory documents the architecture of Telemax AI Factory.

- [`../SPEC-001-Foundation.md`](../SPEC-001-Foundation.md) — the foundation
  specification (mission, layers, packages, quality gates).
- [`adr/`](adr/) — Architecture Decision Records: one file per significant,
  hard-to-reverse decision, capturing its context and consequences.

## Architecture Decision Records

We use ADRs to record _why_ decisions were made, not just _what_ was decided.
Each ADR is immutable once accepted; if a decision changes, we add a new ADR
that supersedes the old one rather than editing history.

Use [`adr/template.md`](adr/template.md) as the starting point for a new record.

### Index

- [ADR-0001](adr/0001-record-architecture-decisions.md) — Record architecture decisions
- [ADR-0002](adr/0002-monorepo-with-pnpm-and-turborepo.md) — Monorepo with pnpm and Turborepo
- [ADR-0003](adr/0003-plugin-first-core.md) — Plugin-first Core
- [ADR-0004](adr/0004-dependency-direction-core-and-generators.md) — Dependency direction between Core and generators
