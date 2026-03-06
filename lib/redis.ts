// lib/redis.ts - ULTIMATE SINGLE SOURCE OF TRUTH (RECOVERY-READY)
// ✅ Node/server only. Do NOT import this from middleware/edge.

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Determine if we are running in a CLI script or the Vault Master Audit
const IS_SCRIPT_MODE =
  process.env.REDIS_DISABLED === "true" || process.argv[1]?.includes("scripts/");

let redisInstance: Redis | null = null;

/**
 * Creates a hardened Redis client.
 * Optimized for high-volume asset registration during Vault Sync.
 */
function createRedisClient(): Redis {
  console.log(
    `[Redis] Initializing ${IS_SCRIPT_MODE ? "Script-Mode" : "Standard"} connection`
  );

  const client = new Redis(REDIS_URL, {
    // 🏛️ [RECOVERY LOGIC]
    maxRetriesPerRequest: IS_SCRIPT_MODE ? 5 : 3,

    retryStrategy: (times) => {
      if (times > 10) {
        console.error("[Redis] Max retries reached. Infrastructure unreachable.");
        return null;
      }
      return Math.min(times * 100, 3000);
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
    console.error(`[Redis] ${err.message}`);
  });

  return client;
}

/** Returns the singleton Redis instance. */
export function getRedis(): Redis {
  if (!redisInstance) redisInstance = createRedisClient();
  return redisInstance;
}

/** Validates connection health with a timeout race. */
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

/** Graceful shutdown for cleanup phases. */
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

const redisExports = {
  getRedis,
  isRedisAvailable,
  closeRedis,
  get client() {
    return getRedis();
  },
};

export default redisExports;