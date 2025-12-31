/* lib/server/inner-circle-cache.ts */
// Redis-based caching layer for Inner Circle system

import { createClient, RedisClientType } from 'redis';
import { logAuditEvent, AUDIT_ACTIONS } from './audit';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  redisUrl?: string;
  namespace: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

export class InnerCircleCache {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };
  private isConnected = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.INNER_CIRCLE_ENABLE_CACHE === 'true',
      ttl: config.ttl ?? Number(process.env.INNER_CIRCLE_CACHE_TTL || 300),
      redisUrl: config.redisUrl ?? process.env.REDIS_URL,
      namespace: config.namespace ?? 'inner-circle:'
    };

    if (this.config.enabled && this.config.redisUrl) {
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    try {
      this.client = createClient({
        url: this.config.redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.warn('[InnerCircleCache] Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('[InnerCircleCache] Redis error:', err);
        this.stats.errors++;
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('[InnerCircleCache] Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('[InnerCircleCache] Reconnecting to Redis...');
      });

      await this.client.connect();
    } catch (error) {
      console.error('[InnerCircleCache] Failed to initialize:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  private getKey(key: string): string {
    return `${this.config.namespace}${key}`;
  }

  private async safeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    if (!this.config.enabled || !this.client || !this.isConnected) {
      return fallback;
    }

    try {
      return await fn();
    } catch (error) {
      console.error(`[InnerCircleCache] ${operation} failed:`, error);
      this.stats.errors++;
      return fallback;
    }
  }

  /**
   * Cache a value
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return this.safeOperation(
      'set',
      async () => {
        const serialized = JSON.stringify(value);
        await this.client!.set(
          this.getKey(key),
          serialized,
          { EX: ttl ?? this.config.ttl }
        );
        this.stats.sets++;
        return true;
      },
      false
    );
  }

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    return this.safeOperation(
      'get',
      async () => {
        const cached = await this.client!.get(this.getKey(key));
        if (cached) {
          this.stats.hits++;
          return JSON.parse(cached) as T;
        } else {
          this.stats.misses++;
          return null;
        }
      },
      null
    );
  }

  /**
   * Delete a cached value
   */
  async delete(key: string): Promise<boolean> {
    return this.safeOperation(
      'delete',
      async () => {
        const result = await this.client!.del(this.getKey(key));
        this.stats.deletes++;
        return result > 0;
      },
      false
    );
  }

  /**
   * Get or set with cache-aside pattern
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshValue = await fetchFn();
    await this.set(key, freshValue, ttl);
    return freshValue;
  }

  /**
   * Cache member data
   */
  async cacheMember(memberId: string, data: any): Promise<boolean> {
    return this.set(`member:${memberId}`, data, 3600); // 1 hour TTL
  }

  /**
   * Get cached member data
   */
  async getCachedMember(memberId: string): Promise<any | null> {
    return this.get(`member:${memberId}`);
  }

  /**
   * Cache key verification result
   */
  async cacheKeyVerification(keyHash: string, result: any): Promise<boolean> {
    return this.set(`verify:${keyHash}`, result, 60); // 1 minute TTL for verification
  }

  /**
   * Get cached key verification
   */
  async getCachedKeyVerification(keyHash: string): Promise<any | null> {
    return this.get(`verify:${keyHash}`);
  }

  /**
   * Cache member keys
   */
  async cacheMemberKeys(memberId: string, keys: any[]): Promise<boolean> {
    return this.set(`member-keys:${memberId}`, keys, 300); // 5 minute TTL
  }

  /**
   * Get cached member keys
   */
  async getCachedMemberKeys(memberId: string): Promise<any[] | null> {
    return this.get(`member-keys:${memberId}`);
  }

  /**
   * Cache system stats
   */
  async cacheSystemStats(stats: any): Promise<boolean> {
    return this.set('system:stats', stats, 900); // 15 minute TTL
  }

  /**
   * Get cached system stats
   */
  async getCachedSystemStats(): Promise<any | null> {
    return this.get('system:stats');
  }

  /**
   * Invalidate all member-related cache
   */
  async invalidateMemberCache(memberId: string): Promise<void> {
    const patterns = [
      `member:${memberId}`,
      `member-keys:${memberId}`,
      `verify:*` // Invalidate all verification caches
    ];

    await Promise.all(
      patterns.map(pattern => this.deletePattern(pattern))
    );

    // Also invalidate stats cache
    await this.delete('system:stats');
  }

  /**
   * Delete keys by pattern (use with caution in production)
   */
  async deletePattern(pattern: string): Promise<number> {
    return this.safeOperation(
      'deletePattern',
      async () => {
        const keys = await this.client!.keys(this.getKey(pattern));
        if (keys.length > 0) {
          const result = await this.client!.del(keys);
          this.stats.deletes += keys.length;
          return result;
        }
        return 0;
      },
      0
    );
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<boolean> {
    return this.safeOperation(
      'clearAll',
      async () => {
        await this.client!.flushDb();
        this.stats.deletes++;
        
        await logAuditEvent({
          actorType: 'system',
          action: AUDIT_ACTIONS.CONFIGURATION_CHANGE,
          resourceType: 'cache',
          status: 'success',
          details: { action: 'cache_cleared' }
        }).catch(() => {});
        
        return true;
      },
      false
    );
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.config.enabled && this.isConnected && this.client !== null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ ok: boolean; details: string }> {
    if (!this.config.enabled) {
      return { ok: true, details: 'Cache disabled' };
    }

    if (!this.client || !this.isConnected) {
      return { ok: false, details: 'Cache not connected' };
    }

    try {
      await this.client.ping();
      return { ok: true, details: 'Cache healthy' };
    } catch (error) {
      return { 
        ok: false, 
        details: `Cache health check failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
let cacheInstance: InnerCircleCache | null = null;

export function getCache(config?: Partial<CacheConfig>): InnerCircleCache {
  if (!cacheInstance) {
    cacheInstance = new InnerCircleCache(config);
  }
  return cacheInstance;
}

// Predefined cache keys for consistency
export const CACHE_KEYS = {
  MEMBER: (id: string) => `member:${id}`,
  MEMBER_KEYS: (id: string) => `member-keys:${id}`,
  KEY_VERIFICATION: (hash: string) => `verify:${hash}`,
  SYSTEM_STATS: 'system:stats',
  DAILY_STATS: (date: string) => `stats:daily:${date}`,
  MEMBER_ACTIVITY: (id: string) => `activity:${id}`,
  KEY_METRICS: (id: string) => `metrics:key:${id}`,
  SEARCH_RESULTS: (query: string) => `search:${Buffer.from(query).toString('base64')}`
} as const;

// Cache middleware for API responses
export function withCache(
  key: string,
  ttl: number = 300,
  options: {
    bypass?: boolean;
    invalidateOnMethods?: string[];
    cacheEmpty?: boolean;
  } = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = getCache();
      
      // Check if we should bypass cache
      const shouldBypass = options.bypass || 
        (options.invalidateOnMethods && 
         options.invalidateOnMethods.includes(args[0]?.method));
      
      if (!cache.isAvailable() || shouldBypass) {
        return originalMethod.apply(this, args);
      }
      
      // Build cache key
      const cacheKey = `${propertyKey}:${key}:${JSON.stringify(args)}`;
      
      try {
        // Try to get from cache
        const cached = await cache.get(cacheKey);
        if (cached !== null) {
          return cached;
        }
        
        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // Don't cache empty results unless specified
        if (result === null || result === undefined) {
          if (!options.cacheEmpty) {
            return result;
          }
        }
        
        // Cache the result
        await cache.set(cacheKey, result, ttl);
        
        return result;
      } catch (error) {
        // On error, bypass cache
        console.error(`[CacheMiddleware] Error in ${propertyKey}:`, error);
        return originalMethod.apply(this, args);
      }
    };
    
    return descriptor;
  };
}

export default {
  InnerCircleCache,
  getCache,
  CACHE_KEYS,
  withCache
};