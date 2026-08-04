# SPRINT-003 — Prompt Engine — Report

- **Sprint:** SPRINT-003 — Prompt Engine
- **Package:** `@telemax/prompt-engine` (v0.1.0)
- **SPEC:** SPEC-003 — Prompt Engine · **ADR:** ADR-0006
- **Dipendenze runtime:** solo `@telemax/core` e `@telemax/knowledge` (nessun provider AI)
- **Esito pipeline:** ✅ verde (`lint` 7/7 · `typecheck` 7/7 · `test` 7/7 · `build` 5/5 · `format:check` OK)

## 1. Architettura implementata

Prompt Engine enterprise come **infrastruttura riutilizzabile** (nessun prompt
specifico), **provider-agnostica**, destinata a tutti gli Agenti AI, al Knowledge
Engine e all'AI Orchestrator. Realizzato in **Clean Architecture** con
**Dependency Injection**, **event-driven**, TypeScript strict **zero `any`**,
errori via `Result`.

La façade `PromptEngine` dipende esclusivamente da **porte** (`interfaces.ts`); gli
adapter concreti le implementano e vengono composti in `di.ts`
(`registerPromptEngine`). Livelli:

- **Base:** `types`, `errors`, `config`, `utils`, `events`, `interfaces`.
- **Dominio:** `template`, `variable`, `metadata`, `version`, `message`,
  `composition`, `advanced` (tipi predisposti).
- **Adapter:** `rendering/*` (renderer, ereditarietà, formatter, locale),
  `schema/*`, `cache/*`, `metrics/*`, `repository/*`.
- **Applicazione:** `service` (façade), `registry`, `validator`, import/export,
  `predisposition`.
- **Composition root:** `di`.

Funzionalità operative: gestione template, variabili e placeholder, validazione,
**versionamento** (checksum SHA-256 del body + **firma di versione** SHA-256 sul
template canonico, con storico), **rendering** dependency-free (interpolazione con
path puntati, `if/else`, `unless`, `each` con `this`/`@index`, partial, block,
commenti), **composizione multilivello** dei ruoli `system`/`developer`/`user`/
`assistant`, **ereditarietà** dei template a blocchi, **estensioni** (partial),
**i18n** con fallback, **cache**, **logging**, **metriche**, **eventi**,
**serializzazione** e **import/export** di bundle JSON, **validazione schema** delle
variabili. Predisposti (porte/tipi, non ancora implementati): Prompt Chains, RAG,
Tool/Function Calling, MCP, Structured Output, JSON Schema, XML/Markdown prompt.

## 2. File creati

**Package `packages/prompt-engine/` — metadati**

- `package.json`, `tsconfig.json`, `tsconfig.build.json`, `README.md`, `CHANGELOG.md`

**Moduli sorgente (29 file `.ts` in `src/`)**

- Base: `types.ts`, `errors.ts`, `config.ts`, `utils.ts`, `events.ts`, `interfaces.ts`, `index.ts`
- Dominio: `domain/metadata.ts`, `domain/variable.ts`, `domain/message.ts`, `domain/template.ts`, `domain/version.ts`, `domain/composition.ts`, `domain/advanced.ts`
- Rendering: `rendering/default-renderer.ts`, `rendering/inheritance.ts`, `rendering/formatters.ts`, `rendering/locale.ts`
- Adapter: `schema/schema-validator.ts`, `cache/in-memory-cache.ts`, `metrics/metrics.ts`, `repository/in-memory-template-repository.ts`
- Applicazione: `registry.ts`, `validator.ts`, `export-manager.ts`, `import-manager.ts`, `predisposition.ts`, `service.ts`, `di.ts`

**Test unitari (12 file in `src/`)**

- `rendering/default-renderer.test.ts`, `rendering/inheritance.test.ts`, `rendering/formatters.test.ts`, `schema/schema-validator.test.ts`, `cache/in-memory-cache.test.ts`, `events.test.ts`, `domain/template.test.ts`, `domain/metadata.test.ts`, `repository/in-memory-template-repository.test.ts`, `validator.test.ts`, `service.test.ts`, `di.test.ts`

**Documentazione**

- `docs/SPEC-003-Prompt-Engine.md`
- `docs/architecture/adr/0006-prompt-engine-architecture.md`
- `.changeset/prompt-engine-foundation.md`

## 3. File modificati

- `tsconfig.base.json` — alias di path `@telemax/prompt-engine`
- `CHANGELOG.md` (root) — voci Prompt Engine + SPEC-003/ADR-0006 + dev dep coverage
- `packages/README.md` — aggiunto `@telemax/prompt-engine` all'elenco
- `docs/architecture/README.md` — link SPEC-003, indice ADR-0006, SPEC-003 → delivered
- `package.json` (root) + `pnpm-lock.yaml` — dev dependency `@vitest/coverage-v8`
- `project/ROADMAP.md`, `project/BACKLOG.md` — stato di consegna SPRINT-003 = delivered

## 4. Decisioni tecniche

1. **Porte + DI (Clean Architecture):** la façade dipende solo da astrazioni; renderer, cache, repository, validator, formatter sono sostituibili senza toccare il motore.
2. **Dipendenza solo da `@telemax/core` + `@telemax/knowledge`:** riuso di `checksum`, `slugify`, `normalizeLabels`, `Clock`, `IdGenerator`, `StructuredValue` e del contratto generico `EventBus` da knowledge — nessuna logica duplicata. Nessuna conoscenza di provider AI.
3. **Rendering dependency-free:** motore interno (sottoinsieme documentato) invece di una libreria di templating di terze parti — supply chain minima e pieno controllo.
4. **Firma di versione deterministica:** `signature = SHA-256(canonical(template))` a chiavi ordinate; `checksum = SHA-256(body)`; storico versioni nel repository.
5. **Errori via `Result`:** unione `PromptError` di sottoclassi `FrameworkError`, nessuna eccezione per i fallimenti attesi.
6. **Capacità avanzate predisposte, non finte:** Prompt Chains, RAG, Tool/Function/MCP, Structured Output esposte come porte/tipi che restituiscono `PromptNotImplementedError` finché non arriveranno gli adapter reali.
7. **Sicurezza del rendering:** nessun `eval`, sola interpolazione dei dati; ricorsione dei partial limitata; cache con chiave firma+locale+hash variabili.

## 5. Test eseguiti

| Area               | File                                               |   Test |
| ------------------ | -------------------------------------------------- | -----: |
| Service (facade)   | `service.test.ts`                                  |      8 |
| Renderer           | `rendering/default-renderer.test.ts`               |      7 |
| Ereditarietà       | `rendering/inheritance.test.ts`                    |      4 |
| Formatter          | `rendering/formatters.test.ts`                     |      3 |
| Schema validator   | `schema/schema-validator.test.ts`                  |      4 |
| Cache              | `cache/in-memory-cache.test.ts`                    |      3 |
| Eventi             | `events.test.ts`                                   |      1 |
| Dominio (Template) | `domain/template.test.ts`                          |      4 |
| Dominio (Metadata) | `domain/metadata.test.ts`                          |      2 |
| Repository         | `repository/in-memory-template-repository.test.ts` |      3 |
| Validator          | `validator.test.ts`                                |      4 |
| DI                 | `di.test.ts`                                       |      2 |
| **Totale**         | **12 file**                                        | **45** |

## 6. Risultati

- **`@telemax/prompt-engine`:** 12 file, **45 test**, tutti verdi.
- **Monorepo completo:** `lint` 7/7 · `typecheck` 7/7 · `build` 5/5 · `format:check` OK.
- **Test totali del monorepo:** 95 (core 9 · config 3 · knowledge 38 · prompt-engine 45).
- Build del package: `dist/index.js` + `dist/index.d.ts` emessi correttamente.

## 7. Copertura

Copertura del package `@telemax/prompt-engine` (provider v8):

| Metrica    | Valore |
| ---------- | -----: |
| Statements | 87.68% |
| Branches   | 75.77% |
| Functions  | 85.96% |
| Lines      | 87.68% |

Aggiunta la dev dependency `@vitest/coverage-v8` e lo script
`pnpm --filter @telemax/prompt-engine test:coverage`. Le percentuali inferiori al
100% riguardano soprattutto i rami difensivi (guardie di errore, casi di formato
predisposto) coperti indirettamente.

## 8. Prossimi passi

- **SPEC-004 — AI Orchestrator** (design come Architecture Review, poi implementazione dopo approvazione).
- Adapter futuri sulle **porte esistenti**, senza modifiche al motore:
  - `PromptChainRunner` reale (esecuzione delle chain);
  - `RagAugmentor` reale con bridge alla ricerca di `@telemax/knowledge`;
  - `JsonSchemaValidator` reale + formatter `xml`/`json` (Structured Output);
  - registry di Tool/Function/MCP e loro invocazione;
  - repository e cache persistenti (filesystem/DB/vector store).
- Integrazione del `PromptEngine` negli Agenti AI e nel Knowledge Engine.
- Estensione del motore di rendering (helper/filtri, block annidati) se necessario.
