// lib/server/rateLimit.ts - Node.js Runtime compatible
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";
import { logAuditEvent } from "./audit";

// --- Types & Interfaces ---
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

export interface LegacyIsRateLimitedResult {
  limited: boolean;
  retryAfter: number; 
  limit: number;
  remaining: number;
}

// --- In-Memory Store with Automatic Cleanup ---
class RateLimitStore {
  private store = new Map<string, { count: number; first: number; resetTime: number }>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.startCleanup();
  }

  startCleanup(intervalMs: number = 60000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, intervalMs);
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  get(key: string) { 
    return this.store.get(key); 
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, entry: any) { 
    this.store.set(key, entry); 
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }
}

// Singleton store instance
const memoryStore = new RateLimitStore();

// Token bucket store
const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

// Violation tracking for exponential backoff
const violationCounts = new Map<string, number>();

// --- Core Rate Limiting Functions ---

/**
 * Fixed window rate limiter
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;
  const entry = memoryStore.get(storeKey);

  if (!entry || (now - entry.first) > windowMs) {
    memoryStore.set(storeKey, { 
      count: 1, 
      first: now, 
      resetTime: resetTime 
    });
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
      retryAfterMs: Math.max(0, windowMs - (now - entry.first)), 
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
 * Token bucket rate limiter (for smooth rate limiting)
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
  
  // Refill tokens
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((timePassed / 1000) * tokensPerSecond);
  bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
  
  // Check if request is allowed
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
  
  // Calculate retry time
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
 * Rate limit with exponential backoff for repeated violations
 */
export function rateLimitWithBackoff(
  key: string, 
  options: RateLimitOptions & { backoffFactor?: number; maxBackoffMs?: number }
): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl", backoffFactor = 2, maxBackoffMs = 3600000 } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  
  // Check existing rate limit
  const baseResult = rateLimit(key, { limit, windowMs, keyPrefix });
  
  if (!baseResult.allowed) {
    // Increment violation count
    const violations = (violationCounts.get(storeKey) || 0) + 1;
    violationCounts.set(storeKey, violations);
    
    // Apply exponential backoff
    const backoffMs = baseResult.retryAfterMs * Math.pow(backoffFactor, violations - 1);
    
    return {
      ...baseResult,
      retryAfterMs: Math.min(backoffMs, maxBackoffMs),
    };
  }
  
  // Reset violation count on successful request
  if (baseResult.remaining > 0) {
    violationCounts.delete(storeKey);
  }
  
  return baseResult;
}

/**
 * Generate HTTP headers from rate limit result
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
 * Get client IP address from request
 */
export function getClientIp(req: NextApiRequest | NextRequest): string {
  // Handle NextApiRequest (Node.js) - check for 'socket' or plain object headers
  if ('socket' in req || ('headers' in req && typeof req.headers === 'object' && !('get' in req.headers))) {
    const nodeReq = req as NextApiRequest;
    const forwarded = nodeReq.headers["x-forwarded-for"];
    
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }
    
    if (Array.isArray(forwarded) && forwarded[0]) {
      return forwarded[0].trim();
    }
    
    return (nodeReq.headers["x-nf-client-connection-ip"] as string) || 
           nodeReq.socket?.remoteAddress || 
           "unknown";
  }
  
  // Handle NextRequest (Edge runtime)
  if ('headers' in req && typeof (req as any).headers.get === 'function') {
    const edgeReq = req as NextRequest;
    const forwarded = edgeReq.headers.get("x-forwarded-for");
    
    if (forwarded) {
      const ips = forwarded.split(",").map(ip => ip.trim());
      // Return the first non-internal IP
      for (const ip of ips) {
        if (!ip.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|::1|127\.|fd[0-9a-f]{2}:|fe80::)/)) {
          return ip;
        }
      }
      return ips[0] || "unknown";
    }
    
    return edgeReq.headers.get("x-nf-client-connection-ip") || 
           edgeReq.headers.get("x-real-ip") || 
           (edgeReq as any).ip || 
           "unknown";
  }
  
  return "unknown";
}

/**
 * Legacy compatibility function
 */
export async function isRateLimited(key: string, bucket: string, limit: number): Promise<LegacyIsRateLimitedResult> {
  const res = rateLimit(`${bucket}:${key}`, { 
    limit, 
    windowMs: 5 * 60 * 1000 
  });
  return { 
    limited: !res.allowed, 
    retryAfter: Math.ceil(res.retryAfterMs / 1000), 
    limit: res.limit, 
    remaining: res.remaining 
  };
}

/**
 * Overloaded version with windowMs parameter
 */
export async function isRateLimitedWithWindow(
  key: string, 
  bucket: string, 
  limit: number, 
  windowMs: number = 5 * 60 * 1000
): Promise<LegacyIsRateLimitedResult> {
  const res = rateLimit(`${bucket}:${key}`, { limit, windowMs });
  return { 
    limited: !res.allowed, 
    retryAfter: Math.ceil(res.retryAfterMs / 1000), 
    limit: res.limit, 
    remaining: res.remaining 
  };
}

/**
 * Generate multiple rate limit keys for different strategies
 */
export function getRateLimitKeys(req: NextApiRequest | NextRequest, keyPrefix: string): string[] {
  const ip = getClientIp(req);
  
  let userAgent = 'unknown';
  let pathname = '/';
  let method = 'GET';

  if ('headers' in req && 'get' in req.headers && typeof (req.headers as any).get === 'function') {
    // Edge Request
    const r = req as NextRequest;
    userAgent = r.headers.get('user-agent') || 'unknown';
    pathname = new URL(r.url).pathname;
    method = r.method;
  } else {
    // Node Request
    const r = req as NextApiRequest;
    userAgent = (r.headers['user-agent'] as string) || 'unknown';
    pathname = r.url?.split('?')[0] || '/';
    method = r.method || 'GET';
  }
  
  return [
    `${keyPrefix}:${ip}`, // Global per IP
    `${keyPrefix}:${ip}:${pathname}`, // Per IP + endpoint
    `${keyPrefix}:${ip}:${method}:${pathname}`, // Per IP + method + endpoint
    `${keyPrefix}:${ip}:${userAgent}`, // Per IP + user agent
  ];
}

/**
 * Check multiple rate limit strategies
 */
export function checkMultipleRateLimits(
  keys: string[], 
  options: RateLimitOptions
): { results: RateLimitResult[]; worstResult: RateLimitResult } {
  const results = keys.map(key => rateLimit(key, options));
  const worstResult = results.reduce((worst, current) => {
    if (!current.allowed) return current;
    if (!worst.allowed) return worst;
    if (current.remaining < worst.remaining) return current;
    return worst;
  }, results[0] as RateLimitResult);
  
  return { results, worstResult };
}

// ============================================================================
// API Route Handler Wrappers
// ============================================================================

/**
 * Wrapper for Next.js API routes (Node.js runtime)
 */
export function withApiRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL,
  useBackoff: boolean = false
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const ip = getClientIp(req);
      const key = `${options.keyPrefix}:${ip}`;
      
      const result = useBackoff 
        ? rateLimitWithBackoff(key, { ...options, backoffFactor: 2 })
        : rateLimit(key, options);
      
      if (!result.allowed) {
        // Log rate limit hit
        await logAuditEvent({
          actorType: "api",
          action: "rate_limit_hit",
          resourceType: "api_endpoint",
          status: "warning",
          severity: "medium",
          ipAddress: ip,
          details: {
            keyPrefix: options.keyPrefix,
            limit: options.limit,
            windowMs: options.windowMs,
            retryAfterMs: result.retryAfterMs,
            path: req.url
          }
        });
        
        // Set rate limit headers
        Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
          retryAfter: Math.ceil(result.retryAfterMs / 1000),
          limit: options.limit,
          windowMs: options.windowMs
        });
      }
      
      // Add rate limit headers to successful responses
      Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Call the original handler
      return handler(req, res);
      
    } catch (error) {
      console.error('[RATE_LIMIT_ERROR]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Combined rate limit wrapper for Node.js API routes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const combinedRateLimit = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextApiRequest, res: NextApiResponse, ...args: any[]) => Promise<any> | any,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextApiRequest, res: NextApiResponse, ...args: any[]) => {
    try {
      const ip = getClientIp(req);
      const result = rateLimit(`${options.keyPrefix}:${ip}`, options);
      
      if (!result.allowed) {
        // Log rate limit attempts
        await logAuditEvent({
          actorType: "api",
          action: "rate_limit_hit",
          resourceType: "api_endpoint",
          status: "warning",
          severity: "medium",
          ipAddress: ip,
          details: {
            keyPrefix: options.keyPrefix,
            limit: options.limit,
            windowMs: options.windowMs,
            retryAfterMs: result.retryAfterMs
          }
        });
        
        // Set headers
        Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(result.retryAfterMs / 1000),
          limit: options.limit,
          windowMs: options.windowMs
        });
      }
      
      // Call the handler
      const response = await handler(req, res, ...args);
      
      // Add rate limit headers to response
      if (!res.headersSent) {
        Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('[RATE_LIMIT_ERROR]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Convenience function for rate limiting based on request IP
 */
export function rateLimitForRequestIp(
  req: NextApiRequest, 
  label: string, 
  options: RateLimitOptions
) {
  const ip = getClientIp(req);
  const result = rateLimit(`${label}:${ip}`, options);
  return { 
    result, 
    ip, 
    headers: createRateLimitHeaders(result) 
  };
}

/**
 * Middleware-friendly rate limit check
 */
export const checkRateLimit = (identifier: string, options: RateLimitOptions): RateLimitResult => {
  return rateLimit(identifier, options);
};

/**
 * Helper to clear all rate limit data (useful for testing)
 */
export function clearRateLimitData(): void {
  memoryStore.clear();
  tokenBuckets.clear();
  violationCounts.clear();
}

/**
 * Get store statistics (for monitoring)
 */
export function getRateLimitStats() {
  return {
    totalEntries: memoryStore.size,
    tokenBucketEntries: tokenBuckets.size,
    violationEntries: violationCounts.size
  };
}

// ============================================================================
// Rate Limit Configurations
// ============================================================================

export const RATE_LIMIT_CONFIGS = {
  // Legacy configurations
  STRATEGY_ROOM_INTAKE: { limit: 10, windowMs: 3600000, keyPrefix: "strategy" },
  INNER_CIRCLE_REGISTER: { limit: 20, windowMs: 900000, keyPrefix: "ic-reg" },
  CONTACT_FORM: { limit: 5, windowMs: 600000, keyPrefix: "contact" },
  NEWSLETTER_SUBSCRIBE: { limit: 5, windowMs: 600000, keyPrefix: "news" },
  API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  TEASER_REQUEST: { limit: 10, windowMs: 900000, keyPrefix: "teaser" },
  ADMIN_API: { limit: 50, windowMs: 300000, keyPrefix: "admin" },
  ADMIN_OPERATIONS: { limit: 20, windowMs: 3600000, keyPrefix: "admin-ops" },
  
  // New configurations
  DOWNLOAD_API: { limit: 30, windowMs: 600000, keyPrefix: "download" },
  ASSET_API: { limit: 50, windowMs: 300000, keyPrefix: "asset" },
  AUTH_API: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
  SEARCH_API: { limit: 60, windowMs: 60000, keyPrefix: "search" },
  WEBHOOK_API: { limit: 5, windowMs: 30000, keyPrefix: "webhook" },
  API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
  
  // Token bucket configurations
  SMOOTH_API: { capacity: 100, tokensPerSecond: 10, keyPrefix: "smooth-api" },
  REAL_TIME_API: { capacity: 50, tokensPerSecond: 20, keyPrefix: "realtime-api" }
} as const;

// ============================================================================
// Export everything
// ============================================================================

export default { 
  rateLimit, 
  tokenBucketRateLimit, 
  rateLimitWithBackoff, 
  isRateLimited, 
  isRateLimitedWithWindow, 
  rateLimitForRequestIp, 
  createRateLimitHeaders, 
  getClientIp, 
  getRateLimitKeys, 
  checkMultipleRateLimits, 
  withApiRateLimit, 
  combinedRateLimit, 
  checkRateLimit, 
  clearRateLimitData, 
  getRateLimitStats, 
  RATE_LIMIT_CONFIGS 
};
