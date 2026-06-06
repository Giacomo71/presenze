# PRD — Presenze

> Web app personale per estrarre turni di lavoro da una foto del planning aziendale e crearli automaticamente su Google Calendar.

- **Autore:** Giacomo Amoruso
- **Data:** 2026-05-24
- **Stato:** Draft v1
- **Tipo prodotto:** Web app single-user, deploy su Vercel

---

## 1. Obiettivo

Eliminare il lavoro manuale di trascrizione dei turni di lavoro nel calendario personale. L'utente fotografa la tabella turni affissa in azienda (o riceve la foto), la carica nell'app, e dopo una rapida revisione i turni vengono creati come eventi sul proprio Google Calendar.

### Problema
Ogni settimana / mese viene pubblicata una tabella turni cartacea. Trascriverla a mano nel calendario è lento, noioso e soggetto a errori (giorno sbagliato, ora sbagliata, dimenticanze).

### Soluzione
Una web app che:
1. Riceve in upload una foto del planning.
2. Usa un LLM multimodale per estrarre solo i turni dell'utente.
3. Mostra un'anteprima editabile.
4. Crea gli eventi su Google Calendar al click di conferma.

### Successo
- Tempo per inserire una settimana di turni: **da ~5 min (manuale) a <60 s**.
- Errori di trascrizione: **0** (l'utente vede sempre l'anteprima prima del commit).
- Affidabilità estrazione: **≥95%** dei turni leggibili a occhio nudo vengono estratti correttamente.

---

## 2. Utente target

Un solo utente: l'autore. Single-tenant, single-account.

Conseguenze:
- Nessuna registrazione/login multi-utente: solo OAuth Google sul proprio account.
- Nessun database multi-tenant: storage minimo (eventualmente nessuno, vedi §7).
- Nessun billing, nessuna gestione ruoli.
- Nessuna compliance/GDPR oltre alle best practice base (token in storage sicuro).

---

## 3. User stories (MVP)

1. **Login** — Come utente voglio collegare il mio account Google una volta, per non dover riautenticarmi ogni volta.
2. **Upload foto** — Voglio caricare una foto (drag & drop o file picker) della tabella turni dal mio PC o dal mio telefono.
3. **Identificazione persona** — Voglio dire all'app quale riga / nome è il mio, perché la tabella contiene tutti i colleghi.
4. **Anteprima editabile** — Voglio vedere i turni estratti come lista (data, orario inizio, orario fine, eventuale nota) e poterli correggere prima di confermare.
5. **Creazione eventi** — Al click di "Crea su Calendar" voglio che gli eventi vengano creati sul mio calendario, con titolo e orario corretti.
6. **Prevenzione duplicati** — Se ricarico la stessa foto o un turno già esistente, voglio essere avvisato e non avere doppioni.

---

## 4. Funzionalità

### MVP (v1)
- [x] OAuth Google (scope: `calendar.events`)
- [x] Upload immagine (JPEG, PNG, HEIC, max ~10 MB)
- [x] Selezione del nome/identificativo proprio (salvato in localStorage per riuso)
- [x] Estrazione turni via LLM multimodale (Claude Sonnet con vision)
- [x] Tabella anteprima editabile (aggiungi / modifica / elimina riga)
- [x] Selezione del Google Calendar di destinazione (default: primario)
- [x] Creazione eventi in batch
- [x] Detection duplicati: prima della creazione, query a Calendar per giorno/orario; se esiste evento con stesso titolo+orario, salta con avviso
- [x] Stato finale: "X eventi creati, Y skippati"

### Nice-to-have (v1.1+)
- Riconoscimento turni ricorrenti ("Mattina" = 06–14, "Pomeriggio" = 14–22, "Notte" = 22–06) configurabili
- Cronologia delle elaborazioni passate
- Possibilità di ricevere foto via Telegram bot / email-to-app
- PWA installabile su mobile, con camera diretta
- Notifiche/promemoria automatici N ore prima del turno

### Out of scope (v1)
- Multi-utente
- Gestione turni di altri colleghi
- Sincronizzazione bidirezionale (modifica in Calendar → modifica in app)
- Esportazione iCal / Outlook
- App mobile native

---

## 5. Flusso utente principale

```
[1] Apro presenze.vercel.app
      ↓
[2] (Primo accesso) "Collega Google" → OAuth → consenso scope calendar.events
      ↓
[3] (Primo accesso) Configuro il mio "nome come appare nella tabella" (es. "AMORUSO G.")
      ↓
[4] Drag & drop della foto del planning
      ↓
[5] Spinner "Sto leggendo la tabella…" (chiamata LLM ~3–8 s)
      ↓
[6] Anteprima:
       ┌─────────────────────────────────────────────┐
       │ Data         Inizio   Fine    Tipo    Note  │
       │ Lun 26/05    06:00    14:00   M             │ ✏️ 🗑
       │ Mar 27/05    14:00    22:00   P             │ ✏️ 🗑
       │ Mer 28/05    --       --      Riposo        │ ✏️ 🗑
       │ ...                                          │
       │ [+ Aggiungi riga]                            │
       └─────────────────────────────────────────────┘
       [Annulla]                    [Crea 5 eventi →]
      ↓
[7] Conferma → POST batch a Google Calendar API
      ↓
[8] "✅ 5 eventi creati, 0 duplicati saltati. [Apri Calendar]"
```

---

## 6. Requisiti tecnici

### Stack
| Layer        | Scelta                                   | Motivazione                                                      |
|--------------|------------------------------------------|------------------------------------------------------------------|
| Framework    | **Next.js 15 (App Router)**              | Deploy nativo su Vercel, server actions per API key safety       |
| UI           | React + Tailwind CSS + shadcn/ui         | Componenti già pronti, zero design from scratch                  |
| Auth         | **NextAuth.js (Auth.js v5)** con Google provider | Gestione OAuth + refresh token con poca configurazione    |
| LLM Vision   | **Anthropic Claude Sonnet 4.6** (`claude-sonnet-4-6`) | Estrazione tabelle da immagini più affidabile; output JSON strutturato |
| Calendar API | `googleapis` (Node SDK ufficiale)        | Standard, ben documentato                                        |
| Hosting      | **Vercel** (free tier inizialmente)      | Richiesta esplicita; deploy via GitHub                           |
| Storage      | Nessun DB nel MVP (vedi §7)              | Single-user → tutto in localStorage / cookie sessione            |

### Architettura

```
Browser (Next.js client)
    │
    ├── /api/auth/*          ← NextAuth (callback Google)
    │
    ├── /api/extract         ← Server route
    │       └─→ Anthropic API (claude-sonnet-4-6, vision)
    │             input:  immagine base64 + nome utente target
    │             output: JSON { shifts: [{date, start, end, type, note}] }
    │
    └── /api/create-events   ← Server route
            └─→ Google Calendar API (insert in batch)
                     ↑
                 access_token dalla sessione (refresh automatico via NextAuth)
```

**Tutte le chiamate a LLM e Google Calendar avvengono server-side** per non esporre API key all'browser.

### Integrazione Google Calendar
- **Scope OAuth richiesto:** `https://www.googleapis.com/auth/calendar.events` (read+write solo sugli eventi, non sui calendari).
- **Refresh token** salvato cifrato nella sessione NextAuth (JWT su cookie httpOnly, secure).
- **Eventi creati con:**
  - `summary`: es. "Lavoro — Mattina" (configurabile)
  - `start.dateTime` / `end.dateTime` con timezone `Europe/Rome`
  - `description`: include marker `[presenze-app]` per riconoscibilità futura
  - `reminders.useDefault`: true (modificabile in v1.1)
- **Detection duplicati:** prima della `insert`, fare `events.list` con `timeMin`/`timeMax` del giorno → se trovo evento con `summary` uguale o description marker `[presenze-app]` con stesso start/end → skip.

### Estrazione via LLM
- **Modello:** `claude-sonnet-4-6` (multimodal).
- **Input:** immagine + prompt strutturato che include:
  - Nome dell'utente da cercare nella tabella (es. "AMORUSO G.")
  - Mese/anno di riferimento (autodetect o input utente per disambiguare date tipo "26" → "26/05/2026")
  - Mapping codici turno → orari (configurabile, default: M=06–14, P=14–22, N=22–06, R=riposo)
- **Output forzato JSON** (tool use o response_format) con schema:
  ```json
  {
    "shifts": [
      { "date": "2026-05-26", "start": "06:00", "end": "14:00", "code": "M", "note": "" }
    ],
    "warnings": ["riga 3 illeggibile", "..."]
  }
  ```
- **Prompt caching** sul system prompt (configurazione codici turno + istruzioni) per ridurre costi se l'utente carica più foto in sequenza.

### Sicurezza & privacy
- API key Anthropic + Google Client Secret **solo in env vars Vercel**, mai esposte.
- Cookie sessione `httpOnly`, `secure`, `sameSite=lax`.
- Le foto **non vengono persistite**: arrivano in memoria sul server, vengono mandate ad Anthropic, scartate dopo la response. Nessun blob storage.
- Rate limit sul route `/api/extract` (es. 20 req/h) per evitare abuso/costi runaway.

### Variabili d'ambiente (Vercel)
```
NEXTAUTH_URL=https://presenze.vercel.app
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ANTHROPIC_API_KEY=...
DEFAULT_TIMEZONE=Europe/Rome
```

---

## 7. Modello dati

Nel MVP **nessun database**. Stato:
- **Sessione utente + token Google:** JWT NextAuth (cookie).
- **Preferenze (nome target, codici turno, calendar ID):** `localStorage`.
- **Foto e turni in elaborazione:** solo in memoria, scartati dopo il submit.

Se in v1.1 si vuole cronologia → aggiungere Vercel Postgres o Vercel KV con tabella:
```
extractions(id, created_at, image_hash, raw_json, events_created_ids)
```

---

## 8. UI / UX

Una sola pagina, tre stati:

1. **Stato iniziale** — Dropzone grande al centro, titolo "Presenze", in alto status connessione Google.
2. **Stato elaborazione** — Spinner + thumbnail della foto caricata + messaggio "Sto leggendo la tabella…".
3. **Stato anteprima** — Tabella editabile + bottone primario "Crea N eventi".

Settings (icona ingranaggio in alto a destra):
- Nome target nella tabella
- Mapping codici turno → orari
- Calendar di destinazione (dropdown popolato via `calendarList.list`)
- Titolo template (es. `Lavoro — {codice}`)
- Timezone

Responsive mobile-first: la dropzone su mobile apre direttamente la fotocamera (`<input capture="environment">`).

---

## 9. Metriche di successo

Trattandosi di tool personale, metriche semplici:
- **Tempo medio "upload → conferma":** target < 60 s.
- **% turni corretti senza editing manuale:** target ≥ 90% al primo colpo.
- **Costo per estrazione:** target < €0,05/foto (monitorare uso Anthropic).
- **Soddisfazione personale:** "lo uso davvero ogni mese senza tornare al metodo manuale".

---

## 10. Roadmap / Milestone

| Milestone | Contenuto | Stima |
|-----------|-----------|-------|
| **M1 — Scaffolding** | Next.js + Tailwind + shadcn, deploy Vercel "hello world" | 0,5 g |
| **M2 — Auth Google** | NextAuth con scope Calendar, login funzionante in prod | 0,5 g |
| **M3 — Estrazione** | Route `/api/extract`, prompt + schema JSON, test con 3 foto reali | 1 g |
| **M4 — Anteprima editabile** | UI tabella con add/edit/delete riga | 0,5 g |
| **M5 — Creazione eventi** | Route `/api/create-events`, batch insert, detection duplicati | 0,5 g |
| **M6 — Settings + polish** | Pagina settings, gestione errori, loading states, mobile | 1 g |
| **MVP totale**            |                                                          | **~4 giorni di lavoro** |

---

## 11. Rischi & mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| LLM sbaglia a leggere foto sfocate / mal illuminate | Media | Medio | Anteprima editabile obbligatoria; mostrare il campo `warnings` del modello |
| Costi Anthropic fuori controllo | Bassa | Medio | Rate limit, prompt caching, log uso |
| Token Google scade / refresh fallisce | Media | Alto | NextAuth gestisce refresh; in caso di errore mostrare "riconnetti Google" |
| Foto con dati di colleghi → privacy | Alta | Medio | Foto mai persistita; informativa breve in fondo all'app |
| Layout planning cambia drasticamente | Bassa | Alto | LLM è flessibile by design; in caso fallisca, fallback a editing manuale di tabella vuota |
| Vercel free tier limits | Bassa | Basso | Uso personale, ben sotto i limiti; eventualmente upgrade |

---

## 12. Domande aperte

1. Il planning aziendale è sempre nello stesso formato o cambia? (Se stabile → si può ottimizzare il prompt; se varia → meglio mantenerlo generico)
2. Esistono codici turno con orari "speciali" (es. mezzi turni, straordinari) da gestire?
3. Vuoi promemoria automatici (push/email) prima del turno, o basta che l'evento sia su Calendar?
4. Vuoi un titolo evento neutro ("Lavoro") o esplicito ("Turno mattina presso X")?

---

## Appendice A — Esempio prompt LLM

```
Sei un assistente che estrae turni di lavoro da una foto di una tabella di planning aziendale.

Devi trovare i turni della persona di nome: "{USER_NAME}".
Il mese di riferimento è: {MONTH_YEAR}.
La timezone è: Europe/Rome.

Codici turno conosciuti:
- M → 08:00–20:00 (mattina)

- N → 20:00–08:00 (notte, sconfina al giorno successivo)
- R → riposo (NON creare evento)
- F → ferie (crea evento "Ferie" tutto il giorno)

Restituisci SOLO JSON valido con questa struttura:
{
  "shifts": [
    {
      "date": "YYYY-MM-DD",
      "start": "HH:MM" | null,    // null se riposo/ferie
      "end":   "HH:MM" | null,
      "code":  "M"|"P"|"N"|"R"|"F"|"altro",
      "note":  "stringa libera o vuota"
    }
  ],
  "warnings": ["eventuali righe ambigue/illeggibili"]
}

Ignora i turni di tutti gli altri nomi. Se non trovi la persona, restituisci shifts vuoto e una warning chiara.
```
