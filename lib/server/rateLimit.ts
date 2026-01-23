// lib/server/rateLimit.ts - COMPLETELY FIXED VERSION
// This file re-exports everything from the unified rate limiter with proper types

// First, import everything from the unified module
import { 
  rateLimit as unifiedRateLimit,
  getClientIp,
  isRateLimited as unifiedIsRateLimited,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
  withApiRateLimit,
  getRateLimiterStatsSync,
  resetRateLimitSync,
  unblockSync,
  RATE_LIMIT_CONFIGS,
  type RateLimitOptions as UnifiedRateLimitOptions,
  type RateLimitResult as UnifiedRateLimitResult,
  isRateLimitedRequest,
  checkRateLimit as unifiedCheckRateLimit,
  rateLimitForRequestIp as unifiedRateLimitForRequestIp
} from "./rate-limit-unified";

// ==================== TYPE DEFINITIONS ====================

// Define the specific type that rateLimitForRequestIp expects to return
export interface RateLimitResponse {
  limited: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
}

// Alias the unified types for backward compatibility
export type RateLimitOptions = UnifiedRateLimitOptions;
export type RateLimitResult = UnifiedRateLimitResult;

// ==================== RE-EXPORTS ====================

// Re-export everything from unified module
export {
  getClientIp,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
  withApiRateLimit,
  getRateLimiterStatsSync,
  resetRateLimitSync,
  unblockSync,
  RATE_LIMIT_CONFIGS,
  type RateLimitOptions,
  type RateLimitResult
};

// Re-export specific unified functions with the expected names
export const isRateLimited = unifiedIsRateLimited;
export const rateLimit = unifiedRateLimit;

// ==================== COMPATIBILITY FUNCTIONS ====================

/**
 * Compatibility function for pages/api/inner-circle/admin/delete.ts
 * This function matches the expected signature from the error messages
 */
export async function rateLimitForRequestIp(
  req: any,
  bucket: string,
  limit: number,
  windowMs?: number
): Promise<RateLimitResponse> {
  // Extract IP from request
  let ip: string;
  
  // Handle different request types (NextApiRequest vs NextRequest)
  if (req.headers?.get) {
    // NextRequest (Edge/App Router)
    const forwarded = req.headers.get('x-forwarded-for');
    ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  } else if (req.headers?.['x-forwarded-for']) {
    // NextApiRequest (Pages Router)
    const forwarded = req.headers['x-forwarded-for'];
    ip = Array.isArray(forwarded) ? forwarded[0]?.trim() || 'unknown' : forwarded?.split(',')[0]?.trim() || 'unknown';
  } else {
    ip = req.socket?.remoteAddress || 'unknown';
  }
  
  // Use the unified rate limit function
  const result = await unifiedRateLimit(
    `${bucket}:${ip}`, 
    { 
      limit, 
      windowMs: windowMs || 5 * 60 * 1000, // Default 5 minutes
      keyPrefix: bucket
    }
  );
  
  return {
    limited: !result.allowed,
    retryAfter: Math.max(0, result.retryAfterMs),
    limit: result.limit,
    remaining: result.remaining
  };
}

/**
 * Compatibility function for pages/api/shorts/[slug]/like.ts
 * This matches the expected checkRateLimit signature
 */
export async function checkRateLimit(
  key: string,
  bucket: string,
  limit: number,
  windowMs: number = 60000
): Promise<RateLimitResponse> {
  const result = await unifiedRateLimit(
    `${bucket}:${key}`,
    { 
      limit, 
      windowMs,
      keyPrefix: bucket
    }
  );
  
  return {
    limited: !result.allowed,
    retryAfter: Math.max(0, result.retryAfterMs),
    limit: result.limit,
    remaining: result.remaining
  };
}

// ==================== DEFAULT EXPORT ====================

// Default export for backward compatibility
const rateLimitModule = {
  // Unified functions
  rateLimit: unifiedRateLimit,
  getClientIp,
  isRateLimited: unifiedIsRateLimited,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
  withApiRateLimit,
  
  // Compatibility functions
  rateLimitForRequestIp,
  checkRateLimit,
  
  // Sync variants
  getRateLimiterStatsSync,
  resetRateLimitSync,
  unblockSync,
  
  // Configs
  RATE_LIMIT_CONFIGS
};

export default rateLimitModule;