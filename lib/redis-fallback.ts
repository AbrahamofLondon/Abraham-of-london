// lib/redis-fallback.ts - Simple Redis stub for client
export const redisClient = {
  get: async (key: string) => {
    console.warn('Redis not available on client');
    return null;
  },
  set: async (key: string, value: string) => {
    console.warn('Redis not available on client');
    return 'OK';
  },
  del: async (key: string) => {
    console.warn('Redis not available on client');
    return 0;
  },
  on: () => ({})
};

export const redisPromise = Promise.resolve(redisClient);