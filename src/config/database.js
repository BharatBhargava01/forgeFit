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
    // 1. Create tables if they do not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        avatar_url TEXT,
        provider TEXT NOT NULL DEFAULT 'local',
        provider_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

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

    // 2. Support pre-existing users tables by adding columns if missing
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;`).catch(() => {});
    try {
      await client.query(`
        UPDATE users 
        SET name = COALESCE(first_name, '') || CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN ' ' ELSE '' END || COALESCE(last_name, '') 
        WHERE name IS NULL
      `);
    } catch (e) {
      // Ignore if first_name/last_name columns don't exist
    }

    await client.query(`
      UPDATE users SET name = 'User' WHERE name IS NULL OR name = '';
      ALTER TABLE users ALTER COLUMN name SET NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'local';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT;

      -- Add user_id column if not exists to all tables
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE routines ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE custom_exercises ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    `);

    console.log('✅ Database tables and user associations ready');
  } finally {
    client.release();
  }
}

// Automatically trigger database initialization on module load
initDB().catch((err) => {
  console.error('❌ Failed to auto-initialize database tables on startup:', err.message);
});

module.exports = { pool, initDB };
