# Sprint 08 — Streaming + cancellation end-to-end

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `ORC-09`, `FND-06`
- **Planned capacity:** 10 SP (assumed velocity ~24 SP/sprint)

## Objective

Add first-class streaming through the whole pipeline with clean cancellation and back-pressure.

## Input

- Resilience suite (Sprint 7)

## Output

- stream() returning an AsyncIterable of chunks
- Cancellation unwinds the pipeline and provider call
- Back-pressure honored on slow consumers
- Optional plugin health()/ready() hooks

## Acceptance Criteria

- [ ] stream() yields incremental chunks and a final completion
- [ ] Aborting mid-stream stops upstream work and frees resources
- [ ] Middleware (telemetry/limits) works on the streaming path
- [ ] Slow consumers apply back-pressure without unbounded buffering
- [ ] Streaming covered by tests with a fake streaming provider

## Checklist

- [ ] Design StreamChunk contract
- [ ] Implement streaming pipeline + cancellation
- [ ] Ensure middleware compatibility with streams
- [ ] Add plugin health hooks
- [ ] Streaming + cancellation tests
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Streaming and cancellation working end-to-end over a fake provider.
