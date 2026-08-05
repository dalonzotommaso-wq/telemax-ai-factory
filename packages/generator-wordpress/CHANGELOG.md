# @telemax/generator-wordpress

## [0.1.0] - Unreleased

### Fixed

- WCAG contrast validation applied the 4.5:1 normal-text threshold to the brand
  `primary` colour; it now uses the correct 3:1 large-text/UI threshold (WCAG
  1.4.3 large text / 1.4.11 non-text), while body text keeps 4.5:1. Contrast
  failures now report the offending pair, measured ratio and required ratio.

### Added

- v1 usable project generation (SPRINT-009): `generateWordPressNewsProject` writes
  a complete WordPress News project to disk (default `output/wordpress-news/`) via
  the engine's new `FileSystemArtifactWriter`, and a `.telemax/manifest.json`
  catalogs every artifact with content type, byte size, SHA-256 checksum and
  version.
- Added templates `home.php`, `search.php`, `author.php`, `404.php`, a
  `screenshot.svg` placeholder and generated assets `assets/css/main.css` /
  `assets/js/main.js`. `functions.php` now registers theme supports, nav menus and
  enqueues the generated assets.
- Demo CLI `telemax generate wordpress-news` (`pnpm telemax generate wordpress-news`).
- Integration tests verifying the project is really written to disk.

- Initial WordPress News generator (SPEC-007): the first real generator of the
  framework. Produces the complete WordPress News theme project as versioned,
  validated artifacts via the Generator Engine, integrating the Workflow, Prompt
  and Knowledge engines. Project scaffolding only — no plugin, no definitive
  WordPress code.
- Template artifacts: theme config (`style.css`, `theme.json`, `functions.php`),
  layouts (front-page, index, single, category, archive, page), partials (header,
  footer, sidebar, navigation), advertising blocks, widget areas, SEO and
  Schema.org components, `robots.txt`, sitemap and manifest configuration, image
  directory layout and project documentation.
- Ten professional blueprints: Project, Design Tokens, Layout Engine, Component
  Registry (13 components with generated scaffolds), SEO, Accessibility
  (WCAG 2.2 AA with contrast checking), Core Web Vitals, Advertisement,
  Performance, and a pre-generation Validation Engine.
- Integrations: prepare workflow (Workflow Engine), meta-description prompt
  (Prompt Engine), naming-conventions retrieval (Knowledge Engine).
- High-level API `generateWordPressNews`, wiring helper `registerWordPressNews`,
  `buildWordPressNewsDefinition`, `validateProject` and the blueprint builders.
- Unit tests (12 files, 26 tests); coverage ≈ 97% lines.
