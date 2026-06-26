"use client";

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
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type SidebarProps = {
  onOpenSettings?: () => void;
};

export function Sidebar({ onOpenSettings }: SidebarProps = {}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userEmail = session?.user?.email || "amoruso.giacomo@gmail.com";
  const userName = "Giacomo Amoruso";
  const userImage = session?.user?.image || "";

  // Helper to extract initials
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "GA";

  const sections: NavSection[] = [
    {
      title: "Presenze (Lavoro)",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/" },
        { label: "Carica turni", icon: Upload, href: "/carica" },
        { label: "Anteprima", icon: ListChecks, href: "/anteprima" },
        { label: "Cronologia", icon: History, href: "/cronologia" },
        { label: "Calendario", icon: CalendarDays, href: "/calendario" },
      ],
    },
    {
      title: "Utenze (Casa)",
      items: [
        { label: "Analisi Bollette", icon: BookOpen, href: "/bill-import/selection" },
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
        { label: "Impostazioni", icon: Settings, href: "/impostazioni" },
        { label: "Supporto", icon: LifeBuoy },
      ],
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col m-4 rounded-2xl glass-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-4">
        <Avatar className="h-10 w-10 ring-2 ring-primary/30 relative overflow-hidden">
          {userImage ? (
            <Image
              src={userImage}
              alt={userName}
              fill
              sizes="40px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {userName}
          </p>
          <p className="truncate text-xs text-slate-400">
            {userEmail}
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
                const isActive = item.href
                  ? item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                  : false;
                const baseClass = isActive
                  ? "w-full flex items-center gap-3 rounded-lg bg-primary/20 px-3 py-2.5 text-sm font-semibold text-primary transition-colors text-left"
                  : "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors text-left";
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <Link href={item.href} className={baseClass}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ) : (
                      <button onClick={item.onClick} className={baseClass}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-2 border-t border-slate-700/50 pt-3">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
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
