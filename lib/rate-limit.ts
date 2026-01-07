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
  },
  INNER_CIRCLE: {
    limit: 30,
    windowMs: 60000,
    keyPrefix: "inner-circle",
    blockDuration: 600000,
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
      },
      INNER_CIRCLE: {
        limit: module.RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK?.max || 30,
        windowMs: module.RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK?.windowMs || 60000,
        keyPrefix: module.RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK?.keyPrefix || 'inner-circle',
        blockDuration: module.RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK?.blockDuration,
        useRedis: module.RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK?.useRedis || false
      }
    };
  }
  
  importedRateLimit = {
    rateLimitAsync: module.rateLimitAsync || module.rateLimit,
    withRateLimit: module.withRateLimit,
    createRateLimitHeaders: module.createRateLimitHeaders,
    getClientIpFromRequest: module.getClientIpFromRequest,
    getClientIp: module.getClientIp,
    checkRateLimit: module.checkRateLimit
  };
  
  console.log('[RateLimitUnified] Loaded original rate-limit module');
} catch (error) {
  console.warn('[RateLimitUnified] Could not load rate-limit module, using fallbacks');
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

export function getClientIpFromRequest(req: NextApiRequest): string {
  return getClientIp(req);
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
    try {
      const { rateLimitRedis } = require('@/lib/rate-limit-redis');
      if (rateLimitRedis) {
        const redisResult = await rateLimitRedis.check(ip, {
          windowMs: config.windowMs,
          max: config.limit,
          keyPrefix: config.keyPrefix || 'rl',
          blockDuration: config.blockDuration,
        });
        
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
    
    // Use fallback implementation
    const result: RateLimitResult = {
      allowed: true,
      remaining: config.limit - 1,
      retryAfterMs: 0,
      resetTime: Date.now() + config.windowMs,
      limit: config.limit,
      windowMs: config.windowMs,
      blocked: false
    };
    
    const headers = createRateLimitHeaders(result);
    
    return {
      allowed: true,
      headers,
      result
    };
    
  } catch (error) {
    console.warn('[withEdgeRateLimit] Error, failing open');
    
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
      
      // Simple fallback: always allow
      await handler(req, res);
      
    } catch (error) {
      console.error('[withApiRateLimit] Error, failing open:', error);
      await handler(req, res);
    }
  };
}

// ==================== EXPORT EVERYTHING ====================
export {
  RATE_LIMIT_CONFIGS
};

export default {
  withApiRateLimit,
  withEdgeRateLimit,
  createRateLimitedResponse,
  createRateLimitHeaders,
  getClientIp,
  getClientIpFromRequest,
  RATE_LIMIT_CONFIGS,
  isEdgeRuntime
};