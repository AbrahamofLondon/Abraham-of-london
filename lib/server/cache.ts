// lib/server/cache.ts - ONLY cache functionality
import type { RedisClient as RedisWrapperClient } from "@/lib/redis-enhanced";

// Cache configuration
interface CacheOptions {
  ttl?: number; // seconds
  namespace?: string;
  staleWhileRevalidate?: number; // seconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
  lastModified?: string;
}

type RedisLike = Pick<
  RedisWrapperClient,
  "get" | "set" | "del" | "keys" | "mget"
> & {
  // optional methods depending on backend
  ping?: () => Promise<string>;
};

export class Cache<T = any> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private namespace: string;
  private defaultTTL: number;
  private staleWhileRevalidate: number;

  constructor(options: CacheOptions = {}) {
    this.namespace = options.namespace || "cache";
    this.defaultTTL = options.ttl || 60 * 60;
    this.staleWhileRevalidate = options.staleWhileRevalidate || 300;
  }

  private generateKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Get the redis wrapper (MemoryRedis fallback already handled inside)
   */
  private async getRedis(): Promise<RedisLike | null> {
    try {
      const { getRedis } = await import("@/lib/redis");
      const redis = getRedis(); // returns wrapper (sync)
      return redis as any;
    } catch (e) {
      console.warn("[Cache] Redis wrapper not available:", e);
      return null;
    }
  }

  async get(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    const now = Date.now();

    // 1) Memory
    const mem = this.memoryCache.get(cacheKey);
    if (mem && now < mem.expiresAt) return mem.data;
    if (mem && now >= mem.expiresAt) this.memoryCache.delete(cacheKey);

    // 2) Redis wrapper (or memory redis behind the wrapper)
    try {
      const r = await this.getRedis();
      if (r) {
        const raw = await r.get(cacheKey);
        if (raw) {
          const entry = JSON.parse(raw) as CacheEntry<T>;
          if (now < entry.expiresAt) {
            this.memoryCache.set(cacheKey, entry);
            return entry.data;
          }
        }
      }
    } catch (e) {
      console.warn("[Cache] get failed:", e);
    }

    return null;
  }

  async set(
    key: string,
    data: T,
    options?: { ttl?: number; etag?: string; lastModified?: string }
  ): Promise<void> {
    const cacheKey = this.generateKey(key);
    const ttl = options?.ttl ?? this.defaultTTL;
    const now = Date.now();
    const expiresAt = now + ttl * 1000;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      etag: options?.etag,
      lastModified: options?.lastModified,
    };

    // Memory
    this.memoryCache.set(cacheKey, entry);

    // Redis
    try {
      const r = await this.getRedis();
      if (r) {
        await r.set(cacheKey, JSON.stringify(entry), { EX: ttl } as any);
      }
    } catch (e) {
      console.warn("[Cache] set failed:", e);
    }
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);
    this.memoryCache.delete(cacheKey);

    try {
      const r = await this.getRedis();
      if (r) await r.del(cacheKey);
    } catch (e) {
      console.warn("[Cache] delete failed:", e);
    }
  }

  async has(key: string): Promise<boolean> {
    const cacheKey = this.generateKey(key);
    const now = Date.now();

    // Memory
    const mem = this.memoryCache.get(cacheKey);
    if (mem && now < mem.expiresAt) return true;

    // Redis check without requiring EXISTS
    try {
      const r = await this.getRedis();
      if (r) {
        const raw = await r.get(cacheKey);
        if (!raw) return false;
        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (now < entry.expiresAt) return true;
        // expired -> clean up best-effort
        await r.del(cacheKey);
      }
    } catch (e) {
      console.warn("[Cache] has failed:", e);
    }

    return false;
  }

  async clear(): Promise<void> {
    // Memory
    for (const k of [...this.memoryCache.keys()]) {
      if (k.startsWith(this.namespace + ":")) this.memoryCache.delete(k);
    }

    // Redis
    try {
      const r = await this.getRedis();
      if (r) {
        const keys = await r.keys(`${this.namespace}:*`);
        if (keys?.length) {
          // del expects single key in our wrapper; do sequential deletes
          for (const k of keys) await r.del(k);
        }
      }
    } catch (e) {
      console.warn("[Cache] clear failed:", e);
    }
  }

  getStats() {
    return {
      memorySize: this.memoryCache.size,
      namespace: this.namespace,
      defaultTTL: this.defaultTTL,
    };
  }

  async getWithRevalidation(key: string, fetcher: () => Promise<T>, options?: { ttl?: number }): Promise<T> {
    const cached = await this.get(key);
    const now = Date.now();

    if (cached) {
      const cacheKey = this.generateKey(key);
      const mem = this.memoryCache.get(cacheKey);

      // If within stale-while-revalidate window, serve cached
      if (mem && now < mem.expiresAt + this.staleWhileRevalidate * 1000) {
        // revalidate in background if already stale
        if (now >= mem.expiresAt) this.revalidateInBackground(key, fetcher, options);
        return cached;
      }

      // Outside SWR window -> fetch fresh
      const fresh = await fetcher();
      await this.set(key, fresh, options);
      return fresh;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, options);
    return fresh;
  }

  private async revalidateInBackground(key: string, fetcher: () => Promise<T>, options?: { ttl?: number }) {
    try {
      const fresh = await fetcher();
      await this.set(key, fresh, options);
    } catch (e) {
      console.warn("[Cache] background revalidation failed:", e);
    }
  }

  // ==================== MISSING EXPORT FUNCTIONS ====================
  static async getCacheStats(): Promise<{
    memorySize: number;
    namespaces: string[];
    totalEntries: number;
  }> {
    // This is a simplified implementation
    return {
      memorySize: 0,
      namespaces: ['content', 'api', 'session'],
      totalEntries: 0
    };
  }

  static getCacheKey(baseKey: string, params: Record<string, string | number> = {}): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return paramString ? `${baseKey}?${paramString}` : baseKey;
  }

  static async cacheResponse<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      revalidate?: number;
    } = {}
  ): Promise<T> {
    const cacheInstance = new Cache<T>({
      namespace: 'api',
      ttl: options.ttl || 300
    });
    
    return cacheInstance.getWithRevalidation(key, fetcher, { ttl: options.ttl });
  }
}

export const cache = new Cache();
export function createCache<T = any>(options: CacheOptions = {}) {
  return new Cache<T>(options);
}

export const contentCache = createCache({ namespace: "content", ttl: 3600 });
export const apiCache = createCache({ namespace: "api", ttl: 300 });
export const sessionCache = createCache({ namespace: "session", ttl: 86400 });

// Export the static methods as standalone functions for compatibility
export const getCacheStats = Cache.getCacheStats;
export const getCacheKey = Cache.getCacheKey;
export const cacheResponse = Cache.cacheResponse;