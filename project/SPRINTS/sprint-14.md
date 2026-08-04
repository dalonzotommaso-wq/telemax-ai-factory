# Sprint 14 — Caching + cost-aware routing

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `CACHE-01`, `CACHE-02`, `ORC-08`
- **Planned capacity:** 15 SP (assumed velocity ~24 SP/sprint)

## Objective

Add a caching layer and smarter routing that uses cost/latency signals.

## Input

- Telemetry + cost (Sprint 13)

## Output

- CacheStore port + memory adapter
- Exact-match response cache
- Cost-aware & failover routing strategies

## Acceptance Criteria

- [ ] Identical requests are served from cache when enabled
- [ ] Cost-aware routing selects the cheapest capable provider
- [ ] Failover routing degrades gracefully
- [ ] Caching respects redaction and tenancy keys

## Checklist

- [ ] Define CacheStore port + memory adapter
- [ ] Implement exact-match cache middleware
- [ ] Implement cost-aware/failover strategies
- [ ] Tests for cache hits and routing decisions
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Response caching + cost-aware routing wired into the pipeline.
