# Sprint 13 — Telemetry + cost & token tracking

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `OBS-01`, `OBS-03`
- **Planned capacity:** 10 SP (assumed velocity ~24 SP/sprint)

## Objective

Make the orchestrator observable: emit metrics/traces/events and track tokens and cost per request and provider.

## Input

- Providers live (Sprint 12)

## Output

- Telemetry wired across pipeline and providers
- CostTracker (usage x price -> Cost)
- Cost/tokens attached to completions

## Acceptance Criteria

- [ ] Latency, tokens, cost and outcome are emitted as metrics
- [ ] Spans cover routing, middleware and provider calls
- [ ] Cost is computed per request and per provider
- [ ] No secrets or prompt bodies leak into telemetry

## Checklist

- [ ] Instrument pipeline with TelemetrySink
- [ ] Implement CostTracker + price tables
- [ ] Attach usage/cost to Completion
- [ ] Redaction checks on telemetry attributes
- [ ] Tests for metrics and cost math
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Observability + cost tracking across all providers.
