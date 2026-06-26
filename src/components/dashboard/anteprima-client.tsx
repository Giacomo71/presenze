"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PromoBanner } from "@/components/dashboard/promo-banner";
import {
  ListChecks, Calendar, Clock, Tag, Pencil, Trash2,
  CheckCircle2, AlertTriangle, Sun, Moon, Palmtree, Coffee
} from "lucide-react";

type Shift = { date: string; start: string; end: string; code: string; note: string };

const CODE_META: Record<string, { label: string; icon: React.ComponentType<{className?:string}>; color: string; bg: string }> = {
  M: { label: "Mattina", icon: Sun,      color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  N: { label: "Notte",   icon: Moon,     color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  F: { label: "Ferie",   icon: Palmtree, color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
  R: { label: "Riposo",  icon: Coffee,   color: "text-slate-400",  bg: "bg-slate-700/30 border-slate-700/40" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "2-digit", month: "short" }).format(d);
}

export function AnteprimaClient() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("savedShifts");
    if (stored) {
      try { setShifts(JSON.parse(stored)); } catch {}
    }
  }, []);

  const filtered = filter === "all" ? shifts : shifts.filter(s => s.code === filter);

  const handleDelete = (i: number) => {
    const next = shifts.filter((_, idx) => idx !== i);
    setShifts(next);
    localStorage.setItem("savedShifts", JSON.stringify(next));
  };

  const handleSaveNote = (i: number) => {
    const next = shifts.map((s, idx) => idx === i ? { ...s, note: editNote } : s);
    setShifts(next);
    localStorage.setItem("savedShifts", JSON.stringify(next));
    setEditIdx(null);
  };

  const counts = { M: 0, N: 0, F: 0, R: 0 };
  shifts.forEach(s => { if (s.code in counts) counts[s.code as keyof typeof counts]++; });

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Anteprima Turni</h1>
              <p className="text-sm text-slate-400">Visualizza, modifica o elimina i turni salvati prima di sincronizzarli</p>
            </div>
          </div>

          {/* KPI Pills */}
          <div className="flex flex-wrap gap-3">
            {(["all", "M", "N", "F", "R"] as const).map(code => {
              const meta = code === "all" ? null : CODE_META[code];
              const Icon = meta?.icon;
              const count = code === "all" ? shifts.length : counts[code];
              return (
                <button
                  key={code}
                  onClick={() => setFilter(code)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                    filter === code
                      ? "border-primary/50 bg-primary/20 text-primary"
                      : "border-slate-700/50 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {code === "all" ? "Tutti" : meta?.label} · <span className="font-bold">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 py-16">
              <AlertTriangle className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-500">Nessun turno trovato. Carica una foto nella pagina <span className="text-slate-300">Carica Turni</span>.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
                <p className="text-sm font-semibold text-white">{filtered.length} turni</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Sincronizzati con il server
                </div>
              </div>
              <div className="divide-y divide-slate-800/40">
                {filtered.map((s, i) => {
                  const meta = CODE_META[s.code] || CODE_META.R;
                  const Icon = meta.icon;
                  const realIdx = shifts.indexOf(s);
                  return (
                    <div key={i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-800/20 transition-colors group">
                      {/* Date */}
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-slate-600" />
                        <span className="text-xs font-mono text-slate-300">{formatDate(s.date)}</span>
                      </div>

                      {/* Code badge */}
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>

                      {/* Orario */}
                      {s.start && s.end && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3 text-slate-600" />
                          {s.start} – {s.end}
                        </div>
                      )}

                      {/* Note — editable */}
                      <div className="flex-1 min-w-0">
                        {editIdx === realIdx ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={editNote}
                              onChange={e => setEditNote(e.target.value)}
                              className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-primary/50"
                              autoFocus
                              onKeyDown={e => { if (e.key === "Enter") handleSaveNote(realIdx); if (e.key === "Escape") setEditIdx(null); }}
                            />
                            <button onClick={() => handleSaveNote(realIdx)} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">Salva</button>
                            <button onClick={() => setEditIdx(null)} className="text-xs text-slate-500 hover:text-slate-300">✕</button>
                          </div>
                        ) : (
                          s.note && (
                            <div className="flex items-center gap-1.5">
                              <Tag className="h-3 w-3 text-slate-600 shrink-0" />
                              <span className="text-xs text-slate-500 truncate">{s.note}</span>
                            </div>
                          )
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditIdx(realIdx); setEditNote(s.note || ""); }}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
                          title="Modifica nota"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(realIdx)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Elimina turno"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
