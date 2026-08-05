# Sprint 12 — Provider: Gemini + contract tests + capability matrix

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `PRV-06`, `PRV-07`, `PRV-08`
- **Planned capacity:** 16 SP (assumed velocity ~24 SP/sprint)

## Objective

Add Gemini and lock provider quality with a contract test suite and a documented capability matrix.

## Input

- Multiple providers (Sprint 11)
- Gemini API access

## Output

- Gemini adapter
- Provider contract/conformance test suite
- Capability matrix (documented + tested)

## Acceptance Criteria

- [ ] Gemini passes the behavioral suite
- [ ] Contract tests run against every provider
- [ ] Capability matrix reflects real, tested capabilities
- [ ] Any capability gap is explicit, not silent

## Checklist

- [ ] Implement Gemini adapter
- [ ] Build provider contract test suite
- [ ] Generate capability matrix from tests
- [ ] Document per-provider capabilities
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

All five providers live and conformance-tested; capability matrix published.
