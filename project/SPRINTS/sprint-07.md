# Sprint 07 — Resilience suite: breaker, bulkhead, limiter, fallback

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `RES-03`, `RES-04`, `RES-05`, `RES-07`
- **Planned capacity:** 20 SP (assumed velocity ~24 SP/sprint)

## Objective

Complete resilience: per-provider circuit breaker, bulkhead/concurrency limits, a rate-limiter port and cross-provider fallback.

## Input

- Retry/timeout (Sprint 6)

## Output

- Circuit breaker (per provider)
- Bulkhead + concurrency limits
- Rate limiter port + local token-bucket adapter
- Fallback routing across providers

## Acceptance Criteria

- [ ] An open breaker short-circuits and routes to a fallback
- [ ] Concurrency caps are enforced under load
- [ ] Local rate limiter throttles as configured
- [ ] Fallback tries alternates in routing order
- [ ] Resilience behaviors unit-tested deterministically

## Checklist

- [ ] Implement circuit breaker middleware
- [ ] Implement bulkhead/concurrency limiter
- [ ] Define rate-limiter port + local adapter
- [ ] Wire fallback into routing
- [ ] Tests for each resilience behavior
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Full resilience layer as composable middleware; no provider or Core changes required.
