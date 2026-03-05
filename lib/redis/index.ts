// lib/redis/index.ts - FALLBACK/COMPATIBILITY LAYER
// This should ONLY re-export from the main lib/redis.ts

import { getRedis, isRedisAvailable } from './client';

// Re-exports
export { getRedis, isRedisAvailable } from './client';
export type { Redis } from 'ioredis';

// Get the redis client instance
export const redisClient = getRedis();

// Helper function to get Redis instance with proper method typing
export async function getRedisClient() {
  const client = getRedis();
  
  // Return a safe wrapper that handles null client
  return {
    // Core methods with null checks
    get: async (key: string) => {
      if (!client) return null;
      return client.get(key);
    },
    set: async (key: string, value: string, ttl?: number) => {
      if (!client) return null;
      return ttl ? client.setex(key, ttl, value) : client.set(key, value);
    },
    del: async (key: string) => {
      if (!client) return 0;
      return client.del(key);
    },
    
    // Additional common methods
    exists: async (key: string) => {
      if (!client) return 0;
      return client.exists(key);
    },
    expire: async (key: string, seconds: number) => {
      if (!client) return 0;
      return client.expire(key, seconds);
    },
    ttl: async (key: string) => {
      if (!client) return -2;
      return client.ttl(key);
    },
    incr: async (key: string) => {
      if (!client) return null;
      return client.incr(key);
    },
    decr: async (key: string) => {
      if (!client) return null;
      return client.decr(key);
    },
    
    // Client instance (may be null)
    client,
    
    // Helper to check if client is available
    isAvailable: () => !!client && isRedisAvailable(),
  };
}

// For environments where Redis is not available
export function initRedis() {
  console.log('[Redis] Using lazy initialization via lib/redis/index.ts');
  return getRedis();
}

// Method proxies for backward compatibility - with null checks
export const get = async (key: string) => {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get(key);
};

export const set = async (key: string, value: string, ttl?: number) => {
  const redis = getRedis();
  if (!redis) return null;
  return ttl ? redis.setex(key, ttl, value) : redis.set(key, value);
};

export const del = async (key: string) => {
  const redis = getRedis();
  if (!redis) return 0;
  return redis.del(key);
};

// Default export
const exports = {
  getRedis,
  redisClient,
  isRedisAvailable,
  initRedis,
  getRedisClient,
  get,
  set,
  del
};

export default exports;