import { NextResponse } from 'next/server';
import LogsModel from '@/models/logs.model';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await LogsModel.deleteById(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/logs error:', err);
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
}
