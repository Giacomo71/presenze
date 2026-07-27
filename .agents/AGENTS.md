# Regole di Sviluppo del Progetto

## Sincronizzazione Calendario
- **Bottone Unico**: Per salvare i turni nel calendario del sito, sincronizzare Google Calendar ed esportare/scaricare il file `.ics`, deve essere sempre utilizzato un singolo bottone coordinato ("Salva e Sincronizza Tutto") per garantire la migliore UX ed evitare passaggi manuali multipli all'utente.

## Estrazione Turni (Identificazione Utente)
- **Riga di "M.C. Amoruso Giacomo"**: Nell'estrazione dei turni tramite LLM Vision, la riga dell'utente può presentare variazioni/qualifiche prefissate o abbreviazioni.
  - Esempi di matching validi: `"Amoruso Giacomo"`, `"AMORUSO G."`, `"G. AMORUSO"`, `"AMORUSO GIAC."`, `"M.A. AMORUSO"`, `"M.C. AMORUSO"`, `"M.C. Amoruso Giacomo"`.
  - Queste varianti (dove "M.A." o "M.C." indicano qualifiche/livelli) si riferiscono tutte allo **stesso utente** e devono essere mappate correttamente sulla stessa riga di dati.

## Regole Promemoria ("Prove Collegamento HF")
- **Condizione di Attivazione**: Inserire automaticamente la nota e il promemoria `"prove collegamento HF"` se:
  1. Il turno corrisponde al **3° martedì del mese** (ovvero è martedì ed il giorno del mese è compreso tra **15 e 21** inclusi).
  2. Il turno è di tipo **8/20** (codice `"M"` o orari dalle `"08:00"` alle `"20:00"`).
- **Integrazione ICS e Calendario**:
  - **Titolo (SUMMARY)**: Accodare `(prove collegamento HF)` al titolo dell'evento (es. `Lavoro - Mattina (prove collegamento HF)`).
  - **Descrizione (DESCRIPTION)**: Includere `Ricordati: prove collegamento HF`.
  - **Allarme (VALARM)**: Configurare un avviso acustico/visivo sul calendario **15 minuti prima** dell'inizio del turno.

## Modulo Analisi Bollette (Luce e Gas)

### Struttura Google Drive attesa
```
Bollette/               ← cartella principale su Google Drive
├── Gas/                ← PDF delle bollette gas (classificati automaticamente come GAS)
└── Luce/               ← PDF delle bollette luce (classificati automaticamente come LUCE)
```
- La ricerca su Drive è case-insensitive per le cartelle (es. "bollette" o "Bollette").
- Fallback: se le sottocartelle non esistono, cerca PDF direttamente in `Bollette/`.
- Fallback globale: se `Bollette/` non esiste, cerca PDF con "bolletta" nel nome in tutto il Drive.

### Fornitori riconosciuti
| Fornitore | Utenza |
|-----------|--------|
| **Sinergas** | Gas |
| **Italgas** | Gas |
| **2irete Gas** | Gas |
| **ENI Gas** | Gas |
| **Hera Comm** | Gas |
| **Dolomiti Energia** | Elettricità |
| **Enel** | Elettricità |
| **Edison / Plenitude** | Elettricità |
| **A2A Luce** | Elettricità |
| **Iren Luce** | Elettricità |
| **Illumia** | Elettricità |

### Utente reale
- **Fornitore Gas**: Sinergas S.p.A. — bolletta maggio 2026, cliente Giacomo Amoruso, Via Potenza 24, 70020 Modugno BA.
- **Fornitore Luce**: Dolomiti Energia — bolletta periodo dic 2025–gen 2026, cliente Giacomo Amoruso, Via Potenza 24, 70026 Modugno BA.

### Estrazione dati dal PDF
- **Libreria**: `pdf-parse` (v1.x) — import dinamico `(pdfParseModule as any).default ?? pdfParseModule` per compatibilità ESM/CJS.
- **Periodo fatturazione**: estratto dai formati `"maggio 2026"`, `"05/2026"`, `"DD/MM/YYYY – DD/MM/YYYY"`, `"Scadenza DD/MM/YYYY"`.
- **Consumo Gas**: regex cercano `XXX Smc`, `Consumo XXX Smc`, `Volume XXX`.
- **Consumo Luce**: regex cercano `XXX kWh`, `Consumo XXX kWh`, `Energia XXX`.
- **Fallback**: se l'estrazione fallisce, viene usato un valore casuale realistico con `console.warn`.
