# @telemax/generator-landing

The second real generator of Telemax AI Factory. It produces a **single-page
static HTML/CSS landing page** (a company "vetrina") as versioned, validated
artifacts via the Generator Engine.

The page copy is written by the AI through the **same Content Plan mechanism** as
`@telemax/generator-wordpress`: an AI step returns JSON, which is parsed,
validated against a typed contract (`LandingContentPlan`), sanitised (never
interpreted as markup or code) and — on any failure — replaced by a deterministic
Content Plan built from the project configuration, so generation never fails on AI.

## Output

```
index.html
assets/css/tokens.css      design tokens (CSS custom properties)
assets/css/style.css       layout + components
assets/js/main.js          small progressive enhancement
assets/images/.gitkeep
config/content-plan.json   the validated Content Plan + source/validation provenance
config/design-tokens.json
docs/NAMING-CONVENTIONS.md
robots.txt
README.md
.telemax/manifest.json     per-file SHA-256 + version
.telemax/build-info.json
```

## Usage

```ts
import { generateLandingPageProject } from "@telemax/generator-landing";

const result = await generateLandingPageProject(
  { siteName: "Acme", description: "We build reliable things." },
  { outputDir: "output/landing-page" },
);
```

Depends only on `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`,
`@telemax/ai`, `@telemax/workflow` and `@telemax/generator-engine`.

> PROJECT SCAFFOLD — review the generated copy before publishing.
