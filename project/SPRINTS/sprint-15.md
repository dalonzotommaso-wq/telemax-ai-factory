# Sprint 15 — CLI + SDK + release → Milestone M1 (AI Gateway)

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `DX-01`, `DX-02`, `QA-04`, `DX-05`
- **Planned capacity:** 20 SP (assumed velocity ~24 SP/sprint)

## Objective

Expose the orchestrator through a CLI and SDK, finalize release automation, and cut the first usable release.

## Input

- Full AI core (Sprints 1-14)

## Output

- CLI (telemax ai ...)
- TypeScript SDK
- Changesets-based release pipeline
- Getting-started docs

## Acceptance Criteria

- [ ] A user can call any provider via CLI and SDK with streaming, retries, fallback and cost output
- [ ] `telemax ai complete/stream` works against all five providers
- [ ] Release pipeline publishes packages from changesets
- [ ] Docs enable a new user to run a call in minutes

## Checklist

- [ ] Implement CLI commands
- [ ] Publish SDK surface + examples
- [ ] Finalize CI release (Changesets)
- [ ] Write getting-started docs
- [ ] Tag and release v0.2
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

RELEASE v0.2 — Milestone M1: a usable multi-provider AI Gateway (CLI + SDK).
