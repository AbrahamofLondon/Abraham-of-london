// lib/redis/index.ts - FALLBACK/COMPATIBILITY LAYER
// This should ONLY re-export from the main lib/redis.ts

export { getRedis, redisClient, isRedisAvailable, closeRedis } from '../redis';
export type { Redis } from '../redis';

// For environments where Redis is not available
export function initRedis() {
  console.log('[Redis] Using lazy initialization via lib/redis.ts');
  return getRedis();
}

// Default export
const exports = {
  getRedis,
  redisClient,
  isRedisAvailable,
  closeRedis,
  initRedis
};

export default exports;