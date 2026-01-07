// lib/server/rate-limit-unified.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// Unified rate limiting with Redis integration

import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";
import { rateLimitRedis } from '@/lib/rate-limit-redis';

// Runtime detection - more reliable method
export const isEdgeRuntime = 
  typeof process !== 'undefined' ? 
    process.env.NEXT_RUNTIME === 'edge' || 
    process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'development' :
  false;

// Type definitions
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
  blockDuration?: number;
  useRedis?: boolean;
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

export interface LegacyIsRateLimitedResult {
  limited: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
}

// Default configurations
export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { 
    limit: 100, 
    windowMs: 3600000, 
    keyPrefix: "api",
    blockDuration: 300000,
    useRedis: !!process.env.REDIS_URL
  },
  API_STRICT: { 
    limit: 30, 
    windowMs: 60000, 
    keyPrefix: "api-strict",
    blockDuration: 600000,
    useRedis: !!process.env.REDIS_URL
  },
  AUTH: {
    limit: 10,
    windowMs: 300000,
    keyPrefix: "auth",
    blockDuration: 1800000,
    useRedis: true // Always use Redis for auth
  },
  CONTENT: {
    limit: 60,
    windowMs: 60000,
    keyPrefix: "content",
    blockDuration: 300000,
    useRedis: !!process.env.REDIS_URL
  },
  DOWNLOADS: {
    limit: 5,
    windowMs: 60000,
    keyPrefix: "downloads",
    blockDuration: 600000,
    useRedis: !!process.env.REDIS_URL
  },
  WEBHOOKS: {
    limit: 100,
    windowMs: 60000,
    keyPrefix: "webhooks",
    blockDuration: 300000,
    useRedis: !!process.env.REDIS_URL
  }
} as const;

// Interface for storage providers
interface RateLimitStorage {
  check(key: string, options: RateLimitOptions): RateLimitResult;
  createRateLimitHeaders(result: RateLimitResult): Record<string, string>;
  getStats?(): Promise<any>;
}

// Memory storage implementation
class MemoryStorage implements RateLimitStorage {
  private store = new Map<string, {
    count: number;
    resetTime: number;
    blockUntil?: number;
    firstRequestTime: number;
  }>();
  private permanentBlocks = new Set<string>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 30000;

  private performCleanup(): void {
    const now = Date.now();
    
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      for (const [key, entry] of this.store.entries()) {
        const isExpired = now > entry.resetTime;
        const blockExpired = entry.blockUntil && entry.blockUntil <= now;
        const notPermanentlyBlocked = !this.permanentBlocks.has(key);
        
        if ((isExpired && (blockExpired || !entry.blockUntil)) && notPermanentlyBlocked) {
          this.store.delete(key);
        }
      }
      this.lastCleanup = now;
    }
  }

  check(key: string, options: RateLimitOptions): RateLimitResult {
    this.performCleanup();
    
    const { limit, windowMs, keyPrefix = "rl", blockDuration } = options;
    const now = Date.now();
    const storeKey = `${keyPrefix}:${key}`;
    
    // Check permanent blocks
    if (this.permanentBlocks.has(storeKey)) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: 365 * 24 * 60 * 60 * 1000,
        resetTime: now + windowMs,
        limit,
        windowMs,
        blocked: true,
        blockUntil: now + 365 * 24 * 60 * 60 * 1000,
      };
    }

    let entry = this.store.get(storeKey);

    // Check if blocked temporarily
    if (entry?.blockUntil && entry.blockUntil > now) {
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

    // Create new entry if expired or doesn't exist
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        firstRequestTime: now,
      };
    }

    // Increment count
    entry.count += 1;
    
    // Check if limit exceeded
    const exceeded = entry.count > limit;
    
    // Apply temporary block if configured
    if (exceeded && blockDuration && !entry.blockUntil) {
      entry.blockUntil = now + blockDuration;
    }

    this.store.set(storeKey, entry);

    return {
      allowed: !exceeded,
      remaining: Math.max(0, limit - entry.count),
      retryAfterMs: exceeded && entry.blockUntil ? Math.max(0, entry.blockUntil - now) : 0,
      resetTime: entry.resetTime,
      limit,
      windowMs,
      blocked: exceeded && !!entry.blockUntil && entry.blockUntil > now,
      blockUntil: entry.blockUntil,
    };
  }

  createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
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

  async getStats() {
    const now = Date.now();
    const activeBuckets = Array.from(this.store.values()).filter(b => b.resetTime > now).length;
    const blockedKeys = Array.from(this.store.values()).filter(b => b.blockUntil && b.blockUntil > now).length;
    
    return {
      totalBuckets: this.store.size,
      activeBuckets,
      blockedKeys,
      permanentBlocks: this.permanentBlocks.size,
      storage: 'memory',
    };
  }
}

// Redis storage implementation
class RedisStorage implements RateLimitStorage {
  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    // Convert our options to Redis rate limiter config
    const redisResult = await rateLimitRedis.check(key, {
      windowMs: options.windowMs,
      max: options.limit,
      keyPrefix: options.keyPrefix || 'rl',
      blockDuration: options.blockDuration,
    });

    // Convert Redis result to our unified format
    return {
      allowed: redisResult.allowed,
      remaining: redisResult.remaining,
      retryAfterMs: redisResult.blocked && redisResult.blockUntil 
        ? Math.max(0, redisResult.blockUntil - Date.now())
        : 0,
      resetTime: redisResult.resetAt,
      limit: redisResult.limit,
      windowMs: options.windowMs,
      blocked: redisResult.blocked,
      blockUntil: redisResult.blockUntil,
    };
  }

  createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
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

  async getStats() {
    const stats = await rateLimitRedis.getStats();
    return {
      ...stats,
      storage: 'redis',
    };
  }
}

// Factory to create appropriate storage
function createStorage(options: RateLimitOptions): RateLimitStorage {
  const useRedis = options.useRedis ?? !!process.env.REDIS_URL;
  
  if (useRedis && process.env.REDIS_URL) {
    try {
      return new RedisStorage();
    } catch (error) {
      console.warn('[RateLimit] Failed to initialize Redis storage, falling back to memory:', error);
      return new MemoryStorage();
    }
  }
  
  return new MemoryStorage();
}

// Main unified rate limiter
class UnifiedRateLimiter {
  private getStorage(options: RateLimitOptions): RateLimitStorage {
    return createStorage(options);
  }

  check(key: string, options: RateLimitOptions): RateLimitResult {
    const storage = this.getStorage(options);
    return storage.check(key, options);
  }

  createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const storage = new MemoryStorage(); // Headers are the same for both
    return storage.createRateLimitHeaders(result);
  }

  getClientIp(req: NextApiRequest | NextRequest): string {
    // Handle Edge/NextRequest
    if ('headers' in req && req.headers && typeof (req.headers as any).get === 'function') {
      const edgeHeaders = req.headers as any;
      const ip = 
        edgeHeaders.get('cf-connecting-ip') ||
        edgeHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        edgeHeaders.get('x-real-ip') ||
        'unknown';
      return ip;
    }
    
    // Handle NextApiRequest
    const apiReq = req as NextApiRequest;
    const forwarded = apiReq.headers['x-forwarded-for'];
    const cfIp = apiReq.headers['cf-connecting-ip'];
    
    if (cfIp) {
      return Array.isArray(cfIp) ? cfIp[0] : cfIp;
    }
    
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
      return ips[0]?.trim() || 'unknown';
    }
    
    return apiReq.socket?.remoteAddress || 'unknown';
  }

  getRateLimitKeys(req: NextApiRequest | NextRequest, keyPrefix: string): string[] {
    const ip = this.getClientIp(req);
    const cleanIp = ip.replace(/[^a-fA-F0-9.:]/g, '');
    
    // For Edge requests, also consider the pathname
    if ('nextUrl' in req && req.nextUrl) {
      const pathname = (req as NextRequest).nextUrl.pathname;
      return [
        `${keyPrefix}:${cleanIp}`,
        `${keyPrefix}:${cleanIp}:${pathname}`,
        `${keyPrefix}:${pathname}`
      ];
    }
    
    // For API requests
    return [`${keyPrefix}:${cleanIp}`];
  }

  checkMultipleRateLimits(
    keys: string[], 
    options: RateLimitOptions
  ): { worstResult: RateLimitResult } {
    const results = keys.map(k => this.check(k, options));
    const worstResult = results.reduce((prev, curr) => {
      if (!curr.allowed && !prev.allowed) {
        return curr.retryAfterMs > prev.retryAfterMs ? curr : prev;
      }
      if (!curr.allowed) return curr;
      if (!prev.allowed) return prev;
      return curr.remaining < prev.remaining ? curr : prev;
    }, results[0]);

    return { worstResult };
  }

  async getStorageStats(options: RateLimitOptions) {
    const storage = this.getStorage(options);
    if (storage.getStats) {
      return storage.getStats();
    }
    return { storage: 'unknown' };
  }
}

// Singleton instance
let unifiedLimiter: UnifiedRateLimiter | null = null;

function getUnifiedLimiter(): UnifiedRateLimiter {
  if (!unifiedLimiter) {
    unifiedLimiter = new UnifiedRateLimiter();
  }
  return unifiedLimiter;
}

// Async wrapper for Redis calls
async function rateLimitAsync(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const limiter = getUnifiedLimiter();
  const result = limiter.check(key, options);
  
  // If result comes from Redis (Promise), await it
  if (result instanceof Promise) {
    return await result;
  }
  
  return result;
}

// Public API functions
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  return getUnifiedLimiter().check(key, options);
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return getUnifiedLimiter().createRateLimitHeaders(result);
}

export function getClientIp(req: NextApiRequest | NextRequest): string {
  return getUnifiedLimiter().getClientIp(req);
}

export function getRateLimitKeys(req: NextApiRequest | NextRequest, keyPrefix: string): string[] {
  return getUnifiedLimiter().getRateLimitKeys(req, keyPrefix);
}

export function checkMultipleRateLimits(
  keys: string[], 
  options: RateLimitOptions
): { worstResult: RateLimitResult } {
  return getUnifiedLimiter().checkMultipleRateLimits(keys, options);
}

// Async version for use with Redis
export async function checkRateLimitAsync(
  keys: string[], 
  options: RateLimitOptions
): Promise<{ worstResult: RateLimitResult }> {
  const limiter = getUnifiedLimiter();
  const promises = keys.map(k => {
    const result = limiter.check(k, options);
    return result instanceof Promise ? result : Promise.resolve(result);
  });
  
  const results = await Promise.all(promises);
  const worstResult = results.reduce((prev, curr) => {
    if (!curr.allowed && !prev.allowed) {
      return curr.retryAfterMs > prev.retryAfterMs ? curr : prev;
    }
    if (!curr.allowed) return curr;
    if (!prev.allowed) return prev;
    return curr.remaining < prev.remaining ? curr : prev;
  }, results[0]);

  return { worstResult };
}

// Backoff wrapper
export function rateLimitWithBackoff(key: string, options: RateLimitOptions): RateLimitResult {
  const result = rateLimit(key, options);
  if (!result.allowed && result.blockUntil) {
    // Apply exponential backoff: double the block duration
    const backoffResult = { ...result };
    if (backoffResult.blockUntil) {
      const originalBlockDuration = backoffResult.blockUntil - Date.now();
      const newBlockDuration = Math.min(originalBlockDuration * 2, 3600000); // Max 1 hour
      backoffResult.blockUntil = Date.now() + newBlockDuration;
      backoffResult.retryAfterMs = newBlockDuration;
    }
    return backoffResult;
  }
  return result;
}

// Legacy compatibility
export async function isRateLimited(
  key: string, 
  bucket: string, 
  limit: number, 
  windowMs = 300000
): Promise<LegacyIsRateLimitedResult> {
  const res = await rateLimitAsync(`${bucket}:${key}`, { 
    limit, 
    windowMs, 
    keyPrefix: bucket,
    useRedis: !!process.env.REDIS_URL
  });
  return {
    limited: !res.allowed,
    retryAfter: Math.ceil(res.retryAfterMs / 1000),
    limit: res.limit,
    remaining: res.remaining
  };
}

// Middleware for Next.js API routes (Pages Router)
export function withApiRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL,
  useBackoff = false
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const keys = getRateLimitKeys(req, options.keyPrefix || 'rl');
      
      // Use async version for Redis compatibility
      const { worstResult } = await checkRateLimitAsync(keys, options);
      
      // Add headers to response
      const headers = createRateLimitHeaders(worstResult);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      if (!worstResult.allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: worstResult.retryAfterMs > 0 ? Math.ceil(worstResult.retryAfterMs / 1000) : undefined,
          resetAt: new Date(worstResult.resetTime).toISOString()
        });
        return;
      }
      
      // All rate limits passed, call handler
      await handler(req, res);
      
    } catch (error) {
      console.error('[RateLimit] Error:', error);
      // Fail open - don't block on rate limit errors
      await handler(req, res);
    }
  };
}

// Middleware for Next.js Edge/App Router
export async function withEdgeRateLimit(
  req: NextRequest,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL,
  useBackoff = false
): Promise<{ allowed: boolean; headers: Record<string, string>; result?: RateLimitResult }> {
  try {
    const keys = getRateLimitKeys(req, options.keyPrefix || 'rl');
    
    // Use async version for Redis compatibility
    const { worstResult } = await checkRateLimitAsync(keys, options);
    
    if (!worstResult.allowed) {
      return {
        allowed: false,
        headers: createRateLimitHeaders(worstResult),
        result: worstResult
      };
    }
    
    return {
      allowed: true,
      headers: createRateLimitHeaders(worstResult),
      result: worstResult
    };
    
  } catch (error) {
    console.error('[EdgeRateLimit] Error:', error);
    // Fail open
    return {
      allowed: true,
      headers: {}
    };
  }
}

// Helper function to create a rate-limited response
export function createRateLimitedResponse(result: RateLimitResult): Response {
  const headers = createRateLimitHeaders(result);
  
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: result.retryAfterMs > 0 ? Math.ceil(result.retryAfterMs / 1000) : undefined,
      resetAt: new Date(result.resetTime).toISOString()
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
}

// Utility to check which storage is being used
export async function getRateLimitStorageInfo(options: RateLimitOptions): Promise<{
  storage: 'memory' | 'redis' | 'unknown';
  redisAvailable: boolean;
  config: RateLimitOptions;
}> {
  const useRedis = options.useRedis ?? !!process.env.REDIS_URL;
  const redisAvailable = !!process.env.REDIS_URL;
  
  return {
    storage: useRedis && redisAvailable ? 'redis' : 'memory',
    redisAvailable,
    config: options,
  };
}

// Unified export for convenience
export default {
  // Core functions
  rateLimit,
  rateLimitAsync,
  rateLimitWithBackoff,
  createRateLimitHeaders,
  getClientIp,
  getRateLimitKeys,
  checkMultipleRateLimits,
  checkRateLimitAsync,
  
  // Middleware
  withApiRateLimit,
  withEdgeRateLimit,
  createRateLimitedResponse,
  
  // Legacy compatibility
  isRateLimited,
  
  // Utilities
  getRateLimitStorageInfo,
  
  // Configurations
  RATE_LIMIT_CONFIGS,
  isEdgeRuntime
};