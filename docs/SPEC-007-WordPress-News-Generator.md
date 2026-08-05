# SPEC-007 — WordPress News Generator (MVP)

- **Package:** `@telemax/generator-wordpress`
- **Status:** Delivered (SPRINT-007)
- **Depends on:** `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`, `@telemax/ai`, `@telemax/workflow`, `@telemax/generator-engine`
- **ADR:** [ADR-0010](architecture/adr/0010-wordpress-news-generator.md)

## 1. Purpose

The first real, usable generator of the framework. It produces the complete
project structure of a WordPress News theme as versioned, validated artifacts via
the Generator Engine, integrating the Workflow, Prompt and Knowledge engines. It
generates **project scaffolding only** — no plugin and no definitive WordPress
code.

## 2. Scope

**In scope:** folder structure; initial configuration; page templates; homepage,
article, category and archive layouts; header; footer; menu; sidebar; advertising
blocks; widget areas; SEO components; Schema.org; `robots.txt`; sitemap
configuration; manifest; image structure; naming conventions; project
documentation. Artifacts are produced through the Generator Engine, each versioned
and each template validated.

**Professional subsystems (blueprints):** Project Blueprint (logical structure +
artifact dependency graph), Design Tokens, Layout Engine, Component Registry (Hero,
Card News, Breaking News, Live Banner, Video Block, Gallery, Related Articles,
Author Box, Breadcrumb, Social Share, Newsletter, Comments, Banner ADV), SEO
Blueprint, Accessibility Blueprint (WCAG 2.2 AA + contrast checking), Core Web
Vitals Blueprint, Advertisement Blueprint, Performance Blueprint, and a
pre-generation Validation Engine.

**Out of scope:** a WordPress plugin, production WordPress code, real AI providers,
filesystem writing (artifacts are produced in memory by the Generator Engine).

## 3. Architecture

The package builds a declarative `GeneratorDefinition` (templates + pipeline) and
runs it on a `GeneratorEngine`. The pipeline first runs three integration steps —
a `workflow` step (build metadata), a `prompt` step (meta description) and a
`transform` step backed by the Knowledge Engine (naming conventions) — then a
`template` step per artifact (including a scaffold per registered component) and a
set of `emit` steps for static and blueprint artifacts. Variables are assembled
from the resolved config plus the serialized blueprints.

`validateProject(config)` runs before generation: it validates the configuration,
template integrity (non-empty bodies, unique ids, only known variables), the
artifact dependency graph (no missing dependencies, no cycles) and the design
tokens' WCAG AA contrast.

## 4. Public API

`generateWordPressNews(config, options?)` (validate → wire engines → generate),
`registerWordPressNews(deps, config)` (wiring helper),
`buildWordPressNewsDefinition(config)`, `validateProject`,
`resolveWordPressConfig`, and every blueprint builder
(`defaultDesignTokens`, `layoutBlueprint`, `componentRegistry`, `seoBlueprint`,
`accessibilityBlueprint`, `webVitalsBlueprint`, `advertisementBlueprint`,
`performanceBlueprint`, `buildProjectBlueprint`).

## 5. Key decisions

| Decision                                                   | Rationale                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Author on the generic Generator Engine (no engine changes) | Reuse pipeline/versioning/validation; keep the engine target-agnostic     |
| Scaffolding artifacts only (no plugin, no final code)      | Deliver a usable project skeleton safely; every `.php` is a reviewed stub |
| Blueprint-driven, not template-only                        | A real generator models tokens, layout, components, SEO, a11y, CWV, ads   |
| Real engine integrations (Workflow, Prompt, Knowledge)     | The generator coordinates, not just emits                                 |
| Validation Engine before generation                        | Fail fast on config, templates, dependency graph and contrast             |
| Depend on all six allowed packages; no cycles              | Sits on top of the engine stack                                           |

## 6. Error handling

`WordPressConfigError` (config/template/project validation, with `issues`) and the
Generator Engine's `GeneratorError` on the generation path.

## 7. Testing

Unit tests cover config resolution, config/template/project validation, every
blueprint (design tokens, components, layout, SEO, accessibility with contrast,
Core Web Vitals, advertising, performance, project graph), the templates, the
generator definition, and the full end-to-end `generateWordPressNews` (40+
artifacts, engine coordination, blueprint emission, component scaffolds). Result:
12 files, 26 tests, all green; coverage ≈ 97% lines.

## 8. Future work

Real filesystem writer; additional targets on the same engine; wiring a real AI
provider for editorial copy; theme-check automation over the generated project.

## 11. v1 — usable project generation (SPRINT-009)

The generator is now runnable end-to-end and writes a complete project to disk.

- **Filesystem output.** `generateWordPressNewsProject(config, { outputDir })`
  generates the artifacts and persists them via the engine's new
  `FileSystemArtifactWriter` (see [ADR-0011](architecture/adr/0011-project-writer-and-cli.md)),
  defaulting to `output/wordpress-news/`.
- **Complete theme.** Added templates `home.php`, `search.php`, `author.php`,
  `404.php`, a `screenshot.svg` placeholder and generated front-end assets
  (`assets/css/main.css`, `assets/js/main.js`). `functions.php` now registers
  theme supports, nav menus and enqueues the generated assets.
- **Metadata & version.** Every artifact embeds the generator version and
  generation timestamp; `.telemax/manifest.json` catalogs each artifact with
  content type, byte size, SHA-256 checksum and version.
- **Demo CLI.** `pnpm telemax generate wordpress-news [--out <dir>] [--name <site>]
[--url <url>]` generates an example project.
- **Integration tests** verify the project is really written to disk (files,
  metadata, manifest).

Still scaffolding (no plugin, no production PHP); editorial copy is deterministic
(no real AI provider yet).
