// lib/server/cache.ts
import crypto from "crypto";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class MemoryTTLCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    // basic size control (FIFO-ish)
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value as string | undefined;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Serverless note: this is per-instance memory; that's fine for "best-effort" caching.
const memoryCache = new MemoryTTLCache(500);

function stableStringify(obj: unknown): string {
  // Stable stringify so cache keys don't change due to key order
  const seen = new WeakSet();
  const sorter = (_key: string, value: any) => {
    if (value && typeof value === "object") {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);

      if (Array.isArray(value)) return value;
      return Object.keys(value)
        .sort()
        .reduce((acc: any, k) => {
          acc[k] = value[k];
          return acc;
        }, {});
    }
    return value;
  };
  return JSON.stringify(obj, sorter);
}

export function getCacheKey(prefix: string, payload: unknown): string {
  const raw = `${prefix}:${stableStringify(payload)}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return `${prefix}:${hash}`;
}

export const cacheResponse = {
  async get<T>(key: string): Promise<T | null> {
    return memoryCache.get<T>(key);
  },
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    memoryCache.set(key, value, ttlSeconds);
  },
  async del(key: string): Promise<void> {
    memoryCache.del(key);
  },
};
