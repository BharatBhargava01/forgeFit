import { NextResponse } from 'next/server';
import LogsModel from '@/models/logs.model';
import { getUserIdFromRequest } from '@/utils/auth';
import { withCache, invalidateCache } from '@/lib/redis';

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const logs = await withCache(`user:${userId}:logs`, 3600, () => LogsModel.findAll(userId));
    return NextResponse.json(logs);
  } catch (err) {
    console.error('GET /api/logs error:', err);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
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
    const log = await LogsModel.create(name, data, userId);
    await invalidateCache(`user:${userId}:logs`);
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error('POST /api/logs error:', err);
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 });
  }
}
