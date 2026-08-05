# Telemax AI Factory — Project Management

This folder runs the project the way a product engineering org (think Microsoft / JetBrains)
would: a single backlog, a milestone roadmap that always ships **usable** software, and work
delivered in **sprints** with explicit acceptance criteria.

## Working method

- **Model:** software house. **Role:** Lead Software Engineer owns technical delivery, backlog
  grooming, sprint planning and release quality.
- **Cadence:** 2-week sprints. Ceremonies: Planning (start), Review/Demo (end), Retrospective (end),
  plus lightweight async check-ins.
- **Traceability:** every sprint references backlog IDs; every backlog item is mapped to a milestone.
  Nothing is built that isn’t traceable to a milestone outcome.

## Folder map

| Path         | Purpose                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `ROADMAP.md` | Milestone plan; each milestone ships usable software.                                                           |
| `BACKLOG.md` | Full, prioritized product backlog (ID, Title, Description, Priority, Dependencies, Complexity, Estimate).       |
| `SPRINTS/`   | One file per sprint (Objective, Input, Output, Acceptance Criteria, Checklist, Deliverable).                    |
| `DECISIONS/` | Project-level decision records (process/scope). Architecture ADRs stay in the repo at `docs/architecture/adr/`. |
| `RELEASES/`  | Release plan, release notes and templates (SemVer, driven by Changesets).                                       |

## Estimation legend

- **Priority:** `P0` foundational/blocking · `P1` high · `P2` medium · `P3` later.
- **Complexity:** T-shirt `S/M/L/XL`.
- **Estimate:** story points (Fibonacci `1,2,3,5,8,13,21`).
- **Planning velocity:** ~24 SP per 2-week sprint (small cross-functional team). Refined each Planning.

## Definition of Ready (DoR)

A backlog item may enter a sprint only when it has: a clear description and acceptance criteria,
resolved dependencies (or they are in-sprint), an estimate, and no open blocking questions.

## Definition of Done (DoD)

An item is Done only when: code + tests are merged to `main` via reviewed PR; format, lint,
type-check, unit tests and build are green; public APIs documented; a Changeset is included when
published behavior changes; and the sprint’s acceptance criteria are demonstrably met. For a
**milestone**, DoD additionally requires the milestone’s _usable_ outcome demonstrated end-to-end
and release notes published under `RELEASES/`.

## How this connects to the SPECs

- `SPEC-001` — Foundation _(delivered; Milestone **M0**)_.
- `SPEC-002` — Knowledge Engine (`@telemax/knowledge`) _(delivered in SPRINT-002)_.
- `SPEC-003` — Prompt Engine _(planned)_.
- `SPEC-004` — AI Orchestrator _(planned; its design is tracked as an Architecture Review, not a SPEC)_.

> The detailed milestone/sprint plan below predates this SPEC re-sequencing (it
> ordered the AI Orchestrator first) and will be re-baselined against the SPEC
> track in a later planning step.

## Ground rules (carried from SPEC-001)

Plugin-first; the Core never depends on generators/providers; centralized config; no duplicated
logic; strict TypeScript with `any` banned; English technical docs; every package documented.
