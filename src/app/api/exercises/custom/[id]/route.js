import { NextResponse } from 'next/server';
import ExercisesModel from '@/models/exercises.model';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await ExercisesModel.deleteById(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/exercises/custom error:', err);
    return NextResponse.json({ error: 'Failed to delete custom exercise' }, { status: 500 });
  }
}
