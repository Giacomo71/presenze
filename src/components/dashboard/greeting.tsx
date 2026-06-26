"use client";

import { Upload, Loader2, X, CheckCircle2, Download, Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

function todayInItalian() {
  const formatter = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const today = formatter.format(new Date());
  return today.charAt(0).toUpperCase() + today.slice(1);
}

type Shift = {
  date: string;
  start: string;
  end: string;
  code: string;
  note: string;
};

type GreetingProps = {
  targetName: string;
  calendarId: string;
  onExtractionComplete: (shifts: Shift[], fileName: string, warnings: string[]) => void;
  onShiftsSaved: (shifts: Shift[], destination: "google" | "ics") => void;
};

export function Greeting({
  targetName,
  calendarId,
  onExtractionComplete,
  onShiftsSaved,
}: GreetingProps) {
  const { data: session } = useSession();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedShifts, setExtractedShifts] = useState<Shift[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saveResult, setSaveResult] = useState<{ message: string; success: boolean } | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const displayGreetingName = "Giacomo";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtracting(true);
      setSaveResult(null);
      setExtractionError(null);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("targetName", targetName);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
        throw new Error(errData.error + (errData.rawResponse ? "\n\nRisposta AI: " + errData.rawResponse : ""));
      }

      const data = await res.json();
      console.log("Extract API response:", data);
      const shifts = data.shifts || [];
      const warnList = data.warnings || [];
      
      setExtractedShifts(shifts);
      setWarnings(warnList);
      
      // Notify parent about successful extraction (adds card to board)
      onExtractionComplete(shifts, file.name, warnList);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setExtractionError(err.message || "Errore sconosciuto durante l'estrazione.");
    } finally {
      setIsExtracting(false);
      e.target.value = "";
    }
  };

  const handleDownloadICS = async () => {
    if (!extractedShifts || extractedShifts.length === 0) return;

    try {
      setIsSaving(true);
      setSaveResult(null);
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shifts: extractedShifts, destination: "ics" }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Errore scaricamento file .ics" }));
        throw new Error(errData.error || "Errore sconosciuto");
      }

      // Download the .ics file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `turni-${extractedShifts[0]?.date || "export"}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaveResult({
        message: `File .ics scaricato con successo (${extractedShifts.length} eventi)! Aprilo per importarli nel calendario.`,
        success: true,
      });

      // Save shifts history locally in the parent
      onShiftsSaved(extractedShifts, "ics");
    } catch (err: any) {
      setSaveResult({ message: err.message, success: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    if (!extractedShifts || extractedShifts.length === 0) return;

    try {
      setIsSaving(true);
      setSaveResult(null);

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shifts: extractedShifts,
          destination: "google",
          calendarId: calendarId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Errore di sincronizzazione" }));
        throw new Error(errData.error || "Sincronizzazione non riuscita.");
      }

      const data = await res.json();
      setSaveResult({
        message: `Sincronizzazione completata! Creati ${data.createdCount} eventi, skippati ${data.skippedCount} duplicati esistenti.`,
        success: true,
      });

      // Save shifts history locally in the parent
      onShiftsSaved(extractedShifts, "google");
    } catch (err: any) {
      setSaveResult({ message: err.message, success: false });
    } finally {
      setIsSaving(false);
    }
  };

  const updateShift = (idx: number, field: keyof Shift, value: string) => {
    if (!extractedShifts) return;
    const updated = [...extractedShifts];
    updated[idx] = { ...updated[idx], [field]: value };
    setExtractedShifts(updated);
  };

  const updateShiftCode = (idx: number, code: string) => {
    if (!extractedShifts) return;
    const updated = [...extractedShifts];
    let start = "";
    let end = "";
    if (code === "M") {
      start = "08:00";
      end = "20:00";
    } else if (code === "N") {
      start = "20:00";
      end = "08:00";
    }
    updated[idx] = { ...updated[idx], code, start, end };
    setExtractedShifts(updated);
  };

  const handleDeleteRow = (idx: number) => {
    if (!extractedShifts) return;
    const updated = [...extractedShifts];
    updated.splice(idx, 1);
    setExtractedShifts(updated);
  };

  const handleAddRow = () => {
    const newShift: Shift = {
      date: new Date().toISOString().split("T")[0],
      start: "08:00",
      end: "20:00",
      code: "M",
      note: "",
    };
    setExtractedShifts([...(extractedShifts || []), newShift]);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 p-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              Ciao, <span className="text-gradient">{displayGreetingName}</span>
            </h1>
            <Link
              href="/impostazioni"
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-400 hover:text-white transition-colors"
              title="Apri Impostazioni"
            >
              <Settings2 className="h-4.5 w-4.5" />
            </Link>
          </div>
          <p className="mt-1.5 text-sm font-medium text-slate-400">{todayInItalian()}</p>
        </div>
        <div>
          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-xl text-white shadow-lg shadow-primary/25 transition-all duration-300 font-semibold px-6 py-4 ${
              isExtracting
                ? "bg-slate-700 pointer-events-none opacity-80"
                : "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 hover:scale-105"
            }`}
          >
            {isExtracting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Upload className="mr-2 h-5 w-5" />
            )}
            {isExtracting ? "Analizzando tabella..." : "Carica planning"}
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isExtracting}
            />
          </label>
        </div>
      </div>

      {/* Extraction error inline notification */}
      {extractionError && (
        <div className="mt-4 p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-300 flex items-center justify-between shadow-lg">
          <span className="text-sm font-medium">{extractionError}</span>
          <button
            onClick={() => setExtractionError(null)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Modal Anteprima */}
      {extractedShifts !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Anteprima ed Modifica Turni
              </h2>
              <button
                onClick={() => {
                  setExtractedShifts(null);
                  setSaveResult(null);
                }}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 flex-1">
              {warnings.length > 0 && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <h3 className="text-amber-400 font-semibold text-sm mb-2">
                    Avvisi dal sistema AI:
                  </h3>
                  <ul className="list-disc list-inside text-sm text-amber-200/80">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save result toast */}
              {saveResult && (
                <div
                  className={`mb-6 p-4 rounded-xl border ${
                    saveResult.success
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-red-500/10 border-red-500/20 text-red-300"
                  }`}
                >
                  {saveResult.message}
                </div>
              )}

              {extractedShifts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-4">
                  <div>Nessun turno trovato per &quot;{targetName}&quot; nell&apos;immagine fornita.</div>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/95 text-white"
                  >
                    <Plus className="h-4 w-4" /> Aggiungi riga manuale
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950/20">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800/50 text-slate-300 border-b border-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Data</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-36">Codice Turno</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-28 text-center">Inizio</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-28 text-center">Fine</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Note</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-12 text-center">Elimina</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {extractedShifts.map((shift, idx) => (
                          <tr
                            key={idx}
                            className="bg-slate-900/30 hover:bg-slate-800/30 transition-colors"
                          >
                            {/* Date input */}
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                value={shift.date}
                                onChange={(e) => updateShift(idx, "date", e.target.value)}
                                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/50 focus:bg-slate-900/80 rounded px-2 py-1 text-slate-200 text-sm w-full transition-all"
                              />
                            </td>
                            {/* Code select dropdown */}
                            <td className="px-3 py-2">
                              <select
                                value={shift.code}
                                onChange={(e) => updateShiftCode(idx, e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-xs font-semibold focus:ring-1 focus:ring-primary/50 outline-none"
                              >
                                <option value="M">M (Mattina 08-20)</option>
                                <option value="N">N (Notte 20-08)</option>
                                <option value="R">R (Riposo)</option>
                                <option value="F">F (Ferie)</option>
                              </select>
                            </td>
                            {/* Start time input */}
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={shift.start || ""}
                                onChange={(e) => updateShift(idx, "start", e.target.value)}
                                placeholder="HH:MM"
                                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/50 focus:bg-slate-900/80 rounded px-2 py-1 text-slate-200 text-sm w-full text-center font-mono transition-all"
                              />
                            </td>
                            {/* End time input */}
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={shift.end || ""}
                                onChange={(e) => updateShift(idx, "end", e.target.value)}
                                placeholder="HH:MM"
                                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/50 focus:bg-slate-900/80 rounded px-2 py-1 text-slate-200 text-sm w-full text-center font-mono transition-all"
                              />
                            </td>
                            {/* Note input */}
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={shift.note || ""}
                                onChange={(e) => updateShift(idx, "note", e.target.value)}
                                placeholder="Aggiungi nota..."
                                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/50 focus:bg-slate-900/80 rounded px-2 py-1 text-slate-400 text-xs w-full transition-all"
                              />
                            </td>
                            {/* Delete button */}
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(idx)}
                                className="p-1 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Aggiungi riga
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 flex justify-end gap-3 flex-wrap">
              <button
                onClick={() => {
                  setExtractedShifts(null);
                  setSaveResult(null);
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Chiudi
              </button>

              <button
                onClick={handleDownloadICS}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
                disabled={extractedShifts.length === 0 || isSaving || saveResult?.success === true}
              >
                <Download className="mr-2 h-4 w-4 inline" />
                Scarica file .ics
              </button>

              <button
                onClick={handleSyncGoogleCalendar}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
                disabled={extractedShifts.length === 0 || isSaving || saveResult?.success === true}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Sincronizzazione in corso...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 inline" />
                    Sincronizza Google Calendar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
