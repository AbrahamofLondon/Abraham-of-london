// lib/redis.ts - ULTIMATE SINGLE SOURCE OF TRUTH (RECOVERY-READY)
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// Determine if we are running in a CLI script or the Vault Master Audit
const IS_SCRIPT_MODE = process.env.REDIS_DISABLED === 'true' || process.argv[1]?.includes('scripts/');

let redisInstance: Redis | null = null;

/**
 * Creates a hardened Redis client.
 * Optimized for high-volume asset registration during Vault Sync.
 */
function createRedisClient(): Redis {
  console.log(`[Redis] Initializing ${IS_SCRIPT_MODE ? 'Script-Mode' : 'Standard'} connection`);
  
  const client = new Redis(REDIS_URL, {
    // 🏛️ [RECOVERY LOGIC]: Allow more retries in scripts to handle the "Healing" phase load.
    maxRetriesPerRequest: IS_SCRIPT_MODE ? 5 : 3, 
    
    retryStrategy: (times) => {
      // If we hit 10 attempts, the infrastructure is likely down.
      if (times > 10) {
        console.error('[Redis] Max retries reached. Infrastructure unreachable.');
        return null; 
      }
      // Exponential backoff: 100ms, 200ms, etc., capped at 3s.
      return Math.min(times * 100, 3000);
    },
    
    // 🏛️ [BUFFER MANAGEMENT]: Must be true to prevent "Stream isn't writeable" during 81+ asset syncs.
    enableOfflineQueue: true, 
    
    lazyConnect: true,
    connectTimeout: 5000, // Increased for Windows/WSL environment latencies
    
    // 🏛️ [IO PROTECTION]: Removed the 1000ms cap. 
    // Vault registration of complex metadata can exceed 1s on local hardware.
    commandTimeout: undefined, 
    
    reconnectOnError: (err) => {
      // Reconnect automatically if the cluster is in a READONLY state
      if (err.message.includes("READONLY")) {
        return true;
      }
      return false;
    }
  });

  client.on('error', (err) => {
    // Suppress noisy logs in scripts unless they are terminal
    if (!IS_SCRIPT_MODE) {
      console.error('[Redis] Connection error:', err.message);
    }
    // Only nullify the instance if the connection is truly dead
    if (err.message.includes('ECONNREFUSED')) {
      redisInstance = null;
    }
  });

  return client;
}

/**
 * Returns the singleton Redis instance.
 */
export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  return redisInstance;
}

/**
 * Validates connection health with a timeout race.
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (typeof window !== 'undefined') return false;
  
  try {
    const client = getRedis();
    // Use a strict 1s timeout for the health check
    const pingPromise = client.ping();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Health Check Timeout')), 1000)
    );
    
    await Promise.race([pingPromise, timeoutPromise]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Graceful shutdown for cleanup phases.
 */
export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    try {
      await redisInstance.quit();
    } catch {
      redisInstance.disconnect();
    } finally {
      redisInstance = null;
    }
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