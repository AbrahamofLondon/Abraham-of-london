/* lib/server/rate-limit-unified.ts — FULL COMPATIBILITY EDITION */
import { NextResponse } from "next/server";
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
  resetTime: number; 
  windowMs: number;
  source: "upstash" | "memory";
};

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitOptions> = {
  API_STRICT: { limit: 30, windowMs: 60_000, keyPrefix: "api-strict" },
  API_GENERAL: { limit: 100, windowMs: 3_600_000, keyPrefix: "api" },
  INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600_000, keyPrefix: "ic-unlock" },
  AUTH: { limit: 10, windowMs: 900_000, keyPrefix: "auth" },
  CONTACT: { limit: 5, windowMs: 3_600_000, keyPrefix: "contact" },
  DOWNLOAD: { limit: 20, windowMs: 3_600_000, keyPrefix: "download" },
  ADMIN: { limit: 100, windowMs: 60_000, keyPrefix: "admin" },
};

const memoryStore = new Map<string, { count: number; resetTime: number }>();

async function getUpstashLimiter(windowMs: number, limit: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    return new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
      analytics: false,
    });
  } catch { return null; }
}

export function getClientIp(req: NextApiRequest | NextRequest): string {
  if ("headers" in req && typeof (req.headers as any).get === "function") {
    const forwarded = (req.headers as any).get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return (req.headers as any).get("x-real-ip") ?? "127.0.0.1";
  }
  const apiReq = req as NextApiRequest;
  const fwd = apiReq.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]) ?? apiReq.socket.remoteAddress ?? "127.0.0.1";
}

/** RESTORED EXPORTS **/

export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  };
}

export async function isRateLimited(identifier: string, options = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<boolean> {
  const key = `${options.keyPrefix ?? "rl"}:${identifier}`;
  const limiter = await getUpstashLimiter(options.windowMs, options.limit);
  if (limiter) {
    try {
      const { remaining } = await limiter.limit(key, { update: false });
      return remaining <= 0;
    } catch { /* fallback */ }
  }
  const record = memoryStore.get(key);
  return record ? record.count >= options.limit : false;
}

export function getRateLimiterStats(): Record<string, any> {
  return { memory: { totalKeys: memoryStore.size } };
}

export async function resetRateLimit(identifier: string, options = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<boolean> {
  const key = `${options.keyPrefix ?? "rl"}:${identifier}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const { Redis } = await import("@upstash/redis");
      await (new Redis({ url, token })).del(key);
    } catch {}
  }
  return memoryStore.delete(key);
}

export const unblock = resetRateLimit;

export async function rateLimit(identifier: string, options = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<RateLimitResult> {
  const key = `${options.keyPrefix ?? "rl"}:${identifier}`;
  const limiter = await getUpstashLimiter(options.windowMs, options.limit);
  if (limiter) {
    try {
      const { success, remaining, reset } = await limiter.limit(key);
      return { allowed: success, remaining, limit: options.limit, retryAfterMs: success ? 0 : reset - Date.now(), resetTime: reset, windowMs: options.windowMs, source: "upstash" };
    } catch {}
  }
  const now = Date.now();
  const record = memoryStore.get(key) || { count: 0, resetTime: now + options.windowMs };
  record.count++;
  memoryStore.set(key, record);
  const allowed = record.count <= options.limit;
  return { allowed, remaining: Math.max(0, options.limit - record.count), limit: options.limit, retryAfterMs: allowed ? 0 : record.resetTime - now, resetTime: record.resetTime, windowMs: options.windowMs, source: "memory" };
}

export async function withEdgeRateLimit(req: NextRequest, options: RateLimitOptions) {
  const res = await rateLimit(getClientIp(req), options);
  return { allowed: res.allowed, headers: createRateLimitHeaders(res), result: res };
}

export function createRateLimitedResponse(result: any) {
  return new NextResponse(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { "Content-Type": "application/json" } });
}