// lib/redis.ts - ULTIMATE SINGLE SOURCE OF TRUTH
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// LAZY initialized client - NO import-time connection
let redisInstance: Redis | null = null;

function createRedisClient(): Redis {
  console.log('[Redis] Creating new connection');
  
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    },
    enableOfflineQueue: false,
    lazyConnect: true,
    reconnectOnError: (err) => {
      console.warn('[Redis] Reconnect on error:', err.message);
      return false; // Don't auto-reconnect
    }
  });

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
    redisInstance = null;
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  client.on('close', () => {
    console.log('[Redis] Connection closed');
    redisInstance = null;
  });

  return client;
}

// MAIN EXPORT - LAZY GETTER
export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  return redisInstance;
}

// Health check
export async function isRedisAvailable(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    return false; // Redis not available in browser
  }
  
  try {
    const client = getRedis();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

// Cleanup
export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
    console.log('[Redis] Connection closed');
  }
}

// For TypeScript
export type { Redis };

// Default export for compatibility
const redisExports = {
  getRedis,
  isRedisAvailable,
  closeRedis,
  // Add a dummy property for any code expecting direct access
  get client() {
    return getRedis();
  }
};

export default redisExports;