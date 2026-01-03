import type { NextRequest } from "next/server";

// Standard interfaces maintained for Aligned ContentHelper compatibility
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

// Memory-efficient stores for ephemeral Edge execution
const edgeStore = new Map<string, { count: number; resetTime: number }>();
const MAX_STORE_SIZE = 10000; // Prevent memory leaks in long-lived nodes

/**
 * FIXED WINDOW RATE LIMITER (Edge Optimized)
 * Performs lazy cleanup to ensure high performance without reliable setInterval.
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  
  // 1. LAZY CLEANUP: If the store is too large, clear expired entries immediately
  if (edgeStore.size > MAX_STORE_SIZE) {
    for (const [k, v] of edgeStore.entries()) {
      if (now > v.resetTime) edgeStore.delete(k);
    }
  }

  const entry = edgeStore.get(storeKey);

  // 2. EXPIRED OR NEW ENTRY
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    edgeStore.set(storeKey, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterMs: 0,
      resetTime,
      limit,
      windowMs,
    };
  }

  // 3. ENFORCE LIMIT
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, entry.resetTime - now),
      resetTime: entry.resetTime,
      limit,
      windowMs,
    };
  }

  // 4. INCREMENT
  entry.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfterMs: 0,
    resetTime: entry.resetTime,
    limit,
    windowMs,
  };
}

/**
 * CLIENT IP RESOLUTION (Enterprise WAF Logic)
 */
export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
         req.headers.get("x-real-ip") || 
         "127.0.0.1";
}

/**
 * KEY GENERATION
 */
export function getRateLimitKeys(req: NextRequest, keyPrefix: string): string[] {
  const ip = getClientIp(req);
  const url = new URL(req.url);
  return [
    `${keyPrefix}:${ip}`,
    `${keyPrefix}:${ip}:${url.pathname}`,
  ];
}

/**
 * MULTI-KEY VALIDATION
 */
export function checkMultipleRateLimits(
  keys: string[], 
  options: RateLimitOptions
): { worstResult: RateLimitResult } {
  const results = keys.map(k => rateLimit(k, options));
  const worstResult = results.reduce((prev, curr) => {
    if (!curr.allowed) return curr;
    if (!prev.allowed) return prev;
    return curr.remaining < prev.remaining ? curr : prev;
  }, results[0]);

  return { worstResult };
}

export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
} as const;

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    "Retry-After": result.retryAfterMs > 0 ? Math.ceil(result.retryAfterMs / 1000).toString() : "0"
  };
}