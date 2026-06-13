import { CalendarDays, Filter, Info, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";

type Shift = {
  date: string;
  start: string;
  end: string;
  code: string;
  note: string;
};

type ShiftsReportProps = {
  savedShifts: Shift[];
};

const monthLabels = ["Dic", "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov"];

const shades = [
  "bg-violet-900/40",
  "bg-violet-800/60",
  "bg-violet-600/80",
  "bg-violet-500",
  "bg-violet-400",
];

function shadeFor(i: number, total: number) {
  if (total === 0) return shades[0];
  const ratio = i / Math.max(total - 1, 1);
  const idx = Math.min(shades.length - 1, Math.floor(ratio * shades.length));
  return shades[idx];
}

export function ShiftsReport({ savedShifts }: ShiftsReportProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  // Filter current month shifts
  const currentMonthShifts = savedShifts.filter((s) => s.date.startsWith(currentMonthPrefix));

  const totalShiftsThisMonth = currentMonthShifts.filter((s) => s.code === "M" || s.code === "N").length;
  const morningShifts = currentMonthShifts.filter((s) => s.code === "M").length;
  const nightShifts = currentMonthShifts.filter((s) => s.code === "N").length;
  const restHolidayShifts = currentMonthShifts.filter((s) => s.code === "R" || s.code === "F").length;

  // Compute trend for the last 6 months
  const trendMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const prefix = `${y}-${String(m + 1).padStart(2, "0")}`;
    const count = savedShifts.filter((s) => s.date.startsWith(prefix) && (s.code === "M" || s.code === "N")).length;
    trendMonths.push({
      label: monthLabels[m],
      total: count,
    });
  }

  const maxTotal = Math.max(...trendMonths.map((m) => m.total), 1);

  // Format current month label for display
  const itMonthFormatter = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });
  const displayCurrentMonth = itMonthFormatter.format(now).charAt(0).toUpperCase() + itMonthFormatter.format(now).slice(1);

  return (
    <Card className="glass-card flex h-full flex-col rounded-2xl p-5 border-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
          Andamento turni
          <Info className="h-3.5 w-3.5 text-slate-500" />
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/50 bg-slate-800/30 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors">
            <CalendarDays className="h-3.5 w-3.5" />
            {displayCurrentMonth}
          </button>
          <button className="rounded-md border border-slate-700/50 bg-slate-800/30 p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors">
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-4 sm:grid-cols-4">
        <div>
          <p className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {totalShiftsThisMonth}
          </p>
          <p className="text-xs text-slate-400 font-medium">Totale turni</p>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {morningShifts}
          </p>
          <p className="text-xs text-slate-400 font-medium">Mattina (M)</p>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {nightShifts}
          </p>
          <p className="text-xs text-slate-400 font-medium">Notte (N)</p>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {restHolidayShifts}
          </p>
          <p className="text-xs text-slate-400 font-medium">Riposo / Ferie</p>
        </div>
      </div>

      <div className="mt-6 flex flex-1 items-end gap-4">
        <div className="flex h-full flex-col justify-between py-2 text-[10px] text-slate-500 font-medium">
          <span>{maxTotal}</span>
          <span>{Math.round(maxTotal * 0.66)}</span>
          <span>{Math.round(maxTotal * 0.33)}</span>
          <span>0</span>
        </div>
        <div className="flex h-44 flex-1 items-end gap-3">
          {trendMonths.map((m, idx) => (
            <div key={idx} className="flex flex-1 flex-col items-center group cursor-pointer">
              <div className="flex w-full flex-col-reverse gap-[3px] group-hover:-translate-y-1 transition-transform duration-300">
                {Array.from({ length: m.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-full rounded-sm ${shadeFor(i, m.total)} shadow-[0_0_8px_rgba(0,0,0,0.2)]`}
                  />
                ))}
                {m.total === 0 && (
                  <div className="h-2 w-full rounded-sm bg-slate-900/40 border border-dashed border-slate-800" />
                )}
              </div>
              <span className="mt-2 text-[11px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
