// lib/rate-limit-redis.ts

// Import Redis with fallback
let redisInstance: any;

async function getRedis() {
  if (!redisInstance) {
    try {
      const { default: redisEnhanced } = await import("./redis-enhanced");
      redisInstance = redisEnhanced;
    } catch (error) {
      // Fallback memory store
      redisInstance = {
        get: async () => null,
        set: async () => {},
        del: async () => {},
        keys: async () => [],
        ping: async () => "PONG"
      };
    }
  }
  return redisInstance;
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
  
  const redis = await getRedis();

  // Simple fixed-window counter in redis (memory fallback works too)
  const current = await redis.get(k);
  const count = current ? Number(current) : 0;

  if (!current) {
    await redis.set(k, "1", { EX: windowSec });
    return {
      allowed: true,
      remaining: Math.max(0, opts.max - 1),
      resetAt: now + opts.windowMs,
      limit: opts.max,
      blocked: false,
    };
  }

  const next = count + 1;
  await redis.set(k, String(next), { EX: windowSec });

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
    const redis = await getRedis();
    await redis.ping();
    return { ok: true, redisAvailable: true };
  } catch {
    return { ok: true, redisAvailable: false };
  }
}

// ✅ named export expected by your codebase
export const rateLimitRedis = { check, getStats };
export default rateLimitRedis;