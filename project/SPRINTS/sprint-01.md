# Sprint 01 — Working method + Core async/scoped DI

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `FND-01`, `FND-03`
- **Planned capacity:** 11 SP (assumed velocity ~24 SP/sprint)

## Objective

Stand up the software-house working method and begin the additive Core upgrades by making the DI container async- and scope-aware.

## Input

- Approved SPEC-004 (AI Orchestrator) Architecture Review (AR)
- SPEC-001 codebase (core/config/generator-kit)
- This project/ structure

## Output

- Sprint/branch/PR workflow agreed and documented
- ServiceContainer with resolveAsync() and createScope()
- AbortSignal convention drafted in core

## Acceptance Criteria

- [ ] resolveAsync resolves async factories and memoizes per scope
- [ ] createScope() returns an isolated child container
- [ ] All SPEC-001 tests still green; no breaking API change
- [ ] Working method (DoR/DoD, cadence) documented in project/README.md

## Checklist

- [ ] Confirm team roles, cadence and ceremonies
- [ ] Add scoped/async resolution to ServiceContainer
- [ ] Unit tests for scopes and async resolution
- [ ] Draft AbortSignal/CancelledError shape
- [ ] Update ADRs if the container contract changes
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Core v0.2-alpha: async/scoped DI merged on a feature branch; process docs in place.
