// lib/redis/client.ts
import Redis from "ioredis";
import fs from "fs";

let redis: Redis | null = null;
let isAvailable = false;

/**
 * Detect whether the process is running inside a runtime Docker container.
 *
 * IMPORTANT: Netlify build containers ARE Linux containers — /.dockerenv
 * exists and a naive check returns true. But a Netlify BUILD is not a
 * runtime Docker host, it is a CI environment with no co-located Redis.
 * Treating it as Docker makes the initializer try to dial
 * host.docker.internal and flood the build log with connect errors.
 *
 * Gate order:
 *   1. NETLIFY=true     → treat as non-Docker (CI build)
 *   2. CI=true with no REDIS_HOST set → non-Docker (any CI, no redis intent)
 *   3. Otherwise fall back to /.dockerenv presence
 */
export function isRunningInDocker(): boolean {
  if (process.env.NETLIFY === "true") return false;
  if (process.env.CI === "true" && !process.env.REDIS_HOST) return false;

  try {
    return (
      fs.existsSync("/.dockerenv") ||
      process.env.RUNNING_IN_DOCKER === "true"
    );
  } catch {
    return false;
  }
}

// Windows detection - only matters if NOT in Docker
const isWindows = process.platform === "win32" && !isRunningInDocker();

// Redis connection config
const REDIS_CONFIG = {
  host:
    process.env.REDIS_HOST ||
    (isRunningInDocker()
      ? "host.docker.internal"
      : isWindows
      ? "127.0.0.1"
      : "localhost"),
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(100 * Math.pow(2, times), 5000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  connectTimeout: 10000,
  keepAlive: 30000,
  family: 4, // Force IPv4
};

/**
 * Check if Redis is intentionally disabled by configuration.
 * When disabled, Redis is reserved infrastructure — not an active dependency.
 * Health checks should show "reserved/disabled" not "offline/degraded".
 */
export function isRedisDisabled(): boolean {
  return (
    process.env.REDIS_DISABLED === "true" ||
    process.env.USE_REDIS === "false"
  );
}

/**
 * Initialize Redis.
 *
 * Build-time safety: if there is no explicit REDIS_HOST env var set, and
 * we are not actually running inside a Docker container, return null.
 * Callers already handle null. This prevents the Netlify build container
 * from spawning an ioredis client that tries to reach host.docker.internal
 * and logs a continuous stream of connection errors during `next build`.
 *
 * REDIS_DISABLED=true or USE_REDIS=false: Redis is intentionally disabled.
 * Return null immediately — no connection attempt. Health checks must show
 * "reserved/disabled" not "offline/degraded".
 */
export function initRedis() {
  if (redis) return redis;

  // Redis is intentionally disabled — reserved infrastructure, not active.
  if (isRedisDisabled()) {
    isAvailable = false;
    return null;
  }

  const hasHost = Boolean(process.env.REDIS_HOST);
  if (!hasHost && !isRunningInDocker()) {
    // No Redis available in this environment (e.g. Netlify CI build).
    // Return null so callers can fall back to their no-redis paths.
    isAvailable = false;
    return null;
  }

  try {
    redis = new Redis(REDIS_CONFIG);

    redis.on("connect", () => {
      isAvailable = true;
    });

    redis.on("ready", () => {
      isAvailable = true;
    });

    redis.on("error", (error) => {
      console.error(`[Redis] Connection error:`, error.message);
      isAvailable = false;
    });

    redis.on("close", () => {
      isAvailable = false;
    });

    redis.on("reconnecting", () => {
      // intentionally silent
    });
  } catch (error) {
    console.error("[Redis] Failed to initialize:", error);
    redis = null;
    isAvailable = false;
  }

  return redis;
}

export function getRedis(): Redis | null {
  if (!redis) {
    return initRedis();
  }
  return redis;
}

export function isRedisAvailable(): boolean {
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