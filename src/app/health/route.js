import { NextResponse } from 'next/server';
import { pool } from '@/config/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'connected';
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    dbStatus = 'disconnected';
  }

  return NextResponse.json({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
