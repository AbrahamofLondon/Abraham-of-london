// lib/redis.ts
/**
 * Redis compatibility wrapper
 * Exports getRedis function that returns the enhanced Redis client
 */

import redis, { RedisClient, createNamespacedClient } from './redis-enhanced';
import type { RedisStats, RedisOptions } from './redis-enhanced';

/**
 * Get the Redis client instance
 * Returns the enhanced Redis client which works with or without actual Redis
 */
export function getRedis(): typeof redis {
  return redis;
}

// Re-export everything from redis-enhanced
export { redis as default, RedisClient, createNamespacedClient };
export type { RedisStats, RedisOptions };

// Additional compatibility exports
export const redisClient = redis;
export const Redis = RedisClient;