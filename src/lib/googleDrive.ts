import { google } from 'googleapis';
import { NextRequest } from 'next/server';

export async function getDriveClient(request: NextRequest) {
  const tokenCookie = request.cookies.get('google_tokens');
  if (!tokenCookie) {
    throw new Error('Missing Google token');
  }
  const tokens = JSON.parse(tokenCookie.value);
  const clientId = process.env.GOOGLE_CLIENT_ID as string;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: oauth2 });
}
