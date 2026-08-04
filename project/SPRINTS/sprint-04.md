# Sprint 04 — AI Orchestrator scaffold: SPI, model, registry

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `ORC-01`, `ORC-02`, `ORC-03`, `ORC-04`
- **Planned capacity:** 18 SP (assumed velocity ~24 SP/sprint)

## Objective

Create the orchestrator package and define the stable extension points: the provider SPI, the provider-agnostic message/capability model and the provider registry.

## Input

- Core v0.2 + Config v2 (Sprints 2-3)

## Output

- @telemax/ai-orchestrator package
- AIProvider / LanguageModel SPI
- Message / Content / ModelCapabilities model
- ProviderRegistry (register/resolve by id+capability)

## Acceptance Criteria

- [ ] Package builds and depends only on @telemax/core
- [ ] SPI compiles and is documented with TSDoc
- [ ] Registry rejects duplicates and resolves by capability
- [ ] No provider implementation included (SPI only)
- [ ] lint/typecheck/test green

## Checklist

- [ ] Scaffold package (README, tsconfig, exports)
- [ ] Define AIProvider/LanguageModel contracts
- [ ] Define message/capability types
- [ ] Implement ProviderRegistry + tests
- [ ] Publish SPI docs in package README
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

@telemax/ai-orchestrator with a stable, documented SPI and registry (no providers yet).
