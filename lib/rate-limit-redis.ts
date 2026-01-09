// lib/rate-limit-redis.ts
import { redis, type RedisInterface } from "./redis-enhanced";

// Get the underlying client if needed, but use the safe interface
async function getRedisClient(): Promise<RedisInterface> {
  return redis;
}

type RedisCheckResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  blocked?: boolean;
  blockUntil?: number;
};

async function check(
  key: string,
  opts: { windowMs: number; max: number; keyPrefix?: string; blockDuration?: number }
): Promise<RedisCheckResult> {
  const now = Date.now();
  const prefix = opts.keyPrefix || "rl";
  const k = `${prefix}:${key}`;
  const windowSec = Math.max(1, Math.ceil(opts.windowMs / 1000));
  
  const redisClient = await getRedisClient();

  // Simple fixed-window counter in redis (memory fallback works too)
  const current = await redisClient.get(k);
  const count = current ? Number(current) : 0;

  if (!current) {
    await redisClient.set(k, "1", { EX: windowSec });
    return {
      allowed: true,
      remaining: Math.max(0, opts.max - 1),
      resetAt: now + opts.windowMs,
      limit: opts.max,
      blocked: false,
    };
  }

  const next = count + 1;
  await redisClient.set(k, String(next), { EX: windowSec });

  const allowed = next <= opts.max;
  return {
    allowed,
    remaining: allowed ? Math.max(0, opts.max - next) : 0,
    resetAt: now + opts.windowMs,
    limit: opts.max,
    blocked: !allowed,
    blockUntil: !allowed && opts.blockDuration ? now + opts.blockDuration : undefined,
  };
}

async function getStats() {
  try {
    const redisClient = await getRedisClient();
    await redisClient.ping();
    return { ok: true, redisAvailable: true };
  } catch {
    return { ok: true, redisAvailable: false };
  }
}

// ✅ named export expected by your codebase
export const rateLimitRedis = { check, getStats };
export default rateLimitRedis;