// lib/redis-enhanced.node.ts - UPDATED WITH SERVER CHECK
import { ensureServerOnly } from '@/lib/server-only';
ensureServerOnly(); // This will throw if imported on client

import Redis from "ioredis";
// Make sure this file is only imported server-side
if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server');
}

export interface RedisConnectionOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
}

export class EnhancedRedisClient extends Redis {
  private readonly clientId: string;
  private readonly prefix: string;
  private stats = {
    commands: 0,
    hits: 0,
    misses: 0,
    errors: 0,
    lastError: null as Error | null,
  };

  constructor(options: RedisConnectionOptions = {}) {
    const url = options.url || process.env.REDIS_URL;
    
    if (url) {
      super(url, {
        maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
        connectTimeout: options.connectTimeout || 5000,
      });
    } else {
      super({
        host: options.host || process.env.REDIS_HOST || 'localhost',
        port: options.port || parseInt(process.env.REDIS_PORT || '6379', 10),
        password: options.password || process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
        connectTimeout: options.connectTimeout || 5000,
      });
    }

    this.clientId = `redis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.prefix = process.env.REDIS_PREFIX || 'aol:';

    this.on('error', (err) => {
      console.error(`[Redis:${this.clientId}] Error:`, err.message);
      this.stats.errors++;
      this.stats.lastError = err;
    });

    this.on('connect', () => {
      console.log(`[Redis:${this.clientId}] Connected`);
    });

    this.on('ready', () => {
      console.log(`[Redis:${this.clientId}] Ready`);
    });

    this.on('end', () => {
      console.log(`[Redis:${this.clientId}] Disconnected`);
    });
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getWithCache<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    const fullKey = this.getKey(key);
    this.stats.commands++;

    try {
      const cached = await this.get(fullKey);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached) as T;
      }
      
      this.stats.misses++;
      const freshData = await fetchFn();
      await this.setex(fullKey, ttlSeconds, JSON.stringify(freshData));
      return freshData;
    } catch (error) {
      this.stats.errors++;
      this.stats.lastError = error as Error;
      console.error(`[Redis:${this.clientId}] Cache error for ${key}:`, error);
      return fetchFn();
    }
  }

  async mgetWithCache<T>(
    keys: string[],
    fetchFn: (missingKeys: string[]) => Promise<Record<string, T>>,
    ttlSeconds = 3600
  ): Promise<Record<string, T>> {
    this.stats.commands++;
    const fullKeys = keys.map(k => this.getKey(k));

    try {
      const cachedValues = await this.mget(...fullKeys);
      const result: Record<string, T> = {};
      const missingKeys: string[] = [];

      keys.forEach((key, index) => {
        const cached = cachedValues[index];
        if (cached) {
          this.stats.hits++;
          result[key] = JSON.parse(cached) as T;
        } else {
          this.stats.misses++;
          missingKeys.push(key);
        }
      });

      if (missingKeys.length > 0) {
        const freshData = await fetchFn(missingKeys);
        await Promise.all(
          Object.entries(freshData).map(async ([key, value]) => {
            result[key] = value;
            const fullKey = this.getKey(key);
            await this.setex(fullKey, ttlSeconds, JSON.stringify(value));
          })
        );
      }

      return result;
    } catch (error) {
      this.stats.errors++;
      this.stats.lastError = error as Error;
      console.error(`[Redis:${this.clientId}] MGET cache error:`, error);
      return fetchFn(keys);
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    const fullPattern = this.getKey(pattern);
    this.stats.commands++;

    try {
      const keys = await this.keys(fullPattern);
      if (keys.length === 0) return 0;
      
      const deleted = await this.del(...keys);
      console.log(`[Redis:${this.clientId}] Cleared ${deleted} keys matching ${pattern}`);
      return deleted;
    } catch (error) {
      this.stats.errors++;
      this.stats.lastError = error as Error;
      console.error(`[Redis:${this.clientId}] Clear pattern error:`, error);
      return 0;
    }
  }

  getStats() {
    return { ...this.stats, clientId: this.clientId };
  }

  async healthCheck(): Promise<{ ok: boolean; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.ping();
      const latency = Date.now() - start;
      return { ok: true, latency };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }
}

// Create a singleton instance for server-side use
const getRedisClient = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    console.warn('[Redis] REDIS_URL not set in production');
  }

  const client = new EnhancedRedisClient();
  return client;
};

export default getRedisClient;