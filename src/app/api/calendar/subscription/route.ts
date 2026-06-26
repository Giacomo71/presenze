import { NextRequest, NextResponse } from "next/server";
import { getShifts, getFeedToken } from "@/lib/storage";
import { generateICS } from "../route"; // Reuse the helper from the main calendar route

/**
 * Public iCalendar subscription endpoint.
 *
 * URL pattern: /api/calendar/subscription?token=YOUR_TOKEN
 * Returns the .ics feed that can be added to Google Calendar via
 * *Add calendar → From URL*.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const expected = getFeedToken();
    if (token !== expected) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const shifts = await getShifts();
    const timeZone = process.env.CALENDAR_TIMEZONE || "Europe/Rome";
    const icsString = generateICS(shifts, timeZone);

    return new NextResponse(icsString, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"turni.ics\"",
        // Force no caching so Google always fetches the latest feed
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Public calendar subscription error:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
