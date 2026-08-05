# SPRINT-005 — Workflow Engine — Report

- **Sprint:** SPRINT-005 — Workflow Engine
- **Package:** `@telemax/workflow` (v0.1.0)
- **SPEC:** SPEC-005 — Workflow Engine · **ADR:** ADR-0008
- **Dipendenze runtime:** `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`, `@telemax/ai` (catena lineare, nessun ciclo)
- **Vincoli rispettati:** sola infrastruttura, nessun generatore reale, nessuna chiamata HTTP, nessuna API key, nessun servizio esterno
- **Esito pipeline:** ✅ verde (`lint` · `typecheck` · `test` · `build` · `format:check`)

## 1. Architettura

Il Workflow Engine coordina gli engine del framework — AI Orchestrator, Prompt
Engine, Knowledge Engine e il futuro Generator Engine — per eseguire **workflow
riutilizzabili e componibili**. Realizzato in **Clean Architecture** con
**Dependency Injection**, **event-driven**, TypeScript strict **zero `any`**,
errori via `Result`.

Un `WorkflowDefinition` è un **albero di step dichiarativo e serializzabile**. Il
`WorkflowCompiler` lo valida e produce un `Workflow` immutabile (checksum + firma
di versione SHA-256), archiviato in un `WorkflowRegistry` versionato. Il
`WorkflowExecutor` esegue l'albero su un `WorkflowContext` immutabile:

- **task** — esegue uno `StepHandler` registrato con retry/timeout, opzionalmente
  salva l'output in una variabile e registra una compensazione di rollback;
- **sequence** — esegue i figli in ordine;
- **parallel** — esegue i rami in concorrenza e fonde il contesto;
- **branch** — valuta una `Condition` ed esegue `then`/`otherwise`;
- **loop** — ripete un corpo finché una condizione è vera, con tetto `maxIterations`;
- **subworkflow** — risolve ed esegue un altro workflow (componibilità);
- **approval/tool** — predisposti: passano da porte opzionali, altrimenti `NotImplemented`.

In caso di errore l'engine si ferma (`halt`) o esegue il **rollback**
(handler compensativi in ordine inverso). La coordinazione con gli altri engine
avviene tramite handler: `aiStepHandler`, `promptStepHandler`, `knowledgeStepHandler`
(l'AI Orchestrator gira sullo stub locale, nessuna rete).

## 2. File creati

**Package `packages/workflow/` — metadati**

- `package.json`, `tsconfig.json`, `tsconfig.build.json`, `README.md`, `CHANGELOG.md`

**Moduli sorgente (31 file `.ts` in `src/`)**

- Base: `types.ts`, `errors.ts`, `config.ts`, `utils.ts`, `events.ts`, `interfaces.ts`, `metrics.ts`, `index.ts`
- Dominio: `domain/metadata.ts`, `domain/condition.ts`, `domain/policy.ts`, `domain/step.ts`, `domain/definition.ts`, `domain/context.ts`, `domain/result.ts`, `domain/schedule.ts`, `domain/advanced.ts`
- Condizioni/handler: `condition/evaluator.ts`, `handlers/registry.ts`, `handlers/builtin.ts`, `handlers/adapters.ts`
- Esecuzione: `execution/timeout.ts`, `execution/executor.ts`
- Servizi: `compiler.ts`, `validator.ts`, `registry.ts`, `scheduler.ts`, `export-manager.ts`, `import-manager.ts`, `engine.ts`, `di.ts`

**Test unitari (13 file in `src/`)**

- `condition/evaluator.test.ts`, `validator.test.ts`, `compiler.test.ts`, `registry.test.ts`, `scheduler.test.ts`
- `handlers/handlers.test.ts`, `handlers/adapters.test.ts`, `metrics.test.ts`, `events.test.ts`
- `execution/timeout.test.ts`, `execution/executor.test.ts`, `engine.test.ts`, `di.test.ts`

**Documentazione**

- `docs/SPEC-005-Workflow-Engine.md`
- `docs/architecture/adr/0008-workflow-engine-architecture.md`
- `.changeset/workflow-engine-foundation.md`

## 3. File modificati

- `tsconfig.base.json` — alias di path `@telemax/workflow`
- `CHANGELOG.md` (root) — voci Workflow Engine + SPEC-005/ADR-0008
- `packages/README.md` — aggiunto `@telemax/workflow` all'elenco
- `docs/architecture/README.md` — link SPEC-005, indice ADR-0008, SPEC-005 → delivered
- `project/ROADMAP.md`, `project/BACKLOG.md` — stato di consegna SPRINT-005 = delivered
- `package.json` (root) + `pnpm-lock.yaml` — collegamento del nuovo package nel workspace

## 4. Decisioni tecniche

1. **Modello dichiarativo e serializzabile:** l'albero di step e le condizioni sono dati, non codice — abilitano validazione, versionamento e import/export senza valutare codice arbitrario.
2. **Compila poi esegui:** `WorkflowCompiler` valida e produce un `Workflow` immutabile (checksum + firma SHA-256); `WorkflowExecutor` esegue.
3. **Porte + DI (Clean Architecture):** l'engine dipende da astrazioni (`StepHandler`, `ConditionEvaluator`, `MetricsSink`, porte predisposte approval/tool/distributed); gli adapter sono composti da `registerWorkflowEngine`.
4. **Coordinazione via handler:** `aiStepHandler`, `promptStepHandler`, `knowledgeStepHandler` trasformano gli altri engine in step handler, senza incorporare logica di provider; nei test l'AI Orchestrator usa lo stub locale.
5. **Resilienza nell'executor:** retry, timeout e rollback per-step + failure mode a livello di workflow, uniformi su ogni tipo di step, senza chiamate esterne.
6. **Direzione delle dipendenze:** `workflow → ai → prompt-engine → knowledge → core`, grafo lineare, nessun ciclo.
7. **Capacità avanzate predisposte:** Human Approval, MCP, Tool/Function calling, Multi-Agent, Scheduled e Distributed come porte/tipi con `NotImplemented`.

## 5. Test

| Area                       | File                          |   Test |
| -------------------------- | ----------------------------- | -----: |
| Executor (flussi completi) | `execution/executor.test.ts`  |     10 |
| Engine (end-to-end)        | `engine.test.ts`              |      5 |
| Validator                  | `validator.test.ts`           |      4 |
| Adapter AI/Prompt          | `handlers/adapters.test.ts`   |      2 |
| Condition evaluator        | `condition/evaluator.test.ts` |      2 |
| Compiler                   | `compiler.test.ts`            |      2 |
| Registry                   | `registry.test.ts`            |      2 |
| Timeout                    | `execution/timeout.test.ts`   |      2 |
| DI                         | `di.test.ts`                  |      2 |
| Scheduler                  | `scheduler.test.ts`           |      1 |
| Handlers + builtin         | `handlers/handlers.test.ts`   |      1 |
| Metriche                   | `metrics.test.ts`             |      1 |
| Eventi                     | `events.test.ts`              |      1 |
| **Totale**                 | **13 file**                   | **35** |

Coperti in particolare: sequenza, parallelo (merge), branch then/else, cap del loop, retry con successo e con esaurimento, rollback compensativo, subworkflow con namespacing degli output, approval/tool `NotImplemented`, timeout.

## 6. Copertura

Copertura del package `@telemax/workflow` (provider v8):

| Metrica    | Valore |
| ---------- | -----: |
| Statements | 87.60% |
| Branches   | 75.53% |
| Functions  | 81.89% |
| Lines      | 87.60% |

Le percentuali inferiori al 100% riguardano soprattutto rami difensivi e le porte
predisposte (approval/tool/distributed) non ancora attivate.

## 7. Risultati

- **`@telemax/workflow`:** 31 moduli, 13 file di test, **35 test**, tutti verdi.
- **Monorepo completo:** `lint` · `typecheck` · `build` · `format:check` tutti verdi (11 task).
- **Test totali del monorepo:** 172 (core 9 · config 3 · knowledge 38 · prompt-engine 45 · ai 42 · workflow 35).
- Build del package: `dist/index.js` + `dist/index.d.ts` emessi correttamente.

## 8. Problemi risolti

- **Narrowing di `StructuredObject` in `asRecord`** (adapters): `Array.isArray` non restringe gli array `readonly` → aggiunto cast esplicito dopo le guardie.
- **`consistent-type-imports`** in `registry.ts`: `Workflow` usato solo come tipo → `import type`.
- **Import inutilizzato** in `engine.ts` (`WorkflowNotFoundError`) e re-export superfluo rimossi.
- **Crash di ESLint (`no-base-to-string`, stack overflow)** su `String(<StructuredValue>)` nei test (tipo ricorsivo): sostituito con narrowing esplicito a `string` prima dell'asserzione.
- **Firma di `ok` in `timeout.test.ts`**: `ok` accetta un solo type argument → annotato il `Result` invece di due argomenti di tipo.
- **Lint/typecheck dei test aggiunti dopo i controlli per-package**: rieseguiti includendo i file di test fino al verde completo.

## 9. Prossimi sprint

- **Generator Engine**: implementazione dei generatori reali come `StepHandler`, orchestrati dai workflow.
- **Attivazione delle capacità predisposte**: Human Approval (gateway), Tool/Function calling e MCP (invoker), Multi-Agent, Scheduled (cron) e Distributed (executor) tramite adapter dedicati.
- **Persistenza** di definizioni, run e cronologia versioni; ripresa/annullamento dei run.
- **Osservabilità**: esportazione di eventi/metriche verso backend esterni; tracing dei run.
- **Scheduler avanzato**: cron reale e triggering temporizzato/distribuito.
- Integrazione end-to-end del Workflow Engine negli Agenti AI e nelle pipeline di generazione del framework.
