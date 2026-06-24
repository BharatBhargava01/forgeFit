import { NextResponse } from 'next/server';
import WorkoutsModel from '@/models/workouts.model';
import { getUserIdFromRequest } from '@/utils/auth';

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const workouts = await WorkoutsModel.findAll(userId);
    return NextResponse.json(workouts);
  } catch (err) {
    console.error('GET /api/workouts error:', err);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
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
    const workout = await WorkoutsModel.create(name, data, userId);
    return NextResponse.json(workout, { status: 201 });
  } catch (err) {
    console.error('POST /api/workouts error:', err);
    return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
  }
}
