// lib/server/redis-unified.ts
// SINGLE IMPORT POINT for server-side code

import { getRedis as getBaseRedis } from "../redis";

type MaybePromise<T> = T | Promise<T>;

export interface UnifiedRedis {
  get(key: string): Promise<string | null>;
  set?(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  setex?(key: string, seconds: number, value: string): Promise<unknown>;
  del?(...keys: string[]): Promise<number | unknown>;
  ping?(): Promise<unknown>;
  exists?(...keys: string[]): Promise<number | unknown>;
  expire?(key: string, seconds: number): Promise<number | unknown>;
  ttl?(key: string): Promise<number | unknown>;
  incr?(key: string): Promise<number | unknown>;
  decr?(key: string): Promise<number | unknown>;
  hget?(key: string, field: string): Promise<string | null>;
  hset?(key: string, field: string, value: string): Promise<number | unknown>;
  hgetall?(key: string): Promise<Record<string, string>>;
  lpush?(key: string, ...values: string[]): Promise<number | unknown>;
  rpush?(key: string, ...values: string[]): Promise<number | unknown>;
  lrange?(key: string, start: number, stop: number): Promise<string[]>;
}

async function resolveRedis(): Promise<UnifiedRedis> {
  const client = await Promise.resolve(
    getBaseRedis() as MaybePromise<UnifiedRedis>
  );
  return client;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// -----------------------------------------------------------------------------
// Availability / lifecycle
// -----------------------------------------------------------------------------

export async function getRedis(): Promise<UnifiedRedis> {
  return resolveRedis();
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const redis = await resolveRedis();
    if (typeof redis.ping !== "function") return true;
    const result = await redis.ping();
    return result === "PONG" || result === "OK" || result === true;
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  // Intentionally a no-op.
  // Current redis adapters in this codebase are stateless or memory-backed.
}

// -----------------------------------------------------------------------------
// Rate limiting
// -----------------------------------------------------------------------------

export async function rateLimitWithRedis(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redis = await resolveRedis();
  const redisKey = `rate-limit:${key}`;
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const current = await redis.get(redisKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: windowMs,
      };
    }

    if (typeof redis.incr === "function") {
      const next = asNumber(await redis.incr(redisKey), count + 1);

      if (next === 1 && typeof redis.expire === "function") {
        await redis.expire(redisKey, ttlSeconds);
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - next),
        resetIn: windowMs,
      };
    }

    // Fallback for clients without incr/expire
    if (typeof redis.setex === "function") {
      await redis.setex(redisKey, ttlSeconds, String(count + 1));
    } else if (typeof redis.set === "function") {
      await redis.set(redisKey, String(count + 1), "EX", ttlSeconds);
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - count - 1),
      resetIn: windowMs,
    };
  } catch (error) {
    console.warn("[Redis Rate Limit] Failed, allowing request:", error);
    return {
      allowed: true,
      remaining: maxRequests,
      resetIn: windowMs,
    };
  }
}

// -----------------------------------------------------------------------------
// Session storage
// -----------------------------------------------------------------------------

export async function setSession(
  key: string,
  value: unknown,
  ttlSeconds = 3600
): Promise<boolean> {
  const redis = await resolveRedis();

  try {
    const payload = JSON.stringify(value);

    if (typeof redis.setex === "function") {
      await redis.setex(`session:${key}`, ttlSeconds, payload);
      return true;
    }

    if (typeof redis.set === "function") {
      await redis.set(`session:${key}`, payload, "EX", ttlSeconds);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function getSession<T = unknown>(key: string): Promise<T | null> {
  const redis = await resolveRedis();

  try {
    const data = await redis.get(`session:${key}`);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Token storage
// -----------------------------------------------------------------------------

export async function storeToken(
  token: string,
  data: unknown,
  expiresInSeconds: number
): Promise<boolean> {
  const redis = await resolveRedis();

  try {
    const payload = JSON.stringify(data);

    if (typeof redis.setex === "function") {
      await redis.setex(`token:${token}`, expiresInSeconds, payload);
      return true;
    }

    if (typeof redis.set === "function") {
      await redis.set(`token:${token}`, payload, "EX", expiresInSeconds);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function validateToken<T = unknown>(
  token: string
): Promise<T | null> {
  const redis = await resolveRedis();

  try {
    const data = await redis.get(`token:${token}`);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}