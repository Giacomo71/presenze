import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Simple in-memory rate limiting map
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 20;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  let timestamps = rateLimitMap.get(userId) || [];
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= MAX_REQUESTS) {
    rateLimitMap.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return false;
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const email = session.user?.email || "anonymous";
    if (isRateLimited(email)) {
      return NextResponse.json({ error: "Troppe richieste. Massimo 20 estrazioni all'ora." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;
    const targetName = formData.get("targetName") as string || process.env.TARGET_NAME || "Amoruso Giacomo";

    if (!file) {
      return NextResponse.json({ error: "Nessuna immagine fornita" }, { status: 400 });
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "L'immagine supera il limite di 10 MB" }, { status: 400 });
    }

    // Validate MIME type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato file non supportato. Carica un'immagine (JPEG, PNG, WEBP, GIF)." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mediaType = file.type === "image/png" ? "image/png" : 
                      file.type === "image/webp" ? "image/webp" : "image/jpeg";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: `Sei un assistente che estrae turni di lavoro da una foto di una tabella di planning aziendale.
Devi trovare SOLO i turni della persona indicata, estrarre le date e gli orari. Sii flessibile sul modo in cui è scritto il nome (es. "Amoruso G.", "Amoruso Giacomo", "Giacomo A." ecc.). Concentrati solo sulla riga di quella persona.

I turni sono espressi con codici di testo o con coppie di numeri (orario inizio e orario fine):
- "8 20" (o "8-20") ➔ Inizio: "08:00", Fine: "20:00", codice: "M" (Mattina)
- "20 24" (o "20-24") ➔ Inizio: "20:00", Fine: "24:00", codice: "N" (Notte 1)
- "0 8" o "00 08" o "0-8" ➔ Inizio: "00:00", Fine: "08:00", codice: "N" (Notte 2)
- "RS" o "R" ➔ Riposo (lascia inizio e fine vuoti "", codice "R")
- "LO", "LP", "LPP", "RL" o "F" ➔ Ferie (lascia inizio e fine vuoti "", codice "F")

Restituisci ESCLUSIVAMENTE un JSON valido. Non inserire introduzioni, spiegazioni o testo discorsivo prima o dopo il JSON. Il tuo output deve essere leggibile come JSON. Formato:
{
  "shifts": [
    { "date": "YYYY-MM-DD", "start": "HH:MM", "end": "HH:MM", "code": "M", "note": "" }
  ],
  "warnings": []
}`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Cerca la riga relativa a: "${targetName}" (che nel planning può essere indicato come "AMORUSO G.", "G. AMORUSO", "AMORUSO GIAC." o anche "M.A. AMORUSO", dove "M.A." indica la qualifica/livello e non un'altra persona). Sono la stessa identica persona!
Anno corrente: ${new Date().getFullYear()}. Estrai solo i turni di questa riga e restituisci ESCLUSIVAMENTE il JSON con i turni. Non aggiungere testo discorsivo.`
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    // Extract text from all text blocks (skip thinking blocks)
    let fullText = "";
    for (const block of response.content) {
      if (block.type === "text") {
        fullText += block.text;
      }
    }
    console.log("Claude full text response:", fullText);

    // Try multiple strategies to extract JSON
    let jsonStr = fullText.trim();
    
    // Strategy 1: Remove markdown code fences
    jsonStr = jsonStr.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    
    // Strategy 2: Extract JSON object from surrounding text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    console.log("Cleaned JSON string:", jsonStr);

    let parsedData = { shifts: [] as any[], warnings: [] as string[] };
    try {
      parsedData = JSON.parse(jsonStr);
      console.log("Parsed data:", parsedData);
      
      // Post-process: add reminders based on date/shift rules
      if (Array.isArray(parsedData.shifts)) {
        for (const shift of parsedData.shifts) {
          if (!shift.date) continue;

          // Regola 1: 3° martedì del mese + turno 8/20 → prove collegamento HF
          if (isThirdTuesday(shift.date) && is8to20Shift(shift)) {
            const reminder = "prove collegamento HF";
            if (!shift.note) {
              shift.note = reminder;
            } else if (!shift.note.includes(reminder)) {
              shift.note = `${shift.note} - ${reminder}`;
            }
          }

          // Regola 2: lunedì o giovedì + turno 8/20 → analisi di scenario
          if (isMondayOrThursday(shift.date) && is8to20Shift(shift)) {
            const reminder = "analisi di scenario";
            if (!shift.note) {
              shift.note = reminder;
            } else if (!shift.note.includes(reminder)) {
              shift.note = `${shift.note} - ${reminder}`;
            }
          }

          // Regola 3: lunedì o giovedì + turno 8/20 → monitoraggio controlli ed efficienza mezzi
          if (isMondayOrThursday(shift.date) && is8to20Shift(shift)) {
            const reminder = "monitoraggio controlli ed efficienza mezzi";
            if (!shift.note) {
              shift.note = reminder;
            } else if (!shift.note.includes(reminder)) {
              shift.note = `${shift.note} - ${reminder}`;
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse JSON from Claude:", jsonStr);
      return NextResponse.json({ 
        error: "Impossibile leggere la risposta AI. Riprova con una foto più nitida.",
        rawResponse: fullText.substring(0, 500)
      }, { status: 500 });
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Extract API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
