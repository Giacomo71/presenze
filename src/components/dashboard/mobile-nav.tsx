"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, Upload, CalendarDays, Settings, History } from "lucide-react";

export function MobileNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Hide if the user is not authenticated/session is loading
  if (!session) return null;

  const items = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Carica", href: "/carica", icon: Upload },
    { label: "Calendario", href: "/calendario", icon: CalendarDays },
    { label: "Cronologia", href: "/cronologia", icon: History },
    { label: "Impostazioni", href: "/impostazioni", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 lg:hidden rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-lg shadow-2xl px-4 py-2">
      <ul className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
                  isActive ? "text-primary scale-105" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
