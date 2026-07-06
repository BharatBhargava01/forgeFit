import { NextResponse } from 'next/server';
import LogsModel from '@/models/logs.model';
import { getUserIdFromRequest } from '@/utils/auth';
import { invalidateCache } from '@/lib/redis';

export async function DELETE(request, { params }) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await LogsModel.deleteById(id, userId);
    await invalidateCache(`user:${userId}:logs`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/logs error:', err);
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { name, ...data } = body;
    const updatedLog = await LogsModel.update(id, name, data, userId);
    await invalidateCache(`user:${userId}:logs`);
    return NextResponse.json(updatedLog);
  } catch (err) {
    console.error('PUT /api/logs error:', err);
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }
}
