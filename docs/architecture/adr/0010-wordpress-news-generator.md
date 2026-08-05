# ADR-0010 — WordPress News generator architecture

- **Status:** Accepted
- **Date:** 2026-07-28
- **Context:** SPEC-007 — WordPress News Generator MVP (`@telemax/generator-wordpress`)

## Context

The framework needs its first real, usable generator. It must produce a complete
WordPress News theme **project structure** as artifacts — not a plugin and not
definitive WordPress code — on top of the existing engine stack, without modifying
the core packages, and it must be a genuine professional generator rather than a
bag of templates.

## Decision

1. **Author on the generic Generator Engine.** The package builds a declarative
   `GeneratorDefinition` (templates + pipeline) and runs it on a `GeneratorEngine`.
   No engine is modified; the engine stays target-agnostic.
2. **Scaffolding only.** Every generated `.php` file is a reviewed-before-use
   scaffold with `TODO` markers. No plugin, no production code, no external I/O.
3. **Blueprint-driven design.** Ten blueprints model the project: Project (logical
   structure + artifact dependency graph), Design Tokens, Layout Engine, Component
   Registry (13 components with generated scaffolds), SEO, Accessibility
   (WCAG 2.2 AA with computed contrast), Core Web Vitals, Advertisement,
   Performance, and a Validation Engine. The blueprints are emitted as JSON/CSS/MD
   artifacts so the generated project carries its own specification.
4. **Real engine integrations.** The pipeline coordinates the Workflow Engine
   (build metadata), the Prompt Engine (meta description) and the Knowledge Engine
   (naming conventions via ingest → full-text retrieval) — genuine coordination,
   not just emission.
5. **Validate before generating.** `validateProject` checks configuration,
   template integrity, the artifact dependency graph (missing deps, cycles) and
   WCAG AA contrast, failing fast before any artifact is produced.
6. **Versioning.** The generator is versioned by the engine (checksum +
   signature); artifacts are stamped with the generator version and catalogued in
   the project blueprint and build-info artifacts.

## Consequences

- **Positive:** a usable, professional-grade project generator; blueprint-driven
  and self-documenting output; real cross-engine coordination; strong validation;
  no changes to the engine stack.
- **Negative / trade-offs:** artifacts are produced in memory (a filesystem writer
  is future work); the `.php` output is scaffolding requiring completion; editorial
  copy uses deterministic prompt rendering rather than a real AI provider (which
  plugs in later behind the engine's `ai` coordination).
