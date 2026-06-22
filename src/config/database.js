/* ============================================
   DATABASE — PostgreSQL Connection & Pool
   ============================================ */
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const useConnectionString = connectionString && !connectionString.includes('YOUR_PASSWORD_HERE');
const isLocalhost = useConnectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'));

const pool = new Pool({
  ...(useConnectionString
    ? {
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'forgefit',
      }),
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
});

/**
 * Initialize database tables.
 */
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS custom_exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        muscles TEXT[] NOT NULL DEFAULT '{}',
        equipment TEXT DEFAULT 'Bodyweight',
        difficulty INTEGER DEFAULT 2,
        type TEXT DEFAULT 'compound',
        description TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workout_logs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Database tables ready');
  } finally {
    client.release();
  }
}

// Automatically trigger database initialization on module load
initDB().catch((err) => {
  console.error('❌ Failed to auto-initialize database tables on startup:', err.message);
});

module.exports = { pool, initDB };
