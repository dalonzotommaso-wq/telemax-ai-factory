# SPRINT-004 — AI Orchestrator — Report

- **Sprint:** SPRINT-004 — AI Orchestrator
- **Package:** `@telemax/ai` (v0.1.0)
- **SPEC:** SPEC-004 — AI Orchestrator · **ADR:** ADR-0007
- **Dipendenze runtime:** solo `@telemax/core`, `@telemax/knowledge`, `@telemax/prompt-engine`
- **Vincoli rispettati:** nessuna chiamata HTTP, nessuna API key, nessun collegamento a servizi esterni — sola infrastruttura, provider-agnostica
- **Esito pipeline:** ✅ verde (`lint` 9/9 · `typecheck` 9/9 · `test` 9/9 · `build` 6/6 · `format:check` OK)

## 1. Architettura

AI Orchestrator come **layer di coordinamento** del framework: riceve una
richiesta, recupera il contesto dal Knowledge Engine, costruisce il prompt tramite
il Prompt Engine, sceglie provider e modello, prepara la richiesta ed esegue,
restituendo una **risposta standardizzata**. **Provider-agnostico**: non conosce
alcun provider specifico. Realizzato in **Clean Architecture** con **Dependency
Injection**, **event-driven**, TypeScript strict **zero `any`**, errori via
`Result`.

La façade `AIOrchestrator` dipende solo da **porte** (`interfaces.ts`); gli adapter
concreti le implementano e vengono composti in `di.ts` (`registerAIOrchestrator`).

Flusso di orchestrazione:

1. **ricezione richiesta** (`AIRequest`: input o messaggi, template opzionale,
   variabili, query di conoscenza, hint di provider/modello, parametri);
2. **recupero contesto** — `KnowledgePipeline` tramite porta `KnowledgeGateway`;
3. **costruzione prompt** — `ContextBuilder` + `PromptPipeline` (Prompt Engine);
4. **scelta provider** — `ProviderSelector` su `AIProviderRegistry`;
5. **scelta modello** — `ModelSelector` su `ModelRegistry`;
6. **preparazione richiesta** — `PreparedRequest` con firma deterministica;
7. **esecuzione** — `ExecutionPipeline`: rate limiter → circuit breaker → retry →
   provider; salute registrata; costo e token tracciati; risposta in cache;
8. **risposta standardizzata** — `ExecutionResult` con `AIResponse`.

Provider previsti (non implementati): Anthropic Claude, OpenAI, Google Gemini,
OpenRouter, Ollama, Azure OpenAI, Amazon Bedrock, provider futuri. È incluso solo
uno `StubProvider` locale e deterministico (nessuna rete, nessuna credenziale) per
esercitare l'intero flusso nei test.

## 2. File creati

**Package `packages/ai/` — metadati**

- `package.json`, `tsconfig.json`, `tsconfig.build.json`, `README.md`, `CHANGELOG.md`

**Moduli sorgente (35 file `.ts` in `src/`)**

- Base: `types.ts`, `errors.ts`, `config.ts`, `utils.ts`, `events.ts`, `interfaces.ts`, `index.ts`
- Dominio: `domain/message.ts`, `domain/capabilities.ts`, `domain/model.ts`, `domain/request.ts`, `domain/response.ts`, `domain/conversation.ts`, `domain/context.ts`, `domain/execution.ts`
- Provider: `providers/provider-registry.ts`, `providers/model-registry.ts`, `providers/selection.ts`, `providers/stub-provider.ts`
- Conversazione: `conversation/conversation-manager.ts`, `conversation/context-builder.ts`
- Pipeline: `pipeline/knowledge-pipeline.ts`, `pipeline/prompt-pipeline.ts`, `pipeline/execution-pipeline.ts`
- Resilienza: `resilience/retry-policy.ts`, `resilience/circuit-breaker.ts`, `resilience/rate-limiter.ts`, `resilience/health-monitor.ts`
- Costo/telemetria: `cost/token-counter.ts`, `cost/cost-tracker.ts`, `telemetry/telemetry.ts`
- Runtime: `cache/cache-manager.ts`, `streaming/streaming-manager.ts`
- Applicazione: `orchestrator.ts`, `di.ts`

**Test unitari (17 file in `src/`)**

- `providers/provider-registry.test.ts`, `providers/model-registry.test.ts`, `providers/selection.test.ts`, `providers/stub-provider.test.ts`
- `resilience/retry-policy.test.ts`, `resilience/circuit-breaker.test.ts`, `resilience/rate-limiter.test.ts`, `resilience/health-monitor.test.ts`
- `cost/cost.test.ts`, `cache/cache-manager.test.ts`, `telemetry/telemetry.test.ts`
- `conversation/conversation-manager.test.ts`, `conversation/context-builder.test.ts`
- `pipeline/pipelines.test.ts`, `events.test.ts`, `orchestrator.test.ts`, `di.test.ts`

**Documentazione**

- `docs/SPEC-004-AI-Orchestrator.md`
- `docs/architecture/adr/0007-ai-orchestrator-architecture.md`
- `.changeset/ai-orchestrator-foundation.md`

## 3. File modificati

- `tsconfig.base.json` — alias di path `@telemax/ai`
- `CHANGELOG.md` (root) — voci AI Orchestrator + SPEC-004/ADR-0007
- `packages/README.md` — aggiunto `@telemax/ai` all'elenco
- `docs/architecture/README.md` — link SPEC-004, indice ADR-0007, SPEC-004 → delivered
- `project/ROADMAP.md`, `project/BACKLOG.md` — stato di consegna SPRINT-004 = delivered
- `package.json` (root) + `pnpm-lock.yaml` — collegamento del nuovo package nel workspace

## 4. Decisioni tecniche

1. **Porte + DI (Clean Architecture):** la façade dipende solo da astrazioni; provider, selettori, gateway, cache, resilienza sono sostituibili senza toccare l'orchestratore.
2. **Dipendenza solo da core + knowledge + prompt-engine:** l'orchestratore compone gli altri engine e ne riusa le primitive (checksum, clock, id, `StructuredValue`, contratto `EventBus`, `PromptEngine`); nessuna duplicazione, nessuna conoscenza di provider.
3. **SPI provider-agnostica:** i provider implementano un'unica porta `AIProvider` e si registrano in `AIProviderRegistry`; l'orchestratore seleziona per strategia e non ramifica mai sull'identità del provider.
4. **Stub locale deterministico, nessun I/O:** `StubProvider` sintetizza la risposta dalla richiesta, così l'intero flusso è testabile senza HTTP né credenziali.
5. **Errori via `Result`:** unione `AIError` di sottoclassi `FrameworkError`.
6. **Stack di resilienza:** rate limiter → circuit breaker → retry → provider, con health monitor: esecuzione «di produzione» senza chiamate esterne.
7. **Firma deterministica della richiesta:** `signature = SHA-256(canonical(prepared))`, chiave di cache indipendente dall'ordine delle chiavi.
8. **Feature discovery via capabilities:** streaming, tool, function calling, vision e JSON mode dichiarati in `ProviderCapabilities`; comportamento aggiunto quando arriveranno i provider reali.

## 5. Test

| Area                       | File                                        |   Test |
| -------------------------- | ------------------------------------------- | -----: |
| Orchestrator (end-to-end)  | `orchestrator.test.ts`                      |      7 |
| Pipeline                   | `pipeline/pipelines.test.ts`                |      6 |
| Selezione provider/modello | `providers/selection.test.ts`               |      5 |
| Retry policy               | `resilience/retry-policy.test.ts`           |      3 |
| Costo + token counter      | `cost/cost.test.ts`                         |      3 |
| Provider registry          | `providers/provider-registry.test.ts`       |      2 |
| Model registry             | `providers/model-registry.test.ts`          |      2 |
| Stub provider              | `providers/stub-provider.test.ts`           |      2 |
| Conversation manager       | `conversation/conversation-manager.test.ts` |      2 |
| Context builder            | `conversation/context-builder.test.ts`      |      2 |
| DI                         | `di.test.ts`                                |      2 |
| Circuit breaker            | `resilience/circuit-breaker.test.ts`        |      1 |
| Rate limiter               | `resilience/rate-limiter.test.ts`           |      1 |
| Health monitor             | `resilience/health-monitor.test.ts`         |      1 |
| Cache                      | `cache/cache-manager.test.ts`               |      1 |
| Telemetria                 | `telemetry/telemetry.test.ts`               |      1 |
| Eventi                     | `events.test.ts`                            |      1 |
| **Totale**                 | **17 file**                                 | **42** |

## 6. Copertura

Copertura del package `@telemax/ai` (provider v8):

| Metrica    | Valore |
| ---------- | -----: |
| Statements | 94.90% |
| Branches   | 80.66% |
| Functions  | 88.99% |
| Lines      | 94.90% |

Le percentuali inferiori al 100% riguardano soprattutto rami difensivi (guardie di
errore, fallback di selezione, percorsi di streaming del provider reale ancora
predisposti).

## 7. Risultati

- **`@telemax/ai`:** 35 moduli, 17 file di test, **42 test**, tutti verdi.
- **Monorepo completo:** `lint` 9/9 · `typecheck` 9/9 · `build` 6/6 · `format:check` OK.
- **Test totali del monorepo:** 137 (core 9 · config 3 · knowledge 38 · prompt-engine 45 · ai 42).
- Build del package: `dist/index.js` + `dist/index.d.ts` emessi correttamente.

## 8. Problemi risolti

- **Import inutilizzati** (`err` in `orchestrator.ts`, `isOk` in `pipelines.test.ts`): rimossi per `noUnusedLocals`/`no-unused-vars`.
- **`consistent-indexed-object-style`** in `utils.ts`: sostituita l'index signature con `Record<string, StructuredValue>`.
- **Narrowing dei `Result`**: uso coerente del discriminante `.ok` e dei type guard `isOk`/`isErr` (verificato lo shape reale di `Result` nel Core).
- **`exactOptionalPropertyTypes`**: costruzione dei campi opzionali (config, `PreparedRequest`, contesto, messaggi) tramite spread condizionali.
- **Lint dei test aggiunti dopo i controlli per-package**: rieseguiti `typecheck`/`lint` includendo i file di test fino al verde completo.

## 9. Prossimi sprint

- **Adapter provider reali** sulla porta `AIProvider` (Anthropic, OpenAI, Gemini, OpenRouter, Ollama, Azure OpenAI, Bedrock): implementazione delle API, gestione chiavi e trasporto HTTP fuori dal core dell'orchestratore.
- **KnowledgeGateway reale** con bridge alla ricerca di `@telemax/knowledge` (RAG).
- **Streaming reale**, tool/function calling, MCP, structured output attivati via `ProviderCapabilities` e adapter dedicati.
- **Cache e rate limiting distribuiti**, persistenza delle conversazioni.
- **Osservabilità**: esportazione metriche/telemetria verso backend esterni.
- Integrazione dell'orchestratore negli Agenti AI e nei generatori del framework.
