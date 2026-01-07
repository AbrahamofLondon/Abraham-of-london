// lib/rate-limit-redis.ts
/**
 * Redis-based rate limiting (SERVER ONLY)
 * This file re-exports from server/rateLimit to avoid ioredis in browser builds
 */

// Just re-export everything from the memory-based rate limiter
// This avoids any ioredis imports during build
export {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  type RateLimitOptions,
  type RateLimitResult,
} from './server/rateLimit';

export { default } from './server/rateLimit';

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