// lib/server/rate-limit-unified.ts
/**
 * Unified rate limiting with comprehensive fallbacks
 * Safe for Edge Runtime and works with current setup
 */

import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

// ==================== FALLBACK CONFIGURATIONS ====================
const FALLBACK_CONFIGS = {
  API_GENERAL: { 
    limit: 100, 
    windowMs: 3600000, 
    keyPrefix: "api",
    blockDuration: 300000,
    useRedis: false
  },
  API_STRICT: { 
    limit: 30, 
    windowMs: 60000, 
    keyPrefix: "api-strict",
    blockDuration: 600000,
    useRedis: false
  },
  AUTH: {
    limit: 10,
    windowMs: 300000,
    keyPrefix: "auth",
    blockDuration: 1800000,
    useRedis: false
  },
  CONTENT: {
    limit: 60,
    windowMs: 60000,
    keyPrefix: "content",
    blockDuration: 300000,
    useRedis: false
  }
};

// ==================== TRY TO IMPORT ORIGINAL MODULE ====================
let originalRateLimitModule: any = null;
let RATE_LIMIT_CONFIGS = FALLBACK_CONFIGS;
let importedRateLimit: any = null;

try {
  // Try to import the working rate-limit module
  const module = require('@/lib/rate-limit');
  originalRateLimitModule = module;
  
  // Map original configs to our format
  if (module.RATE_LIMIT_CONFIGS) {
    RATE_LIMIT_CONFIGS = {
      API_GENERAL: {
        limit: module.RATE_LIMIT_CONFIGS.API_READ?.max || 100,
        windowMs: module.RATE_LIMIT_CONFIGS.API_READ?.windowMs || 60000,
        keyPrefix: module.RATE_LIMIT_CONFIGS.API_READ?.keyPrefix || 'api',
        blockDuration: module.RATE_LIMIT_CONFIGS.API_READ?.blockDuration,
        useRedis: module.RATE_LIMIT_CONFIGS.API_READ?.useRedis || false
      },
      API_STRICT: {
        limit: module.RATE_LIMIT_CONFIGS.API_WRITE?.max || 30,
        windowMs: module.RATE_LIMIT_CONFIGS.API_WRITE?.windowMs || 60000,
        keyPrefix: module.RATE_LIMIT_CONFIGS.API_WRITE?.keyPrefix || 'api-strict',
        blockDuration: module.RATE_LIMIT_CONFIGS.API_WRITE?.blockDuration,
        useRedis: module.RATE_LIMIT_CONFIGS.API_WRITE?.useRedis || false
      },
      AUTH: {
        limit: module.RATE_LIMIT_CONFIGS.AUTH_LOGIN?.max || 10,
        windowMs: module.RATE_LIMIT_CONFIGS.AUTH_LOGIN?.windowMs || 300000,
        keyPrefix: module.RATE_LIMIT_CONFIGS.AUTH_LOGIN?.keyPrefix || 'auth',
        blockDuration: module.RATE_LIMIT_CONFIGS.AUTH_LOGIN?.blockDuration,
        useRedis: module.RATE_LIMIT_CONFIGS.AUTH_LOGIN?.useRedis || true
      },
      CONTENT: {
        limit: module.RATE_LIMIT_CONFIGS.CONTENT_API?.max || 60,
        windowMs: module.RATE_LIMIT_CONFIGS.CONTENT_API?.windowMs || 60000,
        keyPrefix: module.RATE_LIMIT_CONFIGS.CONTENT_API?.keyPrefix || 'content',
        blockDuration: module.RATE_LIMIT_CONFIGS.CONTENT_API?.blockDuration,
        useRedis: module.RATE_LIMIT_CONFIGS.CONTENT_API?.useRedis || false
      }
    };
  }
  
  importedRateLimit = {
    rateLimitAsync: module.rateLimitAsync || module.rateLimit,
    withRateLimit: module.withRateLimit,
    createRateLimitHeaders: module.createRateLimitHeaders,
    getClientIpFromRequest: module.getClientIpFromRequest,
    checkRateLimit: module.checkRateLimit
  };
  
  console.log('[RateLimitUnified] Loaded original rate-limit module');
} catch (error) {
  console.warn('[RateLimitUnified] Could not load rate-limit module, using fallbacks:', error.message);
}

// ==================== TYPES ====================
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

export interface EdgeRateLimitResult {
  allowed: boolean;
  headers: Record<string, string>;
  result?: RateLimitResult;
}

// ==================== MEMORY STORAGE FALLBACK ====================
class MemoryRateLimiter {
  private store = new Map<string, {
    count: number;
    resetTime: number;
    blockUntil?: number;
    firstRequestTime: number;
  }>();

  check(key: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const { limit, windowMs, blockDuration } = options;
    
    let entry = this.store.get(key);
    
    // Check if blocked
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
    
    this.store.set(key, entry);
    
    // Cleanup old entries periodically
    this.cleanup();
    
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
  
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.firstRequestTime > maxAge) {
        this.store.delete(key);
      }
    }
  }
}

// ==================== UTILITY FUNCTIONS ====================
export const isEdgeRuntime = 
  typeof process !== 'undefined' ? 
    process.env.NEXT_RUNTIME === 'edge' || 
    process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'development' :
  false;

export function getClientIp(req: NextApiRequest | NextRequest): string {
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
  
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
    return ips[0]?.trim() || 'unknown';
  }
  
  return apiReq.socket?.remoteAddress || 'unknown';
}

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

// ==================== EDGE RATE LIMIT MIDDLEWARE ====================
export async function withEdgeRateLimit(
  req: NextRequest,
  config: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL,
  useBackoff = false
): Promise<EdgeRateLimitResult> {
  try {
    const ip = getClientIp(req);
    const key = `${config.keyPrefix || 'rl'}:${ip}`;
    
    // Try to use Redis if available
    let redisResult = null;
    try {
      const { rateLimitRedis } = await import('@/lib/rate-limit-redis');
      if (rateLimitRedis) {
        redisResult = await rateLimitRedis.check(ip, {
          windowMs: config.windowMs,
          max: config.limit,
          keyPrefix: config.keyPrefix || 'rl',
          blockDuration: config.blockDuration,
        });
        
        // Convert Redis result to our format
        if (redisResult) {
          const result: RateLimitResult = {
            allowed: redisResult.allowed,
            remaining: redisResult.remaining,
            retryAfterMs: redisResult.blocked && redisResult.blockUntil 
              ? Math.max(0, redisResult.blockUntil - Date.now())
              : 0,
            resetTime: redisResult.resetAt || (Date.now() + config.windowMs),
            limit: redisResult.limit || config.limit,
            windowMs: config.windowMs,
            blocked: redisResult.blocked,
            blockUntil: redisResult.blockUntil,
          };
          
          const headers = createRateLimitHeaders(result);
          
          return {
            allowed: result.allowed,
            headers,
            result
          };
        }
      }
    } catch (redisError) {
      // Redis not available, fall through
    }
    
    // Fallback to memory or original rate limit
    if (importedRateLimit?.checkRateLimit) {
      const mockReq = { headers: req.headers, socket: { remoteAddress: ip } };
      const mockRes = { setHeader: () => {} } as any;
      
      const originalResult = await importedRateLimit.checkRateLimit(
        mockReq, 
        mockRes, 
        {
          windowMs: config.windowMs,
          max: config.limit,
          keyPrefix: config.keyPrefix,
          blockDuration: config.blockDuration,
          useRedis: config.useRedis
        }
      );
      
      if (originalResult) {
        const result: RateLimitResult = {
          allowed: originalResult.allowed,
          remaining: originalResult.remaining,
          retryAfterMs: originalResult.blocked && originalResult.blockUntil 
            ? Math.max(0, originalResult.blockUntil - Date.now())
            : 0,
          resetTime: originalResult.resetAt || (Date.now() + config.windowMs),
          limit: originalResult.limit || config.limit,
          windowMs: config.windowMs,
          blocked: originalResult.blocked,
          blockUntil: originalResult.blockUntil,
        };
        
        const headers = createRateLimitHeaders(result);
        
        return {
          allowed: result.allowed,
          headers,
          result
        };
      }
    }
    
    // Last resort: memory storage
    const memoryLimiter = new MemoryRateLimiter();
    const result = memoryLimiter.check(key, config);
    const headers = createRateLimitHeaders(result);
    
    return {
      allowed: result.allowed,
      headers,
      result
    };
    
  } catch (error) {
    console.warn('[withEdgeRateLimit] Error, failing open:', error);
    
    // Fail open - don't block legitimate traffic
    return {
      allowed: true,
      headers: {},
      result: {
        allowed: true,
        remaining: config.limit,
        retryAfterMs: 0,
        resetTime: Date.now() + config.windowMs,
        limit: config.limit,
        windowMs: config.windowMs
      }
    };
  }
}

// ==================== API RATE LIMIT MIDDLEWARE ====================
export function withApiRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  config: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL,
  useBackoff = false
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Try to use original withRateLimit if available
      if (importedRateLimit?.withRateLimit) {
        const wrappedHandler = importedRateLimit.withRateLimit(config)(handler);
        return wrappedHandler(req, res);
      }
      
      // Fallback implementation
      const ip = getClientIp(req);
      const key = `${config.keyPrefix || 'rl'}:${ip}`;
      
      // Check rate limit
      const memoryLimiter = new MemoryRateLimiter();
      const result = memoryLimiter.check(key, config);
      
      // Add headers
      const headers = createRateLimitHeaders(result);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      if (!result.allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfterMs > 0 ? Math.ceil(result.retryAfterMs / 1000) : undefined,
          resetAt: new Date(result.resetTime).toISOString()
        });
        return;
      }
      
      // All rate limits passed, call handler
      await handler(req, res);
      
    } catch (error) {
      console.error('[withApiRateLimit] Error, failing open:', error);
      // Fail open - don't block on rate limit errors
      await handler(req, res);
    }
  };
}

// ==================== GET RATE LIMIT KEYS ====================
export function getRateLimitKeys(req: NextApiRequest | NextRequest, keyPrefix: string): string[] {
  const ip = getClientIp(req);
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

// ==================== CHECK MULTIPLE RATE LIMITS ====================
export async function checkMultipleRateLimits(
  keys: string[], 
  config: RateLimitOptions
): Promise<{ worstResult: RateLimitResult }> {
  const memoryLimiter = new MemoryRateLimiter();
  const results = keys.map(k => memoryLimiter.check(k, config));
  
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

// ==================== EXPORT EVERYTHING ====================
export {
  RATE_LIMIT_CONFIGS,
  // Re-export original functions if available, otherwise use fallbacks
  getClientIp as getClientIpFromRequest,
};

export default {
  withApiRateLimit,
  withEdgeRateLimit,
  createRateLimitedResponse,
  createRateLimitHeaders,
  getClientIp,
  getRateLimitKeys,
  checkMultipleRateLimits,
  RATE_LIMIT_CONFIGS,
  isEdgeRuntime
};