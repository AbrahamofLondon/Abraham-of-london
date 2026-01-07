// lib/server/rate-limit-edge.ts
// Edge-optimized rate limiting for Next.js Edge Runtime and serverless functions
import type { NextRequest } from "next/server";
import { rateLimitRedis } from '@/lib/rate-limit-redis';

// Standard interfaces maintained for compatibility
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
  blockDuration?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetTime: number;
  limit: number;
  windowMs: number;
  blocked?: boolean;
  blockUntil?: number;
}

// Memory-efficient stores for ephemeral Edge execution with multiple strategies
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockUntil?: number;
  firstRequestTime: number;
}

class EdgeRateLimiter {
  private memoryStore = new Map<string, RateLimitEntry>();
  private permanentBlocks = new Set<string>();
  private MAX_STORE_SIZE = 5000; // Conservative limit for edge runtime
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  constructor() {
    // Initialize with immediate cleanup
    this.performCleanup();
  }

  private performCleanup(): void {
    const now = Date.now();
    
    // Only cleanup if interval has passed and store is getting large
    if (this.memoryStore.size > this.MAX_STORE_SIZE * 0.8 || 
        now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      
      let deleted = 0;
      for (const [key, entry] of this.memoryStore.entries()) {
        // Delete if: expired AND not blocked, or blocked but block expired
        if ((now > entry.resetTime && (!entry.blockUntil || entry.blockUntil <= now)) ||
            (entry.blockUntil && entry.blockUntil <= now && !this.permanentBlocks.has(key))) {
          this.memoryStore.delete(key);
          deleted++;
          
          // Stop cleanup if we've removed enough
          if (deleted > 1000) break;
        }
      }
      
      this.lastCleanup = now;
    }
  }

  isBlocked(key: string): { blocked: boolean; blockUntil?: number } {
    if (this.permanentBlocks.has(key)) {
      return { blocked: true, blockUntil: Date.now() + 365 * 24 * 60 * 60 * 1000 }; // 1 year
    }
    
    const entry = this.memoryStore.get(key);
    if (entry?.blockUntil && entry.blockUntil > Date.now()) {
      return { blocked: true, blockUntil: entry.blockUntil };
    }
    
    return { blocked: false };
  }

  blockPermanently(key: string): void {
    this.permanentBlocks.add(key);
    console.warn(`[EdgeRateLimiter] PERMANENT BLOCK: ${key}`);
  }

  unblock(key: string): void {
    this.permanentBlocks.delete(key);
    const entry = this.memoryStore.get(key);
    if (entry) {
      entry.blockUntil = undefined;
    }
  }

  check(key: string, options: RateLimitOptions): RateLimitResult {
    this.performCleanup();
    
    const { limit, windowMs, keyPrefix = "rl", blockDuration } = options;
    const now = Date.now();
    const storeKey = `${keyPrefix}:${key}`;
    
    // Check if blocked
    const blockStatus = this.isBlocked(storeKey);
    if (blockStatus.blocked) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, (blockStatus.blockUntil || now) - now),
        resetTime: now + windowMs,
        limit,
        windowMs,
        blocked: true,
        blockUntil: blockStatus.blockUntil,
      };
    }

    let entry = this.memoryStore.get(storeKey);

    // Create new entry if expired or doesn't exist
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        firstRequestTime: now,
      };
    }

    // Apply temporary block if configured and limit exceeded
    if (entry.count >= limit && blockDuration && !entry.blockUntil) {
      entry.blockUntil = now + blockDuration;
    }

    // Check temporary block
    if (entry.blockUntil && entry.blockUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, entry.blockUntil - now),
        resetTime: entry.resetTime,
        limit,
        windowMs,
        blocked: true,
        blockUntil: entry.blockUntil,
      };
    }

    // Increment count
    entry.count += 1;
    this.memoryStore.set(storeKey, entry);

    const allowed = entry.count <= limit;
    
    // Apply block if we just exceeded the limit
    if (!allowed && blockDuration && !entry.blockUntil) {
      entry.blockUntil = now + blockDuration;
    }

    return {
      allowed,
      remaining: Math.max(0, limit - entry.count),
      retryAfterMs: 0,
      resetTime: entry.resetTime,
      limit,
      windowMs,
      blocked: !!entry.blockUntil && entry.blockUntil > now,
      blockUntil: entry.blockUntil,
    };
  }

  getStatus(key: string, options: RateLimitOptions): RateLimitResult | null {
    const { limit, windowMs, keyPrefix = "rl" } = options;
    const storeKey = `${keyPrefix}:${key}`;
    
    const entry = this.memoryStore.get(storeKey);
    if (!entry) return null;
    
    const now = Date.now();
    const blockStatus = this.isBlocked(storeKey);
    const blocked = blockStatus.blocked;
    
    return {
      allowed: entry.count <= limit && !blocked,
      remaining: Math.max(0, limit - entry.count),
      retryAfterMs: blocked ? Math.max(0, (blockStatus.blockUntil || now) - now) : 0,
      resetTime: entry.resetTime,
      limit,
      windowMs,
      blocked,
      blockUntil: blockStatus.blockUntil,
    };
  }

  resetKey(key: string, keyPrefix = "rl"): boolean {
    const storeKey = `${keyPrefix}:${key}`;
    this.permanentBlocks.delete(storeKey);
    return this.memoryStore.delete(storeKey);
  }

  getStats() {
    const now = Date.now();
    let activeBuckets = 0;
    let blockedKeys = 0;
    
    for (const entry of this.memoryStore.values()) {
      if (entry.resetTime > now) activeBuckets++;
      if (entry.blockUntil && entry.blockUntil > now) blockedKeys++;
    }
    
    return {
      totalBuckets: this.memoryStore.size,
      activeBuckets,
      blockedKeys,
      permanentBlocks: this.permanentBlocks.size,
    };
  }
}

// Singleton instance for Edge Runtime
let edgeLimiter: EdgeRateLimiter | null = null;

function getEdgeLimiter(): EdgeRateLimiter {
  if (!edgeLimiter) {
    edgeLimiter = new EdgeRateLimiter();
  }
  return edgeLimiter;
}

/**
 * MAIN RATE LIMIT FUNCTION (Edge Optimized)
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const limiter = getEdgeLimiter();
  return limiter.check(key, options);
}

/**
 * CLIENT IP RESOLUTION (Edge Runtime Compatible)
 */
export function getClientIp(req: NextRequest): string {
  // Try common headers in order of reliability
  const headers = req.headers;
  
  // Cloudflare
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.split(",")[0].trim();
  
  // Standard proxy headers
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  
  // Vercel
  const vercelIp = headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();
  
  // AWS Lambda
  const lambdaIp = headers.get("x-lambda-forwarded-for");
  if (lambdaIp) return lambdaIp.split(",")[0].trim();
  
  // Fallback to remote address if available (unlikely in Edge)
  const remoteAddress = headers.get("x-remote-address");
  if (remoteAddress) return remoteAddress;
  
  return "127.0.0.1"; // Default fallback
}

/**
 * IP VALIDATION UTILITIES
 */
export function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1') return false;
  
  const cleanIp = (ip.split(':')[0] || '').trim();
  if (!cleanIp) return false;
  
  // IPv4
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Regex.test(cleanIp)) return true;
  
  // IPv6 (simplified check for Edge)
  if (cleanIp.includes(':')) {
    const ipWithoutScope = (cleanIp.split('%')[0] || ''); 
    const parts = ipWithoutScope.split(':');
    
    if (parts.length > 8) return false;
    
    // Check if it's IPv4-mapped IPv6
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      return ipv4Regex.test(lastPart);
    }
    
    return parts.every(part => part === '' || /^[0-9a-fA-F]{1,4}$/.test(part));
  }
  
  return false;
}

export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip) || ip === 'unknown') return 'unknown';
  
  const cleanIp = (ip.split(':')[0] || '').trim();
  
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    if (parts.length <= 3) return cleanIp;
    return `${parts.slice(0, 2).join(':')}::`; // Keep only first 2 segments
  }
  
  const parts = cleanIp.split('.');
  if (parts.length !== 4) return cleanIp;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`; // Zero out last octet
}

/**
 * KEY GENERATION
 */
export function getRateLimitKeys(req: NextRequest, keyPrefix: string): string[] {
  const ip = getClientIp(req);
  const url = new URL(req.url);
  const anonymizedIp = anonymizeIp(ip);
  
  return [
    `${keyPrefix}:${anonymizedIp}`, // By IP
    `${keyPrefix}:${anonymizedIp}:${url.pathname}`, // By IP + endpoint
    `${keyPrefix}:${url.pathname}`, // By endpoint only
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
    if (!curr.allowed && !prev.allowed) {
      // Both blocked, pick the one with longer retry time
      return curr.retryAfterMs > prev.retryAfterMs ? curr : prev;
    }
    if (!curr.allowed) return curr;
    if (!prev.allowed) return prev;
    // Both allowed, pick the one with fewer remaining
    return curr.remaining < prev.remaining ? curr : prev;
  }, results[0]);

  return { worstResult };
}

/**
 * CONFIGURATION PRESETS
 */
export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { 
    limit: 100, 
    windowMs: 3600000, // 1 hour
    keyPrefix: "api",
    blockDuration: 300000 // 5 minute block if limit exceeded
  },
  API_STRICT: { 
    limit: 30, 
    windowMs: 60000, // 1 minute
    keyPrefix: "api-strict",
    blockDuration: 600000 // 10 minute block
  },
  AUTH: {
    limit: 10,
    windowMs: 300000, // 5 minutes
    keyPrefix: "auth",
    blockDuration: 1800000 // 30 minute block
  },
  CONTENT: {
    limit: 60,
    windowMs: 60000, // 1 minute
    keyPrefix: "content",
    blockDuration: 300000 // 5 minute block
  },
  DOWNLOADS: {
    limit: 5,
    windowMs: 60000, // 1 minute
    keyPrefix: "downloads",
    blockDuration: 600000 // 10 minute block
  },
  WEBHOOKS: {
    limit: 100,
    windowMs: 60000, // 1 minute
    keyPrefix: "webhooks",
    blockDuration: 300000 // 5 minute block
  },
  SUSPICIOUS: {
    limit: 2,
    windowMs: 60000, // 1 minute
    keyPrefix: "suspicious",
    blockDuration: 3600000 // 1 hour block
  }
} as const;

/**
 * HTTP HEADER UTILITIES
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
  
  if (result.retryAfterMs > 0) {
    headers["Retry-After"] = Math.ceil(result.retryAfterMs / 1000).toString();
  }
  
  if (result.blocked && result.blockUntil) {
    headers["X-RateLimit-Blocked-Until"] = new Date(result.blockUntil).toISOString();
  }
  
  return headers;
}

/**
 * MIDDLEWARE FOR EDGE FUNCTIONS
 */
export async function withEdgeRateLimit(
  req: NextRequest,
  config: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<{ allowed: boolean; headers?: Record<string, string>; result?: RateLimitResult }> {
  try {
    const keys = getRateLimitKeys(req, config.keyPrefix || "rl");
    const { worstResult } = checkMultipleRateLimits(keys, config);
    const headers = createRateLimitHeaders(worstResult);
    
    return {
      allowed: worstResult.allowed,
      headers,
      result: worstResult,
    };
  } catch (error) {
    // Fail open on error - don't block legitimate traffic
    console.error("[EdgeRateLimit] Error:", error);
    return { allowed: true };
  }
}

/**
 * API RESPONSE HELPER
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
  const headers = createRateLimitHeaders(result);
  
  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: "Rate limit exceeded",
      retryAfter: result.retryAfterMs > 0 ? Math.ceil(result.retryAfterMs / 1000) : undefined,
      resetAt: new Date(result.resetTime).toISOString(),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );
}

/**
 * COMPATIBILITY WRAPPERS FOR UNIFIED API
 */
export async function rateLimitAsync(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  return Promise.resolve(rateLimit(key, options));
}

export async function markRequestSuccess(key: string, keyPrefix = "rl"): Promise<void> {
  const limiter = getEdgeLimiter();
  const storeKey = `${keyPrefix}:${key}`;
  const entry = limiter.getStatus(key, { limit: 1, windowMs: 1000, keyPrefix }); // Dummy options
  if (entry && entry.remaining < entry.limit) {
    // Decrement count by 1 if possible
    const newEntry = {
      count: Math.max(0, entry.remaining),
      resetTime: entry.resetTime,
      firstRequestTime: Date.now(),
    };
    // Note: This would require exposing internal store methods
  }
}

async function checkEdgeRateLimit() {
  if (process.env.REDIS_URL) {
    // Use Redis-based rate limiting
    return rateLimitRedis.check(key, config);
  } else {

export async function getRateLimitStatus(
  key: string, 
  options: RateLimitOptions
): Promise<RateLimitResult | null> {
  const limiter = getEdgeLimiter();
  return limiter.getStatus(key, options);
}

export async function resetRateLimit(key: string, keyPrefix = "rl"): Promise<boolean> {
  const limiter = getEdgeLimiter();
  return limiter.resetKey(key, keyPrefix);
}

export async function blockPermanently(key: string, keyPrefix = "rl"): Promise<void> {
  const limiter = getEdgeLimiter();
  const storeKey = `${keyPrefix}:${key}`;
  limiter.blockPermanently(storeKey);
}

export async function unblock(key: string, keyPrefix = "rl"): Promise<void> {
  const limiter = getEdgeLimiter();
  const storeKey = `${keyPrefix}:${key}`;
  limiter.unblock(storeKey);
}

export async function getRateLimiterStats() {
  const limiter = getEdgeLimiter();
  return limiter.getStats();
}

// Default export with unified API
export default {
  rateLimit,
  rateLimitAsync,
  withEdgeRateLimit,
  rateLimitedResponse,
  getClientIp,
  getRateLimitKeys,
  checkMultipleRateLimits,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  // Compatibility exports
  markRequestSuccess,
  getRateLimitStatus,
  resetRateLimit,
  blockPermanently,
  unblock,
  getRateLimiterStats,
};