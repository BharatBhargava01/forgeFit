import { NextResponse } from 'next/server';
import RoutinesModel from '@/models/routines.model';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await RoutinesModel.deleteById(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/routines error:', err);
    return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 });
  }
}
