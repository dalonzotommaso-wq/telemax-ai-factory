# Sprint 18 — Quality gates + deterministic writer + workflow runner

- **Milestone:** M2
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `QGATE-01`, `GEN-06`, `GEN-08`, `ASSET-03`
- **Planned capacity:** 23 SP (assumed velocity ~24 SP/sprint)

## Objective

Ensure generated output is correct and reproducible, and enable multi-step generation workflows.

## Input

- Generator infrastructure (Sprint 17)

## Output

- Artifact validators (format/lint/typecheck)
- Deterministic file writer + formatter
- Multi-step workflow runner
- Workflow definition format

## Acceptance Criteria

- [ ] Generated files are validated (format/lint/typecheck) before export
- [ ] Re-running a generation yields byte-stable output
- [ ] A workflow can chain multiple generators
- [ ] Failing validations block export with clear diagnostics

## Checklist

- [ ] Implement artifact validators
- [ ] Implement deterministic writer/formatter
- [ ] Implement workflow runner + definition format
- [ ] Tests for validation and determinism
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Quality gates + deterministic output + workflow runner.
