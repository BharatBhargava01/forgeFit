import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import UsersModel from '@/models/users.model';
import { verifyPassword, signToken } from '@/utils/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    const user = await UsersModel.findByEmail(email.toLowerCase());
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    // Claim orphan records if this is the first user
    await UsersModel.claimOrphanRecords(user.id);
    
    const token = signToken({ userId: user.id });
    
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      provider: user.provider,
      created_at: user.created_at,
    };
    
    return NextResponse.json(responseUser);
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
