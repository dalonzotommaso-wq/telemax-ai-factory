# SPEC-008 — Landing Page Generator

- **Package:** `@telemax/generator-landing`
- **Status:** Delivered
- **Depends on:** `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`, `@telemax/ai`, `@telemax/workflow`, `@telemax/generator-engine`
- **ADR:** [ADR-0012](architecture/adr/0012-landing-page-generator.md)

## 1. Purpose

The second real, usable generator of the framework. It produces a **single-page
static HTML/CSS landing page** (a company "vetrina") as versioned, validated
artifacts via the Generator Engine, integrating the Workflow, Prompt and
Knowledge engines. Output is a plain static site: no build tooling, no framework,
no server code — `index.html` opens directly in a browser.

## 2. Scope

**In scope:** a single HTML page (hero, in-page navigation, content sections,
optional feature cards, footer); a design-token stylesheet and a layout/component
stylesheet; a small progressive-enhancement script; `robots.txt`; project
`README.md`; machine-readable `config/content-plan.json` and
`config/design-tokens.json`; `.telemax/manifest.json` (per-artifact content type,
byte size, SHA-256 checksum, generator version) and `.telemax/build-info.json`.
Every artifact is produced through the Generator Engine and every template is
validated against the set of known variables.

**Out of scope:** multi-page sites, routing, CMS integration, asset pipelines,
image generation, and the large blueprint subsystem of the WordPress generator
(this generator ships a deliberately minimal design-tokens module only —
colors, spacing, typography).

## 3. Content Plan (same mechanism as SPEC-007)

The page copy is written by the AI through the identical mechanism used by
`@telemax/generator-wordpress`: an `ai` pipeline step returns a variable, a
transform turns it into a validated envelope, and field-extractor transforms
flatten it into template variables.

1. **Instruction.** `LP_CONTENT_PLAN_TEMPLATE` (Prompt Engine) is rendered once
   with `{ siteName, description, conventions }`, where `conventions` is retrieved
   from the Knowledge Engine (real ingest → index → search round-trip). The
   instruction asks for **only** a JSON object of a fixed shape, plain text only.
2. **Contract.** The parsed JSON is validated field-by-field against
   `LandingContentPlan`:

   ```ts
   interface LandingContentPlan {
     siteName: string;
     seo: { title: string; description: string; keywords: string[] };
     hero: { headline: string; subheadline: string; primaryCta: { label: string; href: string } };
     sections: { id: string; title: string; body: string }[]; // 1–8
     features: { title: string; description: string }[]; // 0–6
     footer: { tagline: string };
   }
   ```

3. **Sanitisation.** Every string is passed through `sanitizeText` (strips
   HTML/PHP tags, backticks and control characters, collapses whitespace, caps
   length); values inserted into templates are additionally HTML-escaped
   (`escapeHtml`); the CTA `href` is constrained to an in-page anchor, an
   absolute `http(s)` URL or `mailto:` (`sanitizeHref`) — anything else
   (`javascript:` …) falls back to `#contact`. Nothing the model returns can
   become markup or executable code.
4. **Deterministic fallback.** On a stub/empty response, invalid JSON or a
   contract violation, `deterministicContentPlan` builds a valid plan from the
   resolved project configuration. Generation never fails on AI. The
   `contentPlanEnvelope` variable carries `source` (`ai` | `fallback`) and
   `validation` (`passed` | `failed`) for observability.

## 4. Pipeline

`workflow` (build metadata) → `prompt` (deterministic SEO base) → `ai` (Content
Plan) → `transform` (envelope) → flatten transforms → `transform` (naming
conventions) → `template` steps (flat paths) → `emit` steps (tokens CSS, robots,
config JSON, docs, build-info, `.gitkeep`). `writeProject` appends
`.telemax/manifest.json`.

## 5. Platform integration

`apps/api` selects a generator through a `GeneratorAdapter` registry
(`apps/api/src/services/generators/`). A `landing-page` project (or any project
whose installed generator id contains `generator-landing`) routes to the landing
adapter; `GenerationService` records files and packages the output into
`workspace/<slug>/export/site.zip`, served by `GET /projects/:id/download/site`
(with `GET /projects/:id/download/theme` kept as a backward-compatible alias).
The generator auto-appears in the dashboard "New project" wizard via the live
repository scan.
