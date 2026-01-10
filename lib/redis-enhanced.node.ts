// lib/redis-enhanced.ts - PROPER CLIENT SAFE
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
    // Only check on client side
    if (typeof window !== 'undefined') {
      console.warn('EnhancedRedisClient created on client - using stub');
    }
  }

  async getWithCache<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    // On client, just call fetchFn directly
    if (typeof window !== 'undefined') {
      return fetchFn();
    }
    throw new Error('Redis is not available');
  }

  async mgetWithCache<T>(
    keys: string[],
    fetchFn: (missingKeys: string[]) => Promise<Record<string, T>>,
    ttlSeconds = 3600
  ): Promise<Record<string, T>> {
    if (typeof window !== 'undefined') {
      return fetchFn(keys);
    }
    throw new Error('Redis is not available');
  }

  async clearPattern(pattern: string): Promise<number> {
    if (typeof window !== 'undefined') {
      return 0;
    }
    throw new Error('Redis is not available');
  }

  getStats() {
    if (typeof window !== 'undefined') {
      return { commands: 0, hits: 0, misses: 0, errors: 0, lastError: null };
    }
    throw new Error('Redis is not available');
  }

  async healthCheck(): Promise<{ ok: boolean; latency?: number; error?: string }> {
    if (typeof window !== 'undefined') {
      return { ok: true, latency: 0 };
    }
    throw new Error('Redis is not available');
  }
}

// Export a function that only works on server
export const getRedisClient = () => {
  if (typeof window !== 'undefined') {
    // Return a stub for client
    return Promise.resolve(new EnhancedRedisClient());
  }
  
  // Dynamically import the real Redis client only on server
  return import('./redis-enhanced.node').then(module => module.default());
};

// Default export that conditionally imports
export default getRedisClient;