/**
 * Redis-based rate limiting (SERVER ONLY)
 * This file re-exports from server/rateLimit to avoid ioredis in browser builds
 */

// Import the default from server/rateLimit first
import serverRateLimit, {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  type RateLimitOptions,
  type RateLimitResult,
} from './server/rateLimit';

// Re-export everything from the server rate limit module
export {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  type RateLimitOptions,
  type RateLimitResult,
};

// Safe Redis getter that doesn't import ioredis
export function getRedis() {
  // Return null - the enhanced redis client will be used instead
  try {
    // Only available at runtime, not build time
    if (typeof window === 'undefined') {
      const redis = require('./redis-enhanced').default;
      return redis;
    }
  } catch (error) {
    console.warn('[rate-limit-redis] Redis not available');
  }
  return null;
}

// Create the missing rateLimitRedis function that was imported elsewhere
export async function rateLimitRedis(
  key: string,
  options?: {
    limit?: number;
    windowMs?: number;
    keyPrefix?: string;
  }
): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetTime: number;
  limit: number;
  windowMs: number;
}> {
  const defaultOptions = {
    limit: options?.limit || 100,
    windowMs: options?.windowMs || 60000, // 1 minute default
    keyPrefix: options?.keyPrefix || 'redis'
  };
  
  return rateLimit(key, defaultOptions);
}

// Alias for backward compatibility
export const redisRateLimit = rateLimitRedis;

// Helper function for API routes using Redis rate limiting
export async function withRedisRateLimit(
  key: string,
  options?: {
    limit?: number;
    windowMs?: number;
    keyPrefix?: string;
  }
): Promise<boolean> {
  const result = await rateLimitRedis(key, options);
  return result.allowed;
}

// Legacy Redis rate limiter wrapper
export class RedisRateLimiter {
  private prefix: string;
  
  constructor(prefix: string = 'rate') {
    this.prefix = prefix;
  }
  
  async check(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfter: number;
  }> {
    const result = await rateLimitRedis(`${this.prefix}:${key}`, {
      limit,
      windowMs,
      keyPrefix: this.prefix
    });
    
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      retryAfter: Math.ceil(result.retryAfterMs / 1000)
    };
  }
  
  async reset(key: string): Promise<void> {
    try {
      const redis = getRedis();
      if (redis) {
        await redis.del(`${this.prefix}:${key}`);
      }
    } catch (error) {
      console.warn('[RedisRateLimiter] Reset failed:', error);
    }
  }
}

// Create a wrapper object that includes everything
const rateLimitRedisWrapper = {
  // Core functions
  rateLimit: rateLimitRedis,
  rateLimitRedis,
  redisRateLimit,
  withRedisRateLimit,
  RedisRateLimiter,
  getRedis,
  
  // Re-exports from server/rateLimit
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  
  // Include everything from serverRateLimit for compatibility
  ...serverRateLimit
};

// Export the wrapper as default
export default rateLimitRedisWrapper;