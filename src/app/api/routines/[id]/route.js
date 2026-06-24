import { NextResponse } from 'next/server';
import RoutinesModel from '@/models/routines.model';
import { getUserIdFromRequest } from '@/utils/auth';

export async function DELETE(request, { params }) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await RoutinesModel.deleteById(id, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/routines error:', err);
    return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 });
  }
}
