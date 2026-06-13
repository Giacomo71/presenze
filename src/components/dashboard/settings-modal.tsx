"use client";

import { useState, useEffect } from "react";
import { X, Settings2, Save, Copy, Check } from "lucide-react";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  calendarId: string;
  onSave: (newTargetName: string, newCalendarId: string) => void;
  feedUrl: string;
};

export function SettingsModal({
  isOpen,
  onClose,
  targetName: initialTargetName,
  calendarId: initialCalendarId,
  onSave,
  feedUrl,
}: SettingsModalProps) {
  const [targetName, setTargetName] = useState(initialTargetName);
  const [calendarId, setCalendarId] = useState(initialCalendarId);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargetName(initialTargetName);
      setCalendarId(initialCalendarId);
      setIsCopied(false);
    }
  }, [isOpen, initialTargetName, initialCalendarId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy feed URL to clipboard:", err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(targetName, calendarId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Impostazioni
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="targetName" className="text-xs font-semibold text-slate-400">
                Nome Target nella Tabella
              </label>
              <input
                id="targetName"
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="es. AMORUSO GIACOMO"
                required
              />
              <p className="text-[10px] text-slate-500">
                Il nome da cercare nella tabella dei turni. L&apos;AI cercherà questa stringa e le sue varianti abbreviate.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="calendarId" className="text-xs font-semibold text-slate-400">
                ID Calendario di destinazione
              </label>
              <input
                id="calendarId"
                type="text"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="es. primary"
                required
              />
              <p className="text-[10px] text-slate-500">
                Usa &quot;primary&quot; per sincronizzare sul tuo calendario principale.
              </p>
            </div>

            {feedUrl && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-400">
                  URL Sottoscrizione Calendario (Feed ICS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={feedUrl}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none select-all cursor-pointer font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex items-center justify-center p-2.5 rounded-xl border transition-all ${
                      isCopied
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
                    }`}
                    title={isCopied ? "Copiato!" : "Copia link"}
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 space-y-1.5 leading-relaxed">
                  <p>
                    Usa questo link per abbonarti ai turni da client esterni (es. Google Calendar &gt; &quot;Dall&apos;URL&quot;, Apple Calendar o Outlook).
                  </p>
                  <p className="text-amber-500/80 font-medium flex items-center gap-1">
                    ⚠️ Questo link è privato e dà accesso ai tuoi turni. Non condividerlo.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Salva impostazioni
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
