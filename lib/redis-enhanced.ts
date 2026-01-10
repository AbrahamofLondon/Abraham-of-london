// lib/redis-enhanced.ts - CLIENT-SAFE VERSION
// This is a stub that doesn't use ioredis

export interface RedisConnectionOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
}

// Client-side stub that throws errors if used
export class EnhancedRedisClient {
  constructor(options: RedisConnectionOptions = {}) {
    if (typeof window !== 'undefined') {
      throw new Error('Redis client cannot be used on the client side');
    }
  }

  async getWithCache<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    throw new Error('Redis is not available on the client side');
  }

  async mgetWithCache<T>(
    keys: string[],
    fetchFn: (missingKeys: string[]) => Promise<Record<string, T>>,
    ttlSeconds = 3600
  ): Promise<Record<string, T>> {
    throw new Error('Redis is not available on the client side');
  }

  async clearPattern(pattern: string): Promise<number> {
    throw new Error('Redis is not available on the client side');
  }

  getStats() {
    throw new Error('Redis is not available on the client side');
  }

  async healthCheck(): Promise<{ ok: boolean; latency?: number; error?: string }> {
    throw new Error('Redis is not available on the client side');
  }
}

// Export a function that only works on server
export const getRedisClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Redis client cannot be used on the client side');
  }
  
  // Dynamically import the real Redis client
  return import('./redis-enhanced.node').then(module => module.default());
};

// Default export that conditionally imports
export default getRedisClient;