# Sprint 06 — Error taxonomy + retry + timeout

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `PRV-01`, `RES-01`, `RES-02`
- **Planned capacity:** 13 SP (assumed velocity ~24 SP/sprint)

## Objective

Normalize provider errors and add the first resilience middleware: bounded retry with backoff and per-call timeouts.

## Input

- Orchestrator spine (Sprint 5)

## Output

- AIError taxonomy + normalization framework
- Retry middleware (backoff + jitter, Retry-After)
- Timeout middleware tied to AbortSignal

## Acceptance Criteria

- [ ] Vendor-style errors map to categories with correct retryable flags
- [ ] Retries are bounded and honor Retry-After
- [ ] Timeouts cancel in-flight calls via AbortSignal
- [ ] Non-retryable errors are not retried
- [ ] Deterministic tests with fault-injecting fake provider

## Checklist

- [ ] Define AIError categories + base class
- [ ] Build error normalization utilities
- [ ] Implement retry middleware + tests
- [ ] Implement timeout middleware + tests
- [ ] Fault-injection test fixtures
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Normalized errors + retry/timeout middleware, verified with fault injection.
