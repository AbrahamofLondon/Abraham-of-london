/**
 * Redis compatibility wrapper
 * Exports getRedis function that returns the enhanced Redis client
 */

import redisEnhanced, { createNamespacedClient } from './redis-enhanced';
import type { RedisStats, RedisOptions } from './redis-enhanced';

// Define RedisClient type based on what's actually exported
export type RedisClient = ReturnType<typeof redisEnhanced.getClient>;

/**
 * Get the Redis client instance
 * Returns the enhanced Redis client which works with or without actual Redis
 */
export function getRedis(): typeof redisEnhanced {
  return redisEnhanced;
}

/**
 * Get Redis client (compatibility export)
 */
export function getRedisClient(): RedisClient | undefined {
  try {
    return redisEnhanced.getClient();
  } catch {
    return undefined;
  }
}

// Re-export everything from redis-enhanced
export { 
  redisEnhanced as default, 
  createNamespacedClient 
};

// Export type-only re-exports
export type { 
  RedisStats, 
  RedisOptions 
};

// Additional compatibility exports
export const redis = redisEnhanced;

// Create and export a RedisClient type instance
export const redisClient = {
  ...redisEnhanced,
  // Add any missing methods that might be expected
};