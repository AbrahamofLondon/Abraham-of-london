/* lib/server/rateLimit-edge.ts - Edge Runtime compatible */
import type { NextRequest } from "next/server";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetTime: number;
  limit: number;
  windowMs: number;
}

// Simple in-memory store for Edge Runtime
const edgeStore = new Map<string, { count: number; first: number; resetTime: number }>();

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;
  const entry = edgeStore.get(storeKey);

  if (!entry || (now - entry.first) > windowMs) {
    edgeStore.set(storeKey, { count: 1, first: now, resetTime });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0, resetTime, limit, windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, windowMs - (now - entry.first)), resetTime: entry.resetTime, limit, windowMs };
  }

  entry.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - entry.count), retryAfterMs: 0, resetTime: entry.resetTime, limit, windowMs };
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    "Retry-After": result.retryAfterMs > 0 ? Math.ceil(result.retryAfterMs / 1000).toString() : "0"
  };
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-nf-client-connection-ip") || "unknown";
}

/**
 * Combined rate limit wrapper for Edge middleware
 */
export const combinedRateLimit = (
  handler: Function, 
  options: RateLimitOptions = { limit: 100, windowMs: 3600000, keyPrefix: "api" }
) => {
  return async (req: NextRequest, ...args: any[]) => {
    const ip = getClientIp(req);
    const result = rateLimit(`${options.keyPrefix}:${ip}`, options);
    
    if (!result.allowed) {
      // Return 429 Too Many Requests for Edge Runtime
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(result.retryAfterMs / 1000),
          limit: options.limit,
          windowMs: options.windowMs
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...createRateLimitHeaders(result)
          }
        }
      );
    }
    
    // Continue to handler
    return handler(req, ...args);
  };
};

export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  DOWNLOAD_API: { limit: 30, windowMs: 600000, keyPrefix: "download" },
  ASSET_API: { limit: 50, windowMs: 300000, keyPrefix: "asset" }
} as const;

export default { combinedRateLimit, rateLimit, createRateLimitHeaders, RATE_LIMIT_CONFIGS };