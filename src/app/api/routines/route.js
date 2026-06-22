import { NextResponse } from 'next/server';
import RoutinesModel from '@/models/routines.model';

export async function GET() {
  try {
    const routines = await RoutinesModel.findAll();
    return NextResponse.json(routines);
  } catch (err) {
    console.error('GET /api/routines error:', err);
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, ...data } = body;
    const routine = await RoutinesModel.create(name, data);
    return NextResponse.json(routine, { status: 201 });
  } catch (err) {
    console.error('POST /api/routines error:', err);
    return NextResponse.json({ error: 'Failed to save routine' }, { status: 500 });
  }
}
