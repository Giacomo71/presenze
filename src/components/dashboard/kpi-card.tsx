import { ArrowUpRight, MoreHorizontal, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

type KpiCardProps = {
  title: string;
  value: string;
  delta: { value: string; direction: "up" | "down" };
  caption: string;
  ctaLabel?: string;
};

export function KpiCard({
  title,
  value,
  delta,
  caption,
  ctaLabel = "Dettagli",
}: KpiCardProps) {
  const isUp = delta.direction === "up";
  return (
    <Card className="glass-card rounded-2xl p-5 border-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
          {title}
          <Info className="h-3.5 w-3.5 text-slate-500" />
        </div>
        <button className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <p className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
          {value}
        </p>
        <span
          className={
            isUp
              ? "inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-300"
              : "inline-flex items-center gap-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-300"
          }
        >
          {isUp ? "+" : "−"}
          {delta.value}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">{caption}</p>
        <button className="group inline-flex items-center gap-1 rounded-full border border-slate-600/50 bg-slate-800/50 px-3 py-1 text-xs text-slate-300 hover:bg-primary/20 hover:text-primary-foreground hover:border-primary/50 transition-all duration-300">
          {ctaLabel}
          <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </Card>
  );
}
