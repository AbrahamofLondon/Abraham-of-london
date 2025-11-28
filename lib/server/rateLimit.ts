// lib/server/rateLimit.ts
// =========================================================================
// Advanced Rate Limiting - In-Memory & Redis Support (Hardened)
// =========================================================================

import type { NextApiRequest } from "next";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
  useRedis?: boolean;
  redisClient?: BasicRedisClient | null;
}

export interface RateLimitEntry {
  count: number;
  first: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetTime: number;
  limit: number;
  windowMs: number;
}

// Minimal Redis interfaces (vendor-neutral & no `any`)
export interface BasicRedisMulti {
  incr(key: string): BasicRedisMulti;
  expire(key: string, seconds: number): BasicRedisMulti;
  get(key: string): BasicRedisMulti;
  exec(): Promise<unknown>;
}

export interface BasicRedisClient {
  multi(): BasicRedisMulti;
}

// -------------------------------------------------------------------------
// In-memory store with automatic cleanup
// -------------------------------------------------------------------------

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60 * 60 * 1000); // hourly
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// -------------------------------------------------------------------------
// Redis-based rate limiting (optional, async)
// -------------------------------------------------------------------------

class RedisRateLimit {
  constructor(private redisClient: BasicRedisClient) {}

  async check(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const resetTime = now + windowMs;
    const keyWithPrefix = `rate_limit:${key}`;

    try {
      const ttlSeconds = Math.ceil(windowMs / 1000);

      const multi = this.redisClient.multi();
      multi.incr(keyWithPrefix);
      multi.expire(keyWithPrefix, ttlSeconds);
      multi.get(keyWithPrefix);

      const rawResult = await multi.exec();

      // Expect something like: [ [err, incrCount], [err, "OK"], [err, "currentCount"] ]
      let count = 1;

      if (Array.isArray(rawResult)) {
        const third = rawResult[2] as unknown;
        if (Array.isArray(third) && third.length >= 2) {
          const value = third[1] as unknown;
          const num = Number(value);
          if (!Number.isNaN(num) && num > 0) {
            count = num;
          }
        } else {
          const last = rawResult[rawResult.length - 1] as unknown;
          if (Array.isArray(last) && last.length >= 2) {
            const value = last[1] as unknown;
            const num = Number(value);
            if (!Number.isNaN(num) && num > 0) {
              count = num;
            }
          }
        }
      }

      const remaining = Math.max(0, limit - count);
      const elapsed = now - (resetTime - windowMs);

      return {
        allowed: count <= limit,
        remaining,
        retryAfterMs: count > limit ? windowMs - elapsed : 0,
        resetTime,
        limit,
        windowMs,
      };
    } catch (error) {
      // Fail open but log – do NOT block legitimate traffic because Redis died
      // eslint-disable-next-line no-console
      console.error("Redis rate limit error:", error);

      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        retryAfterMs: 0,
        resetTime,
        limit,
        windowMs,
      };
    }
  }
}

// -------------------------------------------------------------------------
// Global memory store instance + clean shutdown
// -------------------------------------------------------------------------

const memoryStore = new RateLimitStore();

if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("SIGTERM", () => memoryStore.destroy());
  process.on("SIGINT", () => memoryStore.destroy());
}

// -------------------------------------------------------------------------
// Synchronous memory-based rate limiter (for Node/Netlify functions)
// -------------------------------------------------------------------------

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const {
    limit,
    windowMs,
    keyPrefix = "rl",
    useRedis = false,
    redisClient,
  } = options;

  if (!key || typeof key !== "string") {
    throw new Error("Rate limit key must be a non-empty string");
  }

  if (limit < 1 || windowMs < 1000) {
    throw new Error("Invalid rate limit parameters");
  }

  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;

  // Synchronous function cannot safely talk to Redis – enforce this
  if (useRedis && redisClient) {
    // eslint-disable-next-line no-console
    console.warn(
      "[rateLimit] Redis configured but sync rateLimit() was used. Use rateLimitAsync() instead.",
    );
  }

  const entry = memoryStore.get(storeKey);

  if (!entry) {
    const newEntry: RateLimitEntry = {
      count: 1,
      first: now,
      resetTime,
    };
    memoryStore.set(storeKey, newEntry);

    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterMs: 0,
      resetTime,
      limit,
      windowMs,
    };
  }

  const elapsed = now - entry.first;

  if (elapsed > windowMs) {
    const newEntry: RateLimitEntry = {
      count: 1,
      first: now,
      resetTime,
    };
    memoryStore.set(storeKey, newEntry);

    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterMs: 0,
      resetTime,
      limit,
      windowMs,
    };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - elapsed,
      resetTime: entry.resetTime,
      limit,
      windowMs,
    };
  }

  entry.count += 1;
  memoryStore.set(storeKey, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfterMs: 0,
    resetTime: entry.resetTime,
    limit,
    windowMs,
  };
}

// -------------------------------------------------------------------------
// Async variant – proper Redis support
// -------------------------------------------------------------------------

export async function rateLimitAsync(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const { useRedis = false, redisClient, limit, windowMs, keyPrefix = "rl" } =
    options;

  if (useRedis && redisClient) {
    const redisLimiter = new RedisRateLimit(redisClient);
    return redisLimiter.check(`${keyPrefix}:${key}`, limit, windowMs);
  }

  // Fallback to in-memory
  return rateLimit(key, options);
}

// -------------------------------------------------------------------------
// HTTP Headers helper (for API responses)
// -------------------------------------------------------------------------

export function createRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };

  if (result.retryAfterMs > 0) {
    headers["Retry-After"] = Math.ceil(
      result.retryAfterMs / 1000,
    ).toString();
  }

  return headers;
}

// -------------------------------------------------------------------------
// IP extraction helper (Netlify / proxies / Node)
// -------------------------------------------------------------------------

/**
 * Best-effort IP extraction for API routes.
 * Handles typical proxy headers used by Netlify and others.
 */
export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const parts = forwarded.split(",").map((p) => p.trim());
    if (parts[0]) return parts[0];
  }

  const netlifyIpHeader = req.headers["x-nf-client-connection-ip"];
  if (typeof netlifyIpHeader === "string" && netlifyIpHeader.length > 0) {
    return netlifyIpHeader;
  }

  const socketAddr =
    typeof req.socket?.remoteAddress === "string"
      ? req.socket.remoteAddress
      : "unknown";

  return socketAddr;
}

/**
 * Convenience helper: rate-limit based on client IP + logical label.
 * Usage:
 *   const result = rateLimitForRequestIp(req, "inner-circle-register", RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER);
 */
export function rateLimitForRequestIp(
  req: NextApiRequest,
  label: string,
  options: RateLimitOptions,
): { result: RateLimitResult; ip: string } {
  const ip = getClientIp(req);
  const key = `${label}:${ip}`;
  const result = rateLimit(key, options);
  return { result, ip };
}

// -------------------------------------------------------------------------
// Pre-configured rate limit configurations
// -------------------------------------------------------------------------

export const RATE_LIMIT_CONFIGS = {
  TEASER_REQUEST: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: "teaser",
  },
  NEWSLETTER_SUBSCRIBE: {
    limit: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: "newsletter",
  },
  CONTACT_FORM: {
    limit: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: "contact",
  },
  AUTHENTICATION: {
    limit: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: "auth",
  },
  API_GENERAL: {
    limit: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: "api",
  },
  INNER_CIRCLE_REGISTER: {
    limit: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes per IP
    keyPrefix: "ic-reg",
  },
  INNER_CIRCLE_UNLOCK: {
    limit: 50,
    windowMs: 10 * 60 * 1000, // 10 minutes per IP
    keyPrefix: "ic-unlock",
  },
  INNER_CIRCLE_ADMIN_EXPORT: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute per IP
    keyPrefix: "ic-admin-export",
  },
} as const;