import { NextRequest, NextResponse } from "next/server";

type Shift = {
  date: string;
  start: string;
  end: string;
  code: string;
  note: string;
};

const CODE_LABELS: Record<string, string> = {
  M: "Lavoro - Mattina",
  P: "Lavoro - Pomeriggio",
  N: "Lavoro - Notte",
  R: "Riposo",
  F: "Ferie",
};

function toICSDate(date: string, time: string): string {
  // date: "2025-06-02", time: "06:00" → "20250602T060000"
  return date.replace(/-/g, "") + "T" + time.replace(/:/g, "") + "00";
}

function generateUID(): string {
  return "presenze-" + Math.random().toString(36).substring(2, 15) + "@presenze.local";
}

export async function POST(req: NextRequest) {
  try {
    const { shifts } = (await req.json()) as { shifts: Shift[] };

    if (!shifts || shifts.length === 0) {
      return NextResponse.json({ error: "Nessun turno da esportare." }, { status: 400 });
    }

    const timeZone = process.env.CALENDAR_TIMEZONE || "Europe/Rome";
    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Presenze App//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-TIMEZONE:${timeZone}`,
    ];

    for (const shift of shifts) {
      const summary = CODE_LABELS[shift.code] || `Lavoro - ${shift.code}`;
      const dtstart = toICSDate(shift.date, shift.start);
      const dtend = toICSDate(shift.date, shift.end);

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${generateUID()}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=${timeZone}:${dtstart}`,
        `DTEND;TZID=${timeZone}:${dtend}`,
        `SUMMARY:${summary}`,
        shift.note ? `DESCRIPTION:${shift.note}` : `DESCRIPTION:Turno ${shift.code}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    }

    icsContent.push("END:VCALENDAR");

    const icsString = icsContent.join("\r\n");

    return new NextResponse(icsString, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="turni-${shifts[0]?.date || "export"}.ics"`,
      },
    });
  } catch (error: any) {
    console.error("ICS Export Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
