import { NextResponse } from 'next/server';
import LogsModel from '@/models/logs.model';

export async function GET() {
  try {
    const logs = await LogsModel.findAll();
    return NextResponse.json(logs);
  } catch (err) {
    console.error('GET /api/logs error:', err);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, ...data } = body;
    const log = await LogsModel.create(name, data);
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error('POST /api/logs error:', err);
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 });
  }
}
