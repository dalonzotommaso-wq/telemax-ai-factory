# @telemax/generator-landing

## [0.1.0] - Unreleased

### Added

- Initial Landing Page generator (SPEC-008): the second real generator of the
  framework. Produces a single-page static HTML/CSS landing page ("vetrina") as
  versioned, validated artifacts via the Generator Engine, integrating the
  Workflow, Prompt and Knowledge engines. Static project output only — no build
  tooling, no framework, no server code.
- AI-written copy through the **same Content Plan mechanism** as
  `@telemax/generator-wordpress`: AI step → JSON → parse → validate against the
  `LandingContentPlan` contract → sanitise → deterministic fallback built from the
  project configuration, so generation never fails on AI.
- Template artifacts: `index.html`, `assets/css/style.css`, `assets/js/main.js`,
  `README.md`; emitted artifacts: `assets/css/tokens.css`, `robots.txt`,
  `config/content-plan.json`, `config/design-tokens.json`,
  `docs/NAMING-CONVENTIONS.md`, `.telemax/build-info.json` and a
  `.telemax/manifest.json` cataloguing every artifact with content type, byte
  size, SHA-256 checksum and version.
- Minimal design-tokens module (colors, spacing, typography) — deliberately not a
  port of the WordPress blueprint subsystem.
- High-level API `generateLandingPageProject` / `generateLandingPage`, wiring
  helper `registerLandingPage`, `buildLandingPageDefinition`, `validateProject`.
