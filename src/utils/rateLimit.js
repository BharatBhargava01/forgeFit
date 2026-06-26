import { pool } from '@/config/database';
import { getUserIdFromRequest } from '@/utils/auth';

// In-memory fallback if database query fails or is not ready
const memoryStore = new Map();

function checkInMemoryLimit(key, maxHits, windowDurationMs) {
  const now = Date.now();
  
  // Clean up memory store periodically
  for (const [k, data] of memoryStore.entries()) {
    if (now > data.resetAt) {
      memoryStore.delete(k);
    }
  }

  const record = memoryStore.get(key);
  if (!record || now > record.resetAt) {
    const resetAt = now + windowDurationMs;
    memoryStore.set(key, { hits: 1, resetAt });
    return {
      success: true,
      limit: maxHits,
      remaining: maxHits - 1,
      resetInSeconds: Math.max(0, Math.round(windowDurationMs / 1000))
    };
  }

  if (record.hits >= maxHits) {
    return {
      success: false,
      limit: maxHits,
      remaining: 0,
      resetInSeconds: Math.max(0, Math.round((record.resetAt - now) / 1000))
    };
  }

  record.hits += 1;
  return {
    success: true,
    limit: maxHits,
    remaining: Math.max(0, maxHits - record.hits),
    resetInSeconds: Math.max(0, Math.round((record.resetAt - now) / 1000))
  };
}

/**
 * Checks if the request should be rate-limited.
 * Enforces limits over a 24-hour window:
 * - Logged-in: maxHitsUser (default 5)
 * - Anonymous: maxHitsAnonymous (default 2)
 */
export async function checkRateLimit(request, limitType = 'ai-generation', maxHitsAnonymous = 2, maxHitsUser = 5) {
  let userId = null;
  try {
    userId = await getUserIdFromRequest();
  } catch (err) {
    console.warn('[RateLimit Auth Error]:', err.message);
  }

  let ip = '127.0.0.1';
  try {
    ip = request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         '127.0.0.1';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
  } catch (err) {
    console.warn('[RateLimit IP Error]:', err.message);
  }

  const isAnonymous = !userId;
  const identifier = isAnonymous ? `ip:${ip}` : `user:${userId}`;
  const key = `rl:${limitType}:${identifier}`;
  const maxHits = isAnonymous ? maxHitsAnonymous : maxHitsUser;
  const windowDurationMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const now = new Date();

  try {
    // 1. Delete expired keys in DB
    await pool.query('DELETE FROM rate_limits WHERE reset_at < $1', [now]);

    // 2. Select current record
    const selectRes = await pool.query('SELECT hits, reset_at FROM rate_limits WHERE key = $1', [key]);

    if (selectRes.rows.length === 0) {
      // Create new record
      const resetAt = new Date(now.getTime() + windowDurationMs);
      await pool.query(
        'INSERT INTO rate_limits (key, hits, reset_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
        [key, 1, resetAt]
      );
      return {
        success: true,
        limit: maxHits,
        remaining: maxHits - 1,
        resetInSeconds: Math.max(0, Math.round((resetAt.getTime() - now.getTime()) / 1000))
      };
    } else {
      const record = selectRes.rows[0];
      const resetAt = new Date(record.reset_at);

      if (now > resetAt) {
        // Record is expired, reset it
        const newResetAt = new Date(now.getTime() + windowDurationMs);
        await pool.query(
          'INSERT INTO rate_limits (key, hits, reset_at) VALUES ($1, 1, $2) ON CONFLICT (key) DO UPDATE SET hits = 1, reset_at = $2',
          [key, newResetAt]
        );
        return {
          success: true,
          limit: maxHits,
          remaining: maxHits - 1,
          resetInSeconds: Math.max(0, Math.round((newResetAt.getTime() - now.getTime()) / 1000))
        };
      }

      if (record.hits >= maxHits) {
        return {
          success: false,
          limit: maxHits,
          remaining: 0,
          resetInSeconds: Math.max(0, Math.round((resetAt.getTime() - now.getTime()) / 1000))
        };
      }

      // Increment hits
      const updateRes = await pool.query(
        'UPDATE rate_limits SET hits = hits + 1 WHERE key = $1 RETURNING hits, reset_at',
        [key]
      );

      const updatedRecord = updateRes.rows[0] || record;
      return {
        success: true,
        limit: maxHits,
        remaining: Math.max(0, maxHits - updatedRecord.hits),
        resetInSeconds: Math.max(0, Math.round((new Date(updatedRecord.reset_at).getTime() - now.getTime()) / 1000))
      };
    }
  } catch (dbErr) {
    console.warn('[RateLimit DB Fallback]: Database rate limit check failed. Falling back to in-memory.', dbErr.message);
    return checkInMemoryLimit(key, maxHits, windowDurationMs);
  }
}
