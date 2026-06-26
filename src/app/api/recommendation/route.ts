import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const recPath = path.join(dataDir, 'recommendation.json');
    const consPath = path.join(dataDir, 'consumption.json');
    
    let recommendation = null;
    let consumptions = [];

    try {
      recommendation = JSON.parse(await fs.readFile(recPath, 'utf8'));
    } catch (_) {}

    try {
      consumptions = JSON.parse(await fs.readFile(consPath, 'utf8'));
    } catch (_) {}

    return NextResponse.json({ recommendation, consumptions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
