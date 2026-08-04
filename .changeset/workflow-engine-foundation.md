---
"@telemax/workflow": minor
---

Initial Workflow Engine foundation (SPEC-005): infrastructure to define reusable,
composable workflows that coordinate the AI Orchestrator, Prompt Engine, Knowledge
Engine and future Generator Engine. Includes a declarative step tree
(sequence/parallel/branch/loop/task/subworkflow), declarative conditions, per-step
retry/timeout/rollback, compiler, validator, versioned registry, scheduler,
import/export, events, metrics and DI. Advanced capabilities (Human Approval, MCP,
Tool/Function calling, Multi-Agent, Scheduled, Distributed) are prepared.
Infrastructure only; depends on `@telemax/core`, `@telemax/knowledge`,
`@telemax/prompt-engine` and `@telemax/ai`, with no circular dependencies.
