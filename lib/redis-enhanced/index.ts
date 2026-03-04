// lib/redis-enhanced/index.ts

// Dynamic import to handle edge vs node runtime
let redis: any;

try {
  // Try to import the edge version
  redis = require('./redis-enhanced.edge').default;
} catch (error) {
  // Fallback to a basic implementation
  console.warn('Failed to load redis-enhanced.edge, using fallback');
  redis = {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 1,
    incr: async () => 1,
    expire: async () => 1,
    on: () => {},
    quit: async () => 'OK',
  };
}

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
    incr: (key: string) => redis.incr(`${namespace}:${key}`),
    expire: (key: string, seconds: number) => redis.expire(`${namespace}:${key}`, seconds),
    // ... wrap other methods as needed
  };
};