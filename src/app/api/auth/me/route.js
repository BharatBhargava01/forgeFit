import { NextResponse } from 'next/server';
import UsersModel from '@/models/users.model';
import { getUserIdFromRequest } from '@/utils/auth';

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await UsersModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (err) {
    console.error('Auth check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
