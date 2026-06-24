import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import UsersModel from '@/models/users.model';
import { signToken } from '@/utils/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (error || !code) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=google_auth_failed', baseUrl));
  }
  
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = new URL('/api/auth/google/callback', baseUrl).toString();
    
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Failed to exchange code for token:', errText);
      return NextResponse.redirect(new URL('/?error=google_token_exchange_failed', baseUrl));
    }
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    
    // 2. Fetch user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!profileRes.ok) {
      console.error('Failed to fetch user info from Google');
      return NextResponse.redirect(new URL('/?error=google_profile_fetch_failed', baseUrl));
    }
    
    const profile = await profileRes.json();
    const googleId = profile.sub;
    const email = profile.email?.toLowerCase();
    const name = profile.name || 'Google User';
    const avatarUrl = profile.picture;
    
    if (!email) {
      return NextResponse.redirect(new URL('/?error=google_email_missing', baseUrl));
    }
    
    // 3. Find or create user
    let user = await UsersModel.findByProvider('google', googleId);
    
    if (!user) {
      // Check if user with same email exists
      const existingUser = await UsersModel.findByEmail(email);
      if (existingUser) {
        // Link existing user to Google
        const { pool } = require('@/config/database');
        await pool.query(
          `UPDATE users 
           SET provider = $1, provider_id = $2, avatar_url = $3, updated_at = NOW() 
           WHERE id = $4`,
          ['google', googleId, avatarUrl, existingUser.id]
        );
        user = { ...existingUser, provider: 'google', provider_id: googleId, avatar_url: avatarUrl };
      } else {
        // Create new user
        user = await UsersModel.create({
          name,
          email,
          avatarUrl,
          provider: 'google',
          providerId: googleId,
        });
      }
    }
    
    // 5. Sign token and set cookie
    const token = signToken({ userId: user.id });
    
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return NextResponse.redirect(new URL('/?login_success=true', baseUrl));
  } catch (err) {
    console.error('Google callback error:', err);
    return NextResponse.redirect(new URL('/?error=google_auth_exception', baseUrl));
  }
}
