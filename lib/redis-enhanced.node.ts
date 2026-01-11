// lib/redis-enhanced.node.ts - SERVER ONLY WITH DEFAULT EXPORT
import { ensureServerOnly } from '@/lib/server-only';
ensureServerOnly(); // This will throw if imported on client

import Redis from "ioredis";

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

  // ... rest of your methods (getWithCache, mgetWithCache, etc.) ...
}

// Create a singleton instance for server-side use
const getRedisClient = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    console.warn('[Redis] REDIS_URL not set in production');
  }

  const client = new EnhancedRedisClient();
  return client;
};

// ✅ ADD DEFAULT EXPORT
export default getRedisClient;