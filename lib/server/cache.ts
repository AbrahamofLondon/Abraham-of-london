// lib/server/cache.ts
import crypto from "crypto";
import redis from "@/lib/redis";
import { PerformanceMonitor } from "@/lib/monitoring/performance";
import { sendHealthAlert } from "@/lib/server/alerts";
import { getSecurityStatus } from "@/lib/server/security";
import { getContentStats } from "@/lib/server/content";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  metadata?: {
    hitCount: number;
    createdAt: number;
    lastAccessed: number;
    size?: number;
  };
};

interface CacheOptions {
  maxEntries?: number;
  defaultTTL?: number;
  enableRedis?: boolean;
  redisTTL?: number;
}

class MemoryTTLCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;
  private defaultTTL: number;
  private performanceMonitor: PerformanceMonitor;
  private enableRedis: boolean;
  private redisTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxEntries = options.maxEntries || 500;
    this.defaultTTL = options.defaultTTL || 300; // 5 minutes default
    this.enableRedis = options.enableRedis || false;
    this.redisTTL = options.redisTTL || 3600; // 1 hour for Redis
    this.performanceMonitor = new PerformanceMonitor("cache");
  }

  async get<T>(key: string): Promise<T | null> {
    const perf = this.performanceMonitor.start(`get:${key}`);
    
    try {
      // Try Redis first if enabled
      if (this.enableRedis) {
        const redisValue = await this.getFromRedis<T>(key);
        if (redisValue !== null) {
          perf.end({ source: "redis", hit: true });
          return redisValue;
        }
      }

      // Fall back to memory cache
      const entry = this.store.get(key) as CacheEntry<T> | undefined;
      if (!entry) {
        perf.end({ source: "memory", hit: false });
        return null;
      }

      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        perf.end({ source: "memory", hit: false, expired: true });
        return null;
      }

      // Update metadata
      if (entry.metadata) {
        entry.metadata.hitCount++;
        entry.metadata.lastAccessed = Date.now();
      }

      perf.end({ 
        source: "memory", 
        hit: true,
        hitCount: entry.metadata?.hitCount || 0
      });
      
      return entry.value;
    } catch (error) {
      perf.end({ error: error instanceof Error ? error.message : "Unknown error" });
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    ttlSeconds?: number
  ): Promise<void> {
    const perf = this.performanceMonitor.start(`set:${key}`);
    
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const expiresAt = Date.now() + ttl * 1000;
      
      // Estimate size
      const size = this.estimateSize(value);
      
      // Set in memory cache
      if (this.store.size >= this.maxEntries) {
        await this.evictLeastUsed();
      }

      const entry: CacheEntry<T> = {
        value,
        expiresAt,
        metadata: {
          hitCount: 0,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          size,
        },
      };

      this.store.set(key, entry);

      // Also set in Redis if enabled
      if (this.enableRedis) {
        await this.setInRedis(key, value, ttl);
      }

      perf.end({ 
        size, 
        ttl, 
        redisEnabled: this.enableRedis,
        currentSize: this.store.size
      });

    } catch (error) {
      perf.end({ error: error instanceof Error ? error.message : "Unknown error" });
      console.error("Cache set error:", error);
      
      // Send alert for cache failures
      if (this.enableRedis && error instanceof Error) {
        await sendHealthAlert({
          component: "cache",
          severity: "warning",
          message: `Cache write error: ${error.message}`,
          metadata: { key, error: error.message }
        });
      }
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    
    if (this.enableRedis) {
      try {
        await redis.del(key);
      } catch (error) {
        console.error("Redis delete error:", error);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  async getStats() {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    
    const stats = {
      totalEntries: this.store.size,
      expiredEntries: entries.filter(([_, entry]) => entry.expiresAt < now).length,
      memoryUsage: entries.reduce((sum, [_, entry]) => 
        sum + (entry.metadata?.size || 0), 0
      ),
      hitDistribution: entries.reduce((acc, [_, entry]) => {
        const hits = entry.metadata?.hitCount || 0;
        acc[hits] = (acc[hits] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      securityStatus: await getSecurityStatus(),
      contentStats: await getContentStats(),
    };

    return stats;
  }

  private async evictLeastUsed(): Promise<void> {
    if (this.store.size === 0) return;

    let leastUsedKey: string | null = null;
    let lowestHitCount = Infinity;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.store.entries()) {
      const hitCount = entry.metadata?.hitCount || 0;
      const lastAccessed = entry.metadata?.lastAccessed || 0;
      
      if (hitCount < lowestHitCount || 
          (hitCount === lowestHitCount && lastAccessed < oldestAccess)) {
        lowestHitCount = hitCount;
        oldestAccess = lastAccessed;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.store.delete(leastUsedKey);
      
      // Also remove from Redis if it exists there
      if (this.enableRedis) {
        try {
          await redis.del(leastUsedKey);
        } catch (error) {
          // Silent fail for Redis cleanup
        }
      }
    }
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      
      // Parse JSON stored in Redis
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  private async setInRedis<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error("Redis set error:", error);
      throw error;
    }
  }

  private estimateSize<T>(value: T): number {
    try {
      const serialized = JSON.stringify(value);
      return Buffer.byteLength(serialized, 'utf8');
    } catch {
      return 0;
    }
  }

  // Getters for monitoring
  getCurrentSize(): number {
    return this.store.size;
  }

  getMemoryUsage(): number {
    return Array.from(this.store.values()).reduce((sum, entry) => 
      sum + (entry.metadata?.size || 0), 0
    );
  }
}

// Default cache instance with configuration from environment
const memoryCache = new MemoryTTLCache({
  maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || "500"),
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || "300"),
  enableRedis: process.env.REDIS_URL !== undefined,
  redisTTL: parseInt(process.env.REDIS_CACHE_TTL || "3600"),
});

function stableStringify(obj: unknown): string {
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
    await memoryCache.set(key, value, ttlSeconds);
  },
  
  async del(key: string): Promise<void> {
    await memoryCache.del(key);
  },
  
  async clear(): Promise<void> {
    memoryCache.clear();
  },
  
  async getStats() {
    return memoryCache.getStats();
  },
  
  async healthCheck(): Promise<{
    healthy: boolean;
    memoryEntries: number;
    memoryUsage: number;
    redisEnabled: boolean;
    redisConnected?: boolean;
  }> {
    try {
      const memoryEntries = memoryCache.getCurrentSize();
      const memoryUsage = memoryCache.getMemoryUsage();
      const redisEnabled = memoryCache['enableRedis']; // Access private field
      
      let redisConnected = false;
      if (redisEnabled) {
        try {
          await redis.ping();
          redisConnected = true;
        } catch {
          redisConnected = false;
        }
      }
      
      return {
        healthy: true,
        memoryEntries,
        memoryUsage,
        redisEnabled,
        redisConnected,
      };
    } catch (error) {
      return {
        healthy: false,
        memoryEntries: 0,
        memoryUsage: 0,
        redisEnabled: false,
        redisConnected: false,
      };
    }
  },
};

// ✅ Named export for admin/system-health.ts compatibility
export async function getCacheStats() {
  return cacheResponse.getStats();
}

export default memoryCache;