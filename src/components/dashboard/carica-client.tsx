"use client";

import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Upload, ImageIcon, Loader2, CheckCircle2, AlertTriangle, X, FileImage } from "lucide-react";
import { useSession } from "next-auth/react";

type Shift = { date: string; start: string; end: string; code: string; note: string };

export function CaricaClient() {
  const { data: session } = useSession();
  const [targetName, setTargetName] = useState("Amoruso Giacomo");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedShifts, setExtractedShifts] = useState<Shift[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Carica solo file immagine (JPG, PNG, WEBP).");
      return;
    }
    setError(null);
    setExtractedShifts(null);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("image", file);
    formData.append("targetName", targetName);

    setIsExtracting(true);
    try {
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore estrazione");
      setExtractedShifts(data.shifts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const codeColor: Record<string, string> = {
    M: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    N: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    F: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    R: "bg-slate-600/30 text-slate-400 border-slate-600/40",
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Carica Turni</h1>
              <p className="text-sm text-slate-400">Carica una foto del planning e l&apos;AI estrarrà i turni automaticamente</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-slate-700 bg-slate-900/40 hover:border-primary/50 hover:bg-slate-900/60"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {preview ? (
              <div className="relative w-full max-h-64 overflow-hidden rounded-xl mx-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Anteprima" className="w-full object-contain max-h-64 rounded-xl opacity-80" />
                <button
                  onClick={(e) => { e.stopPropagation(); setPreview(null); setFileName(null); setExtractedShifts(null); }}
                  className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <FileImage className="h-8 w-8 text-primary/70" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-200">Trascina qui la foto del planning</p>
                  <p className="text-xs text-slate-500 mt-1">oppure clicca per selezionare · JPG, PNG, WEBP</p>
                </div>
              </>
            )}
          </div>

          {/* Stato estrazione */}
          {isExtracting && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 px-5 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-slate-300">Analisi in corso con AI — attendi qualche secondo…</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {/* Risultati */}
          {extractedShifts && !isExtracting && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">
                    {extractedShifts.length} turni estratti
                    {fileName && <span className="text-slate-400 font-normal"> da {fileName}</span>}
                  </p>
                </div>
                <span className="text-xs text-slate-500">Vai su Dashboard per sincronizzare</span>
              </div>
              <div className="divide-y divide-slate-800/50">
                {extractedShifts.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/20 transition-colors">
                    <span className="w-28 text-xs font-mono text-slate-400">{s.date}</span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${codeColor[s.code] || codeColor.R}`}>
                      {s.code}
                    </span>
                    <span className="text-xs text-slate-400">
                      {s.start && s.end ? `${s.start} – ${s.end}` : "—"}
                    </span>
                    {s.note && <span className="ml-auto text-xs text-slate-500 truncate max-w-[200px]">{s.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tip box */}
          {!extractedShifts && !isExtracting && (
            <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 px-5 py-4 flex items-start gap-3">
              <ImageIcon className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Per risultati migliori usa foto nitide e ben illuminate. Il nome cercato è{" "}
                <span className="text-slate-300 font-medium">{targetName}</span> — puoi cambiarlo nelle Impostazioni.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
