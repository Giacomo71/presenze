import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
  // Retrieve stored Google tokens from cookie
  const cookies = request.headers.get('cookie') ?? '';
  const match = cookies.match(/google_tokens=([^;]+)/);
  if (!match) {
    return NextResponse.json({ error: 'Missing Google auth' }, { status: 401 });
  }
  const tokens = JSON.parse(decodeURIComponent(match[1]));

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const res = await drive.files.list({
      q: "mimeType='application/pdf' and name contains 'bolletta'",
      fields: 'files(id, name)',
    });
    return NextResponse.json({ files: res.data.files });
  } catch (err) {
    console.error('Drive list error', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
