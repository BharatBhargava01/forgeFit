import { NextResponse } from 'next/server';
import ExercisesModel from '@/models/exercises.model';
import { getUserIdFromRequest } from '@/utils/auth';

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const exercises = await ExercisesModel.findAll(userId);
    return NextResponse.json(exercises);
  } catch (err) {
    console.error('GET /api/exercises/custom error:', err);
    return NextResponse.json({ error: 'Failed to fetch custom exercises' }, { status: 500 });
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
    if (!name) {
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 });
    }
    const exercise = await ExercisesModel.create(name, data, userId);
    return NextResponse.json(exercise, { status: 201 });
  } catch (err) {
    console.error('POST /api/exercises/custom error:', err);
    return NextResponse.json({ error: 'Failed to save custom exercise' }, { status: 500 });
  }
}
