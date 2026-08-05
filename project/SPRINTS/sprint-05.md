# Sprint 05 — Facade + middleware pipeline + default routing

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `ORC-05`, `ORC-06`, `ORC-07`
- **Planned capacity:** 18 SP (assumed velocity ~24 SP/sprint)

## Objective

Assemble the orchestrator facade over a composable middleware pipeline, with a pluggable routing strategy and a safe default.

## Input

- Orchestrator SPI + registry (Sprint 4)

## Output

- Orchestrator facade (complete/embed; stream stub)
- Chain-of-Responsibility middleware pipeline
- RoutingStrategy port + default strategy

## Acceptance Criteria

- [ ] complete() runs a request through the pipeline to a (fake) model and returns a Result
- [ ] Middleware order is deterministic and unit-tested
- [ ] Default routing selects a provider by id/capability
- [ ] Facade has no provider-specific code
- [ ] Tests use an in-memory fake provider

## Checklist

- [ ] Implement facade + invocation context
- [ ] Build middleware pipeline abstraction
- [ ] Implement default RoutingStrategy
- [ ] Wire registry + routing + pipeline
- [ ] Tests with a fake provider
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

A working orchestrator spine: request → routing → middleware → model (fake) → Result.
