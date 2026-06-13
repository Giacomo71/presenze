import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { getShifts, saveShifts, getFeedToken } from "@/lib/storage";

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

function toICSDate(date: string, time: string): string {
  // date: "2025-06-02", time: "06:00" → "20250602T060000"
  const sanitizedTime = time === "24:00" ? "23:59" : time;
  return date.replace(/-/g, "") + "T" + sanitizedTime.replace(/:/g, "") + "00";
}

function generateUID(): string {
  return "presenze-" + Math.random().toString(36).substring(2, 15) + "@presenze.local";
}

function isThirdTuesday(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return false;
  const [year, month, day] = parts;
  const d = new Date(Date.UTC(year, month - 1, day));
  const isTuesday = d.getUTCDay() === 2; // 0 = Sunday, 1 = Monday, 2 = Tuesday
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
  const dow = d.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu
  return dow === 1 || dow === 4;
}

function addOneDay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isCrossMidnight(start: string, end: string): boolean {
  if (!start || !end) return false;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (eh < sh) return true;
  if (eh === sh && em < sm) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { shifts, destination, calendarId = "primary" } = (await req.json()) as {
      shifts: Shift[];
      destination?: "google" | "ics" | "save";
      calendarId?: string;
    };

    if (!shifts || shifts.length === 0) {
      return NextResponse.json({ error: "Nessun turno da esportare." }, { status: 400 });
    }

    const timeZone = process.env.CALENDAR_TIMEZONE || "Europe/Rome";

    // -------------------------------------------------------------
    // OPTION S: Save shifts to the server database
    // -------------------------------------------------------------
    if (destination === "save") {
      await saveShifts(shifts);
      return NextResponse.json({ success: true, count: shifts.length });
    }

    // -------------------------------------------------------------
    // OPTION A: Synchronize directly with Google Calendar API
    // -------------------------------------------------------------
    if (destination === "google") {
      const accessToken = (session as any).accessToken;
      if (!accessToken) {
        return NextResponse.json(
          { error: "Token di accesso Google mancante. Prova a scollegare e ricollegare l'account." },
          { status: 401 }
        );
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: "v3", auth });

      // Fetch existing events in range to check for duplicates
      const dates = shifts.map((s) => s.date).sort();
      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];

      // timeMin start of day, timeMax end of maxDate + 1 day (to capture midnight boundary crossings)
      const timeMin = new Date(`${minDate}T00:00:00`).toISOString();
      const maxDateObj = new Date(`${maxDate}T23:59:59`);
      maxDateObj.setDate(maxDateObj.getDate() + 2);
      const timeMax = maxDateObj.toISOString();

      let existingEventsList: any[] = [];
      try {
        const listResponse = await calendar.events.list({
          calendarId,
          timeMin,
          timeMax,
          singleEvents: true,
        });
        existingEventsList = listResponse.data.items || [];
      } catch (err: any) {
        console.error("Error reading Google Calendar:", err);
        return NextResponse.json(
          { error: `Impossibile accedere a Google Calendar: ${err.message}` },
          { status: 500 }
        );
      }

      const isDuplicate = (shift: Shift, startIso: string, endIso: string) => {
        const shiftStartMs = new Date(startIso).getTime();
        const shiftEndMs = new Date(endIso).getTime();
        const shiftSummary = CODE_LABELS[shift.code] || `Lavoro - ${shift.code}`;

        return existingEventsList.some((evt) => {
          const evtStartMs = evt.start?.dateTime ? new Date(evt.start.dateTime).getTime() : null;
          const evtEndMs = evt.end?.dateTime ? new Date(evt.end.dateTime).getTime() : null;

          const sameTime = evtStartMs === shiftStartMs && evtEndMs === shiftEndMs;
          const sameSummary = evt.summary === shiftSummary;
          const hasMarker = evt.description?.includes("[presenze-app]");

          return sameTime && (sameSummary || hasMarker);
        });
      };

      let createdCount = 0;
      let skippedCount = 0;

      for (const shift of shifts) {
        if (shift.code === "R") {
          skippedCount++;
          continue; // skip rest days
        }

        const isNightShift = shift.start && shift.end && isCrossMidnight(shift.start, shift.end);
        const endDateStr = isNightShift ? addOneDay(shift.date) : shift.date;

        let startIso: string;
        let endIso: string;
        let isAllDay = false;

        if (shift.code === "F" || (!shift.start && !shift.end)) {
          startIso = shift.date;
          endIso = addOneDay(shift.date);
          isAllDay = true;
        } else {
          startIso = `${shift.date}T${shift.start}:00`;
          endIso = `${endDateStr}T${shift.end}:00`;
        }

        if (!isAllDay && isDuplicate(shift, startIso, endIso)) {
          skippedCount++;
          continue;
        }

        // Build summary and description
        let summary = CODE_LABELS[shift.code] || `Lavoro - ${shift.code}`;
        const addHFReminder = isThirdTuesday(shift.date) && is8to20Shift(shift);
        const addScenarioReminder = isMondayOrThursday(shift.date) && is8to20Shift(shift);
        const hfText = "prove collegamento HF";
        const scenarioText = "analisi di scenario";

        const suffixes: string[] = [];
        if (addHFReminder && !summary.includes(hfText)) suffixes.push(hfText);
        if (addScenarioReminder && !summary.includes(scenarioText)) suffixes.push(scenarioText);
        if (suffixes.length > 0) summary = `${summary} (${suffixes.join(" + ")})`;

        let baseDesc = shift.note || `Turno ${shift.code}`;
        const descReminders: string[] = [];
        if (addHFReminder && !baseDesc.includes(hfText)) descReminders.push(hfText);
        if (addScenarioReminder && !baseDesc.includes(scenarioText)) descReminders.push(scenarioText);
        const description = descReminders.length > 0
          ? `${baseDesc}\nRicordati: ${descReminders.join(" + ")}\n[presenze-app]`
          : `${baseDesc}\n[presenze-app]`;

        const eventBody: any = {
          summary,
          description,
          start: isAllDay ? { date: startIso } : { dateTime: startIso, timeZone },
          end: isAllDay ? { date: endIso } : { dateTime: endIso, timeZone },
        };

        if (addHFReminder || addScenarioReminder) {
          eventBody.reminders = {
            useDefault: false,
            overrides: [{ method: "popup", minutes: 15 }],
          };
        }

        try {
          await calendar.events.insert({
            calendarId,
            requestBody: eventBody,
          });
          createdCount++;
        } catch (err: any) {
          console.error("Error creating Google Calendar event:", err);
          return NextResponse.json(
            { error: `Impossibile creare l'evento su Google Calendar: ${err.message}` },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ success: true, createdCount, skippedCount });
    }

    // -------------------------------------------------------------
    // OPTION B: Generate traditional ICS file
    // -------------------------------------------------------------
    const icsString = generateICS(shifts, timeZone);

    return new NextResponse(icsString, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="turni-${shifts[0]?.date || "export"}.ics"`,
      },
    });
  } catch (error: any) {
    console.error("Calendar Route Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}

// -------------------------------------------------------------
// HELPER: Generate ICS file contents
// -------------------------------------------------------------
function generateICS(shifts: Shift[], timeZone: string): string {
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
    if (shift.code === "R") {
      continue; // Skip rest days in the ICS download
    }

    let summary = CODE_LABELS[shift.code] || `Lavoro - ${shift.code}`;
    const isNightShift = shift.start && shift.end && isCrossMidnight(shift.start, shift.end);
    const endDate = isNightShift ? addOneDay(shift.date) : shift.date;

    let dtstartLine = "";
    let dtendLine = "";
    const isAllDay = shift.code === "F" || (!shift.start && !shift.end);

    if (isAllDay) {
      const dateFormatted = shift.date.replace(/-/g, "");
      const endDateFormatted = addOneDay(shift.date).replace(/-/g, "");
      dtstartLine = `DTSTART;VALUE=DATE:${dateFormatted}`;
      dtendLine = `DTEND;VALUE=DATE:${endDateFormatted}`;
    } else {
      const dtstart = toICSDate(shift.date, shift.start);
      const dtend = toICSDate(endDate, shift.end);
      dtstartLine = `DTSTART;TZID=${timeZone}:${dtstart}`;
      dtendLine = `DTEND;TZID=${timeZone}:${dtend}`;
    }

    // Regola 1: 3° martedì del mese + turno 8/20 → prove collegamento HF
    const addHFReminder = isThirdTuesday(shift.date) && is8to20Shift(shift);
    // Regola 2: lunedì o giovedì + turno 8/20 → analisi di scenario
    const addScenarioReminder = isMondayOrThursday(shift.date) && is8to20Shift(shift);

    const hfText = "prove collegamento HF";
    const scenarioText = "analisi di scenario";

    // Build summary suffixes
    const suffixes: string[] = [];
    if (addHFReminder && !summary.includes(hfText)) suffixes.push(hfText);
    if (addScenarioReminder && !summary.includes(scenarioText)) suffixes.push(scenarioText);
    if (suffixes.length > 0) summary = `${summary} (${suffixes.join(" + ")})`;

    // Build description
    let baseDesc = shift.note || `Turno ${shift.code}`;
    const descReminders: string[] = [];
    if (addHFReminder && !baseDesc.includes(hfText)) descReminders.push(hfText);
    if (addScenarioReminder && !baseDesc.includes(scenarioText)) descReminders.push(scenarioText);
    const description =
      descReminders.length > 0
        ? `DESCRIPTION:${baseDesc}\\nRicordati: ${descReminders.join(" + ")}`
        : `DESCRIPTION:${baseDesc}`;

    icsContent.push(
      "BEGIN:VEVENT",
      `UID:${generateUID()}`,
      `DTSTAMP:${dtstamp}`,
      dtstartLine,
      dtendLine,
      `SUMMARY:${summary}`,
      description,
      "STATUS:CONFIRMED"
    );

    // VALARM for HF reminder
    if (addHFReminder) {
      icsContent.push(
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        `DESCRIPTION:Ricordati: ${hfText}`,
        "END:VALARM"
      );
    }

    // VALARM for analisi di scenario reminder
    if (addScenarioReminder) {
      icsContent.push(
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        `DESCRIPTION:Ricordati: ${scenarioText}`,
        "END:VALARM"
      );
    }

    icsContent.push("END:VEVENT");
  }

  icsContent.push("END:VCALENDAR");

  return icsContent.join("\r\n");
}

// -------------------------------------------------------------
// GET: Serve the ICS feed (public) or return shifts & config (private)
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    // 1. GET PUBLIC / PRIVATE FEED (with token query param)
    if (token) {
      const expectedToken = getFeedToken();
      if (token !== expectedToken) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
      }

      const shifts = await getShifts();
      const timeZone = process.env.CALENDAR_TIMEZONE || "Europe/Rome";
      const icsString = generateICS(shifts, timeZone);

      // Prevent caching of the calendar feed so clients always pull fresh data
      return new NextResponse(icsString, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="turni.ics"',
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    }

    // 2. GET DASHBOARD LOAD (requires NextAuth session)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const shifts = await getShifts();
    const feedToken = getFeedToken();

    // Construct the absolute subscription feed URL
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const feedUrl = `${protocol}://${host}/api/calendar?token=${feedToken}`;

    return NextResponse.json({
      success: true,
      shifts,
      feedUrl,
      feedToken,
    });
  } catch (error: any) {
    console.error("GET Calendar Feed Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
