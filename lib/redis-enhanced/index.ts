// lib/redis-enhanced/index.ts
import redis from './redis-enhanced.edge';

// Export the redis instance
export default redis;
export { redis };

// For compatibility with older code that expects these exports
export const getRedis = () => redis;
export const createNamespacedClient = (namespace: string) => {
  // Create a namespaced client wrapper
  return {
    get: (key: string) => redis.get(`${namespace}:${key}`),
    set: (key: string, value: string, options?: any) => redis.set(`${namespace}:${key}`, value, options),
    setex: (key: string, seconds: number, value: string) => redis.setex(`${namespace}:${key}`, seconds, value),
    del: (key: string) => redis.del(`${namespace}:${key}`),
    // ... wrap other methods as needed
  };
};