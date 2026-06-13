import {
  CalendarDays,
  Filter,
  Info,
  KanbanSquare,
  ListIcon,
  MoreHorizontal,
  Plus,
  Rows3,
} from "lucide-react";
import { Card } from "@/components/ui/card";

type Tag = { label: string; color: "blue" | "amber" | "violet" | "rose" | "emerald" };

type ExtractionCard = {
  columnId: string;
  title: string;
  description: string;
  tags: Tag[];
  thumbs: string[];
  timeAgo: string;
};

type ExtractionsBoardProps = {
  extractions: ExtractionCard[];
  onAddExtractionClick?: () => void;
};

const tagColors: Record<Tag["color"], string> = {
  blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  amber: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  violet: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
  rose: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

const columnsConfig = [
  {
    key: "todo",
    title: "Da rivedere",
    dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
  },
  {
    key: "review",
    title: "In anteprima",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  },
  {
    key: "done",
    title: "Pubblicati su Calendar",
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  },
];

function Thumbs({ items }: { items: string[] }) {
  return (
    <div className="flex -space-x-2">
      {items.map((t, i) => (
        <div
          key={i}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800 text-[10px] font-semibold text-slate-300 shadow-sm"
        >
          {t}
        </div>
      ))}
    </div>
  );
}

export function ExtractionsBoard({ extractions, onAddExtractionClick }: ExtractionsBoardProps) {
  const now = new Date();
  const itMonthFormatter = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });
  const displayCurrentMonth = itMonthFormatter.format(now).charAt(0).toUpperCase() + itMonthFormatter.format(now).slice(1);

  return (
    <Card className="glass-card rounded-2xl p-5 border-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
          Estrazioni
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 pb-3">
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/50 p-1 text-xs border border-slate-700/30">
          <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-700/80 px-3 py-1.5 font-medium text-white shadow-sm">
            <KanbanSquare className="h-3.5 w-3.5 text-primary" />
            Kanban
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-400 hover:text-white transition-colors">
            <Rows3 className="h-3.5 w-3.5" />
            Tabella
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-400 hover:text-white transition-colors">
            <ListIcon className="h-3.5 w-3.5" />
            Lista
          </button>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/50 bg-slate-800/30 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filtra
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        {columnsConfig.map((col) => {
          const colCards = extractions.filter((card) => card.columnId === col.key);

          return (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  {col.title}
                  <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700">
                    {colCards.length}
                  </span>
                </div>
                <button className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={onAddExtractionClick}
                className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30 py-3 text-slate-500 hover:border-primary/50 hover:text-primary transition-all duration-300 hover:bg-primary/5"
              >
                <Plus className="h-5 w-5" />
              </button>

              {colCards.map((card, idx) => (
                <div
                  key={idx}
                  className="group rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 hover:border-primary/40 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {card.tags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          tagColors[tag.color as Tag["color"]] || tagColors.blue
                        }`}
                      >
                        {tag.label}
                      </span>
                    ))}
                    <button className="ml-auto opacity-0 group-hover:opacity-100 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white group-hover:text-primary-100 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">
                    {card.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <Thumbs items={card.thumbs} />
                    <span className="text-[11px] font-medium text-slate-500">{card.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
