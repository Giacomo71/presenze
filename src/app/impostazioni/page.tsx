"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import {
  Radio,
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings2,
  Save,
  Copy,
  Check,
} from "lucide-react";

type Rule = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glowColor: string;
  title: string;
  subtitle: string;
  conditions: { label: string; detail: string }[];
  effects: { label: string }[];
  testCases: { date: string; day: string; dayNum: string; result: boolean; reason: string }[];
};

const rules: Rule[] = [
  {
    id: "hf",
    icon: Radio,
    color: "from-violet-500 to-indigo-500",
    glowColor: "shadow-violet-500/20",
    title: "Prove Collegamento HF",
    subtitle: "Promemoria automatico nel titolo e nell'allarme dell'evento",
    conditions: [
      {
        label: "3° Martedì del mese",
        detail: "Il giorno è martedì (getDay() === 2) e il giorno del mese è compreso tra 15 e 21.",
      },
      {
        label: "Turno 8/20",
        detail: 'Il codice turno è "M" (Mattina) oppure gli orari sono esattamente 08:00–20:00.',
      },
    ],
    effects: [
      { label: "Titolo evento → «Lavoro - Mattina (prove collegamento HF)»" },
      { label: "Descrizione → «Ricordati: prove collegamento HF»" },
      { label: "Allarme popup 15 minuti prima dell'inizio" },
      { label: "Campo note del turno aggiornato in fase di estrazione AI" },
    ],
    testCases: [
      { date: "02-06-2026", day: "Mar", dayNum: "2", result: false, reason: "1° martedì del mese" },
      { date: "09-06-2026", day: "Mar", dayNum: "9", result: false, reason: "2° martedì del mese" },
      { date: "16-06-2026", day: "Mar", dayNum: "16", result: true, reason: "3° martedì del mese ✓" },
      { date: "23-06-2026", day: "Mar", dayNum: "23", result: false, reason: "4° martedì del mese" },
      { date: "19-05-2026", day: "Mar", dayNum: "19", result: true, reason: "3° martedì di Maggio ✓" },
      { date: "21-07-2026", day: "Mar", dayNum: "21", result: true, reason: "3° martedì di Luglio ✓" },
    ],
  },
  {
    id: "scenario",
    icon: CalendarCheck,
    color: "from-amber-500 to-orange-500",
    glowColor: "shadow-amber-500/20",
    title: "Analisi di Scenario",
    subtitle: "Promemoria automatico nei turni del lunedì e giovedì",
    conditions: [
      {
        label: "Lunedì o Giovedì",
        detail: "Il giorno della settimana è lunedì (getDay() === 1) oppure giovedì (getDay() === 4).",
      },
      {
        label: "Turno 8/20",
        detail: 'Il codice turno è "M" (Mattina) oppure gli orari sono esattamente 08:00–20:00.',
      },
    ],
    effects: [
      { label: "Titolo evento → «Lavoro - Mattina (analisi di scenario)»" },
      { label: "Descrizione → «Ricordati: analisi di scenario»" },
      { label: "Allarme popup 15 minuti prima dell'inizio" },
      { label: "Campo note del turno aggiornato in fase di estrazione AI" },
    ],
    testCases: [
      { date: "16-06-2026", day: "Lun", dayNum: "16", result: true, reason: "Lunedì + turno M ✓" },
      { date: "18-06-2026", day: "Mer", dayNum: "18", result: false, reason: "Mercoledì — escluso" },
      { date: "19-06-2026", day: "Gio", dayNum: "19", result: true, reason: "Giovedì + turno M ✓" },
      { date: "20-06-2026", day: "Ven", dayNum: "20", result: false, reason: "Venerdì — escluso" },
      { date: "23-06-2026", day: "Lun", dayNum: "23", result: true, reason: "Lunedì + turno M ✓" },
      { date: "24-06-2026", day: "Mar", dayNum: "24", result: false, reason: "Martedì — escluso" },
    ],
  },
];

export default function ImpostazioniPage() {
  const [isRulesSectionOpen, setIsRulesSectionOpen] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  
  const [targetName, setTargetName] = useState("Amoruso Giacomo");
  const [calendarId, setCalendarId] = useState("primary");
  const [feedUrl, setFeedUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const storedTargetName = localStorage.getItem("targetName");
    const storedCalendarId = localStorage.getItem("calendarId");
    
    if (storedTargetName) setTargetName(storedTargetName);
    if (storedCalendarId) setCalendarId(storedCalendarId);
    
    // Fetch feedUrl from server
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        if (data.feedUrl) setFeedUrl(data.feedUrl);
      })
      .catch((err) => console.error("Failed to fetch feed URL:", err));
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy feed URL:", err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("targetName", targetName);
    localStorage.setItem("calendarId", calendarId);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Settings Section */}
          <section className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
                  <Settings2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Impostazioni</h1>
                  <p className="text-sm text-slate-400">
                    Configura il tuo account e le preferenze di sincronizzazione
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl shadow-xl overflow-hidden p-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="targetName" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                    <p className="text-[11px] text-slate-500">
                      Il nome da cercare nella tabella dei turni.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="calendarId" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      ID Calendario
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
                    <p className="text-[11px] text-slate-500">
                      Usa &quot;primary&quot; per il tuo calendario principale.
                    </p>
                  </div>
                </div>

                {feedUrl && (
                  <div className="space-y-2 pt-4 border-t border-slate-800/50">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      URL Sottoscrizione Calendario (Feed ICS)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={feedUrl}
                        readOnly
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none select-all cursor-pointer font-mono truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`inline-flex items-center justify-center px-4 rounded-xl border transition-all ${
                          isCopied
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10 transition-colors"
                  >
                    {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {isSaved ? "Salvato!" : "Salva Impostazioni"}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Rules Section - Collapsible */}
          <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl shadow-xl overflow-hidden">
            <button
              onClick={() => setIsRulesSectionOpen(!isRulesSectionOpen)}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg ring-1 ring-white/10">
                  <Zap className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Regole fisse</h2>
                  <p className="text-sm text-slate-400">
                    Regole impostate automaticamente per il calendario
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                  {rules.length} regole
                </span>
                {isRulesSectionOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {isRulesSectionOpen && (
              <div className="px-6 pb-6 pt-2 border-t border-slate-800/50 space-y-4">
              {rules.map((rule) => {
                const Icon = rule.icon;
                const isOpen = expandedRule === rule.id;

                return (
                  <div
                    key={rule.id}
                    className={`rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl shadow-xl transition-all duration-300 overflow-hidden ${isOpen ? `shadow-2xl ${rule.glowColor}` : ""}`}
                  >
                    {/* Card Header */}
                    <button
                      className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpandedRule(isOpen ? null : rule.id)}
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${rule.color} shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-white">{rule.title}</p>
                        <p className="text-sm text-slate-400 truncate">{rule.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Attiva
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isOpen && (
                      <div className="px-6 pb-6 space-y-6 border-t border-slate-700/40 pt-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                              Condizioni di Attivazione
                            </p>
                            <ul className="space-y-3">
                              {rule.conditions.map((c, i) => (
                                <li key={i} className="space-y-0.5">
                                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                                    <span className={`inline-block h-2 w-2 rounded-full bg-gradient-to-r ${rule.color}`} />
                                    {c.label}
                                  </p>
                                  <p className="text-xs text-slate-500 pl-4">{c.detail}</p>
                                </li>
                              ))}
                            </ul>
                            <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-400 font-mono">
                              condizione 1 <span className="text-amber-400 font-bold">AND</span> condizione 2
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-primary" />
                              Effetti Applicati
                            </p>
                            <ul className="space-y-2">
                              {rule.effects.map((e, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                                  {e.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Casi di Test Validati
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-700/50">
                                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500">Data</th>
                                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500">Giorno</th>
                                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500">N° giorno</th>
                                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500">Motivo</th>
                                  <th className="text-right py-2 text-xs font-medium text-slate-500">Risultato</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {rule.testCases.map((tc, i) => (
                                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">{tc.date}</td>
                                    <td className="py-2.5 pr-4 text-xs text-slate-400">{tc.day}</td>
                                    <td className="py-2.5 pr-4 text-xs text-slate-400">{tc.dayNum}</td>
                                    <td className="py-2.5 pr-4 text-xs text-slate-400">{tc.reason}</td>
                                    <td className="py-2.5 text-right">
                                      {tc.result ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                                          <CheckCircle2 className="h-3 w-3" /> Attivo
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 border border-slate-700">
                                          <XCircle className="h-3 w-3" /> Escluso
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
