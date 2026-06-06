import { Sidebar } from "@/components/dashboard/sidebar";
import { PromoBanner } from "@/components/dashboard/promo-banner";
import { Greeting } from "@/components/dashboard/greeting";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ShiftsReport } from "@/components/dashboard/shifts-report";
import { ExtractionsBoard } from "@/components/dashboard/extractions-board";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <PromoBanner />
          <Greeting />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
              <KpiCard
                title="Turni questo mese"
                value="18"
                delta={{ value: "12%", direction: "up" }}
                caption="+2 rispetto al mese scorso"
              />
              <KpiCard
                title="Foto elaborate"
                value="7"
                delta={{ value: "24%", direction: "up" }}
                caption="+2 nuove estrazioni"
              />
              <KpiCard
                title="Ore lavorate"
                value="144h"
                delta={{ value: "4.2%", direction: "up" }}
                caption="+8h rispetto al mese scorso"
              />
              <KpiCard
                title="Affidabilità estrazione"
                value="96%"
                delta={{ value: "1.7%", direction: "up" }}
                caption="-1 turno da correggere a mano"
              />
            </div>

            <div className="lg:col-span-1">
              <ShiftsReport />
            </div>
          </div>

          <ExtractionsBoard />
        </div>
      </main>
    </div>
  );
}
