// lib/rate-limit-redis.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRedis } from "@/lib/redis";

export type RedisRateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
  blockDuration?: number; // ms
};

export type RedisRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
  limit: number;
  blocked?: boolean;
  blockUntil?: number; // epoch ms
};

function nowMs() {
  return Date.now();
}

export const rateLimitRedis = {
  async check(key: string, opts: RedisRateLimitOptions): Promise<RedisRateLimitResult> {
    const redis = getRedis();
    if (!redis) {
      // caller will fallback elsewhere
      return {
        allowed: true,
        remaining: opts.max - 1,
        resetAt: nowMs() + opts.windowMs,
        limit: opts.max,
        blocked: false,
      };
    }

    const storeKey = `${opts.keyPrefix}:${key}`;
    const blockKey = `${storeKey}:block`;
    const now = nowMs();

    // 1) block check
    const blockUntilStr = await redis.get(blockKey);
    if (blockUntilStr) {
      const blockUntil = Number(blockUntilStr);
      if (blockUntil > now) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: blockUntil,
          limit: opts.max,
          blocked: true,
          blockUntil,
        };
      } else {
        await redis.del(blockKey);
      }
    }

    // 2) fixed window counter
    const windowKey = `${storeKey}:win:${Math.floor(now / opts.windowMs)}`;
    const multi = redis.multi();
    multi.incr(windowKey);
    multi.pttl(windowKey);
    const [incrRes, ttlRes] = (await multi.exec()) as any[];

    const count = Number(incrRes?.[1] ?? 1);
    let ttl = Number(ttlRes?.[1] ?? -1);

    if (ttl < 0) {
      // first request in this window
      await redis.pexpire(windowKey, opts.windowMs);
      ttl = opts.windowMs;
    }

    const resetAt = now + ttl;
    const exceeded = count > opts.max;

    if (exceeded && opts.blockDuration) {
      const blockUntil = now + opts.blockDuration;
      await redis.set(blockKey, String(blockUntil), "PX", opts.blockDuration);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: opts.max,
        blocked: true,
        blockUntil,
      };
    }

    return {
      allowed: !exceeded,
      remaining: Math.max(0, opts.max - count),
      resetAt,
      limit: opts.max,
      blocked: false,
    };
  },

  async getStats() {
    const redis = getRedis();
    if (!redis) return { ok: false, reason: "no_redis" };
    try {
      const pong = await redis.ping();
      return { ok: true, pong };
    } catch (e: any) {
      return { ok: false, reason: e?.message ?? "redis_error" };
    }
  },
};