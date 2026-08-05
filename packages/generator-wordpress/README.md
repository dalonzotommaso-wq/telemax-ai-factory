# @telemax/generator-wordpress

The **first real generator** of Telemax AI Factory. It produces the complete
project structure of a **WordPress News** theme as **versioned, validated
artifacts** via the Generator Engine, integrating the Workflow, Prompt and
Knowledge engines.

It generates **project scaffolding only** — no plugin, and no definitive
WordPress code. Every `.php` artifact is a reviewed-before-use scaffold with
`TODO` markers. It depends on `@telemax/core`, `@telemax/knowledge`,
`@telemax/prompt-engine`, `@telemax/ai`, `@telemax/workflow` and
`@telemax/generator-engine`.

## What it generates

A full WordPress News theme project: folder structure, configuration
(`style.css`, `theme.json`, `functions.php`), page layouts (homepage, article,
category, archive, page), structural partials (header, footer, sidebar, menu),
advertising blocks and widget areas, SEO and Schema.org components, `robots.txt`,
sitemap and manifest configuration, an image directory layout, naming conventions
and project documentation — plus a scaffold for every registered component.

## Professional blueprints

Beyond templates, the generator is driven by ten blueprints:

1. **Project Blueprint** — the whole project, its logical structure and the
   artifact dependency graph.
2. **Design Tokens** — colors, typography, spacing, breakpoints, z-index, radius,
   shadows, animations (emitted as JSON and CSS custom properties).
3. **Layout Engine** — page regions (header, nav, hero, content, sidebar, widgets,
   ads, footer) and per-page composition.
4. **Component Registry** — Hero, Card News, Breaking News, Live Banner, Video
   Block, Gallery, Related Articles, Author Box, Breadcrumb, Social Share,
   Newsletter, Comments, Banner ADV — each with a generated scaffold.
5. **SEO Blueprint** — per page type: title, meta description, Open Graph, Twitter
   Card, canonical, robots, Schema.org and JSON-LD.
6. **Accessibility Blueprint** — WCAG 2.2 AA, landmarks, ARIA, keyboard
   navigation, focus management and real contrast checking.
7. **Core Web Vitals Blueprint** — LCP/CLS/INP budgets and techniques (lazy
   loading, preload, prefetch, responsive images).
8. **Advertisement Blueprint** — standard positions: header, sidebar, in-article,
   footer, sticky, mobile, video.
9. **Performance Blueprint** — cache strategy, assets, images, JavaScript, CSS,
   critical CSS.
10. **Validation Engine** — a complete pre-generation validation (config,
    templates, artifact dependency graph and contrast).

## Quick start

```ts
import { generateWordPressNews } from "@telemax/generator-wordpress";

const result = await generateWordPressNews({
  siteName: "Daily Post",
  categories: ["Politics", "Business", "Sports"],
});

if (result.ok) {
  for (const artifact of result.value.artifacts.list()) {
    console.log(artifact.path); // daily-post/front-page.php, …
  }
}
```

## CLI (v1)

Generate a complete WordPress News project on disk:

```bash
pnpm telemax generate wordpress-news --name "Daily Post" --out output/wordpress-news
```

This writes a full theme directory (e.g. `output/wordpress-news/daily-post/`) with
every template, generated assets (`assets/css/main.css`, `assets/js/main.js`), a
`screenshot.svg` placeholder and a `.telemax/manifest.json` cataloguing each
artifact with its version and SHA-256 checksum.

Programmatic equivalent:

```ts
import { generateWordPressNewsProject } from "@telemax/generator-wordpress";

const result = await generateWordPressNewsProject(
  { siteName: "Daily Post" },
  { outputDir: "output/wordpress-news" },
);
// result.value.fileCount, result.value.outputDir, result.value.manifestPath
```

## Integrations

- **Workflow Engine** — a prepare workflow computes the build metadata written to
  `.telemax/build-info.json`.
- **Prompt Engine** — renders the site meta description used by the SEO components.
- **Knowledge Engine** — stores and serves the naming conventions
  (`docs/NAMING-CONVENTIONS.md`) via full-text retrieval.

## Validation & versioning

`validateProject(config)` runs before generation. The generator is versioned by
the Generator Engine (checksum + signature); artifacts are stamped with the
generator version and catalogued in `config/project.blueprint.json` and
`.telemax/build-info.json`.

## Scripts

```bash
pnpm --filter @telemax/generator-wordpress build
pnpm --filter @telemax/generator-wordpress typecheck
pnpm --filter @telemax/generator-wordpress lint
pnpm --filter @telemax/generator-wordpress test
pnpm --filter @telemax/generator-wordpress test:coverage
```

## License

MIT © Gruppo AIR srl
