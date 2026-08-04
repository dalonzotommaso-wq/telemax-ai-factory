# Sprint 02 — Core hardening: disposal, errors, Result, telemetry port

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `FND-02`, `FND-03`, `FND-04`, `FND-05`, `FND-07`
- **Planned capacity:** 19 SP (assumed velocity ~24 SP/sprint)

## Objective

Complete the additive Core primitives the orchestrator depends on: disposal, cancellation, error metadata, Result ergonomics and a telemetry port.

## Input

- Core v0.2-alpha (Sprint 1)

## Output

- Disposable services + kernel/scope disposal
- CancelledError + AbortSignal wiring
- FrameworkError with retryable/status/data
- Result andThen/mapErr/fromPromise/tryCatch
- TelemetrySink interface + no-op default

## Acceptance Criteria

- [ ] Disposing a scope releases its disposables deterministically
- [ ] Cancelling a signal surfaces a CancelledError
- [ ] New Result helpers covered by unit tests
- [ ] TelemetrySink present with a no-op default and documented
- [ ] `any` still banned; lint/typecheck/test green

## Checklist

- [ ] Implement Disposable + teardown disposal
- [ ] Add CancelledError and signal helpers
- [ ] Extend FrameworkError metadata (backward compatible)
- [ ] Add Result combinators + tests
- [ ] Add TelemetrySink port + no-op + tests
- [ ] Changeset for @telemax/core
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Core v0.2: all additive primitives merged; @telemax/core changeset ready.
