# @telemax/prompt-engine

Enterprise **Prompt Engine** for Telemax AI Factory. Reusable infrastructure used
by every AI agent, the Knowledge Engine and the AI Orchestrator to manage,
version, validate, render and compose prompts.

It is **provider-agnostic**: it knows nothing about Claude, ChatGPT, Gemini or any
other model. It contains **no concrete prompts** — only the machinery to build
them. It depends **only** on `@telemax/core` and `@telemax/knowledge`.

## Highlights

- **Templates** with variables, placeholders, dotted paths and a dependency-free
  render engine (interpolation, `if/else`, `unless`, `each`, partials, blocks).
- **Variables & schema validation** — typed variable declarations
  (`string`/`number`/`boolean`/`list`/`object`/`enum`), required/default/enum
  checks, with a pluggable JSON-Schema port prepared for structured output.
- **Versioning** — checksum (SHA-256 of the body) and a stable **version
  signature** (SHA-256 over the canonical template), with per-template history.
- **Composition & multi-level prompts** — assemble `system` / `developer` /
  `user` / `assistant` messages into a single rendered prompt.
- **Template inheritance** via named blocks (`{{#block name}}…{{/block}}`) and
  **extensions** contributing reusable partials.
- **i18n** — per-locale bodies with fallback resolution.
- **Cache, metrics, events, logging** — all behind ports, with safe defaults.
- **Import/export** — portable JSON bundles with re-validation on import.
- **Prepared** for Prompt Chains, RAG, Tool/Function calling, MCP, Structured
  Output, JSON Schema, XML and Markdown prompts.

## Install

Workspace-internal package:

```jsonc
// package.json
{
  "dependencies": {
    "@telemax/prompt-engine": "workspace:*",
  },
}
```

## Quick start

```ts
import { registerPromptEngine } from "@telemax/prompt-engine";
import { ServiceContainer } from "@telemax/core";

const engine = registerPromptEngine(new ServiceContainer());

await engine.registerTemplate({
  id: "greeting",
  name: "Greeting",
  role: "system",
  body: "You are {{persona}}. Greet {{user}} warmly.",
  variables: [
    { name: "persona", type: "string", required: true },
    { name: "user", type: "string", required: true },
  ],
});

const rendered = await engine.render({
  templateId: "greeting",
  variables: { persona: "a helpful assistant", user: "Ada" },
});
// rendered.value.content -> "You are a helpful assistant. Greet Ada warmly."
```

## Architecture

Clean Architecture with Dependency Inversion: the `PromptEngine` façade depends
only on ports (`interfaces.ts`); concrete adapters implement them and are wired
by DI. Errors travel via the Core `Result` type; the engine is event-driven.

```
             registerTemplate / render / renderComposition / import·export
                                    │
                            ┌───────▼────────┐
                            │  PromptEngine  │  (facade)
                            └───────┬────────┘
   ┌───────────┬───────────┬────────┼─────────┬───────────┬───────────┐
   ▼           ▼           ▼        ▼         ▼           ▼           ▼
Repository  Validator  SchemaVal  Renderer  Formatter  Registry    Cache
                                    │
                             Inheritance                     Metrics · Events
```

Layers: `types` / `errors` / `config` (base) → `domain/*` (entities: template,
variable, metadata, version, composition, advanced) → adapters (`rendering/*`,
`schema/*`, `cache/*`, `metrics/*`, `repository/*`) → application (`service`,
`registry`, `validator`, import/export) → `di`.

### Ports (adapters are swappable)

`TemplateRenderer`, `SchemaValidator`, `JsonSchemaValidator` (prepared),
`RenderCache`, `MetricsSink`, `TemplateRepository`, `PromptExtension`,
`LocaleResolver`, `PromptFormatter`, `PromptChainRunner` (prepared),
`RagAugmentor` (prepared).

## Formats

| Format     | Status      |
| ---------- | ----------- |
| `text`     | implemented |
| `markdown` | implemented |
| `xml`      | prepared    |
| `json`     | prepared    |

## Events

`template.registered` · `template.updated` · `template.removed` ·
`prompt.rendered` · `composition.rendered` · `cache.hit` · `cache.miss` ·
`import.completed` · `export.completed` · `prompt.error`.

## Scripts

```bash
pnpm --filter @telemax/prompt-engine build       # emit dist
pnpm --filter @telemax/prompt-engine typecheck   # tsc --noEmit
pnpm --filter @telemax/prompt-engine lint        # eslint
pnpm --filter @telemax/prompt-engine test        # vitest
pnpm --filter @telemax/prompt-engine test:coverage
```

## License

MIT © Gruppo AIR srl
