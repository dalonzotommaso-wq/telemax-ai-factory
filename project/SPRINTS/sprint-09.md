# Sprint 09 — Provider: Anthropic (Claude) + provider sandbox

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `PRV-02`, `QA-03`
- **Planned capacity:** 13 SP (assumed velocity ~24 SP/sprint)

## Objective

Ship the first real provider adapter (Claude) and a deterministic provider sandbox for testing.

## Input

- Streaming pipeline (Sprint 8)
- Anthropic API access

## Output

- Anthropic adapter (complete + stream)
- Error mapping to AIError
- Capability declaration
- Provider mock/sandbox for tests

## Acceptance Criteria

- [ ] complete() and stream() work against Claude behind the orchestrator
- [ ] Anthropic errors normalize correctly (429/5xx/4xx)
- [ ] Capabilities reported accurately
- [ ] Sandbox enables deterministic tests without network
- [ ] Secrets loaded via SecretsProvider only

## Checklist

- [ ] Implement Anthropic adapter as a plugin
- [ ] Map errors + declare capabilities
- [ ] Wire secrets + pooled HTTP client
- [ ] Build provider sandbox/mocks
- [ ] Adapter + sandbox tests
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

@telemax/provider-anthropic: first provider usable through the orchestrator.
