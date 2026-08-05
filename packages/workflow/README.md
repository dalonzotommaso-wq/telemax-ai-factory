# @telemax/workflow

The **Workflow Engine** of Telemax AI Factory. It lets you define reusable,
composable workflows that coordinate the other engines — **AI Orchestrator**,
**Prompt Engine**, **Knowledge Engine** and the future **Generator Engine** —
through registered step handlers.

It is **infrastructure only**: no real generators, no HTTP, no API keys. Cross-engine
coordination is exercised with the AI Orchestrator's local stub. It depends on
`@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine` and `@telemax/ai`,
with no circular dependencies.

## Highlights

- **Composable step tree** — `sequence`, `parallel`, `branch`, `loop`, `task`,
  `subworkflow` (composability), plus prepared `approval` and `tool` steps.
- **Declarative conditions** — `always`, `var-truthy`, `var-equals`, `not`,
  `all`, `any`; serializable and safe (no code eval).
- **Resilience** — per-step retry, timeout and rollback; workflow-level failure
  mode (`halt` or `rollback` with compensating handlers run in reverse).
- **Coordination adapters** — `aiStepHandler`, `promptStepHandler`,
  `knowledgeStepHandler` turn the other engines into step handlers.
- **Lifecycle services** — `WorkflowCompiler`, `WorkflowValidator`,
  `WorkflowRegistry` (with version history), `WorkflowScheduler`,
  import/export bundles, event bus, metrics, logging.
- **Prepared** — Human Approval, MCP, Tool/Function calling, Multi-Agent,
  Scheduled and Distributed workflows (ports/types; `NotImplemented` by default).

## Install

```jsonc
// package.json
{
  "dependencies": {
    "@telemax/workflow": "workspace:*",
  },
}
```

## Quick start

```ts
import { WorkflowEngine } from "@telemax/workflow";

const engine = new WorkflowEngine();

engine.registerWorkflow({
  id: "greet-flow",
  name: "Greet flow",
  root: {
    id: "root",
    kind: "sequence",
    steps: [
      { id: "s1", kind: "task", handler: "echo", input: { hello: "world" }, output: "greeting" },
    ],
  },
});

const result = await engine.run("greet-flow");
// result.value.output.greeting -> { hello: "world" }
```

Coordinating the AI Orchestrator:

```ts
import { AIOrchestrator, StubProvider } from "@telemax/ai";

const orchestrator = new AIOrchestrator();
// ...register a provider + model...
engine.registerAI("ai", orchestrator);

engine.registerWorkflow({
  id: "ai-flow",
  name: "AI flow",
  root: { id: "call", kind: "task", handler: "ai", input: { input: "Hello!" }, output: "reply" },
});
```

## Architecture

Clean Architecture with Dependency Inversion and an event-driven core. The
`WorkflowEngine` façade compiles and validates definitions, stores them in a
versioned registry, and delegates execution to a `WorkflowExecutor` that applies
policies, evaluates conditions, runs parallel branches and loops, and resolves
subworkflows. Every collaborator is a port with a swappable adapter.

```
 WorkflowDefinition ──compile/validate──▶ Workflow (registry, versioned)
                                              │ run
                                              ▼
                                      WorkflowExecutor
        sequence · parallel · branch · loop · subworkflow · task
        retry · timeout · rollback · events · metrics
                                              │ task handlers
                                              ▼
      echo/noop · aiStepHandler · promptStepHandler · knowledgeStepHandler
```

### Ports

`StepHandler`, `ConditionEvaluator`, `MetricsSink`, and the prepared
`HumanApprovalGateway`, `ToolInvoker`, `DistributedExecutor`.

## Events

`workflow.registered/started/completed/failed/rolledback`,
`step.started/completed/failed/retried`, `branch.evaluated`, `loop.iteration`,
`parallel.joined`, `import.completed`, `export.completed`, `workflow.scheduled`.

## Scripts

```bash
pnpm --filter @telemax/workflow build
pnpm --filter @telemax/workflow typecheck
pnpm --filter @telemax/workflow lint
pnpm --filter @telemax/workflow test
pnpm --filter @telemax/workflow test:coverage
```

## License

MIT © Gruppo AIR srl
