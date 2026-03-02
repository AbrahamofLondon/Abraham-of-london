// lib/redis/client.ts
import Redis from "ioredis";
import fs from 'fs';

console.log('🔍 Redis Debug:');
console.log('- process.platform:', process.platform);
console.log('- REDIS_HOST env:', process.env.REDIS_HOST);
console.log('- isDocker (old logic):', process.env.DOCKER === 'true' || process.env.REDIS_HOST === 'host.docker.internal' || process.platform === 'win32');
console.log('- isRunningInDocker (new):', fs.existsSync('/.dockerenv') || process.env.RUNNING_IN_DOCKER === 'true');

let redis: Redis | null = null;
let isAvailable = false;

// Better detection: check if we're running inside a Docker container
const isRunningInDocker = fs.existsSync('/.dockerenv') || 
                         process.env.RUNNING_IN_DOCKER === 'true';

// Windows detection - only matters if NOT in Docker
const isWindows = process.platform === 'win32' && !isRunningInDocker;

// Redis connection config
const REDIS_CONFIG = {
  // On Windows with Docker but app not in Docker, use 127.0.0.1
  // On Windows without Docker, use localhost
  // In Docker container, use host.docker.internal or redis service name
  host: process.env.REDIS_HOST || 
        (isRunningInDocker ? 'host.docker.internal' : 
         isWindows ? '127.0.0.1' : 'localhost'),
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(100 * Math.pow(2, times), 5000);
    console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  connectTimeout: 10000,
  keepAlive: 30000,
  family: 4, // Force IPv4
};

// Initialize Redis
export function initRedis() {
  if (redis) return redis;

  try {
    console.log(`[Redis] Attempting to connect to ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`);
    console.log(`[Redis] Runtime: ${isRunningInDocker ? 'Docker' : 'Host'} (${process.platform})`);
    
    redis = new Redis(REDIS_CONFIG);

    redis.on("connect", () => {
      console.log(`✅ [Redis] Connected successfully to ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`);
      isAvailable = true;
    });

    redis.on("ready", () => {
      console.log(`✅ [Redis] Ready to accept commands`);
      isAvailable = true;
    });

    redis.on("error", (error) => {
      console.error(`❌ [Redis] Connection error:`, error.message);
      isAvailable = false;
    });

    redis.on("close", () => {
      console.log("🔌 [Redis] Connection closed");
      isAvailable = false;
    });

    redis.on("reconnecting", () => {
      console.log("🔄 [Redis] Reconnecting...");
    });

    // Test connection immediately
    redis.ping().then((result) => {
      console.log(`✅ [Redis] PING successful: ${result}`);
      isAvailable = true;
    }).catch((error) => {
      console.error(`❌ [Redis] Initial PING failed:`, error.message);
      isAvailable = false;
    });

  } catch (error) {
    console.error("❌ [Redis] Failed to initialize:", error);
    redis = null;
    isAvailable = false;
  }

  return redis;
}

export function getRedis() {
  if (!redis) {
    return initRedis();
  }
  return redis;
}

export function isRedisAvailable() {
  return isAvailable && redis?.status === "ready";
}

/**
 * Health check function that was previously in health-check.ts
 * Now integrated directly into the client
 */
export async function checkRedisHealth() {
  const status = {
    connected: false,
    ping: false,
    memory: null as string | null,
    keys: 0,
    error: null as string | null,
  };

  try {
    // Check if Redis is available
    status.connected = isRedisAvailable();
    
    if (status.connected && redis) {
      // Try to ping
      const pong = await redis.ping();
      status.ping = pong === "PONG";

      // Get memory info
      const info = await redis.info("memory");
      const usedMemory = info.match(/used_memory_human:(.*)/)?.[1]?.trim();
      status.memory = usedMemory || null;

      // Count vault keys
      const keys = await redis.keys("vault:*");
      status.keys = keys.length;
    }
  } catch (error) {
    status.error = error instanceof Error ? error.message : String(error);
    status.connected = false;
  }

  return status;
}

export default {
  getRedis,
  isRedisAvailable,
  checkRedisHealth,
  initRedis,
  client: redis,
};