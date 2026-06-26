"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { LoginScreen } from "@/components/dashboard/login-screen";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Radio, 
  CalendarCheck,
  Info,
  Calendar as CalendarIcon
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

const CODE_BG_CLASSES: Record<string, string> = {
  M: "bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300",
  N: "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300",
  R: "bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 text-slate-400",
  F: "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300",
};

const CODE_INDICATOR_CLASSES: Record<string, string> = {
  M: "bg-violet-400",
  N: "bg-blue-400",
  R: "bg-slate-500",
  F: "bg-emerald-400",
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

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

export default function CalendarioPage() {
  const { data: session, status } = useSession();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayShifts, setSelectedDayShifts] = useState<Shift[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchShifts = async () => {
      try {
        const res = await fetch("/api/calendar");
        if (res.ok) {
          const data = await res.json();
          if (data.shifts) {
            setShifts(data.shifts);
          }
        }
      } catch (err) {
        console.error("Errore nel recupero del calendario turni:", err);
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

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Helper to change month
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  // Day of week of first day (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const totalDaysInMonth = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells = [];

  // Previous month padding days
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const pm = currentMonth === 0 ? 11 : currentMonth - 1;
    const py = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${py}-${String(pm + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    calendarCells.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarCells.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  // Next month padding days to complete grid (usually 42 cells)
  const totalCells = Math.ceil(calendarCells.length / 7) * 7;
  const nextMonthPadding = totalCells - calendarCells.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    const nm = currentMonth === 11 ? 0 : currentMonth + 1;
    const ny = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${ny}-${String(nm + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarCells.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  const itMonthFormatter = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });
  const displayCurrentMonth = itMonthFormatter.format(firstDayOfMonth).charAt(0).toUpperCase() + itMonthFormatter.format(firstDayOfMonth).slice(1);

  const getShiftsForDate = (dateStr: string) => {
    return shifts.filter((s) => s.date === dateStr);
  };

  const handleCellClick = (dateStr: string) => {
    const dayShifts = getShiftsForDate(dateStr);
    setSelectedDayShifts(dayShifts);
    setSelectedDateStr(dateStr);
  };

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr + "T00:00:00");
      return new Intl.DateTimeFormat("it-IT", {
        weekday: "long",
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
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Calendario Turni</h1>
                <p className="text-sm text-slate-400">
                  Vista mensile dei tuoi turni lavorativi
                </p>
              </div>
            </div>
          </div>

          {/* Calendar Board */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Grid Container */}
            <Card className="glass-card border-none p-5 lg:col-span-3 flex flex-col min-h-[600px]">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-5">
                <h2 className="text-lg font-bold text-white">{displayCurrentMonth}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/40 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    Oggi
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-2 flex-1">
                {calendarCells.map((cell, idx) => {
                  const dayShifts = getShiftsForDate(cell.dateStr);
                  const isToday = cell.dateStr === new Date().toISOString().substring(0, 10);
                  const isSelected = selectedDateStr === cell.dateStr;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCellClick(cell.dateStr)}
                      className={`min-h-[90px] rounded-xl p-2 cursor-pointer flex flex-col justify-between transition-all duration-300 select-none ${
                        cell.isCurrentMonth 
                          ? "bg-slate-900/40 border border-slate-800/60 text-white" 
                          : "bg-slate-950/20 border border-transparent text-slate-600"
                      } ${
                        isSelected 
                          ? "ring-2 ring-primary border-transparent" 
                          : "hover:bg-slate-800/30"
                      } ${
                        isToday ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full ${
                          isToday ? "bg-primary text-slate-950 font-extrabold" : ""
                        }`}>
                          {cell.dayNum}
                        </span>
                        
                        {dayShifts.length > 0 && (
                          <div className="flex gap-1">
                            {dayShifts.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className={`h-1.5 w-1.5 rounded-full ${CODE_INDICATOR_CLASSES[s.code] || "bg-primary"}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {dayShifts.map((shift, sIdx) => {
                          const hasHF = isThirdTuesday(shift.date) && is8to20Shift(shift);
                          const hasScenario = isMondayOrThursday(shift.date) && is8to20Shift(shift);
                          
                          return (
                            <div
                              key={sIdx}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold truncate flex items-center justify-between gap-1 ${
                                CODE_BG_CLASSES[shift.code] || "bg-slate-800 text-slate-300"
                              }`}
                            >
                              <span>
                                {shift.code} {shift.start && `${shift.start}`}
                              </span>
                              {(hasHF || hasScenario) && (
                                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Sidebar details */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="glass-card border-none p-5 h-full flex flex-col">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Dettagli Turno
                </h3>

                {selectedDateStr ? (
                  <div className="flex-1 flex flex-col">
                    <p className="text-sm font-bold text-white mb-4">
                      {formatDateLabel(selectedDateStr)}
                    </p>

                    {selectedDayShifts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                        <div className="h-10 w-10 rounded-full bg-slate-800/40 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                          <Info className="h-5 w-5" />
                        </div>
                        <p className="text-xs text-slate-400">Nessun turno inserito in questo giorno.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1 overflow-y-auto">
                        {selectedDayShifts.map((shift, idx) => {
                          const hasHF = isThirdTuesday(shift.date) && is8to20Shift(shift);
                          const hasScenario = isMondayOrThursday(shift.date) && is8to20Shift(shift);
                          
                          return (
                            <div key={idx} className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
                              <div className="flex items-center justify-between">
                                <Badge className={`${CODE_BG_CLASSES[shift.code] || "bg-slate-800"} text-xs font-semibold px-2.5 py-1`}>
                                  {CODE_LABELS[shift.code] || shift.code}
                                </Badge>
                                {shift.start && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{shift.start} - {shift.end}</span>
                                  </div>
                                )}
                              </div>

                              {shift.note ? (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Note</span>
                                  <p className="text-xs text-slate-200 leading-relaxed">{shift.note}</p>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic">Nessuna nota aggiuntiva</p>
                              )}

                              {/* Reminders list */}
                              {(hasHF || hasScenario) && (
                                <div className="space-y-2 pt-2 border-t border-slate-800/50">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Promemoria automatici</span>
                                  <div className="space-y-1.5">
                                    {hasHF && (
                                      <div className="flex items-start gap-2 text-xs text-violet-400 bg-violet-500/5 border border-violet-500/10 p-2 rounded-lg">
                                        <Radio className="h-3.5 w-3.5 mt-0.5 shrink-0 animate-pulse" />
                                        <div>
                                          <p className="font-semibold">Prove collegamento HF</p>
                                          <p className="text-[10px] text-slate-400 mt-0.5">Viene inserito allarme 15 minuti prima.</p>
                                        </div>
                                      </div>
                                    )}
                                    {hasScenario && (
                                      <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg">
                                        <CalendarCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <div>
                                          <p className="font-semibold">Analisi di scenario</p>
                                          <p className="text-[10px] text-slate-400 mt-0.5">Viene inserito allarme 15 minuti prima.</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <div className="h-10 w-10 rounded-full bg-slate-800/40 border border-slate-700 flex items-center justify-center text-slate-500 mb-3 animate-bounce">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-slate-400">Seleziona un giorno sulla griglia per vedere i dettagli del turno.</p>
                  </div>
                )}
              </Card>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
