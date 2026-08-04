# @telemax/workflow

## [0.1.0] - Unreleased

### Added

- Initial Workflow Engine foundation (SPEC-005): infrastructure to define
  reusable, composable workflows coordinating the AI Orchestrator, Prompt Engine,
  Knowledge Engine and future Generator Engine. Depends on `@telemax/core`,
  `@telemax/knowledge`, `@telemax/prompt-engine` and `@telemax/ai`; no cycles.
- `WorkflowEngine` façade: register/compile/validate/version, run, schedule,
  import/export, events.
- Composable step tree (`sequence`, `parallel`, `branch`, `loop`, `task`,
  `subworkflow`; prepared `approval`, `tool`) with declarative `Condition`s.
- `WorkflowExecutor` with per-step retry, timeout and rollback (compensating
  handlers), parallel join, bounded loops and subworkflow resolution.
- `WorkflowCompiler`, `WorkflowValidator`, `WorkflowRegistry` (version history),
  `WorkflowScheduler`, `ExportManager`/`ImportManager`, `WorkflowEventBus`,
  metrics, DI wiring (`registerWorkflowEngine`).
- Coordination adapters: `aiStepHandler`, `promptStepHandler`,
  `knowledgeStepHandler`; built-in `noop`/`echo` handlers.
- Prepared ports/types for Human Approval, MCP, Tool/Function calling,
  Multi-Agent, Scheduled and Distributed workflows.
- Unit tests (13 files, 35 tests).
