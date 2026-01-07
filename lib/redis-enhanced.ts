// lib/redis-enhanced.ts
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

class MemoryStore {
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
}

class EnhancedRedis {
  private client: RedisClientType | null = null;
  private memoryStore: MemoryStore | null = null;
  private isConnected = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!process.env.REDIS_URL) {
      this.memoryStore = new MemoryStore();
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
        }
      });

      await this.client.connect();
      await this.client.ping();
      this.isConnected = true;

    } catch (error) {
      console.error('[Redis] Connection failed:', error);
      this.client = null;
      this.memoryStore = new MemoryStore();
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.get(key);
      } catch (error) {
        console.warn('[Redis] Get failed:', error);
      }
    }
    return this.memoryStore?.get(key) || null;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        if (options?.EX) {
          await this.client.setEx(key, options.EX, value);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (error) {
        console.warn('[Redis] Set failed:', error);
      }
    }
    await this.memoryStore?.set(key, value, options);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    return this.set(key, value, { EX: seconds });
  }

  async del(key: string): Promise<number> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.del(key);
      } catch (error) {
        console.warn('[Redis] Delete failed:', error);
      }
    }
    return this.memoryStore?.del(key) || 0;
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.keys(pattern);
      } catch (error) {
        console.warn('[Redis] Keys failed:', error);
      }
    }
    return this.memoryStore?.keys(pattern) || [];
  }

  async ping(): Promise<string> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.ping();
      } catch (error) {
        console.warn('[Redis] Ping failed:', error);
      }
    }
    return this.memoryStore?.ping() || 'NO_STORE';
  }
}

const redis = new EnhancedRedis();

export function createNamespacedClient(namespace: string) {
  return {
    get: async (key: string): Promise<string | null> => 
      redis.get(`${namespace}:${key}`),
    
    set: async (key: string, value: string, options?: { EX?: number }): Promise<void> => 
      redis.set(`${namespace}:${key}`, value, options),
    
    setex: async (key: string, seconds: number, value: string): Promise<void> => 
      redis.setex(`${namespace}:${key}`, seconds, value),
    
    del: async (key: string): Promise<number> => 
      redis.del(`${namespace}:${key}`),
    
    keys: async (pattern: string): Promise<string[]> => {
      const fullPattern = `${namespace}:${pattern}`;
      const keys = await redis.keys(fullPattern);
      return keys.map(k => k.replace(`${namespace}:`, ''));
    },
    
    getClient: () => redis,
    
    ping: async (): Promise<string> => redis.ping(),
  };
}

export default redis;