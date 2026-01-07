// lib/redis-enhanced.ts
/**
 * Enhanced Redis client with fallbacks and error handling
 * Build-safe: avoids ioredis imports during webpack bundling
 */

// Simple in-memory store as fallback
class MemoryRedis {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiresAt = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    return this.set(key, value, { EX: seconds });
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());
    if (pattern === '*') return allKeys;
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return allKeys.filter(key => regex.test(key));
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<void> {
    // Nothing to do for memory store
  }
}

// Singleton instance
let redisInstance: any = null;

async function getRedisClient() {
  if (redisInstance) return redisInstance;
  
  // Only try to load ioredis if we're on the server AND have a Redis URL
  const isServer = typeof window === 'undefined';
  const hasRedisUrl = isServer && process.env.REDIS_URL;
  
  if (!hasRedisUrl) {
    console.log('[Redis] Using memory store (no REDIS_URL or not on server)');
    redisInstance = new MemoryRedis();
    return redisInstance;
  }

  try {
    // Use require with string concatenation to prevent webpack from bundling
    // This makes it truly dynamic at runtime
    const moduleName = 'io' + 'redis';
    const Redis = require(moduleName);
    const RedisConstructor = Redis.default || Redis;
    
    redisInstance = new RedisConstructor(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        return Math.min(times * 50, 2000);
      }
    });
    
    // Test connection
    await redisInstance.ping();
    console.log('[Redis] Connected successfully to ioredis');
  } catch (error) {
    console.warn('[Redis] ioredis not available, using memory store:', error);
    redisInstance = new MemoryRedis();
  }
  
  return redisInstance;
}

// Public API
const redisClient = {
  async get(key: string): Promise<string | null> {
    const client = await getRedisClient();
    return client.get(key);
  },

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const client = await getRedisClient();
    return client.set(key, value, options);
  },

  async setex(key: string, seconds: number, value: string): Promise<void> {
    const client = await getRedisClient();
    return client.setex(key, seconds, value);
  },

  async del(key: string): Promise<number> {
    const client = await getRedisClient();
    return client.del(key);
  },

  async keys(pattern: string): Promise<string[]> {
    const client = await getRedisClient();
    return client.keys(pattern);
  },

  async ping(): Promise<string> {
    const client = await getRedisClient();
    return client.ping();
  },

  async quit(): Promise<void> {
    if (redisInstance && redisInstance.quit) {
      await redisInstance.quit();
    }
    redisInstance = null;
  },

  isConnected(): boolean {
    return redisInstance instanceof MemoryRedis 
      ? true 
      : redisInstance?.status === 'ready';
  }
};

export default redisClient;

// Named exports for compatibility
export const getRedis = () => redisClient;
export { redisClient as redis };