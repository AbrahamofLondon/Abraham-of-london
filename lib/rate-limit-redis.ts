// lib/rate-limit-redis.ts - FIXED VERSION
import { getRedis } from '@/lib/redis';
import enhancedRedis from '@/lib/redis-enhanced'; 

interface RedisInterface {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { EX: number }) => Promise<string>;
  ping: () => Promise<string>;
}

async function getRedisClient(): Promise<RedisInterface> {
  const client = getRedis();
  
  // If getRedis returns a promise, await it
  if (client && typeof (client as any).then === 'function') {
    return await client;
  }
  
  return client as RedisInterface;
}

export type RedisCheckResult = {
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
  const windowSec = Math.max(1, Math.ceil(opts.windowMs / 1000));
  const k = `${prefix}:${key}`;
  const blockKey = `${k}:block`;

  try {
    const client = await getRedisClient();

    // 0) Block enforcement (optional)
    if (opts.blockDuration && opts.blockDuration > 0) {
      const blocked = await client.get(blockKey);
      if (blocked) {
        const until = Number(blocked) || now + opts.blockDuration;
        return {
          allowed: false,
          remaining: 0,
          resetAt: until,
          limit: opts.max,
          blocked: true,
          blockUntil: until,
        };
      }
    }

    // 1) Fixed-window counter
    const current = await client.get(k);
    const count = current ? Number(current) : 0;

    if (!current) {
      await client.set(k, "1", { EX: windowSec });
      return {
        allowed: true,
        remaining: Math.max(0, opts.max - 1),
        resetAt: now + opts.windowMs,
        limit: opts.max,
        blocked: false,
      };
    }

    const next = count + 1;
    await client.set(k, String(next), { EX: windowSec });

    const allowed = next <= opts.max;

    // 2) If exceeded, optionally block
    if (!allowed && opts.blockDuration && opts.blockDuration > 0) {
      const blockUntil = now + opts.blockDuration;
      const blockSec = Math.max(1, Math.ceil(opts.blockDuration / 1000));
      await client.set(blockKey, String(blockUntil), { EX: blockSec });

      return {
        allowed: false,
        remaining: 0,
        resetAt: blockUntil,
        limit: opts.max,
        blocked: true,
        blockUntil,
      };
    }

    return {
      allowed,
      remaining: allowed ? Math.max(0, opts.max - next) : 0,
      resetAt: now + opts.windowMs,
      limit: opts.max,
      blocked: !allowed,
      blockUntil: undefined,
    };
  } catch (error) {
    // Fallback: allow all if Redis fails
    console.error('Redis rate limit error:', error);
    return {
      allowed: true,
      remaining: opts.max,
      resetAt: now + opts.windowMs,
      limit: opts.max,
      blocked: false,
    };
  }
}

async function getStats() {
  try {
    const client = await getRedisClient();
    await client.ping();
    return { ok: true, redisAvailable: true };
  } catch {
    return { ok: true, redisAvailable: false };
  }
}

export const rateLimitRedis = { check, getStats };
export default rateLimitRedis;