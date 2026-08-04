# ADR-0008 — Workflow Engine architecture

- **Status:** Accepted
- **Date:** 2026-07-28
- **Context:** SPEC-005 — Workflow Engine (`@telemax/workflow`)

## Context

The framework needs an engine to define reusable, composable workflows that
coordinate the AI Orchestrator, Prompt Engine, Knowledge Engine and the future
Generator Engine. For this sprint it must be infrastructure only (no real
generators, no external I/O) and must stay consistent with the foundation: strict
TypeScript, SOLID, Clean Architecture, DI, event-driven, `Result`-based errors,
and no circular dependencies.

## Decision

1. **Declarative, serializable model.** A workflow is a step tree
   (`sequence`/`parallel`/`branch`/`loop`/`task`/`subworkflow`, plus prepared
   `approval`/`tool`) with declarative `Condition`s. This enables validation,
   versioning and import/export without evaluating arbitrary code.
2. **Compile then execute.** `WorkflowCompiler` validates a definition and
   produces an immutable `Workflow` (checksum + SHA-256 version signature) stored
   in a versioned `WorkflowRegistry`; `WorkflowExecutor` runs it.
3. **Ports + Dependency Injection.** The engine depends on abstractions
   (`StepHandler`, `ConditionEvaluator`, `MetricsSink`, and prepared approval/tool/
   distributed ports); adapters are composed by `registerWorkflowEngine`.
4. **Coordinate engines via handlers.** `aiStepHandler`, `promptStepHandler` and
   `knowledgeStepHandler` turn the other engines into step handlers, so the
   Workflow Engine composes them without embedding provider logic. Tests use the
   AI Orchestrator's local stub — no HTTP, no keys.
5. **Executor owns resilience.** Per-step retry, timeout and rollback
   (compensating handlers in reverse) plus a workflow-level failure mode give
   uniform, production-shaped behavior with no external calls.
6. **Dependency direction.** `workflow` depends on `ai → prompt-engine →
knowledge → core`, a linear graph with no cycles.
7. **Advanced capabilities prepared.** Human Approval, MCP, Tool/Function calling,
   Multi-Agent, Scheduled and Distributed workflows exist as ports/types and
   report `NotImplemented` until adapters arrive.

## Consequences

- **Positive:** reusable and composable workflows; serializable and versioned;
  new engines/generators plug in as handlers; resilience is uniform and testable;
  safe to ship with no external dependencies.
- **Negative / trade-offs:** without real generators/providers the executed
  behavior is stub/handler-driven; approval, tools, scheduling and distribution
  are prepared, not active; conditions are intentionally limited to a safe,
  declarative set rather than arbitrary predicates. All are isolated behind ports.
