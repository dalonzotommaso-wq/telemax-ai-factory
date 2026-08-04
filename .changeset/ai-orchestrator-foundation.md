---
"@telemax/ai": minor
---

Initial AI Orchestrator foundation (SPEC-004): provider-agnostic infrastructure
that coordinates the Knowledge and Prompt engines. Includes the orchestration
flow (context → prompt → provider → model → prepared request → standardized
response), provider/model registries and SPI, resilience (retry, circuit breaker,
rate limiter, health), cost, telemetry, conversations, context, streaming and
cache. No HTTP, no API keys, no external calls; a local deterministic stub
provider is included. Depends only on `@telemax/core`, `@telemax/knowledge` and
`@telemax/prompt-engine`.
