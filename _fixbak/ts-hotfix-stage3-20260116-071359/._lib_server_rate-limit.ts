// lib/server/rate-limit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextRequest } from 'next/server';
import LRU from 'lru-cache';

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
  keyGenerator?: (req: NextApiRequest | NextRequest) => string;
}

/* -------------------------------------------------------------------------- */
/* LRU CACHE SETUP                                                            */
/* -------------------------------------------------------------------------- */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Create LRU cache with reasonable defaults
const rateLimitCache = new LRU<string, RateLimitRecord>({
  max: 10000, // Maximum number of items in cache
  ttl: 60 * 60 * 1000, // 1 hour TTL
});

/* -------------------------------------------------------------------------- */
/* KEY GENERATORS                                                             */
/* -------------------------------------------------------------------------- */

function defaultKeyGenerator(req: NextApiRequest | NextRequest): string {
  // For Pages Router
  if ('socket' in req) {
    const pagesReq = req as NextApiRequest;
    return `rl:${pagesReq.socket.remoteAddress || 'unknown'}:${pagesReq.url}`;
  }
  
  // For App Router
  const appReq = req as NextRequest;
  const ip = appReq.ip || appReq.headers.get('x-forwarded-for') || 'unknown';
  const path = new URL(appReq.url).pathname;
  return `rl:${ip}:${path}`;
}

function userKeyGenerator(req: NextApiRequest | NextRequest): string {
  // For Pages Router
  if ('socket' in req) {
    const pagesReq = req as NextApiRequest;
    const userId = pagesReq.headers['x-user-id'] || pagesReq.cookies?.userId || 'anonymous';
    return `rl:user:${userId}:${pagesReq.url}`;
  }
  
  // For App Router
  const appReq = req as NextRequest;
  const userId = appReq.headers.get('x-user-id') || 
                 appReq.cookies.get('userId')?.value || 
                 'anonymous';
  const path = new URL(appReq.url).pathname;
  return `rl:user:${userId}:${path}`;
}

/* -------------------------------------------------------------------------- */
/* RATE LIMIT FUNCTION                                                        */
/* -------------------------------------------------------------------------- */

export function rateLimit<T = any>(
  handler: (req: NextApiRequest | NextRequest, res?: NextApiResponse) => Promise<T> | T,
  config: RateLimitConfig
): (req: NextApiRequest | NextRequest, res?: NextApiResponse) => Promise<T> {
  const {
    maxRequests,
    windowMs,
    keyGenerator = defaultKeyGenerator,
  } = config;
  
  return async function rateLimitedHandler(
    req: NextApiRequest | NextRequest,
    res?: NextApiResponse
  ): Promise<T> {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create rate limit record
    let record = rateLimitCache.get(key);
    
    if (!record || now > record.resetTime) {
      // Create new record
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    // Increment count
    record.count += 1;
    rateLimitCache.set(key, record);
    
    // Check if rate limit exceeded
    if (record.count > maxRequests) {
      const error: any = new Error(config.message || 'Too many requests');
      error.statusCode = 429;
      error.retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw error;
    }
    
    // Set rate limit headers
    if (res && 'setHeader' in res) {
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
    }
    
    // Execute the handler
    return handler(req, res);
  };
}

/* -------------------------------------------------------------------------- */
/* PRE-CONFIGURED RATE LIMITERS                                               */
/* -------------------------------------------------------------------------- */

export const rateLimitPublic = (handler: any) => 
  rateLimit(handler, { maxRequests: 10, windowMs: 60000 });

export const rateLimitAuthenticated = (handler: any) => 
  rateLimit(handler, { 
    maxRequests: 30, 
    windowMs: 60000,
    keyGenerator: userKeyGenerator,
  });

export const rateLimitCritical = (handler: any) => 
  rateLimit(handler, { maxRequests: 5, windowMs: 60000 });

/* -------------------------------------------------------------------------- */
/* CACHE MANAGEMENT                                                           */
/* -------------------------------------------------------------------------- */

export function clearRateLimitCache(): void {
  rateLimitCache.clear();
  console.log('Rate limit cache cleared');
}

export function getRateLimitCacheStats(): {
  size: number;
  itemCount: number;
} {
  return {
    size: rateLimitCache.size,
    itemCount: rateLimitCache.size,
  };
}

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT                                                             */
/* -------------------------------------------------------------------------- */

export default rateLimit;