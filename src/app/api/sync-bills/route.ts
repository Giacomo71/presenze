import { NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/googleDrive';
import { parseBillPdf } from '@/lib/parseBill';
import { fetchOffers } from '@/lib/fetchOffers';
import { recommendOffer } from '@/lib/recommendation';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  // Convert generic Request to NextRequest for cookie handling (type casting for simplicity)
  const nextReq = request as any;
  try {
    const drive = await getDriveClient(nextReq);
    // List PDF bill files in the user's Drive folder
    const listRes = await drive.files.list({
      q: "mimeType='application/pdf' and name contains 'bolletta'",
      fields: 'files(id, name)',
    });
    const files = listRes.data.files ?? [];
    const consumptions: { month: number; year: number; consumptionKwh: number }[] = [];
    for (const file of files) {
      const resp = await drive.files.get({
        fileId: file.id!,
        alt: 'media',
      }, { responseType: 'arraybuffer' });
      const pdfBuffer = Buffer.from(resp.data as ArrayBuffer);
      const parsed = await parseBillPdf(pdfBuffer);
      consumptions.push(parsed);
    }
    // Persist consumptions locally (append to existing data)
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const consumptionPath = path.join(dataDir, 'consumption.json');
    let existing: any[] = [];
    try { existing = JSON.parse(await fs.readFile(consumptionPath, 'utf8')); } catch (_) {}
    const merged = [...existing, ...consumptions];
    await fs.writeFile(consumptionPath, JSON.stringify(merged, null, 2), 'utf8');
    // Fetch current offers and compute the best recommendation
    const offers = await fetchOffers();
    const recommendation = recommendOffer(merged, offers);
    const recPath = path.join(dataDir, 'recommendation.json');
    await fs.writeFile(recPath, JSON.stringify(recommendation, null, 2), 'utf8');
    return NextResponse.json({ status: 'synced', recommendation });
  } catch (err) {
    console.error('Sync error', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
