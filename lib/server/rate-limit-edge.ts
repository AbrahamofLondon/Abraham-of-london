/* lib/server/rate-limit-edge.ts */
import { Redis } from "@upstash/redis";

export type EdgeRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
  headers: Record<string, string>;
};

export type EdgeRateLimitArgs = {
  key: string;
  windowSeconds: number;
  limit: number;
};

let redisInstance: Redis | null = null;

function getRedisOrNull(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  if (!redisInstance) {
    redisInstance = new Redis({ url, token });
  }

  return redisInstance;
}

export async function edgeRateLimit({
  key,
  windowSeconds,
  limit,
}: EdgeRateLimitArgs): Promise<EdgeRateLimitResult> {
  const redis = getRedisOrNull();

  // Safe degradation: if Redis is unavailable or not configured, allow.
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

  const rawCount = await redis.incr(redisKey);
  const count = Number(rawCount);

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

/**
 * Default export intentionally mirrors the named export so legacy compat bridges
 * can safely re-export both.
 */
export default edgeRateLimit;