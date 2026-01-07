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

  async sadd(key: string, member: string): Promise<number> {
    const current = (await this.get(key)) || '[]';
    const set = new Set(JSON.parse(current));
    set.add(member);
    await this.set(key, JSON.stringify(Array.from(set)));
    return 1;
  }

  async smembers(key: string): Promise<string[]> {
    const value = await this.get(key);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  async srem(key: string, member: string): Promise<number> {
    const current = (await this.get(key)) || '[]';
    const set = new Set(JSON.parse(current));
    const existed = set.delete(member);
    if (existed) {
      await this.set(key, JSON.stringify(Array.from(set)));
      return 1;
    }
    return 0;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(key => this.get(key)));
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
    // Use dynamic import to prevent webpack bundling issues
    const Redis = await import('ioredis');
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

// Public API - Create actual functions that work
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

  async sadd(key: string, member: string): Promise<number> {
    const client = await getRedisClient();
    if (client.sadd) return client.sadd(key, member);
    // Fallback for MemoryRedis
    return client.sadd(key, member);
  },

  async smembers(key: string): Promise<string[]> {
    const client = await getRedisClient();
    if (client.smembers) return client.smembers(key);
    // Fallback for MemoryRedis
    return client.smembers(key);
  },

  async srem(key: string, member: string): Promise<number> {
    const client = await getRedisClient();
    if (client.srem) return client.srem(key, member);
    // Fallback for MemoryRedis
    return client.srem(key, member);
  },

  async mget(keys: string[]): Promise<(string | null)[]> {
    const client = await getRedisClient();
    if (client.mget) return client.mget(keys);
    // Fallback for MemoryRedis
    return client.mget(keys);
  },

  async zadd(key: string, score: number, member: string): Promise<number> {
    const client = await getRedisClient();
    if (client.zadd) return client.zadd(key, score, member);
    // Fallback for MemoryRedis (simple implementation)
    const data = await client.get(key) || '{}';
    const sorted = JSON.parse(data);
    sorted[member] = score;
    await client.set(key, JSON.stringify(sorted));
    return 1;
  },

  async zrangebyscore(key: string, min: number, max: number, withScores = false): Promise<string[]> {
    const client = await getRedisClient();
    if (client.zrangebyscore) return client.zrangebyscore(key, min, max, withScores ? 'WITHSCORES' : undefined);
    // Fallback for MemoryRedis
    const data = await client.get(key) || '{}';
    const sorted = JSON.parse(data);
    const result = Object.entries(sorted)
      .filter(([_, score]: [string, any]) => score >= min && score <= max)
      .sort((a: any, b: any) => a[1] - b[1]);
    
    if (withScores) {
      return result.flatMap(([member, score]: [string, any]) => [member, score.toString()]);
    }
    return result.map(([member]: [string, any]) => member);
  },

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    const client = await getRedisClient();
    if (client.zremrangebyrank) return client.zremrangebyrank(key, start, stop);
    // Fallback: don't implement for memory store
    return 0;
  },

  async zrange(key: string, start: number, stop: number, withScores = false): Promise<string[]> {
    const client = await getRedisClient();
    if (client.zrange) return client.zrange(key, start, stop, withScores ? 'WITHSCORES' : undefined);
    // Fallback for MemoryRedis
    const data = await client.get(key) || '{}';
    const sorted = JSON.parse(data);
    const entries = Object.entries(sorted).sort((a: any, b: any) => a[1] - b[1]);
    const sliced = entries.slice(start, stop + 1);
    
    if (withScores) {
      return sliced.flatMap(([member, score]: [string, any]) => [member, score.toString()]);
    }
    return sliced.map(([member]: [string, any]) => member);
  },

  isConnected(): boolean {
    return redisInstance instanceof MemoryRedis 
      ? true 
      : redisInstance?.status === 'ready';
  }
};

// Named exports
export const getRedis = () => redisClient;
export const redis = redisClient;

// Type exports
export type RedisClient = typeof redisClient;
export type RedisStats = {
  isConnected: boolean;
  usingMemoryStore: boolean;
};

export type RedisOptions = {
  url?: string;
  maxRetries?: number;
};

export const createNamespacedClient = (namespace: string) => {
  return {
    get: (key: string) => redisClient.get(`${namespace}:${key}`),
    set: (key: string, value: string, options?: any) => redisClient.set(`${namespace}:${key}`, value, options),
    del: (key: string) => redisClient.del(`${namespace}:${key}`),
    sadd: (key: string, member: string) => redisClient.sadd(`${namespace}:${key}`, member),
    smembers: (key: string) => redisClient.smembers(`${namespace}:${key}`),
    srem: (key: string, member: string) => redisClient.srem(`${namespace}:${key}`, member),
  };
};

export default redisClient;