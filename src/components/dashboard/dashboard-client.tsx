"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PromoBanner } from "@/components/dashboard/promo-banner";
import { Greeting } from "@/components/dashboard/greeting";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ShiftsReport } from "@/components/dashboard/shifts-report";
import { ExtractionsBoard } from "@/components/dashboard/extractions-board";

type Shift = {
  date: string;
  start: string;
  end: string;
  code: string;
  note: string;
};

type Tag = { label: string; color: "blue" | "amber" | "violet" | "rose" | "emerald" };

type ExtractionCard = {
  columnId: string;
  title: string;
  description: string;
  tags: Tag[];
  thumbs: string[];
  timeAgo: string;
};

function generateSeedShifts(): Shift[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return [
    { date: `${year}-${month}-04`, start: "08:00", end: "20:00", code: "M", note: "analisi di scenario - monitoraggio controlli ed efficienza mezzi" },
    { date: `${year}-${month}-05`, start: "08:00", end: "20:00", code: "M", note: "" },
    { date: `${year}-${month}-07`, start: "20:00", end: "08:00", code: "N", note: "" },
    { date: `${year}-${month}-08`, start: "20:00", end: "08:00", code: "N", note: "" },
    { date: `${year}-${month}-11`, start: "08:00", end: "20:00", code: "M", note: "analisi di scenario - monitoraggio controlli ed efficienza mezzi" },
    { date: `${year}-${month}-12`, start: "08:00", end: "20:00", code: "M", note: "" },
    { date: `${year}-${month}-14`, start: "20:00", end: "08:00", code: "N", note: "" },
    { date: `${year}-${month}-15`, start: "20:00", end: "08:00", code: "N", note: "" },
    { date: `${year}-${month}-18`, start: "08:00", end: "20:00", code: "M", note: "analisi di scenario - monitoraggio controlli ed efficienza mezzi" },
    { date: `${year}-${month}-19`, start: "08:00", end: "20:00", code: "M", note: "prove collegamento HF" },
    { date: `${year}-${month}-21`, start: "20:00", end: "08:00", code: "N", note: "" },
    { date: `${year}-${month}-22`, start: "20:00", end: "08:00", code: "N", note: "" },
    { date: `${year}-${month}-25`, start: "08:00", end: "20:00", code: "M", note: "analisi di scenario - monitoraggio controlli ed efficienza mezzi" },
    { date: `${year}-${month}-26`, start: "08:00", end: "20:00", code: "M", note: "" },
    { date: `${year}-${month}-28`, start: "20:00", end: "08:00", code: "N", note: "" },
    { date: `${year}-${month}-29`, start: "20:00", end: "08:00", code: "N", note: "" },
  ];
}

const defaultExtractions: ExtractionCard[] = [
  {
    columnId: "todo",
    title: "Planning Maggio · settimana 22",
    description: "Foto del planning caricata stamattina. 5 turni rilevati da confermare prima di crearli su Calendar.",
    tags: [
      { label: "Nuovo", color: "blue" },
      { label: "5 turni", color: "amber" },
    ],
    thumbs: ["GA", "M", "N"],
    timeAgo: "10m fa",
  },
  {
    columnId: "review",
    title: "Planning Maggio · settimana 21",
    description: "Anteprima pronta: 4 turni (M, M, N, N) e 3 giorni di riposo. Manca solo la tua conferma.",
    tags: [
      { label: "Pronto", color: "amber" },
      { label: "4 turni", color: "violet" },
    ],
    thumbs: ["GA", "M", "N"],
    timeAgo: "2g fa",
  },
  {
    columnId: "done",
    title: "Planning Maggio · settimana 20",
    description: "5 eventi creati sul calendario primario, 0 duplicati. Apri Google Calendar per controllare.",
    tags: [
      { label: "Completato", color: "emerald" },
      { label: "5 eventi", color: "blue" },
    ],
    thumbs: ["GA", "M", "N", "R"],
    timeAgo: "5g fa",
  },
];

export function DashboardClient() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [savedShifts, setSavedShifts] = useState<Shift[]>([]);
  const [extractions, setExtractions] = useState<ExtractionCard[]>([]);
  const [photoCount, setPhotoCount] = useState(7);
  const [targetName, setTargetName] = useState("Giacomo");
  const [calendarId, setCalendarId] = useState("primary");
  const [feedUrl, setFeedUrl] = useState("");

  useEffect(() => {
    // Always reset targetName to Giacomo (overrides any old stored value like "RAD71")
    localStorage.setItem("targetName", "Giacomo");
    setTargetName("Giacomo");
    const storedCalendarId = localStorage.getItem("calendarId");
    const storedPhotoCount = localStorage.getItem("photoCount");
    const storedShifts = localStorage.getItem("savedShifts");
    const storedExtractions = localStorage.getItem("extractions");

    if (storedCalendarId) setCalendarId(storedCalendarId);
    if (storedPhotoCount) setPhotoCount(Number(storedPhotoCount));

    if (storedExtractions) {
      setExtractions(JSON.parse(storedExtractions));
    } else {
      setExtractions(defaultExtractions);
      localStorage.setItem("extractions", JSON.stringify(defaultExtractions));
    }

    // Initialize with local storage shifts or seed shifts first
    let initialShifts: Shift[] = [];
    if (storedShifts) {
      try {
        initialShifts = JSON.parse(storedShifts);
      } catch (e) {
        console.error("Failed to parse stored shifts:", e);
      }
    } else {
      initialShifts = generateSeedShifts();
      localStorage.setItem("savedShifts", JSON.stringify(initialShifts));
    }
    setSavedShifts(initialShifts);

    // Sync shifts with the server
    const syncWithServer = async () => {
      try {
        const res = await fetch("/api/calendar");
        if (res.ok) {
          const data = await res.json();
          if (data.feedUrl) setFeedUrl(data.feedUrl);

          if (data.shifts && data.shifts.length > 0) {
            // Server has shifts, prioritize server copy
            setSavedShifts(data.shifts);
            localStorage.setItem("savedShifts", JSON.stringify(data.shifts));
          } else if (initialShifts.length > 0) {
            // Server is empty but client has shifts, populate server
            await fetch("/api/calendar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ shifts: initialShifts, destination: "save" }),
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch shifts from server:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    syncWithServer();
  }, []);

  const handleExtractionComplete = (shifts: Shift[], fileName: string, warnings: string[]) => {
    const nextPhotoCount = photoCount + 1;
    setPhotoCount(nextPhotoCount);
    localStorage.setItem("photoCount", String(nextPhotoCount));

    const newCard: ExtractionCard = {
      columnId: "review",
      title: `Planning · ${fileName.substring(0, 20)}`,
      description: `Rilevati ${shifts.length} turni nell'immagine. Controlla e conferma nell'anteprima.`,
      tags: [
        { label: "Pronto", color: "amber" },
        { label: `${shifts.length} turni`, color: "blue" },
      ],
      thumbs: ["GA", ...shifts.map((s) => s.code).filter((v, i, a) => a.indexOf(v) === i && v)],
      timeAgo: "Ora",
    };

    const nextExtractions = [newCard, ...extractions];
    setExtractions(nextExtractions);
    localStorage.setItem("extractions", JSON.stringify(nextExtractions));
  };

  const handleShiftsSaved = async (newShifts: Shift[], destination: "google" | "ics") => {
    const updatedShifts = [...savedShifts];
    let added = 0;
    for (const ns of newShifts) {
      if (ns.code === "R") continue; // Don't persist rest days in stats
      const exists = updatedShifts.some(
        (s) => s.date === ns.date && s.start === ns.start && s.code === ns.code
      );
      if (!exists) {
        updatedShifts.push(ns);
        added++;
      }
    }

    // Always update client state and localStorage
    setSavedShifts(updatedShifts);
    localStorage.setItem("savedShifts", JSON.stringify(updatedShifts));

    // Save to the server in background so the subscription feed is updated
    try {
      await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shifts: updatedShifts, destination: "save" }),
      });
    } catch (err) {
      console.error("Failed to save shifts to server:", err);
    }

    // Transition review card to done
    const nextExtractions = extractions.map((card) => {
      if (card.columnId === "review") {
        return {
          ...card,
          columnId: "done",
          description: `Sincronizzati ${newShifts.length} eventi via ${destination.toUpperCase()}.`,
          tags: [
            { label: "Completato", color: "emerald" as const },
            { label: `${newShifts.length} eventi`, color: "blue" as const },
          ],
        };
      }
      return card;
    });

    setExtractions(nextExtractions);
    localStorage.setItem("extractions", JSON.stringify(nextExtractions));
  };

  // Helper to calculate shift duration in hours
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let diffMinutes = eh * 60 + em - (sh * 60 + sm);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // crossover midnight
    return diffMinutes / 60;
  };

  // KPI Calculations
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthShifts = savedShifts.filter(
    (s) => s.date.startsWith(currentMonthPrefix) && (s.code === "M" || s.code === "N")
  );

  const turnsThisMonthCount = currentMonthShifts.length;

  const hoursWorkedThisMonth = currentMonthShifts.reduce(
    (acc, s) => acc + calculateDuration(s.start, s.end),
    0
  );

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <PromoBanner />
          
          <Greeting
            targetName={targetName}
            calendarId={calendarId}
            onExtractionComplete={handleExtractionComplete}
            onShiftsSaved={handleShiftsSaved}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
              <KpiCard
                title="Turni questo mese"
                value={isLoaded ? String(turnsThisMonthCount) : "--"}
                delta={{ value: "12%", direction: "up" }}
                caption="Calcolato sui turni salvati"
              />
              <KpiCard
                title="Foto elaborate"
                value={isLoaded ? String(photoCount) : "--"}
                delta={{ value: "+1", direction: "up" }}
                caption="Elaborazioni totali completate"
              />
              <KpiCard
                title="Ore lavorate"
                value={isLoaded ? `${hoursWorkedThisMonth}h` : "--"}
                delta={{ value: "4.2%", direction: "up" }}
                caption="Turni diurni e notturni"
              />
              <KpiCard
                title="Affidabilità estrazione"
                value="96%"
                delta={{ value: "1.7%", direction: "up" }}
                caption="Basato su ultime estrazioni"
              />
            </div>

            <div className="lg:col-span-1">
              <ShiftsReport savedShifts={isLoaded ? savedShifts : []} />
            </div>
          </div>

          <ExtractionsBoard
            extractions={isLoaded ? extractions : []}
            onAddExtractionClick={() => {
              // Click upload input programmatically or show helper
              const uploadInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (uploadInput) uploadInput.click();
            }}
          />
        </div>
      </main>
    </div>
  );
}
