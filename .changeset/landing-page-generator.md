---
"@telemax/generator-landing": minor
---

Initial Landing Page generator (SPEC-008): the second real generator of Telemax
AI Factory. Produces a single-page static HTML/CSS landing page ("vetrina") as
versioned, validated artifacts via the Generator Engine, integrating the
Workflow, Prompt and Knowledge engines. The page copy is written by the AI
through the same Content Plan mechanism as `@telemax/generator-wordpress` (AI
step → JSON → parse → validate against the `LandingContentPlan` contract →
sanitise → deterministic fallback built from the project configuration, so
generation never fails on AI). Output: `index.html`, `assets/css/{tokens,style}.css`,
`assets/js/main.js`, `config/{content-plan,design-tokens}.json`, `robots.txt`,
`README.md` and a `.telemax/manifest.json` with per-file SHA-256 and version.
Static project output only; no build tooling, framework or server code. Depends
only on `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`,
`@telemax/ai`, `@telemax/workflow` and `@telemax/generator-engine`.
