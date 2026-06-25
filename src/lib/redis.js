import Redis from 'ioredis';
import crypto from 'crypto';

let REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
if (REDIS_URL && REDIS_URL.startsWith('"') && REDIS_URL.endsWith('"')) {
  REDIS_URL = REDIS_URL.slice(1, -1);
}

function createMockRedis() {
  return {
    async get() { return null; },
    async set() { return 'OK'; },
    async del() { return 0; },
    on() { return this; }
  };
}

let redisClient;

if (typeof window === 'undefined') {
  if (global.cachedRedis) {
    redisClient = global.cachedRedis;
  } else {
    if (REDIS_URL) {
      try {
        redisClient = new Redis(REDIS_URL, {
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          lazyConnect: true,
        });

        redisClient.on('error', (err) => {
          console.warn('⚠️ Redis Client Error:', err.message);
        });

        redisClient.connect().catch((err) => {
          console.warn('⚠️ Redis connection failed. Operating in bypass/mock mode.', err.message);
        });
      } catch (err) {
        console.warn('⚠️ Failed to construct Redis client:', err.message);
        redisClient = createMockRedis();
      }
    } else {
      console.warn('ℹ️ REDIS_URL not set. Running in Redis mock/bypass mode.');
      redisClient = createMockRedis();
    }

    if (process.env.NODE_ENV !== 'production') {
      global.cachedRedis = redisClient;
    }
  }
} else {
  redisClient = createMockRedis();
}

/**
 * Gets value from cache.
 */
export async function getCache(key) {
  try {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn(`[Redis GET Error for ${key}]:`, err.message);
    return null;
  }
}

/**
 * Sets value in cache.
 */
export async function setCache(key, value, ttlSeconds) {
  if (value === undefined || value === null) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`[Redis SET Error for ${key}]:`, err.message);
  }
}

/**
 * Deletes key from cache.
 */
export async function invalidateCache(key) {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.warn(`[Redis DEL Error for ${key}]:`, err.message);
  }
}

/**
 * Automatically retrieves from cache or fetches and saves to cache.
 */
export async function withCache(key, ttlSeconds, fetchFunction) {
  const cached = await getCache(key);
  if (cached !== null) {
    return cached;
  }
  const fresh = await fetchFunction();
  await setCache(key, fresh, ttlSeconds);
  return fresh;
}

/**
 * Generates a consistent cache key for AI prompts by sorting keys and hashing the parameters.
 */
export function generateAiCacheKey(type, params) {
  const sortedString = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash('sha256').update(sortedString).digest('hex');
  return `ai:${type}:${hash}`;
}

export default redisClient;
