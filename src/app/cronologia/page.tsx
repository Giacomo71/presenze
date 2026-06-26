"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { LoginScreen } from "@/components/dashboard/login-screen";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Search, 
  Filter, 
  CalendarDays, 
  Clock, 
  Radio, 
  Trash2,
  CalendarCheck,
  TrendingUp,
  FileText
} from "lucide-react";

type Shift = {
  date: string;
  start: string;
  end: string;
  code: string;
  note: string;
};

const CODE_LABELS: Record<string, string> = {
  M: "Lavoro - Mattina",
  N: "Lavoro - Notte",
  R: "Riposo",
  F: "Ferie",
};

const CODE_BADGES: Record<string, string> = {
  M: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
  N: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  R: "bg-slate-500/20 text-slate-400 border border-slate-700",
  F: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

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

function isMondayOrThursday(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return false;
  const [year, month, day] = parts;
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay();
  return dow === 1 || dow === 4;
}

export default function CronologiaPage() {
  const { data: session, status } = useSession();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCode, setFilterCode] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchShifts = async () => {
      try {
        const res = await fetch("/api/calendar");
        if (res.ok) {
          const data = await res.json();
          if (data.shifts) {
            // Sort shifts newest first
            const sorted = [...data.shifts].sort((a, b) => b.date.localeCompare(a.date));
            setShifts(sorted);
          }
        }
      } catch (err) {
        console.error("Errore nel recupero della cronologia turni:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return <LoginScreen />;
  }

  // Get list of all available months in dataset for filtering
  const availableMonths = Array.from(
    new Set(shifts.map((s) => s.date.substring(0, 7)))
  ).sort((a, b) => b.localeCompare(a));

  // Filter shifts
  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch =
      shift.note?.toLowerCase().includes(search.toLowerCase()) ||
      (CODE_LABELS[shift.code] || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    
    const matchesCode = filterCode === "ALL" || shift.code === filterCode;
    const matchesMonth = selectedMonth === "ALL" || shift.date.startsWith(selectedMonth);

    return matchesSearch && matchesCode && matchesMonth;
  });

  // Calculate stats
  const totalTurns = filteredShifts.filter((s) => s.code === "M" || s.code === "N").length;
  const morningCount = filteredShifts.filter((s) => s.code === "M").length;
  const nightCount = filteredShifts.filter((s) => s.code === "N").length;
  const restCount = filteredShifts.filter((s) => s.code === "R" || s.code === "F").length;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00");
      return new Intl.DateTimeFormat("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Cronologia Turni</h1>
                <p className="text-sm text-slate-400">
                  Archivio storico dei turni salvati ed elaborati
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="glass-card border-none p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Turni Totali</p>
                <h3 className="text-2xl font-bold text-white mt-1">{loading ? "--" : totalTurns}</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-4">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span>Nel periodo selezionato</span>
              </div>
            </Card>

            <Card className="glass-card border-none p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Mattina (M)</p>
                <h3 className="text-2xl font-bold text-violet-400 mt-1">{loading ? "--" : morningCount}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-4">08:00 - 20:00</p>
            </Card>

            <Card className="glass-card border-none p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Notte (N)</p>
                <h3 className="text-2xl font-bold text-blue-400 mt-1">{loading ? "--" : nightCount}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-4">20:00 - 08:00</p>
            </Card>

            <Card className="glass-card border-none p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Riposo / Ferie</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{loading ? "--" : restCount}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-4">Nessun evento o ferie</p>
            </Card>
          </div>

          {/* Filters Card */}
          <Card className="glass-card border-none p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cerca nelle note o per tipo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Code Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={filterCode}
                    onChange={(e) => setFilterCode(e.target.value)}
                    className="bg-slate-950/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary cursor-pointer"
                  >
                    <option value="ALL">Tutti i codici</option>
                    <option value="M">Mattina (M)</option>
                    <option value="N">Notte (N)</option>
                    <option value="R">Riposo (R)</option>
                    <option value="F">Ferie (F)</option>
                  </select>
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-950/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary cursor-pointer"
                  >
                    <option value="ALL">Tutti i mesi</option>
                    {availableMonths.map((m) => {
                      const [year, month] = m.split("-");
                      const date = new Date(Number(year), Number(month) - 1, 1);
                      const display = new Intl.DateTimeFormat("it-IT", {
                        month: "long",
                        year: "numeric",
                      }).format(date);
                      return (
                        <option key={m} value={m}>
                          {display.charAt(0).toUpperCase() + display.slice(1)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Shifts Table/List */}
          <Card className="glass-card border-none overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-slate-400">Caricamento turni...</p>
              </div>
            ) : filteredShifts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/40 text-slate-500 mb-4 border border-slate-800">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">Nessun turno trovato</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  Prova a modificare i filtri o la ricerca per trovare quello che cerchi.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/30">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Data</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Codice</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Orario</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Note & Regole</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredShifts.map((shift, idx) => {
                      const hasHF = isThirdTuesday(shift.date) && is8to20Shift(shift);
                      const hasScenario = isMondayOrThursday(shift.date) && is8to20Shift(shift);
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                            {formatDate(shift.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${CODE_BADGES[shift.code] || "bg-slate-800"} shadow-sm`}>
                              {CODE_LABELS[shift.code] || shift.code}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {shift.start && shift.end ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                <span>{shift.start} - {shift.end}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex flex-col gap-1">
                              {shift.note ? (
                                <span className="text-slate-300 font-medium">{shift.note}</span>
                              ) : (
                                <span className="text-slate-500 italic">Nessuna nota</span>
                              )}
                              
                              {/* Automatic Rules Badges */}
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {hasHF && (
                                  <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] py-0.5 px-1.5 flex items-center gap-1">
                                    <Radio className="h-3 w-3" />
                                    HF Connection
                                  </Badge>
                                )}
                                {hasScenario && (
                                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] py-0.5 px-1.5 flex items-center gap-1">
                                    <CalendarCheck className="h-3 w-3" />
                                    Scenario Analysis
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
