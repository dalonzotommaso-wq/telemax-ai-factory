# Sprint 11 — Providers: Ollama (local) + OpenRouter

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `PRV-04`, `PRV-05`
- **Planned capacity:** 10 SP (assumed velocity ~24 SP/sprint)

## Objective

Enable a self-hosted path (Ollama) and aggregated access (OpenRouter), proving the SPI across very different providers.

## Input

- OpenAI adapter (Sprint 10)
- Local Ollama runtime; OpenRouter access

## Output

- Ollama adapter (local/on-prem)
- OpenRouter adapter

## Acceptance Criteria

- [ ] Ollama runs fully offline behind the orchestrator
- [ ] OpenRouter routes to multiple upstream models
- [ ] Both pass the shared behavioral suite
- [ ] Capabilities differ correctly per provider

## Checklist

- [ ] Implement Ollama adapter
- [ ] Implement OpenRouter adapter
- [ ] Validate against behavioral suite
- [ ] Document local/offline setup
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

@telemax/provider-ollama and @telemax/provider-openrouter; on-prem path proven.
