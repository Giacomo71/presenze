"use client";

import { Upload, Loader2, X, CheckCircle2, Download } from "lucide-react";
import { useState } from "react";

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

export function Greeting() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedShifts, setExtractedShifts] = useState<Shift[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saveResult, setSaveResult] = useState<{ message: string; success: boolean } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtracting(true);
      setSaveResult(null);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("targetName", "Amoruso Giacomo");

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
      setExtractedShifts(data.shifts || []);
      setWarnings(data.warnings || []);
    } catch (err: any) {
      console.error("Extraction error:", err);
      alert("Errore durante l'estrazione:\n" + err.message);
    } finally {
      setIsExtracting(false);
      e.target.value = "";
    }
  };

  const handleDownloadICS = async () => {
    if (!extractedShifts || extractedShifts.length === 0) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shifts: extractedShifts }),
      });

      if (!res.ok) {
        const errData = await res.json();
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
        message: `File .ics scaricato con ${extractedShifts.length} eventi! Aprilo per importarli in Google Calendar.`,
        success: true,
      });
    } catch (err: any) {
      setSaveResult({ message: err.message, success: false });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 p-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            Ciao, <span className="text-gradient">Giacomo</span>
          </h1>
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

      {/* Modal Anteprima */}
      {extractedShifts !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Anteprima Estrazione
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
                <div className="text-center py-12 text-slate-400">
                  Nessun turno trovato per &quot;Amoruso Giacomo&quot; nell&apos;immagine fornita.
                </div>
              ) : (
                <div className="border border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/50 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Data</th>
                        <th className="px-4 py-3 font-semibold">Turno</th>
                        <th className="px-4 py-3 font-semibold">Inizio</th>
                        <th className="px-4 py-3 font-semibold">Fine</th>
                        <th className="px-4 py-3 font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {extractedShifts.map((shift, idx) => (
                        <tr
                          key={idx}
                          className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-300">{shift.date}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                              {shift.code || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{shift.start || "--:--"}</td>
                          <td className="px-4 py-3 text-slate-400">{shift.end || "--:--"}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{shift.note || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setExtractedShifts(null);
                  setSaveResult(null);
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleDownloadICS}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
                disabled={extractedShifts.length === 0 || isSaving || saveResult?.success === true}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Generando file...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4 inline" />
                    Scarica {extractedShifts.length} eventi (.ics)
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
