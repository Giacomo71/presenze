import { NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/googleDrive';
import { parseBillPdf } from '@/lib/parseBill';
import { fetchOffers } from '@/lib/fetchOffers';
import { recommendOffer } from '@/lib/recommendation';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const nextReq = request as any;
  try {
    const drive = await getDriveClient(nextReq);
    
    // 1. Search for the main parent folder "Bollette" (case-insensitive)
    const folderRes = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and (name='Bollette' or name='bollette') and trashed=false",
      fields: 'files(id, name)',
    });
    
    const folders = folderRes.data.files ?? [];
    const consumptions: any[] = [];
    
    if (folders.length > 0 && folders[0].id) {
      const parentFolderId = folders[0].id;
      
      // 2. Search for "Gas" and "Luce" subfolders inside "Bollette"
      const subfoldersRes = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
      });
      
      const subfolders = subfoldersRes.data.files ?? [];
      const gasFolder = subfolders.find(sf => sf.name?.toLowerCase() === 'gas');
      const luceFolder = subfolders.find(sf => sf.name?.toLowerCase() === 'luce');
      
      let processedAny = false;
      
      // Process files in the Gas subfolder
      if (gasFolder?.id) {
        const gasFilesRes = await drive.files.list({
          q: `mimeType='application/pdf' and '${gasFolder.id}' in parents and trashed=false`,
          fields: 'files(id, name)',
        });
        const gasFiles = gasFilesRes.data.files ?? [];
        for (const file of gasFiles) {
          const resp = await drive.files.get({ fileId: file.id!, alt: 'media' }, { responseType: 'arraybuffer' });
          const pdfBuffer = Buffer.from(resp.data as ArrayBuffer);
          const parsed = await parseBillPdf(pdfBuffer, file.name ?? '', 'gas');
          consumptions.push(parsed);
        }
        if (gasFiles.length > 0) processedAny = true;
      }
      
      // Process files in the Luce subfolder
      if (luceFolder?.id) {
        const luceFilesRes = await drive.files.list({
          q: `mimeType='application/pdf' and '${luceFolder.id}' in parents and trashed=false`,
          fields: 'files(id, name)',
        });
        const luceFiles = luceFilesRes.data.files ?? [];
        for (const file of luceFiles) {
          const resp = await drive.files.get({ fileId: file.id!, alt: 'media' }, { responseType: 'arraybuffer' });
          const pdfBuffer = Buffer.from(resp.data as ArrayBuffer);
          const parsed = await parseBillPdf(pdfBuffer, file.name ?? '', 'electricity');
          consumptions.push(parsed);
        }
        if (luceFiles.length > 0) processedAny = true;
      }
      
      // Fallback: If no subfolders or they are empty, look for direct PDF files in the parent "Bollette" folder
      if (!processedAny) {
        const directFilesRes = await drive.files.list({
          q: `mimeType='application/pdf' and '${parentFolderId}' in parents and trashed=false`,
          fields: 'files(id, name)',
        });
        const directFiles = directFilesRes.data.files ?? [];
        for (const file of directFiles) {
          const resp = await drive.files.get({ fileId: file.id!, alt: 'media' }, { responseType: 'arraybuffer' });
          const pdfBuffer = Buffer.from(resp.data as ArrayBuffer);
          const parsed = await parseBillPdf(pdfBuffer, file.name ?? '');
          consumptions.push(parsed);
        }
      }
      
    } else {
      // Global fallback: Search the entire Drive for files containing "bolletta" in the filename
      const listRes = await drive.files.list({
        q: "mimeType='application/pdf' and name contains 'bolletta' and trashed=false",
        fields: 'files(id, name)',
      });
      const files = listRes.data.files ?? [];
      for (const file of files) {
        const resp = await drive.files.get({ fileId: file.id!, alt: 'media' }, { responseType: 'arraybuffer' });
        const pdfBuffer = Buffer.from(resp.data as ArrayBuffer);
        const parsed = await parseBillPdf(pdfBuffer, file.name ?? '');
        consumptions.push(parsed);
      }
    }
    // Persist consumptions locally (append to existing data)
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const consumptionPath = path.join(dataDir, 'consumption.json');
    let existing: any[] = [];
    try { existing = JSON.parse(await fs.readFile(consumptionPath, 'utf8')); } catch (_) {}
    
    // Deduplicate or merge (for simplicity we merge and overwrite, but we can deduplicate by month/year/utility)
    const mergedMap = new Map();
    for (const item of [...existing, ...consumptions]) {
      const key = `${item.utility}-${item.year}-${item.month}`;
      mergedMap.set(key, item);
    }
    const merged = Array.from(mergedMap.values());
    
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
