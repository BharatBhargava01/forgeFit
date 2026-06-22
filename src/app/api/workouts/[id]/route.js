import { NextResponse } from 'next/server';
import WorkoutsModel from '@/models/workouts.model';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await WorkoutsModel.deleteById(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/workouts error:', err);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
}
