# Sprint 16 — Generation Engine core: project, artifacts, pipeline

- **Milestone:** M2
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `GEN-01`, `GEN-02`, `GEN-03`
- **Planned capacity:** 18 SP (assumed velocity ~24 SP/sprint)

## Objective

Start the generation engine: the project/workspace model, the artifact/file model, and the plan→generate→assemble→validate pipeline.

## Input

- AI Gateway v0.2 (Sprint 15)

## Output

- Project & workspace model
- Artifact/file model (text/binary, diffs)
- Generation pipeline skeleton

## Acceptance Criteria

- [ ] A project can be created and described in memory
- [ ] Artifacts can be produced, assembled into a tree and serialized
- [ ] The pipeline runs plan→generate→assemble→validate with a fake generator
- [ ] Pipeline stages are observable via telemetry

## Checklist

- [ ] Implement project/workspace model
- [ ] Implement artifact/file model
- [ ] Implement pipeline stages
- [ ] Wire telemetry into pipeline
- [ ] Unit tests with a fake generator
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Generation engine core: project/artifact model + working pipeline (no real generators yet).
