// lib/rate-limit-redis.ts
import { redis, type RedisInterface } from "./redis-enhanced";

async function getRedisClient(): Promise<RedisInterface> {
  return redis;
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
