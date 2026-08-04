# Sprint 17 — Generator SPI + templates + prompt library

- **Milestone:** M2
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `GEN-04`, `GEN-05`, `ASSET-01`, `ASSET-02`
- **Planned capacity:** 20 SP (assumed velocity ~24 SP/sprint)

## Objective

Define how concrete generators plug in, and stand up the template and prompt infrastructure they use.

## Input

- Generation engine core (Sprint 16)

## Output

- Generator SPI (extends generator-kit)
- Template engine integration
- Prompt library (versioned)
- Template repository & resolver

## Acceptance Criteria

- [ ] A generator can be registered and invoked by the pipeline
- [ ] Templates render deterministically from data
- [ ] Prompts are versioned and resolvable by id
- [ ] No concrete target generator yet (infrastructure only)

## Checklist

- [ ] Define Generator SPI on top of generator-kit
- [ ] Integrate a template engine
- [ ] Build prompt library + resolver
- [ ] Build template repository + resolver
- [ ] Tests for templating and prompt resolution
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Generator SPI + template + prompt infrastructure ready for real generators.
