# SPEC-005 — Workflow Engine

- **Package:** `@telemax/workflow`
- **Status:** Delivered (SPRINT-005)
- **Depends on:** `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`, `@telemax/ai`
- **ADR:** [ADR-0008](architecture/adr/0008-workflow-engine-architecture.md)

## 1. Purpose

The Workflow Engine coordinates the framework's engines — AI Orchestrator, Prompt
Engine, Knowledge Engine and the future Generator Engine — to run reusable,
composable workflows. It delivers infrastructure only: no real generators, no
HTTP, no API keys. Coordination is exercised through the AI Orchestrator's local
stub.

## 2. Scope

**In scope (infrastructure):** `Workflow`/`WorkflowDefinition`, `WorkflowEngine`,
`WorkflowContext`, `WorkflowState`, `WorkflowStep`, `WorkflowExecutor`,
`WorkflowRegistry`, `WorkflowValidator`, `WorkflowCompiler`, `WorkflowEvent`(bus),
`WorkflowResult`, `WorkflowMetadata`, `WorkflowScheduler`, `Condition`, `Branch`,
`Loop`, `ParallelStep`, `RetryPolicy`, `RollbackPolicy`, `TimeoutPolicy`,
event-bus integration, configuration, errors, interfaces, types and utils.
Supports sequential and parallel workflows, conditional branching, retry,
rollback, timeout, events, logging, metrics, serialization, import/export,
versioning and validation.

**Prepared (ports/types, `NotImplemented`):** Human Approval, MCP, Tool Calling,
Function Calling, Multi-Agent, Scheduled and Distributed workflows.

**Out of scope:** real generators, external I/O.

## 3. Architecture

Clean Architecture with Dependency Inversion and an event-driven core. A
`WorkflowDefinition` is a declarative, serializable step tree. The
`WorkflowCompiler` validates it and produces an immutable `Workflow` (checksum +
version signature), stored in a versioned `WorkflowRegistry`. The
`WorkflowExecutor` runs the tree against an immutable `WorkflowContext`:

- **task** — runs a registered `StepHandler`, applying retry/timeout, optionally
  storing the output in a variable and registering a rollback compensation.
- **sequence** — runs children in order.
- **parallel** — runs branches concurrently and merges their context.
- **branch** — evaluates a `Condition` and runs `then`/`otherwise`.
- **loop** — repeats a body while a condition holds, bounded by `maxIterations`.
- **subworkflow** — resolves and runs another workflow (composability).
- **approval/tool** — prepared; go through optional ports, else `NotImplemented`.

On failure the engine either halts or rolls back (compensating handlers run in
reverse). Handlers coordinate the other engines: `aiStepHandler`,
`promptStepHandler`, `knowledgeStepHandler`.

## 4. Public interfaces (ports)

`StepHandler`, `ConditionEvaluator`, `MetricsSink`, and the prepared
`HumanApprovalGateway`, `ToolInvoker`, `DistributedExecutor`. The `WorkflowEngine`
façade exposes `registerWorkflow`, `run`, `registerHandler`/`registerAI`/
`registerPrompt`, `getWorkflow`, `listWorkflows`, `getVersions`, `schedule`,
`runDue`, `exportBundle`, `importBundle` and `on`.

## 5. Key decisions

| Decision                                                   | Rationale                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Declarative, serializable step & condition tree            | Import/export, versioning and validation without evaluating code           |
| Ports + DI (Clean Architecture)                            | Swap handlers, evaluator, metrics, approval/tool ports freely              |
| Depend on core + knowledge + prompt-engine + ai, no cycles | Reuse primitives; coordinate engines via handlers; linear dependency graph |
| `StepHandler` adapters for AI/Prompt/Knowledge             | Coordination without embedding provider logic; stub-backed in tests        |
| Executor owns retry/timeout/rollback                       | Uniform resilience across every step kind                                  |
| Signature = SHA-256 over the canonical definition          | Stable version identity, order-independent                                 |
| Advanced capabilities prepared behind ports/types          | Human Approval, MCP, tools, multi-agent, scheduling, distribution later    |

## 6. Error handling

All errors extend the Core `FrameworkError`: `WorkflowValidationError`,
`WorkflowNotFoundError`, `WorkflowDuplicateError`, `StepExecutionError`,
`WorkflowTimeoutError`, `WorkflowCompilationError`, `WorkflowNotImplementedError`,
`WorkflowIoError` — unioned as `WorkflowError`.

## 7. Logging, metrics, events

Optional Core `Logger`; a `MetricsSink` port (noop default, `MetricsCollector`
for inspection); a typed `WorkflowEventBus` emits workflow/step/branch/loop/
parallel/import/export/schedule events.

## 8. Security & performance

No secrets or network I/O. Loops are bounded by `maxIterations` and the engine
`maxLoopIterations`; parallelism is available for independent branches; steps are
guarded by timeouts and retries; failures can compensate via rollback.

## 9. Future compatibility

Real generators and providers plug in as `StepHandler`s. Approval, tools/MCP,
function calling, multi-agent, scheduled and distributed execution activate as
their prepared ports gain adapters — without changing the definition model or the
executor's shape.

## 10. Testing

Unit tests cover the condition evaluator, validator, compiler, registry,
scheduler, handlers, metrics, events, timeout, the executor (sequential, parallel,
branch, loop cap, retry success/exhaustion, rollback, subworkflow, prepared
approval/tool, timeout), the AI/Prompt adapters, the engine (run, versioning,
import/export, AI coordination) and DI. Result: 13 files, 35 tests, all green;
coverage ≈ 88% lines.
