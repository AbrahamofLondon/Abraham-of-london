// lib/server/rateLimit.ts
// =========================================================================
// Advanced Rate Limiting - In-Memory & Redis Support (Hardened)
// + Backward-compatible wrappers for older imports (isRateLimited / rateLimit config style)
// =========================================================================

import type { NextApiRequest } from "next";
import crypto from "crypto";

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

export interface CombinedRateLimitResult {
  ipResult: RateLimitResult;
  emailResult: RateLimitResult | null;
  ip: string;
  email: string | null;
  allowed: boolean;
  hitIpLimit: boolean;
  hitEmailLimit: boolean;
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
// Privacy-conscious logging
// -------------------------------------------------------------------------

function logRateLimitAction(
  action: string,
  metadata: Record<string, unknown> = {}
): void {
  // In production, avoid logging identifiable inputs (IPs/emails).
  // Leave logging enabled for security observability; keep it privacy-safe.
  // eslint-disable-next-line no-console
  console.log(`🛡️ Rate Limit: ${action}`, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

// -------------------------------------------------------------------------
// In-memory store with automatic cleanup
// -------------------------------------------------------------------------

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000); // hourly
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
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) logRateLimitAction("store_cleanup", { cleanedEntries: cleaned });
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
    logRateLimitAction("store_destroyed");
  }
}

// -------------------------------------------------------------------------
// Redis-based rate limiting (optional, async)
// -------------------------------------------------------------------------

class RedisRateLimit {
  constructor(private redisClient: BasicRedisClient) {}

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
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
        // Try 3rd item first, then fall back to last.
        const pick = (idx: number) => rawResult[idx] as unknown;
        const decode = (v: unknown) => {
          if (Array.isArray(v) && v.length >= 2) {
            const value = v[1] as unknown;
            const num = Number(value);
            if (!Number.isNaN(num) && num > 0) return num;
          }
          return null;
        };

        const third = decode(pick(2));
        if (third !== null) count = third;
        else {
          const last = decode(rawResult[rawResult.length - 1] as unknown);
          if (last !== null) count = last;
        }
      }

      const remaining = Math.max(0, limit - count);
      const elapsed = now - (resetTime - windowMs);

      return {
        allowed: count <= limit,
        remaining,
        retryAfterMs: count > limit ? Math.max(0, windowMs - elapsed) : 0,
        resetTime,
        limit,
        windowMs,
      };
    } catch (error) {
      // Fail open but log - do NOT block legitimate traffic because Redis died
      logRateLimitAction("redis_error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

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
// Core limiter (sync)
// -------------------------------------------------------------------------

function assertValidKey(key: string): void {
  if (!key || typeof key !== "string") {
    throw new Error("Rate limit key must be a non-empty string");
  }
}

function assertValidOptions(options: RateLimitOptions): void {
  if (!options || typeof options !== "object") {
    throw new Error("Rate limit options are required");
  }
  if (options.limit < 1 || options.windowMs < 1000) {
    throw new Error("Invalid rate limit parameters");
  }
}

/**
 * SYNC limiter.
 * NOTE: If useRedis=true, we log a warning and still run in-memory (sync cannot await Redis safely).
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult;
export function rateLimit(config: RateLimitOptions): RateLimitOptions;
/**
 * Backward-compatible overload:
 * - rateLimit(key, options) => RateLimitResult
 * - rateLimit(options) => returns options (factory-style)
 */
export function rateLimit(arg1: string | RateLimitOptions, arg2?: RateLimitOptions) {
  if (typeof arg1 !== "string") {
    // factory-style (older code sometimes does: const cfg = rateLimit({limit,...}))
    assertValidOptions(arg1);
    return arg1;
  }

  const key = arg1;
  const options = arg2 as RateLimitOptions;
  assertValidKey(key);
  assertValidOptions(options);

  const { limit, windowMs, keyPrefix = "rl", useRedis = false, redisClient } = options;

  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;

  if (useRedis && redisClient) {
    logRateLimitAction("sync_redis_warning", { keyPrefix });
  }

  const entry = memoryStore.get(storeKey);

  if (!entry) {
    const newEntry: RateLimitEntry = { count: 1, first: now, resetTime };
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
    const newEntry: RateLimitEntry = { count: 1, first: now, resetTime };
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
    logRateLimitAction("rate_limit_hit", { key: storeKey, count: entry.count, limit, windowMs });

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - elapsed),
      resetTime: entry.resetTime,
      limit,
      windowMs,
    };
  }

  entry.count += 1;
  memoryStore.set(storeKey, entry);

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfterMs: 0,
    resetTime: entry.resetTime,
    limit,
    windowMs,
  };
}

// -------------------------------------------------------------------------
// Async variant - proper Redis support
// -------------------------------------------------------------------------

export async function rateLimitAsync(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  assertValidKey(key);
  assertValidOptions(options);

  const { useRedis = false, redisClient, limit, windowMs, keyPrefix = "rl" } = options;

  if (useRedis && redisClient) {
    const redisLimiter = new RedisRateLimit(redisClient);
    return redisLimiter.check(`${keyPrefix}:${key}`, limit, windowMs);
  }

  return rateLimit(key, options) as RateLimitResult;
}

// -------------------------------------------------------------------------
// Headers helper
// -------------------------------------------------------------------------

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };

  if (result.retryAfterMs > 0) {
    headers["Retry-After"] = Math.ceil(result.retryAfterMs / 1000).toString();
  }

  return headers;
}

// -------------------------------------------------------------------------
// IP extraction helper (Netlify / proxies / Node)
// -------------------------------------------------------------------------

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
    typeof req.socket?.remoteAddress === "string" ? req.socket.remoteAddress : "unknown";

  return socketAddr;
}

// -------------------------------------------------------------------------
// Email-based rate limiting helper
// -------------------------------------------------------------------------

export function rateLimitForEmail(
  email: string,
  label: string,
  options: RateLimitOptions
): { result: RateLimitResult; email: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex");
  const key = `${label}:${emailHash}`;
  const result = rateLimit(key, options) as RateLimitResult;

  logRateLimitAction("email_rate_limit_check", {
    label,
    allowed: result.allowed,
    remaining: result.remaining,
  });

  return { result, email: normalizedEmail };
}

export function rateLimitForRequestIp(
  req: NextApiRequest,
  label: string,
  options: RateLimitOptions
): { result: RateLimitResult; ip: string } {
  const ip = getClientIp(req);

  const anonymizedIp = ip.includes(":")
    ? ip.split(":").slice(0, 3).join(":") + "::"
    : ip.split(".").slice(0, 3).join(".") + ".0";

  const key = `${label}:${anonymizedIp}`;
  const result = rateLimit(key, options) as RateLimitResult;

  logRateLimitAction("ip_rate_limit_check", {
    label,
    allowed: result.allowed,
    remaining: result.remaining,
  });

  return { result, ip };
}

export function combinedRateLimit(
  req: NextApiRequest,
  email: string | null,
  label: string,
  ipOptions: RateLimitOptions,
  emailOptions?: RateLimitOptions
): CombinedRateLimitResult {
  const { result: ipResult, ip } = rateLimitForRequestIp(req, label, ipOptions);

  let emailResult: RateLimitResult | null = null;
  let normalizedEmail: string | null = null;

  if (email && emailOptions) {
    const emailLimit = rateLimitForEmail(email, `${label}-email`, emailOptions);
    emailResult = emailLimit.result;
    normalizedEmail = emailLimit.email;
  }

  const hitIpLimit = !ipResult.allowed;
  const hitEmailLimit = emailResult ? !emailResult.allowed : false;
  const allowed = ipResult.allowed && (!emailResult || emailResult.allowed);

  if (!allowed) {
    logRateLimitAction("combined_rate_limit_hit", {
      label,
      hitIpLimit,
      hitEmailLimit,
      ipRemaining: ipResult.remaining,
      emailRemaining: emailResult?.remaining,
    });
  }

  return {
    ipResult,
    emailResult,
    ip,
    email: normalizedEmail,
    allowed,
    hitIpLimit,
    hitEmailLimit,
  };
}

// -------------------------------------------------------------------------
// Backward-compat wrapper expected by your analytics route:
//   const r = await isRateLimited(key, bucket, limit);
//   if (r.limited) ...
// -------------------------------------------------------------------------

export type LegacyIsRateLimitedResult = {
  limited: boolean;
  retryAfter: number; // seconds
  limit: number;
  remaining: number;
};

export async function isRateLimited(
  key: string,
  bucketType: string,
  limit: number,
  windowMs = 5 * 60 * 1000
): Promise<LegacyIsRateLimitedResult> {
  const result = await rateLimitAsync(`${bucketType}:${key}`, {
    limit,
    windowMs,
    keyPrefix: "api",
    useRedis: false,
    redisClient: null,
  });

  return {
    limited: !result.allowed,
    retryAfter: Math.ceil(result.retryAfterMs / 1000),
    limit: result.limit,
    remaining: result.remaining,
  };
}

// -------------------------------------------------------------------------
// Pre-configured configs
// -------------------------------------------------------------------------

export const RATE_LIMIT_CONFIGS = {
  TEASER_REQUEST: { limit: 5, windowMs: 15 * 60 * 1000, keyPrefix: "teaser" },
  NEWSLETTER_SUBSCRIBE: { limit: 5, windowMs: 10 * 60 * 1000, keyPrefix: "newsletter" },
  CONTACT_FORM: { limit: 5, windowMs: 10 * 60 * 1000, keyPrefix: "contact" },
  AUTHENTICATION: { limit: 5, windowMs: 5 * 60 * 1000, keyPrefix: "auth" },
  API_GENERAL: { limit: 100, windowMs: 60 * 60 * 1000, keyPrefix: "api" },
  INNER_CIRCLE_REGISTER: { limit: 20, windowMs: 15 * 60 * 1000, keyPrefix: "ic-reg" },
  INNER_CIRCLE_REGISTER_EMAIL: { limit: 3, windowMs: 60 * 60 * 1000, keyPrefix: "ic-reg-email" },
  INNER_CIRCLE_UNLOCK: { limit: 50, windowMs: 10 * 60 * 1000, keyPrefix: "ic-unlock" },
  INNER_CIRCLE_RESEND: { limit: 3, windowMs: 15 * 60 * 1000, keyPrefix: "ic-resend" },
  INNER_CIRCLE_RESEND_EMAIL: { limit: 2, windowMs: 60 * 60 * 1000, keyPrefix: "ic-resend-email" },
  INNER_CIRCLE_ADMIN_EXPORT: { limit: 10, windowMs: 60 * 1000, keyPrefix: "ic-admin-export" },
  ADMIN_OPERATIONS: { limit: 10, windowMs: 60 * 60 * 1000, keyPrefix: "admin-ops" },
  ADMIN_LOGIN: { limit: 5, windowMs: 15 * 60 * 1000, keyPrefix: "admin-login" },
  ADMIN_API: { limit: 100, windowMs: 5 * 60 * 1000, keyPrefix: "admin-api" },
} as const;

export type RateLimitConfigKey = keyof typeof RATE_LIMIT_CONFIGS;

export function getRateLimitConfig(key: RateLimitConfigKey): RateLimitOptions {
  const config = RATE_LIMIT_CONFIGS[key];
  if (!config) throw new Error(`Rate limit configuration "${key}" not found`);
  return config;
}

export function hasRateLimitConfig(key: string): key is RateLimitConfigKey {
  return key in RATE_LIMIT_CONFIGS;
}

// -------------------------------------------------------------------------
// Default export for convenience
// -------------------------------------------------------------------------

export default {
  rateLimit,
  rateLimitAsync,
  isRateLimited,
  createRateLimitHeaders,
  getClientIp,
  rateLimitForEmail,
  rateLimitForRequestIp,
  combinedRateLimit,
  RATE_LIMIT_CONFIGS,
  getRateLimitConfig,
  hasRateLimitConfig,
};