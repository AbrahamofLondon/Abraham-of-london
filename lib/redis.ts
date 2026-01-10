// lib/redis.ts
import redisEnhanced from "./redis-enhanced";

// Type definition for your Redis interface
export type RedisClient = typeof redisEnhanced;
export type RedisInterface = RedisClient;

// Since your redis-enhanced exports a MemoryRedis instance directly,
// we need to check the actual structure
const isMemoryRedis = (obj: any): obj is { get: Function; set: Function } => {
  return obj && typeof obj.get === 'function' && typeof obj.set === 'function';
};

// Get the redis instance
export const redis = isMemoryRedis(redisEnhanced) ? redisEnhanced : 
                    (redisEnhanced as any).redis || redisEnhanced.default || redisEnhanced;

// For MemoryRedis (edge runtime), createNamespacedClient might not exist
// So we'll create a simple implementation
export const createNamespacedClient = (namespace: string): RedisClient => {
  // If the function exists in redis-enhanced, use it
  if (typeof (redisEnhanced as any).createNamespacedClient === 'function') {
    return (redisEnhanced as any).createNamespacedClient(namespace);
  }
  
  // Otherwise, create a namespaced wrapper for MemoryRedis
  const baseClient = redis;
  
  return {
    // Wrap all methods to automatically prefix keys
    async get(key: string) {
      return baseClient.get(`${namespace}:${key}`);
    },
    
    async set(key: string, value: string, options?: { EX?: number }) {
      return baseClient.set(`${namespace}:${key}`, value, options);
    },
    
    async setex(key: string, seconds: number, value: string) {
      return baseClient.setex(`${namespace}:${key}`, seconds, value);
    },
    
    async del(key: string) {
      return baseClient.del(`${namespace}:${key}`);
    },
    
    async keys(pattern: string) {
      const allKeys = await baseClient.keys(`${namespace}:${pattern}`);
      // Remove namespace prefix from returned keys
      return allKeys.map((k: string) => k.replace(`${namespace}:`, ''));
    },
    
    async ping() {
      return baseClient.ping();
    },
    
    async quit() {
      return baseClient.quit?.();
    },
    
    async sadd(key: string, member: string) {
      return baseClient.sadd(`${namespace}:${key}`, member);
    },
    
    async smembers(key: string) {
      return baseClient.smembers(`${namespace}:${key}`);
    },
    
    async srem(key: string, member: string) {
      return baseClient.srem(`${namespace}:${key}`, member);
    },
    
    async mget(keys: string[]) {
      const prefixedKeys = keys.map(k => `${namespace}:${k}`);
      return baseClient.mget(prefixedKeys);
    },
    
    async exists(key: string) {
      return baseClient.exists(`${namespace}:${key}`);
    }
  } as RedisClient;
};

// getRedis function - returns a Redis client
export const getRedis = (): RedisClient => {
  return redis;
};

// Alias for backward compatibility
export const getRedisClient = getRedis;

// Default export
export default redis;