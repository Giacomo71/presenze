# Regole ed Implementazioni del Promemoria "Prove Collegamento HF"

Questo file documenta la logica e le regole applicate per inserire automaticamente il promemoria **"prove collegamento HF"** all'interno dell'applicazione **Presenze**.

---

## 📌 Regola di Attivazione

Il promemoria viene inserito solo quando si verificano contemporaneamente queste due condizioni:

1. **Giorno della Settimana e del Mese**: La data del turno corrisponde al **3° martedì del mese**.
   * *Formula Matematica*: Il giorno della settimana è martedì (`getDay() === 2`) e il giorno del mese è compreso tra **15 e 21** (inclusi).
2. **Tipo di Turno**: È un turno **8/20**.
   * *Definizione*: Il codice del turno è `"M"` (Mattina) oppure gli orari impostati sono esattamente dalle `"08:00"` alle `"20:00"`.

---

## 💻 Dettagli dell'Implementazione

La logica è distribuita su due livelli per garantire sia la visibilità nell'applicazione che la corretta esportazione su Google Calendar:

### 1. Fase di Estrazione ed Anteprima (Backend)
Nel modulo di estrazione turni dell'AI, dopo l'elaborazione dell'immagine e prima di inviare i dati al browser:
* **File:** [src/app/api/extract/route.ts](file:///c:/Users/amoru/Desktop/Presenze/src/app/api/extract/route.ts)
* **Logica:** 
  Viene post-processato l'array dei turni. Se un turno soddisfa le condizioni, il campo `note` viene modificato:
  * Se non ci sono note: viene impostato a `"prove collegamento HF"`.
  * Se ci sono note esistenti: viene accodato come `" - prove collegamento HF"`.
* **Snippet Codice:**
  ```typescript
  function isThirdTuesday(dateStr: string): boolean {
    if (!dateStr) return false;
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return false;
    const [year, month, day] = parts;
    const d = new Date(Date.UTC(year, month - 1, day));
    const isTuesday = d.getUTCDay() === 2;
    const dayOfMonth = d.getUTCDate();
    return isTuesday && dayOfMonth >= 15 && dayOfMonth <= 21;
  }

  function is8to20Shift(shift: { start?: string; end?: string; code?: string }): boolean {
    return shift.code === "M" || (shift.start === "08:00" && shift.end === "20:00");
  }
  ```

---

### 2. Fase di Generazione del File di Calendario (ICS)
Durante la conversione dei turni nel file `.ics` per l'importazione in Google Calendar:
* **File:** [src/app/api/calendar/route.ts](file:///c:/Users/amoru/Desktop/Presenze/src/app/api/calendar/route.ts)
* **Logica:**
  Se il turno risponde ai requisiti (anche nel caso in cui l'utente abbia modificato manualmente la tabella a schermo):
  1. **Titolo dell'evento (`SUMMARY`)**: Diventa `Lavoro - Mattina (prove collegamento HF)`.
  2. **Descrizione dell'evento (`DESCRIPTION`)**: Include la nota `Ricordati: prove collegamento HF`.
  3. **Allarme/Notifica (`VALARM`)**: Viene inserito un promemoria sonoro/visivo che si attiva **15 minuti prima** dell'inizio del turno.
* **Formato ICS Generato per l'evento:**
  ```ics
  BEGIN:VEVENT
  UID:presenze-xxxxxxxxx@presenze.local
  DTSTAMP:20260608T091924Z
  DTSTART;TZID=Europe/Rome:20260616T080000
  DTEND;TZID=Europe/Rome:20260616T200000
  SUMMARY:Lavoro - Mattina (prove collegamento HF)
  DESCRIPTION:Turno M\nRicordati: prove collegamento HF
  STATUS:CONFIRMED
  BEGIN:VALARM
  TRIGGER:-PT15M
  ACTION:DISPLAY
  DESCRIPTION:Ricordati: prove collegamento HF
  END:VALARM
  END:VEVENT
  ```

---

## 🧪 Casi di Test e Validazione

I seguenti giorni del 2026 sono stati testati e confermati come validi o non validi dalla logica di rilevazione:

| Data | Giorno della Settimana | Giorno del Mese | Risultato Atteso | Note |
| :--- | :--- | :--- | :--- | :--- |
| **02-06-2026** | Martedì | 2 | ❌ **Escluso** | 1° martedì del mese |
| **09-06-2026** | Martedì | 9 | ❌ **Escluso** | 2° martedì del mese |
| **16-06-2026** | Martedì | 16 |  **Attivo** | 3° martedì del mese (compreso tra 15 e 21) |
| **23-06-2026** | Martedì | 23 | ❌ **Escluso** | 4° martedì del mese |
| **30-06-2026** | Martedì | 30 | ❌ **Escluso** | 5° martedì del mese |
| **15-06-2026** | Lunedì | 15 | ❌ **Escluso** | Giorno della settimana errato (Lunedì) |
| **19-05-2026** | Martedì | 19 |  **Attivo** | 3° martedì di Maggio |
| **21-07-2026** | Martedì | 21 |  **Attivo** | 3° martedì di Luglio |
