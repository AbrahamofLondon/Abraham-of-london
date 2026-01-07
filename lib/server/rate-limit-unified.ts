// lib/server/rate-limit-unified.ts
/**
 * Unified rate limiting with comprehensive fallbacks
 * Safe for Edge Runtime and works with current setup
 */

import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

// ==================== IMPORT ORIGINAL RATE LIMIT MODULE ====================
let originalRateLimitModule: any = null;
let RATE_LIMIT_CONFIGS: any = null;

try {
  // Try to import the working rate-limit module
  const module = require('@/lib/server/rateLimit');
  originalRateLimitModule = module;
  
  // Use original configs if available
  if (module.RATE_LIMIT_CONFIGS) {
    RATE_LIMIT_CONFIGS = module.RATE_LIMIT_CONFIGS;
  }
  
  console.log('[RateLimitUnified] Loaded original rate-limit module');
} catch (error) {
  console.warn('[RateLimitUnified] Could not load rate-limit module, creating fallback configs');
  // Create fallback configs if module can't be loaded
  RATE_LIMIT_CONFIGS = {
    API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
    API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
    AUTH_API: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
    DOWNLOAD_API: { limit: 30, windowMs: 600000, keyPrefix: "download" },
    CONTACT_FORM: { limit: 5, windowMs: 600000, keyPrefix: "contact" },
    NEWSLETTER_SUBSCRIBE: { limit: 5, windowMs: 600000, keyPrefix: "news" },
    ADMIN_API: { limit: 50, windowMs: 300000, keyPrefix: "admin" },
    STRATEGY_ROOM_INTAKE: { limit: 10, windowMs: 3600000, keyPrefix: "strategy" },
    INNER_CIRCLE_REGISTER: { limit: 20, windowMs: 900000, keyPrefix: "ic-reg" },
    TEASER_REQUEST: { limit: 10, windowMs: 900000, keyPrefix: "teaser" },
    INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600000, keyPrefix: "ic-unlock" },
    INNER_CIRCLE_ADMIN_EXPORT: { limit: 5, windowMs: 300000, keyPrefix: "ic-admin-export" },
    INNER_CIRCLE_REGISTER_EMAIL: { limit: 3, windowMs: 3600000, keyPrefix: "ic-reg-email" }
  };
}

// ==================== TYPES ====================
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

// ==================== RE-EXPORT ORIGINAL FUNCTIONS OR PROVIDE FALLBACKS ====================

// Try to re-export original functions, fall back to simple implementations
export const rateLimit = originalRateLimitModule?.rateLimit || async function(
  key: string, 
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<RateLimitResult> {
  // Simple fallback that always allows
  return {
    allowed: true,
    remaining: options.limit - 1,
    retryAfterMs: 0,
    resetTime: Date.now() + options.windowMs,
    limit: options.limit,
    windowMs: options.windowMs
  };
};

export const getClientIp = originalRateLimitModule?.getClientIp || function(
  req: NextApiRequest | NextRequest
): string {
  if ('headers' in req && typeof (req as any).headers?.get === 'function') {
    const edgeReq = req as NextRequest;
    const forwarded = edgeReq.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0]?.trim() || 'unknown';
  }
  
  const apiReq = req as NextApiRequest;
  const forwarded = apiReq.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0]?.trim() : forwarded.split(',')[0]?.trim() || 'unknown';
  }
  
  return apiReq.socket?.remoteAddress || 'unknown';
};

export const createRateLimitHeaders = originalRateLimitModule?.createRateLimitHeaders || function(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfterMs > 0 ? {
      "Retry-After": Math.ceil(result.retryAfterMs / 1000).toString()
    } : {})
  };
};

export const withApiRateLimit = originalRateLimitModule?.withApiRateLimit || function(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Simple fallback - just call the handler
    return handler(req, res);
  };
};

export const isRateLimited = originalRateLimitModule?.isRateLimited || async function(
  key: string,
  bucket: string,
  limit: number
): Promise<{ 
  limited: boolean; 
  retryAfter: number; 
  limit: number; 
  remaining: number; 
}> {
  return {
    limited: false,
    retryAfter: 0,
    limit,
    remaining: limit - 1
  };
};

export const checkRateLimit = originalRateLimitModule?.checkRateLimit || isRateLimited;

export const getRateLimiterStats = originalRateLimitModule?.getRateLimiterStats || async function() {
  return {
    memoryStoreSize: 0,
    tokenBucketsSize: 0,
    violationCountsSize: 0,
    isRedisAvailable: false
  };
};

export const resetRateLimit = originalRateLimitModule?.resetRateLimit || async function() {
  // No-op for fallback
};

export const unblock = originalRateLimitModule?.unblock || resetRateLimit;

export const getClientIpFromRequest = originalRateLimitModule?.getClientIpFromRequest || getClientIp;

// ==================== UNIFIED FUNCTIONS ====================

/**
 * Get rate limit storage info
 */
export async function getRateLimitStorageInfo(config: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<{
  storage: 'memory' | 'redis';
  redisAvailable: boolean;
}> {
  // Try to get actual info if available
  if (originalRateLimitModule?.getRateLimitStats) {
    const stats = await originalRateLimitModule.getRateLimitStats();
    return {
      storage: stats.isRedisAvailable ? 'redis' : 'memory',
      redisAvailable: stats.isRedisAvailable
    };
  }
  
  // Fallback
  return {
    storage: 'memory',
    redisAvailable: false
  };
}

/**
 * Edge Runtime compatible rate limiting
 */
export async function withEdgeRateLimit(
  req: NextRequest,
  config: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  try {
    const ip = getClientIp(req);
    const key = `${config.keyPrefix}:${ip}`;
    
    const result = await rateLimit(key, config);
    const headers = createRateLimitHeaders(result);
    
    return {
      allowed: result.allowed,
      headers
    };
  } catch (error) {
    console.warn('[withEdgeRateLimit] Error, failing open');
    return {
      allowed: true,
      headers: {}
    };
  }
}

// ==================== EXPORT EVERYTHING ====================
export {
  RATE_LIMIT_CONFIGS
};

export default {
  rateLimit,
  withApiRateLimit,
  withEdgeRateLimit,
  createRateLimitHeaders,
  getClientIp,
  getClientIpFromRequest,
  isRateLimited,
  checkRateLimit,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
  getRateLimitStorageInfo,
  RATE_LIMIT_CONFIGS
};