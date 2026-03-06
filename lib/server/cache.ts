// lib/server/cache.ts - ONLY cache functionality (type-safe, wrapper-agnostic)

type CacheOptions = {
  ttl?: number; // seconds
  namespace?: string;
  staleWhileRevalidate?: number; // seconds
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
  lastModified?: string;
}

/**
 * Minimal Redis surface we rely on (wrapper-agnostic).
 * Supports:
 * - Upstash style: set(key, value, { ex })
 * - ioredis style: set(key, value, "EX", seconds)
 */
type RedisLike = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ...args: any[]) => Promise<any>;
  del: (...keys: string[]) => Promise<number> | Promise<any>;
  keys: (pattern: string) => Promise<string[]>;
  mget?: (...keys: string[]) => Promise<(string | null)[]>;
  ping?: () => Promise<string>;
};

function nowMs() {
  return Date.now();
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

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
   * Get the redis wrapper (Memory fallback handled by "@/lib/redis" in your stack)
   * IMPORTANT: This file stays pages-safe; dynamic import avoids hard coupling.
   */
  private async getRedis(): Promise<RedisLike | null> {
    try {
      // Your project uses "@/lib/redis" as the canonical resolver in several places.
      // If it doesn't exist in some environments, we fail open to memory.
      const mod = (await import("@/lib/redis")) as any;

      // allow either:
      // - export function getRedis(): RedisLike
      // - default export { getRedis }
      const getRedisFn = mod?.getRedis || mod?.default?.getRedis;
      if (typeof getRedisFn !== "function") return null;

      const redis = getRedisFn();
      if (!redis) return null;

      // duck-type validate
      if (typeof redis.get !== "function" || typeof redis.set !== "function" || typeof redis.keys !== "function") {
        return null;
      }
      if (typeof redis.del !== "function") return null;

      return redis as RedisLike;
    } catch (e) {
      console.warn("[Cache] Redis wrapper not available:", e);
      return null;
    }
  }

  async get(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    const now = nowMs();

    // 1) Memory
    const mem = this.memoryCache.get(cacheKey);
    if (mem && now < mem.expiresAt) return mem.data;
    if (mem && now >= mem.expiresAt) this.memoryCache.delete(cacheKey);

    // 2) Redis
    try {
      const r = await this.getRedis();
      if (!r) return null;

      const raw = await r.get(cacheKey);
      if (!raw) return null;

      const entry = safeJsonParse<CacheEntry<T>>(raw);
      if (!entry) return null;

      if (now < entry.expiresAt) {
        this.memoryCache.set(cacheKey, entry);
        return entry.data;
      }

      // expired -> cleanup best-effort
      try {
        await r.del(cacheKey);
      } catch {
        // ignore
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
    const now = nowMs();
    const expiresAt = now + ttl * 1000;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      etag: options?.etag,
      lastModified: options?.lastModified,
    };

    // 1) Memory
    this.memoryCache.set(cacheKey, entry);

    // 2) Redis
    try {
      const r = await this.getRedis();
      if (!r) return;

      const payload = JSON.stringify(entry);

      // Prefer Upstash style if supported: set(key, value, { ex })
      try {
        await r.set(cacheKey, payload, { ex: ttl });
        return;
      } catch {
        // Fallback to ioredis style: set(key, value, "EX", seconds)
      }

      await r.set(cacheKey, payload, "EX", ttl);
    } catch (e) {
      console.warn("[Cache] set failed:", e);
    }
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);
    this.memoryCache.delete(cacheKey);

    try {
      const r = await this.getRedis();
      if (!r) return;
      await r.del(cacheKey);
    } catch (e) {
      console.warn("[Cache] delete failed:", e);
    }
  }

  async has(key: string): Promise<boolean> {
    const cacheKey = this.generateKey(key);
    const now = nowMs();

    // 1) Memory
    const mem = this.memoryCache.get(cacheKey);
    if (mem && now < mem.expiresAt) return true;

    // 2) Redis
    try {
      const r = await this.getRedis();
      if (!r) return false;

      const raw = await r.get(cacheKey);
      if (!raw) return false;

      const entry = safeJsonParse<CacheEntry<T>>(raw);
      if (!entry) return false;

      if (now < entry.expiresAt) return true;

      // expired -> cleanup best-effort
      try {
        await r.del(cacheKey);
      } catch {
        // ignore
      }
    } catch (e) {
      console.warn("[Cache] has failed:", e);
    }

    return false;
  }

  async clear(): Promise<void> {
    // 1) Memory (namespace-only)
    for (const k of [...this.memoryCache.keys()]) {
      if (k.startsWith(this.namespace + ":")) this.memoryCache.delete(k);
    }

    // 2) Redis (namespace-only)
    try {
      const r = await this.getRedis();
      if (!r) return;

      const keys = await r.keys(`${this.namespace}:*`);
      if (!keys?.length) return;

      // Wrapper del may accept spread or single; handle conservatively.
      for (const k of keys) {
        try {
          await r.del(k);
        } catch {
          // ignore
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
      staleWhileRevalidate: this.staleWhileRevalidate,
    };
  }

  async getWithRevalidation(key: string, fetcher: () => Promise<T>, options?: { ttl?: number }): Promise<T> {
    const cacheKey = this.generateKey(key);
    const now = nowMs();

    const cached = await this.get(key);
    if (cached !== null) {
      const mem = this.memoryCache.get(cacheKey);

      // stale-while-revalidate window
      if (mem && now < mem.expiresAt + this.staleWhileRevalidate * 1000) {
        if (now >= mem.expiresAt) void this.revalidateInBackground(key, fetcher, options);
        return cached;
      }

      // outside SWR window -> fetch fresh
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

  // ==================== STATIC COMPAT FUNCTIONS ====================
  static async getCacheStats(): Promise<{
    memorySize: number;
    namespaces: string[];
    totalEntries: number;
  }> {
    // Minimal implementation; you can enhance with redis keyscan if needed.
    return {
      memorySize: 0,
      namespaces: ["content", "api", "session"],
      totalEntries: 0,
    };
  }

  static getCacheKey(baseKey: string, params: Record<string, string | number> = {}): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");

    return paramString ? `${baseKey}?${paramString}` : baseKey;
  }

  static async cacheResponse<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; tags?: string[]; revalidate?: number } = {}
  ): Promise<T> {
    const cacheInstance = new Cache<T>({ namespace: "api", ttl: options.ttl || 300 });
    return cacheInstance.getWithRevalidation(key, fetcher, { ttl: options.ttl });
  }
}

// ==================== SINGLETONS + COMPAT EXPORTS ====================
export const cache = new Cache();
export function createCache<T = any>(options: CacheOptions = {}) {
  return new Cache<T>(options);
}

export const contentCache = createCache({ namespace: "content", ttl: 3600 });
export const apiCache = createCache({ namespace: "api", ttl: 300 });
export const sessionCache = createCache({ namespace: "session", ttl: 86400 });

// Standalone exports (back-compat)
export const getCacheStats = Cache.getCacheStats;
export const getCacheKey = Cache.getCacheKey;
export const cacheResponse = Cache.cacheResponse;