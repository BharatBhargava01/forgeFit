import { NextResponse } from 'next/server';
import ExercisesModel from '@/models/exercises.model';
import { getUserIdFromRequest } from '@/utils/auth';
import { invalidateCache } from '@/lib/redis';

export async function DELETE(request, { params }) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await ExercisesModel.deleteById(id, userId);
    await invalidateCache(`user:${userId}:custom_exercises`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/exercises/custom error:', err);
    return NextResponse.json({ error: 'Failed to delete custom exercise' }, { status: 500 });
  }
}
