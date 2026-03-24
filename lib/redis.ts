// lib/redis.ts - ULTIMATE SINGLE SOURCE OF TRUTH (RECOVERY-READY)
// ✅ Node/server only. Do NOT import this from middleware/edge.

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Determine if we are running in a CLI script or the Vault Master Audit.
 * This prevents hanging builds during Contentlayer generation.
 */
const IS_SCRIPT_MODE =
  process.env.REDIS_DISABLED === "true" || 
  (typeof process !== 'undefined' && process.argv[1]?.includes("scripts/"));

let redisInstance: Redis | null = null;

/**
 * Creates a hardened Redis client.
 * Optimized for high-volume asset registration during Vault Sync.
 */
function createRedisClient(): Redis {
  // Silent initialization in production to avoid log noise, verbose in dev/scripts
  if (process.env.NODE_ENV !== 'production' || IS_SCRIPT_MODE) {
    console.log(
      `[Redis] Initializing ${IS_SCRIPT_MODE ? "Script-Mode" : "Standard"} connection`
    );
  }

  const client = new Redis(REDIS_URL, {
    // 🏛️ [RECOVERY LOGIC]
    maxRetriesPerRequest: IS_SCRIPT_MODE ? 5 : 3,

    retryStrategy: (times) => {
      const delay = Math.min(times * 100, 3000);
      if (times > 10) {
        console.error("[Redis] Infrastructure unreachable after 10 attempts.");
        return null; // Stop retrying
      }
      return delay;
    },

    // 🏛️ [BUFFER MANAGEMENT]
    enableOfflineQueue: true,
    lazyConnect: true,
    connectTimeout: 5000,

    // 🏛️ [IO PROTECTION]
    commandTimeout: undefined,
    reconnectOnError: (err) => err.message.includes("READONLY"),
  });

  client.on("error", (err) => {
    // Suppress noise during build-time if Redis isn't strictly required
    if (!IS_SCRIPT_MODE) {
      console.error(`[Redis Connection Error] ${err.message}`);
    }
  });

  return client;
}

/** * Returns the singleton Redis instance. 
 * Use this for all server-side data operations.
 */
export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  return redisInstance;
}

/** * Validates connection health with a timeout race. 
 * Critical for pre-flight checks before the Inner Circle Export API runs.
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (typeof window !== "undefined") return false;

  try {
    const client = getRedis();
    const pingPromise = client.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Health Check Timeout")), 3000)
    );

    await Promise.race([pingPromise, timeoutPromise]);
    return true;
  } catch {
    return false;
  }
}

/** * Graceful shutdown for cleanup phases. 
 * Essential for Vercel/Self-hosted SIGTERM handling.
 */
export async function closeRedis(): Promise<void> {
  if (!redisInstance) return;

  try {
    await redisInstance.quit();
  } catch {
    redisInstance.disconnect();
  } finally {
    redisInstance = null;
  }
}

/**
 * NAMED EXPORT: redis
 * This satisfies the most common import pattern.
 */
export const redis = getRedis();

/**
 * ALIAS EXPORT: redisClient
 * Specifically added to resolve the "Property does not exist" Type Error in keys.server.ts.
 */
export const redisClient = redis;

/**
 * DEFAULT EXPORT: Institutional API
 */
const redisExports = {
  getRedis,
  isRedisAvailable,
  closeRedis,
  redis,
  redisClient, // Alias for build compatibility
  get client() {
    return getRedis();
  },
};

export default redisExports;