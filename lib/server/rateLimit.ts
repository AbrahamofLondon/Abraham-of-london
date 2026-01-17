// lib/server/rateLimit.ts - FIXED VERSION
// Re-export everything from the unified rate limiter
export * from "./rate-limit-unified";

// Also export specific functions that other files expect
import { 
  rateLimit,
  getClientIp,
  isRateLimitedRequest as isRateLimited,
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
} from "./rate-limit-unified";

// Re-export the unified functions
export {
  rateLimit,
  getClientIp,
  isRateLimited,
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

// Export the specific function that pages/api/inner-circle/admin/delete.ts is looking for
export async function rateLimitForRequestIp(
  req: any,
  bucket: string,
  limit: number,
  windowMs?: number
): Promise<{
  limited: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
}> {
  const ip = req.headers?.['x-forwarded-for']?.[0] || 
             req.socket?.remoteAddress || 
             'unknown';
  
  const options: RateLimitOptions = {
    maxRequests: limit,
    windowMs: windowMs || 5 * 60 * 1000 // Default 5 minutes
  };
  
  const result = await rateLimit(`${bucket}:${ip}`, options);
  
  return {
    limited: !result.allowed,
    retryAfter: result.resetTime - Date.now(),
    limit: result.limit,
    remaining: result.remaining
  };
}

// Export checkRateLimit function that pages/api/shorts/[slug]/like.ts expects
export async function checkRateLimit(
  key: string,
  bucket: string,
  limit: number,
  windowMs: number = 60000
): Promise<{
  limited: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
}> {
  const options: RateLimitOptions = {
    maxRequests: limit,
    windowMs
  };
  
  const result = await rateLimit(`${bucket}:${key}`, options);
  
  return {
    limited: !result.allowed,
    retryAfter: Math.max(0, result.resetTime - Date.now()),
    limit: result.limit,
    remaining: result.remaining
  };
}

// Default export
const rateLimitModule = {
  rateLimit,
  getClientIp,
  isRateLimited,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
  withApiRateLimit,
  rateLimitForRequestIp,
  checkRateLimit,
  getRateLimiterStatsSync,
  resetRateLimitSync,
  unblockSync,
  RATE_LIMIT_CONFIGS
};

export default rateLimitModule;