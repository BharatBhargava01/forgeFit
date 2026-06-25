import { NextResponse } from 'next/server';
import RoutinesModel from '@/models/routines.model';
import { getUserIdFromRequest } from '@/utils/auth';
import { withCache, invalidateCache } from '@/lib/redis';

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const routines = await withCache(`user:${userId}:routines`, 3600, () => RoutinesModel.findAll(userId));
    return NextResponse.json(routines);
  } catch (err) {
    console.error('GET /api/routines error:', err);
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, ...data } = body;
    const routine = await RoutinesModel.create(name, data, userId);
    await invalidateCache(`user:${userId}:routines`);
    return NextResponse.json(routine, { status: 201 });
  } catch (err) {
    console.error('POST /api/routines error:', err);
    return NextResponse.json({ error: 'Failed to save routine' }, { status: 500 });
  }
}
