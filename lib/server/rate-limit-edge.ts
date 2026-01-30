// lib/server/rate-limit-edge.ts
import { Redis } from "@upstash/redis";

export type EdgeRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
  headers: Record<string, string>;
};

type Args = {
  key: string;
  windowSeconds: number;
  limit: number;
};

let _redis: Redis | null = null;

function getRedisOrNull(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // If missing, return null (do NOT throw)
  if (!url || !token) return null;

  if (!_redis) _redis = new Redis({ url, token });
  return _redis;
}

export async function edgeRateLimit({ key, windowSeconds, limit }: Args): Promise<EdgeRateLimitResult> {
  const redis = getRedisOrNull();

  // Safe degradation: allow if not configured
  if (!redis) {
    return {
      allowed: true,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(limit),
      },
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSeconds);
  const redisKey = `rl:${bucket}:${key}`;

  // Atomic-ish: INCR then EXPIRE
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  const remaining = Math.max(0, limit - count);
  const resetSeconds = (bucket + 1) * windowSeconds - now;

  const allowed = count <= limit;

  return {
    allowed,
    retryAfterSeconds: allowed ? undefined : resetSeconds,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(resetSeconds),
      ...(allowed ? {} : { "Retry-After": String(resetSeconds) }),
    },
  };
}