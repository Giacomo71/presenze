import {
  LayoutDashboard,
  Upload,
  ListChecks,
  History,
  CalendarDays,
  Settings,
  LifeBuoy,
  LogOut,
  ChevronDown,
  Check,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Menu principale",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, active: true },
      { label: "Carica turni", icon: Upload },
      { label: "Anteprima", icon: ListChecks },
      { label: "Cronologia", icon: History },
      { label: "Calendario", icon: CalendarDays },
    ],
  },
  {
    title: "Configurazione",
    items: [
      { label: "Codici turno", icon: Clock },
      { label: "Account Google", icon: Check },
    ],
  },
  {
    title: "Aiuto",
    items: [
      { label: "Impostazioni", icon: Settings },
      { label: "Supporto", icon: LifeBuoy },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col m-4 rounded-2xl glass-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-4">
        <Avatar className="h-10 w-10 ring-2 ring-primary/30">
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            GA
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            Giacomo Amoruso
          </p>
          <p className="truncate text-xs text-slate-400">
            amoruso.giacomo@gmail.com
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <a
                      href="#"
                      className={
                        item.active
                          ? "flex items-center gap-3 rounded-lg bg-primary/20 px-3 py-2.5 text-sm font-semibold text-primary transition-colors"
                          : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-2 border-t border-slate-700/50 pt-3">
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </a>
        </div>
      </nav>

      <div className="m-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Google Calendar
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connesso
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Gli eventi vengono creati sul tuo calendario{" "}
            <span className="font-medium text-slate-300">primario</span>.
          </p>
        </div>
      </div>
    </aside>
  );
}
