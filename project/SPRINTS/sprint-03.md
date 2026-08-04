# Sprint 03 — Configuration v2 + Secrets foundation

- **Milestone:** M1
- **Duration:** 2 weeks (relative to project kickoff)
- **Backlog items:** `CFG-01`, `CFG-03`, `SEC-01`, `SEC-02`, `SEC-03`, `FND-08`
- **Planned capacity:** 26 SP (assumed velocity ~24 SP/sprint)

## Objective

Extend configuration for nested provider schemas and introduce a secrets abstraction with redaction, so API keys never touch config files or logs.

## Input

- Core v0.2 (Sprint 2)

## Output

- Nested/namespaced config schemas (ai.providers.\*)
- SecretsProvider port + env & file stores
- Secret references resolved lazily
- Redaction-by-default in logger
- Request-scoped logger bindings

## Acceptance Criteria

- [ ] A nested config validates and returns a typed Result
- [ ] Secrets resolve via SecretsProvider and never appear in the plain config object
- [ ] Logs redact secrets and message content by default
- [ ] correlationId can be bound on a child logger
- [ ] Unit tests cover happy/invalid paths

## Checklist

- [ ] Add nested schema support to @telemax/config
- [ ] Implement SecretsProvider + env/file adapters
- [ ] Wire secret references into config load
- [ ] Add redaction hook to logger + defaults
- [ ] Tests for config, secrets and redaction
- [ ] Changesets for config/core
- [ ] Definition of Done met for every backlog item in scope
- [ ] Changesets added; CI green (format, lint, typecheck, test, build)
- [ ] Sprint review + retrospective held; notes recorded

## Deliverable

Config v2 + secrets + redaction merged; provider credentials can be supplied safely.
