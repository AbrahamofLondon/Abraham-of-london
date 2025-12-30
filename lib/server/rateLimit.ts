/* lib/server/rateLimit.ts */
// =========================================================================
// Advanced Rate Limiting - In-Memory & Redis Support (Hardened)
// Architected for: Abraham of London Institutional Perimeter
// =========================================================================

import type { NextApiRequest } from "next";
import crypto from "crypto";
import { logAuditEvent } from "./audit"; // Synchronized with Enterprise Schema

// -------------------------------------------------------------------------
// Types & Interfaces
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
// Privacy-Conscious Logging & Audit Integration
// -------------------------------------------------------------------------

function logRateLimitAction(action: string, metadata: Record<string, unknown> = {}): void {
  // Console logging for real-time DevOps observability
  console.log(`🛡️ [PERIMETER] ${action}`, {
    ts: new Date().toISOString(),
    ...metadata,
  });
}

// -------------------------------------------------------------------------
// In-Memory Store (Resilience Layer)
// -------------------------------------------------------------------------

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000); // Hourly hygiene
    }
  }

  get(key: string): RateLimitEntry | undefined { return this.store.get(key); }
  set(key: string, entry: RateLimitEntry): void { this.store.set(key, entry); }
  delete(key: string): void { this.store.delete(key); }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) logRateLimitAction("STORE_CLEANUP", { cleanedEntries: cleaned });
  }

  destroy(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const memoryStore = new RateLimitStore();

// -------------------------------------------------------------------------
// Redis-Based Rate Limiting (Distributed Strategy)
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
      let count = 1;

      if (Array.isArray(rawResult)) {
        const decode = (v: any) => {
          const val = Array.isArray(v) ? v[1] : v;
          const num = Number(val);
          return !Number.isNaN(num) && num > 0 ? num : null;
        };
        count = decode(rawResult[0]) ?? decode(rawResult[2]) ?? 1;
      }

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfterMs: count > limit ? windowMs : 0,
        resetTime,
        limit,
        windowMs,
      };
    } catch (error) {
      logRateLimitAction("REDIS_FAIL_OPEN", { error: String(error) });
      return { allowed: true, remaining: limit - 1, retryAfterMs: 0, resetTime, limit, windowMs };
    }
  }
}

// -------------------------------------------------------------------------
// Core Limiter (Sync & Async)
// -------------------------------------------------------------------------

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;

  const entry = memoryStore.get(storeKey);

  if (!entry || (now - entry.first) > windowMs) {
    const newEntry: RateLimitEntry = { count: 1, first: now, resetTime };
    memoryStore.set(storeKey, newEntry);
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0, resetTime, limit, windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, windowMs - (now - entry.first)), resetTime: entry.resetTime, limit, windowMs };
  }

  entry.count += 1;
  memoryStore.set(storeKey, entry);
  return { allowed: true, remaining: Math.max(0, limit - entry.count), retryAfterMs: 0, resetTime: entry.resetTime, limit, windowMs };
}

export async function rateLimitAsync(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  if (options.useRedis && options.redisClient) {
    return new RedisRateLimit(options.redisClient).check(key, options.limit, options.windowMs);
  }
  return rateLimit(key, options);
}

// -------------------------------------------------------------------------
// Institutional Helpers (IP/Email/Combined)
// -------------------------------------------------------------------------

export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return (req.headers["x-nf-client-connection-ip"] as string) || req.socket?.remoteAddress || "unknown";
}

export function combinedRateLimit(
  req: NextApiRequest,
  email: string | null,
  label: string,
  ipOptions: RateLimitOptions,
  emailOptions?: RateLimitOptions
): CombinedRateLimitResult {
  const ip = getClientIp(req);
  const anonIp = ip.includes(":") ? ip.split(":").slice(0, 3).join(":") + "::" : ip.split(".").slice(0, 3).join(".") + ".0";
  
  const ipResult = rateLimit(`${label}:${anonIp}`, ipOptions);
  let emailResult: RateLimitResult | null = null;
  let normalizedEmail: string | null = null;

  if (email && emailOptions) {
    normalizedEmail = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex");
    emailResult = rateLimit(`${label}:${emailHash}`, emailOptions);
  }

  const allowed = ipResult.allowed && (!emailResult || emailResult.allowed);

  if (!allowed) {
    // Institutional Audit: Breach recorded for Board Dashboard
    logAuditEvent({
      actorType: "system",
      action: "RATE_LIMIT_EXCEEDED",
      resourceType: label,
      status: "failed",
      details: { label, ip: anonIp, email: normalizedEmail ? "present" : "absent" },
      ipAddress: ip
    }).catch(() => {});
  }

  return { ipResult, emailResult, ip, email: normalizedEmail, allowed, hitIpLimit: !ipResult.allowed, hitEmailLimit: emailResult ? !emailResult.allowed : false };
}

// -------------------------------------------------------------------------
// Institutional Configurations
// -------------------------------------------------------------------------

export const RATE_LIMIT_CONFIGS = {
  STRATEGY_ROOM_INTAKE: { limit: 10, windowMs: 60 * 60 * 1000, keyPrefix: "strategy" },
  INNER_CIRCLE_REGISTER: { limit: 20, windowMs: 15 * 60 * 1000, keyPrefix: "ic-reg" },
  INNER_CIRCLE_UNLOCK: { limit: 50, windowMs: 10 * 60 * 1000, keyPrefix: "ic-unlock" },
  INNER_CIRCLE_RESEND: { limit: 3, windowMs: 15 * 60 * 1000, keyPrefix: "ic-resend" },
} as const;

export default { rateLimit, rateLimitAsync, combinedRateLimit, getClientIp, RATE_LIMIT_CONFIGS };