import { NextResponse } from 'next/server';
import { pool } from '@/config/database';

export async function GET() {
  try {
    const result = await pool.query('SELECT NOW()');
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    }, { status: 500 });
  }
}
