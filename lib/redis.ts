// lib/redis.ts - ULTIMATE SINGLE SOURCE OF TRUTH
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// Determine if we are running in a CLI script or the Vault Master Audit
const IS_SCRIPT_MODE = process.env.REDIS_DISABLED === 'true' || process.argv[1]?.includes('scripts/');

let redisInstance: Redis | null = null;

function createRedisClient(): Redis {
  console.log(`[Redis] Initializing ${IS_SCRIPT_MODE ? 'Script-Mode' : 'Standard'} connection`);
  
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: IS_SCRIPT_MODE ? 1 : 3, // Fail fast in scripts
    retryStrategy: (times) => {
      if (times > 3 || IS_SCRIPT_MODE) return null; // No retries in script mode
      return Math.min(times * 50, 2000);
    },
    // CRITICAL FIX: Enable queue for scripts so they don't crash on boot
    enableOfflineQueue: IS_SCRIPT_MODE ? true : false, 
    lazyConnect: true,
    connectTimeout: 2000,
    commandTimeout: IS_SCRIPT_MODE ? 1000 : undefined, // Don't hang the vault audit
    reconnectOnError: (err) => {
      console.warn('[Redis] Reconnect on error:', err.message);
      return false;
    }
  });

  client.on('error', (err) => {
    // Only log errors if we aren't in script mode to keep logs clean
    if (!IS_SCRIPT_MODE) console.error('[Redis] Connection error:', err.message);
    redisInstance = null;
  });

  return client;
}

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  return redisInstance;
}

export async function isRedisAvailable(): Promise<boolean> {
  if (typeof window !== 'undefined') return false;
  
  try {
    const client = getRedis();
    // In script mode, we use a timeout to ensure we don't hang if Redis is down
    const pingPromise = client.ping();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 800)
    );
    
    await Promise.race([pingPromise, timeoutPromise]);
    return true;
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}

const redisExports = {
  getRedis,
  isRedisAvailable,
  closeRedis,
  get client() {
    return getRedis();
  }
};

export default redisExports;