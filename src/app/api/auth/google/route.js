import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || clientId === 'your_google_client_id' || !clientSecret || clientSecret === 'your_google_client_secret') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/?error=google_not_configured', baseUrl));
  }
  
  const redirectUri = new URL('/api/auth/google/callback', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').toString();
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
  
  return NextResponse.redirect(googleAuthUrl);
}
