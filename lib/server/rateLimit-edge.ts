// lib/server/rateLimit-edge.ts - Edge Runtime compatible
import type { NextRequest } from "next/server";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface TokenBucketOptions {
  capacity: number;
  tokensPerSecond: number;
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

// Token bucket store
const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

// Violation tracking for exponential backoff
const violationCounts = new Map<string, number>();

// Cleanup interval reference
let cleanupInterval: ReturnType<typeof setInterval> | undefined;

/**
 * Safe interval for Edge Runtime
 */
function setSafeInterval(callback: () => void, ms: number): ReturnType<typeof setInterval> {
  if (typeof setInterval !== 'undefined') {
    return setInterval(callback, ms);
  }
  // Fallback for environments without setInterval
  return 0 as unknown as ReturnType<typeof setInterval>;
}

/**
 * Safe clear interval for Edge Runtime
 */
function clearSafeInterval(interval: ReturnType<typeof setInterval> | undefined): void {
  if (interval && typeof clearInterval !== 'undefined') {
    clearInterval(interval);
  }
}

/**
 * Start automatic cleanup of expired rate limit entries
 */
export function startCleanup(intervalMs: number = 60000): void {
  clearSafeInterval(cleanupInterval);
  
  cleanupInterval = setSafeInterval(() => {
    const now = Date.now();
    
    // Cleanup edgeStore
    for (const [key, entry] of edgeStore.entries()) {
      // FIX: Use resetTime to determine expiration since windowMs is not stored
      if (now > entry.resetTime) {
        edgeStore.delete(key);
      }
    }
    
    // Cleanup tokenBuckets
    for (const [key, bucket] of tokenBuckets.entries()) {
      if (now - bucket.lastRefill > 3600000) { // 1 hour idle
        tokenBuckets.delete(key);
      }
    }
    
    // Cleanup violation counts
    for (const [key] of violationCounts.entries()) {
      const parts = key.split(':');
      const prefix = parts[0]; 
      const baseKey = `${prefix}:${parts.slice(1).join(':')}`;
      const entry = edgeStore.get(baseKey);
      
      // If base entry is gone or violation is old (1 hour TTL)
      if (!entry || now > entry.resetTime + 3600000) { 
        violationCounts.delete(key);
      }
    }
  }, intervalMs);
}

/**
 * Stop cleanup interval (useful for testing)
 */
export function stopCleanup(): void {
  clearSafeInterval(cleanupInterval);
  cleanupInterval = undefined;
}

/**
 * Fixed window rate limiter
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;
  const entry = edgeStore.get(storeKey);

  // Start cleanup on first rate limit call
  if (!cleanupInterval && typeof global !== 'undefined' && typeof setInterval !== 'undefined') {
    startCleanup();
  }

  // Check if expired
  if (!entry || (now > entry.resetTime)) {
    edgeStore.set(storeKey, { count: 1, first: now, resetTime: resetTime });
    return { 
      allowed: true, 
      remaining: limit - 1, 
      retryAfterMs: 0, 
      resetTime, 
      limit, 
      windowMs 
    };
  }

  if (entry.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfterMs: Math.max(0, entry.resetTime - now), 
      resetTime: entry.resetTime, 
      limit, 
      windowMs 
    };
  }

  entry.count += 1;
  return { 
    allowed: true, 
    remaining: Math.max(0, limit - entry.count), 
    retryAfterMs: 0, 
    resetTime: entry.resetTime, 
    limit, 
    windowMs 
  };
}

/**
 * Token bucket rate limiter
 */
export function tokenBucketRateLimit(key: string, options: TokenBucketOptions): RateLimitResult {
  const { capacity, tokensPerSecond, keyPrefix = "tb" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  
  let bucket = tokenBuckets.get(storeKey);
  
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    tokenBuckets.set(storeKey, bucket);
  }
  
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((timePassed / 1000) * tokensPerSecond);
  bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
  
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { 
      allowed: true, 
      remaining: Math.floor(bucket.tokens), 
      retryAfterMs: 0, 
      resetTime: now + Math.ceil((1 - bucket.tokens) / tokensPerSecond) * 1000,
      limit: capacity,
      windowMs: Math.ceil(1000 / tokensPerSecond)
    };
  }
  
  const tokensNeeded = 1 - bucket.tokens;
  const retryAfterMs = Math.ceil(tokensNeeded / tokensPerSecond * 1000);
  
  return { 
    allowed: false, 
    remaining: 0, 
    retryAfterMs, 
    resetTime: now + retryAfterMs,
    limit: capacity,
    windowMs: Math.ceil(1000 / tokensPerSecond)
  };
}

/**
 * Rate limit with exponential backoff
 */
export function rateLimitWithBackoff(
  key: string, 
  options: RateLimitOptions & { backoffFactor?: number; maxBackoffMs?: number }
): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl", backoffFactor = 2, maxBackoffMs = 3600000 } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  
  const baseResult = rateLimit(key, { limit, windowMs, keyPrefix });
  
  if (!baseResult.allowed) {
    const violations = (violationCounts.get(storeKey) || 0) + 1;
    violationCounts.set(storeKey, violations);
    
    const backoffMs = baseResult.retryAfterMs * Math.pow(backoffFactor, violations - 1);
    
    return {
      ...baseResult,
      retryAfterMs: Math.min(backoffMs, maxBackoffMs),
    };
  }
  
  if (baseResult.remaining > 0) {
    violationCounts.delete(storeKey);
  }
  
  return baseResult;
}

/**
 * Generate HTTP headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    "Retry-After": result.retryAfterMs > 0 ? Math.ceil(result.retryAfterMs / 1000).toString() : "0"
  };
}

/**
 * Get client IP
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(ip => ip.trim());
    for (const ip of ips) {
      if (!ip.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|::1|127\.|fd[0-9a-f]{2}:|fe80::)/)) {
        return ip;
      }
    }
    return ips[0] || "unknown";
  }
  
  return req.headers.get("x-nf-client-connection-ip") || 
         req.headers.get("x-real-ip") || 
         (req as any).ip || 
         "unknown";
}

/**
 * Generate keys
 */
export function getRateLimitKeys(req: NextRequest, keyPrefix: string): string[] {
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const url = new URL(req.url);
  
  return [
    `${keyPrefix}:${ip}`,
    `${keyPrefix}:${ip}:${url.pathname}`,
    `${keyPrefix}:${ip}:${req.method}:${url.pathname}`,
    `${keyPrefix}:${ip}:${userAgent}`,
  ];
}

/**
 * Check multiple limits - FIXED
 */
export function checkMultipleRateLimits(
  keys: string[], 
  options: RateLimitOptions
): { results: RateLimitResult[]; worstResult: RateLimitResult } {
  const results = keys.map(key => rateLimit(key, options));
  
  // FIX: Handle empty array case explicitly
  if (results.length === 0) {
    const defaultResult: RateLimitResult = {
      allowed: true,
      remaining: options.limit,
      retryAfterMs: 0,
      resetTime: Date.now() + options.windowMs,
      limit: options.limit,
      windowMs: options.windowMs
    };
    return { results, worstResult: defaultResult };
  }

  // FIX: Safe reduce with explicit initial value type
  const worstResult = results.reduce((worst, current) => {
    if (!worst) return current; // Should not happen, but safe for TS
    if (!current.allowed) return current;
    if (!worst.allowed) return worst;
    if (current.remaining < worst.remaining) return current;
    return worst;
  }, results[0] as RateLimitResult);
  
  return { results, worstResult };
}

/**
 * Combined limit wrapper
 */
export const combinedRateLimit = (
  handler: Function, 
  options: RateLimitOptions = { limit: 100, windowMs: 3600000, keyPrefix: "api" }
) => {
  return async (req: NextRequest, ...args: any[]) => {
    const ip = getClientIp(req);
    const result = rateLimit(`${options.keyPrefix}:${ip}`, options);
    
    if (!result.allowed) {
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
    
    const response = await handler(req, ...args);
    Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
};

/**
 * Next.js wrapper
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response> | Response,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL,
  useBackoff: boolean = false
) {
  return async (req: NextRequest) => {
    const ip = getClientIp(req);
    const key = `${options.keyPrefix}:${ip}`;
    
    const result = useBackoff 
      ? rateLimitWithBackoff(key, { ...options, backoffFactor: 2 })
      : rateLimit(key, options);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
          retryAfter: Math.ceil(result.retryAfterMs / 1000),
          limit: options.limit,
          windowMs: options.windowMs
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...createRateLimitHeaders(result),
          },
        }
      );
    }
    
    const response = await handler(req);
    const headers = createRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

export function clearRateLimitData(): void {
  edgeStore.clear();
  tokenBuckets.clear();
  violationCounts.clear();
  stopCleanup();
}

export function getRateLimitStats() {
  return {
    totalEntries: edgeStore.size,
    tokenBucketEntries: tokenBuckets.size,
    violationEntries: violationCounts.size
  };
}

export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
  DOWNLOAD_API: { limit: 30, windowMs: 600000, keyPrefix: "download" },
  ASSET_API: { limit: 50, windowMs: 300000, keyPrefix: "asset" },
  AUTH_API: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
  SEARCH_API: { limit: 60, windowMs: 60000, keyPrefix: "search" },
  WEBHOOK_API: { limit: 5, windowMs: 30000, keyPrefix: "webhook" },
} as const;

export default {
  rateLimit,
  tokenBucketRateLimit,
  rateLimitWithBackoff,
  combinedRateLimit,
  withRateLimit,
  createRateLimitHeaders,
  getClientIp,
  getRateLimitKeys,
  checkMultipleRateLimits,
  getRateLimitStats,
  startCleanup,
  stopCleanup,
  clearRateLimitData,
  RATE_LIMIT_CONFIGS,
};