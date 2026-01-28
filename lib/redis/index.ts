// lib/redis/index.ts - FALLBACK/COMPATIBILITY LAYER
// This should ONLY re-export from the main lib/redis.ts

import { getRedis, isRedisAvailable, closeRedis } from '../redis';

// Re-exports
export { getRedis, isRedisAvailable, closeRedis } from '../redis';
export type { Redis } from '../redis';

// Get the redis client instance
export const redisClient = getRedis();

// Helper function to get Redis instance with proper method typing
export async function getRedisClient() {
  const client = getRedis();
  return {
    // Core methods
    get: (key: string) => client.get(key),
    set: (key: string, value: string, ttl?: number) => 
      ttl ? client.setex(key, ttl, value) : client.set(key, value),
    del: (key: string) => client.del(key),
    
    // Additional common methods
    exists: (key: string) => client.exists(key),
    expire: (key: string, seconds: number) => client.expire(key, seconds),
    ttl: (key: string) => client.ttl(key),
    incr: (key: string) => client.incr(key),
    decr: (key: string) => client.decr(key),
    
    // Client instance
    client
  };
}

// For environments where Redis is not available
export function initRedis() {
  console.log('[Redis] Using lazy initialization via lib/redis.ts');
  return getRedis();
}

// Method proxies for backward compatibility
export const get = (key: string) => getRedis().get(key);
export const set = (key: string, value: string, ttl?: number) => 
  ttl ? getRedis().setex(key, ttl, value) : getRedis().set(key, value);
export const del = (key: string) => getRedis().del(key);

// Default export
const exports = {
  getRedis,
  redisClient,
  isRedisAvailable,
  closeRedis,
  initRedis,
  getRedisClient,
  get,
  set,
  del
};

export default exports;