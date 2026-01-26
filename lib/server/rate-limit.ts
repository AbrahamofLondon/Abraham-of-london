// lib/server/rate-limit.ts
// SINGLE SOURCE OF TRUTH — Pages Router + App Router compatible
// REQUIRED EXPORTS by call-sites:
// - createRateLimitHeaders
// - rateLimit (default + named)
// - rateLimitPublic / rateLimitAuthenticated / rateLimitCritical

import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";
import { LRUCache } from "lru-cache";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
  keyGenerator?: (req: NextApiRequest | NextRequest) => string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitCache = new LRUCache<string, RateLimitRecord>({
  max: 10000,
  ttl: 60 * 60 * 1000,
});

function defaultKeyGenerator(req: NextApiRequest | NextRequest): string {
  if ("socket" in req) {
    const pagesReq = req as NextApiRequest;
    return `rl:${pagesReq.socket.remoteAddress || "unknown"}:${pagesReq.url || "unknown"}`;
  }

  const appReq = req as NextRequest;
  const ip = appReq.ip || appReq.headers.get("x-forwarded-for") || "unknown";
  const pathname = new URL(appReq.url).pathname;
  return `rl:${ip}:${pathname}`;
}

function userKeyGenerator(req: NextApiRequest | NextRequest): string {
  if ("socket" in req) {
    const pagesReq = req as NextApiRequest;
    const userId =
      (pagesReq.headers["x-user-id"] as string | undefined) ||
      (pagesReq.cookies as any)?.userId ||
      "anonymous";
    return `rl:user:${userId}:${pagesReq.url || "unknown"}`;
  }

  const appReq = req as NextRequest;
  const userId =
    appReq.headers.get("x-user-id") ||
    appReq.cookies.get("userId")?.value ||
    "anonymous";
  const pathname = new URL(appReq.url).pathname;
  return `rl:user:${userId}:${pathname}`;
}

/**
 * REQUIRED BY MANY API ROUTES:
 * createRateLimitHeaders(...)
 */
export function createRateLimitHeaders(params: {
  limit: number;
  remaining: number;
  reset: number; // epoch seconds
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(params.limit),
    "X-RateLimit-Remaining": String(Math.max(0, params.remaining)),
    "X-RateLimit-Reset": String(params.reset),
  };
}

export function rateLimit<T = any>(
  handler: (req: NextApiRequest | NextRequest, res?: NextApiResponse) => Promise<T> | T,
  config: RateLimitConfig
): (req: NextApiRequest | NextRequest, res?: NextApiResponse) => Promise<T> {
  const { maxRequests, windowMs, keyGenerator = defaultKeyGenerator } = config;

  return async function rateLimitedHandler(
    req: NextApiRequest | NextRequest,
    res?: NextApiResponse
  ): Promise<T> {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = rateLimitCache.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count += 1;
    rateLimitCache.set(key, record);

    const remaining = Math.max(0, maxRequests - record.count);
    const resetEpochSeconds = Math.ceil(record.resetTime / 1000);

    // Set headers (Pages Router only)
    if (res && "setHeader" in res) {
      const headers = createRateLimitHeaders({
        limit: maxRequests,
        remaining,
        reset: resetEpochSeconds,
      });
      for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    }

    if (record.count > maxRequests) {
      const err: any = new Error(config.message || "Too many requests");
      err.statusCode = 429;
      err.retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      err.headers = createRateLimitHeaders({
        limit: maxRequests,
        remaining: 0,
        reset: resetEpochSeconds,
      });
      throw err;
    }

    return handler(req, res);
  };
}

export const rateLimitPublic = (handler: any) =>
  rateLimit(handler, { maxRequests: 10, windowMs: 60_000 });

export const rateLimitAuthenticated = (handler: any) =>
  rateLimit(handler, {
    maxRequests: 30,
    windowMs: 60_000,
    keyGenerator: userKeyGenerator,
  });

export const rateLimitCritical = (handler: any) =>
  rateLimit(handler, { maxRequests: 5, windowMs: 60_000 });

export function clearRateLimitCache(): void {
  rateLimitCache.clear();
}

export function getRateLimitCacheStats(): { size: number; itemCount: number } {
  return { size: rateLimitCache.size, itemCount: rateLimitCache.size };
}

export default rateLimit;