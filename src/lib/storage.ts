import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type Shift = {
  date: string;
  start: string;
  end: string;
  code: string;
  note: string;
};

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const LOCAL_DB_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(LOCAL_DB_DIR, "shifts.json");

export async function getShifts(): Promise<Shift[]> {
  if (KV_URL && KV_TOKEN) {
    try {
      const res = await fetch(`${KV_URL}/get/shifts`, {
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          return JSON.parse(data.result) as Shift[];
        }
      }
    } catch (error) {
      console.error("Failed to read from Vercel KV, falling back to local file:", error);
    }
  }

  // Fallback to local file database
  try {
    const fileContent = await fs.readFile(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(fileContent) as Shift[];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Failed to read local shifts file:", error);
    return [];
  }
}

export async function saveShifts(shifts: Shift[]): Promise<void> {
  if (KV_URL && KV_TOKEN) {
    try {
      // Execute command SET shifts JSON_STRING on Upstash KV
      const res = await fetch(KV_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", "shifts", JSON.stringify(shifts)]),
      });
      if (res.ok) {
        return;
      }
      console.error("Failed to write to Vercel KV, status:", res.status);
    } catch (error) {
      console.error("Failed to write to Vercel KV, falling back to local file:", error);
    }
  }

  // Fallback to local file database
  try {
    await fs.mkdir(LOCAL_DB_DIR, { recursive: true });
    await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(shifts, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write shifts to local file:", error);
    throw error;
  }
}

export function getFeedToken(): string {
  const secret = process.env.CALENDAR_FEED_TOKEN || process.env.NEXTAUTH_SECRET || "presenze-default-secret-2026";
  return crypto.createHash("sha256").update(secret).digest("hex").substring(0, 16);
}
