import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import UsersModel from '@/models/users.model';
import { hashPassword, signToken } from '@/utils/auth';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    
    const existingUser = await UsersModel.findByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }
    
    const passwordHash = await hashPassword(password);
    const user = await UsersModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });
    
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
    
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
