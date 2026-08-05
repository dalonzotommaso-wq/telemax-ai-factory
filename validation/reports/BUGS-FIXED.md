# BUGS FIXED — SPRINT-010 Validation

## BUG-010-01 — Soglia di contrasto WCAG troppo restrittiva sul colore brand

- **Severità:** Alta (bloccante per configurazioni valide)
- **Individuato durante:** generazione dei 5 progetti di validazione — 2 su 5
  fallivano (`magazine-lifestyle`, `portale-sport`) con
  `WordPressConfigError: Project validation failed.`
- **Causa radice:** `accessibilityBlueprint` calcolava `contrastPasses` richiedendo
  la soglia **AA testo normale (4.5:1)** per **tutte** le coppie di colori,
  incluse `primary-on-background` e `background-on-primary` (colore brand sullo
  sfondo). Il colore primario di un tema è però usato per titoli, link e componenti
  UI: la soglia AA applicabile è **3:1** (WCAG 2.2 §1.4.3 testo grande e §1.4.11
  contrasto non testuale). Il rapporto reale era 3.51:1 (magazine) e 3.19:1 (sport)
  — accessibili per titoli/UI, ma sotto 4.5:1. Il generatore rifiutava quindi
  palette di brand valide e accessibili.
- **Fix (correttezza, non nuova funzionalità):** soglia per-coppia in
  `blueprint/accessibility.ts` — `text-on-background` resta a **4.5:1** (corpo del
  testo), le coppie che coinvolgono il primary passano a **3:1**. `ContrastCheck`
  ora espone `requiredRatio` e `passes`; `contrastPasses` valuta ogni coppia con la
  propria soglia.
- **Diagnostica migliorata:** `validation-engine.ts` non emette più un messaggio
  generico ma elenca ogni coppia non conforme con rapporto misurato e soglia
  richiesta.
- **Regressione:** aggiunti 2 test in `accessibility.test.ts` (un primary vivace a
  ~3.5:1 è accettato; il corpo del testo continua a richiedere 4.5:1).
- **Esito:** dopo il fix e la rigenerazione, **5/5 progetti generati, 85/85
  controlli superati**. Nessuna riduzione dell'accessibilità del corpo del testo.

## Riepilogo

| Bug                                                    | Severità | Stato                    |
| ------------------------------------------------------ | -------- | ------------------------ |
| BUG-010-01 — soglia contrasto brand troppo restrittiva | Alta     | ✅ Corretto e verificato |

Bug trovati: **1** · Bug corretti: **1**.
