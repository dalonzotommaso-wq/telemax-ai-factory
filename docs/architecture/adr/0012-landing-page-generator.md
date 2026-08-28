# ADR-0012 — Landing Page generator and API generator-adapter registry

- **Status:** Accepted
- **Date:** 2026-08-28
- **Context:** Second concrete generator (SPEC-008)

## Context

The factory shipped a single concrete generator, `@telemax/generator-wordpress`.
`apps/api`'s `GenerationService` dispatched to it with a hard-coded `isWordPress`
check that threw for every other `project.type`. We want a second, unrelated
target — a single-page static HTML/CSS landing page ("vetrina") — with AI-written
copy produced by the **same Content Plan mechanism**, without duplicating that
mechanism and without the dispatch turning into an ever-growing `if/else`.

## Decision

1. **New package `@telemax/generator-landing`, same layer as the WordPress
   generator.** It depends only on the six engine packages (`core`, `knowledge`,
   `prompt-engine`, `ai`, `workflow`, `generator-engine`) and nothing depends on
   it except `apps/api`. It mirrors the structure of `generator-wordpress` but
   lean: no CLI, and a deliberately minimal design-tokens module instead of the
   large blueprint subsystem.
2. **Content Plan reused as a pattern, not shared code.** The AI step → JSON →
   parse → validate against a typed contract → sanitise → deterministic fallback
   flow is re-implemented for the `LandingContentPlan` contract, exactly as the
   WordPress generator re-implements its own. The generator-specific
   `validateTemplates`, `resilientAiRunner`, `seedKnowledge` and `buildPromptEngine`
   helpers are likewise per-generator, as they already are for WordPress; the
   shared primitives stay in the engine packages they call. Output copy inserted
   into HTML is additionally HTML-escaped and CTA hrefs are scheme-restricted, so
   nothing the model returns can become markup or executable code.
3. **`apps/api` dispatches through a `GeneratorAdapter` registry.**
   `apps/api/src/services/generators/` defines the `GeneratorAdapter` contract
   (`matches` / `run`), one adapter per generator package, a shared `engine.ts`
   that opts into the real env-based AI Orchestrator, and `registry.ts`
   (`resolveAdapter`) that maps a project to its adapter or throws a message
   beginning `"No runnable generator"`. `GenerationService` keeps only the generic
   tail: record files, package `export/site.zip`, persist the generation row.
4. **Download generalised.** Packaging always writes `export/site.zip`; the new
   `GET /projects/:id/download/site` serves it and `GET /projects/:id/download/theme`
   is kept as a backward-compatible alias. The dashboard generation page labels the
   button per project type ("SCARICA SITO" for a landing page, "SCARICA TEMA"
   otherwise).

## Consequences

- **Positive:** a second target proves the engine's genericity and the
  Content Plan pattern; adding a third target is its adapter plus one line in the
  registry; the WordPress path is unchanged in behaviour; the generator
  auto-appears in the dashboard wizard via the existing repository scan.
- **Negative / trade-offs:** `validateTemplates` and the small AI/Knowledge/
  Workflow helpers are duplicated per generator (consistent with the current
  codebase; a shared helper in `@telemax/generator-engine` is a possible later
  consolidation). The `.html` output is a reviewed scaffold, not a finished
  design; editorial copy falls back to deterministic text when no real AI provider
  is configured.
