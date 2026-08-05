# SPRINT-009 — WordPress News Generator v1 — Report

- **Sprint:** SPRINT-009 — WordPress News Generator v1
- **Package principale:** `@telemax/generator-wordpress` (+ `@telemax/generator-engine`)
- **ADR:** ADR-0011 · **SPEC:** SPEC-007 (sezione v1)
- **Vincoli rispettati:** nessun nuovo package infrastrutturale; solo i 7 package esistenti; nessun cambio di architettura; nessuna nuova funzionalità oltre l'obiettivo v1; ogni file generato tramite il Generator Engine (nessun template statico copiato).
- **Esito pipeline:** ✅ verde (`install` · `lint` · `typecheck` · `test` · `build` · `format:check`)

## 1. Obiettivo e riepilogo

Trasformare `generator-wordpress` da scaffolding a **generatore realmente
utilizzabile**: la v1 genera un progetto WordPress News completo e lo **scrive su
disco** in `output/wordpress-news/`, invocabile da una **CLI dimostrativa**. La
generazione resta interamente basata sul Generator Engine (template resi via
engine, coordinamento con Prompt/Knowledge/Workflow); la scrittura su disco usa un
nuovo adapter generico della porta `ArtifactWriter`.

## 2. Architettura della soluzione (invariata nei principi)

- **`FileSystemArtifactWriter`** aggiunto a `@telemax/generator-engine`: implementa
  la porta `ArtifactWriter` esistente e persiste gli artefatti sotto una root
  fissa, rifiutando il path-traversal (`GeneratorIoError`). Usa solo built-in Node
  (`node:fs`, `node:path`); il writer di default resta `InMemoryArtifactWriter`
  (nessun cambio di comportamento per gli usi esistenti).
- **`writeProject`** in `generator-wordpress`: scrive la `ArtifactCollection`
  generata tramite il filesystem writer e produce `.telemax/manifest.json` con, per
  ogni artefatto, content type, dimensione in byte, checksum SHA-256 e versione.
- **`generateWordPressNewsProject`**: compone generazione + scrittura e restituisce
  un riepilogo (numero file, directory di output, path del manifest).
- **CLI `bin/telemax.ts`**: `generate wordpress-news [--out <dir>] [--name <site>]
[--url <url>]`; scrive solo su `stdout`/`stderr`; default output
  `output/wordpress-news`. Collegata come script root `telemax` e come `bin` del
  package.

## 3. Elenco file creati

- `packages/generator-engine/src/artifact/fs-writer.ts` — `FileSystemArtifactWriter`
- `packages/generator-engine/src/artifact/fs-writer.test.ts` — test (write, base64, path-traversal)
- `packages/generator-wordpress/src/templates/pages.ts` — `home.php`, `search.php`, `author.php`, `404.php`
- `packages/generator-wordpress/src/templates/assets.ts` — `assets/css/main.css`, `assets/js/main.js`, `screenshot.svg`
- `packages/generator-wordpress/src/write.ts` — `writeProject` + manifest
- `packages/generator-wordpress/src/project.ts` — `generateWordPressNewsProject`
- `packages/generator-wordpress/src/bin/telemax.ts` — CLI
- `packages/generator-wordpress/src/project.integration.test.ts` — test d'integrazione su disco
- `docs/architecture/adr/0011-project-writer-and-cli.md` — ADR-0011
- `SPRINT-009-REPORT.md` (+ `.docx`)

## 4. Elenco file modificati

- `packages/generator-engine/src/index.ts` — export `FileSystemArtifactWriter`
- `packages/generator-engine/CHANGELOG.md`
- `packages/generator-wordpress/src/templates/index.ts` — aggregazione pages + assets
- `packages/generator-wordpress/src/templates/theme.ts` — `functions.php`: theme supports, menu, enqueue asset generati
- `packages/generator-wordpress/src/variables.ts` — variabile `generatedAt`
- `packages/generator-wordpress/src/assemble.ts` — propagazione `generatedAt`
- `packages/generator-wordpress/src/runner.ts` — opzione `generatedAt`
- `packages/generator-wordpress/src/blueprint/project.ts` — dipendenze nuove pagine/asset, dir `assets/js`
- `packages/generator-wordpress/src/index.ts` — export API progetto/CLI
- `packages/generator-wordpress/package.json` — campo `bin`
- `packages/generator-wordpress/README.md`, `CHANGELOG.md`
- `package.json` (root) — script `telemax`
- `docs/SPEC-007-WordPress-News-Generator.md` (sezione v1), `docs/architecture/README.md`
- `CHANGELOG.md` (root), `project/ROADMAP.md`, `project/BACKLOG.md`, `project/RELEASES/v0.2.0.md`

## 5. Dipendenze aggiunte

Nessuna dipendenza esterna nuova. `generator-engine` usa i built-in Node
(`node:fs`, `node:path`) per il writer; `generator-wordpress` usa `node:crypto`
(SHA-256) e i built-in per la CLI. Grafo dei package invariato, nessun ciclo.

## 6. Risultati della pipeline

| Fase                | Esito | Note                  |
| ------------------- | :---: | --------------------- |
| `pnpm install`      |  ✅   | 11 progetti workspace |
| `pnpm lint`         |  ✅   | 15 task, zero warning |
| `pnpm typecheck`    |  ✅   | 15 task, 0 errori     |
| `pnpm test`         |  ✅   | 15 task               |
| `pnpm build`        |  ✅   | 9 task, dist emessi   |
| `pnpm format:check` |  ✅   | Prettier pulito       |

**Test totali monorepo:** 265 (core 27 · config 3 · knowledge 38 · prompt-engine 45 · ai 42 · workflow 35 · **generator-engine 42** · **generator-wordpress 28** · generator-kit 5).

## 7. Copertura dei test

| Package                      |  Lines |
| ---------------------------- | -----: |
| @telemax/generator-engine    | 91.41% |
| @telemax/generator-wordpress | 93.52% |

Il test d'integrazione genera il progetto in una cartella temporanea e verifica la
presenza su disco di tutti i file richiesti, i metadata/versione nei file e il
manifest con checksum.

## 8. Test d'integrazione della CLI

Comando: `pnpm telemax generate wordpress-news` → genera in `output/wordpress-news/`.
Verificati su disco: `style.css`, `functions.php`, `theme.json`, `index.php`,
`front-page.php`, `home.php`, `single.php`, `page.php`, `archive.php`,
`category.php`, `search.php`, `author.php`, `header.php`, `footer.php`,
`sidebar.php`, `404.php`, `screenshot.svg`, `assets/css/main.css`,
`assets/js/main.js`, `README.md`; directory `assets/`, `assets/css/`, `assets/js/`,
`assets/images/`, `template-parts/`, `inc/`; e `.telemax/manifest.json` con
versione + checksum SHA-256 per ogni artefatto. Il tema è generato nella cartella
`output/wordpress-news/<themeSlug>/` (layout standard di un tema WordPress).

## 9. Problemi risolti

- Il typecheck di `generator-wordpress` non vedeva `FileSystemArtifactWriter`
  finché `generator-engine` non è stato ricompilato (l'alias risolve dal `dist`):
  risolto rieseguendo il build dell'engine.
- Lint `prefer-optional-chain` nel parser della CLI: `token !== undefined &&
token.startsWith(...)` → `token?.startsWith(...) === true`.
- Formattazione Prettier dei nuovi file: risolta con `pnpm format`.

## 10. Debito tecnico residuo

- Output `.php` ancora a livello scaffold (da completare), per design.
- Copy editoriale deterministica (nessun provider AI reale, previsto dietro lo step
  `ai` in futuro).
- `FileSystemArtifactWriter` sincrono (adeguato alla CLI, non ottimizzato per alberi
  molto grandi).
- Copertura `knowledge`/`config` da alzare (ereditato).

## 11. Raccomandazioni

- Provider AI reale dietro feature flag per titoli/occhielli editoriali.
- Secondo target sullo stesso engine (React/Next.js) per validare la genericità.
- Opzione CLI per scrittura asincrona/streaming su alberi grandi; flag `--force`/
  `--dry-run`.
- Completare i componenti prioritari (Hero, Card News, Breaking News) con rendering
  reale guidato dai design token.
