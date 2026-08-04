# Architecture

This directory documents the architecture of Telemax AI Factory.

- [`../SPEC-001-Foundation.md`](../SPEC-001-Foundation.md) — the foundation
  specification (mission, layers, packages, quality gates).
- [`../SPEC-002-Knowledge-Engine.md`](../SPEC-002-Knowledge-Engine.md) — the
  Knowledge Engine specification (`@telemax/knowledge`).
- [`../SPEC-003-Prompt-Engine.md`](../SPEC-003-Prompt-Engine.md) — the
  Prompt Engine specification (`@telemax/prompt-engine`).
- [`../SPEC-004-AI-Orchestrator.md`](../SPEC-004-AI-Orchestrator.md) — the
  AI Orchestrator specification (`@telemax/ai`).
- [`../SPEC-005-Workflow-Engine.md`](../SPEC-005-Workflow-Engine.md) — the
  Workflow Engine specification (`@telemax/workflow`).
- [`../SPEC-006-Generator-Engine.md`](../SPEC-006-Generator-Engine.md) — the
  Generator Engine specification (`@telemax/generator-engine`).
- [`../SPEC-007-WordPress-News-Generator.md`](../SPEC-007-WordPress-News-Generator.md) — the
  WordPress News generator specification (`@telemax/generator-wordpress`).
- [`adr/`](adr/) — Architecture Decision Records: one file per significant,
  hard-to-reverse decision, capturing its context and consequences.

## SPEC roadmap

- **SPEC-001** — Foundation _(delivered)_
- **SPEC-002** — Knowledge Engine (`@telemax/knowledge`) _(delivered)_
- **SPEC-003** — Prompt Engine (`@telemax/prompt-engine`) _(delivered)_
- **SPEC-004** — AI Orchestrator (`@telemax/ai`) _(delivered)_
- **SPEC-005** — Workflow Engine (`@telemax/workflow`) _(delivered)_
- **SPEC-006** — Generator Engine (`@telemax/generator-engine`) _(delivered)_
- **SPEC-007** — WordPress News Generator (`@telemax/generator-wordpress`) _(delivered)_

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
- [ADR-0005](adr/0005-knowledge-engine-architecture.md) — Knowledge Engine architecture
- [ADR-0006](adr/0006-prompt-engine-architecture.md) — Prompt Engine architecture
- [ADR-0007](adr/0007-ai-orchestrator-architecture.md) — AI Orchestrator architecture
- [ADR-0008](adr/0008-workflow-engine-architecture.md) — Workflow Engine architecture
- [ADR-0009](adr/0009-generator-engine-architecture.md) — Generator Engine architecture
- [ADR-0010](adr/0010-wordpress-news-generator.md) — WordPress News generator architecture
- [ADR-0011](adr/0011-project-writer-and-cli.md) — Filesystem project writer and demo CLI
