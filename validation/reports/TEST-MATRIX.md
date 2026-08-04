# TEST MATRIX — WordPress News Generator (SPRINT-010)

5 progetti generati in isolamento, 17 controlli automatici ciascuno (85 controlli
totali). Legenda: ✓ superato.

| Controllo                            |   TGMAX   | Quotidiano | Magazine  |   Sport   |   Blog    |
| ------------------------------------ | :-------: | :--------: | :-------: | :-------: | :-------: |
| Struttura cartelle                   |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| File richiesti (20)                  |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Sintassi PHP (euristica)             |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Include `get_template_part` risolti  |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Layout con `get_header`/`get_footer` |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Link interni (navigazione)           |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Metadata (versione + generatedAt)    |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Manifest presente                    |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Campi manifest completi              |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Conteggio artefatti coerente         |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Checksum SHA-256 verificati          |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Versioni artefatti                   |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| README progetto                      |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Asset (colore brand in main.css)     |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| `theme.json` valido                  |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Config riflessa in `style.css`       |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| Config blueprint presenti            |     ✓     |     ✓      |     ✓     |     ✓     |     ✓     |
| **Esito**                            | **17/17** | **17/17**  | **17/17** | **17/17** | **17/17** |

File generati per progetto: 67 (66 artefatti tema + `.telemax/manifest.json`).
Totale file generati: **335**. Controlli superati: **85/85**.

## Determinismo (FASE 7)

- Stessa configurazione e stesso `generatedAt` → output **byte-identici** (0 differenze).
- `generatedAt` diverso → differiscono **solo** le righe con il timestamp e i
  checksum/bytes da esse derivati nel manifest (0 differenze sostanziali).
- Rigenerazione di TGMAX identica all'artefatto precedente.
