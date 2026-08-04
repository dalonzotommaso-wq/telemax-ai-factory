# Sprint 10 — Provider: OpenAI (ChatGPT) + test standards

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `PRV-03`, `QA-01`
- **Planned capacity:** 11 SP (assumed velocity ~24 SP/sprint)

## Objective

Add the OpenAI adapter and codify testing standards across the workspace.

## Input

- Anthropic adapter (Sprint 9)
- OpenAI API access

## Output

- OpenAI adapter (complete + stream)
- Testing standards + coverage gates

## Acceptance Criteria

- [ ] OpenAI adapter passes the same behavioral tests as Anthropic
- [ ] Two providers are interchangeable behind the facade
- [ ] Coverage gates enforced in CI
- [ ] Error mapping validated against OpenAI semantics

## Checklist

- [ ] Implement OpenAI adapter as a plugin
- [ ] Reuse behavioral test suite
- [ ] Define coverage thresholds
- [ ] Document testing standards
- [ ] CI wiring for coverage
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

@telemax/provider-openai; documented testing standards; two interchangeable providers.
