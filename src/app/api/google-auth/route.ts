import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  const { token } = await request.json();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = 'postmessage'; // for one‑time code exchange

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  try {
    const { tokens } = await oauth2Client.getToken({ code: token, grant_type: 'authorization_code' } as any);
    // Store tokens in secure http‑only cookie (simplified for demo)
    const response = NextResponse.json({ success: true });
    response.cookies.set('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (err) {
    console.error('Google auth error', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
