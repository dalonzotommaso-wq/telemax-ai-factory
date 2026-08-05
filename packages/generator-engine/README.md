# @telemax/generator-engine

The generic **Generator Engine** of Telemax AI Factory. It registers generators,
runs generation pipelines and produces artifacts, coordinating the **Workflow
Engine**, **AI Orchestrator**, **Prompt Engine** and **Knowledge Engine** through
injected runners.

It is **completely target-agnostic**: it knows nothing about WordPress, React,
Next.js, Laravel, Flutter, Desktop, API, SaaS, CRM or ERP. Those are _foreseen
targets_ — prepared as naming conventions only (`GENERATOR_TARGETS`); the engine
never branches on a target. This package is **infrastructure only**: no real
generators are shipped. It depends on `@telemax/core`, `@telemax/knowledge`,
`@telemax/prompt-engine`, `@telemax/ai` and `@telemax/workflow`, with no circular
dependencies.

## Highlights

- **Declarative generators** — a `GeneratorDefinition` is a serializable pipeline
  of steps, compiled by a `GeneratorFactory` into an immutable `Generator`
  (checksum + version signature).
- **Pipeline steps** — `template` and `emit` produce artifacts; `transform`,
  `workflow`, `prompt` and `ai` produce variables by coordinating other engines.
- **Artifacts** — `GeneratorArtifact`, `ArtifactCollection` and a pluggable
  `ArtifactWriter` (in-memory by default); `GeneratorOutput` is a serializable
  manifest snapshot.
- **Coordination adapters** — `workflowRunner`, `aiRunner`, `promptRunner`,
  `knowledgeRunner` turn the other engines into runners the pipeline can call.
- **Lifecycle services** — validation, versioned registry, template repository,
  transforms, result cache, events, metrics, logging, and import/export bundles.

## Install

```jsonc
// package.json
{
  "dependencies": {
    "@telemax/generator-engine": "workspace:*",
  },
}
```

## Quick start

```ts
import { GeneratorEngine } from "@telemax/generator-engine";

const engine = new GeneratorEngine();

engine.registerGenerator({
  id: "landing",
  name: "Landing page",
  templates: [{ id: "page", name: "page", body: "<h1>{{title}}</h1>" }],
  pipeline: {
    steps: [{ id: "s1", kind: "template", templateId: "page", path: "{{title}}.html" }],
  },
});

const result = await engine.generate("landing", { title: "Home" });
// result.value.artifacts.get("Home.html")?.content -> "<h1>Home</h1>"
```

Coordinating other engines:

```ts
import { AIOrchestrator } from "@telemax/ai";
import { WorkflowEngine } from "@telemax/workflow";

engine.useAI(new AIOrchestrator(/* provider + model registered */));
engine.useWorkflow(new WorkflowEngine());

engine.registerGenerator({
  id: "ai-page",
  name: "AI page",
  pipeline: {
    steps: [
      { id: "draft", kind: "ai", input: "Write a hero title", output: "title" },
      { id: "emit", kind: "emit", path: "hero.txt", fromVariable: "title" },
    ],
  },
});
```

## Architecture

Clean Architecture with Dependency Inversion and an event-driven core. The
`GeneratorEngine` façade compiles and validates definitions, stores them in a
versioned registry, and delegates execution to a `GeneratorExecution` that runs
the pipeline against a `GeneratorContext`, emitting events and metrics and writing
artifacts. Every collaborator is a port with a swappable adapter.

```
 GeneratorDefinition ──factory (validate + compile)──▶ Generator (registry, versioned)
                                                          │ generate
                                                          ▼
                                                  GeneratorExecution
      template · emit  ──▶ artifacts (ArtifactWriter, ArtifactCollection)
      transform ──▶ variable        workflow/prompt/ai ──▶ variable (via runners)
                                                          │
                                                          ▼
                                                    GeneratorResult
```

### Ports

`TemplateRenderer`, `GeneratorTransform`, `ArtifactWriter`, `MetricsSink`,
`GeneratorResultCache`, and the coordination runners `WorkflowRunner`,
`AIRunner`, `PromptRunner`, `KnowledgeRunner`.

### Step kinds

`template`, `emit`, `transform`, `workflow`, `prompt`, `ai`.

## Events

`generator.registered`, `generation.started/completed/failed`,
`step.started/completed/failed`, `artifact.written`, `cache.hit/miss`,
`import.completed`, `export.completed`.

## Foreseen targets

`wordpress`, `react`, `nextjs`, `laravel`, `flutter`, `desktop`, `api`, `saas`,
`crm`, `erp` — conventions only (`GENERATOR_TARGETS`). No specific generator is
implemented in this package.

## Scripts

```bash
pnpm --filter @telemax/generator-engine build
pnpm --filter @telemax/generator-engine typecheck
pnpm --filter @telemax/generator-engine lint
pnpm --filter @telemax/generator-engine test
pnpm --filter @telemax/generator-engine test:coverage
```

## License

MIT © Gruppo AIR srl
