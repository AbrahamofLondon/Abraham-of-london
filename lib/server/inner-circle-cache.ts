/* lib/server/inner-circle-cache.ts */
/**
 * Edge-safe in-memory caching layer for Inner Circle.
 *
 * Important:
 * - No dependency on the `redis` package
 * - No Node-only Redis clients
 * - Safe for Next.js builds and Edge-sensitive code paths
 * - Preserves the existing public API shape as much as possible
 */

import { logAuditEvent, AUDIT_ACTIONS } from "./audit";

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
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

type CacheEntry<T = unknown> = {
  value: T;
  expiresAt: number;
};

export class InnerCircleCache {
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  private store = new Map<string, CacheEntry>();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.INNER_CIRCLE_ENABLE_CACHE === "true",
      ttl: config.ttl ?? Number(process.env.INNER_CIRCLE_CACHE_TTL || 300),
      redisUrl: config.redisUrl ?? process.env.REDIS_URL,
      namespace: config.namespace ?? "inner-circle:",
    };
  }

  private getKey(key: string): string {
    return `${this.config.namespace}${key}`;
  }

  private isExpired(entry: CacheEntry | undefined): boolean {
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  private pruneIfExpired(key: string): void {
    const entry = this.store.get(key);
    if (this.isExpired(entry)) {
      this.store.delete(key);
    }
  }

  private async safeOperation<T>(
    _operation: string,
    fn: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    if (!this.config.enabled) return fallback;

    try {
      return await fn();
    } catch (error) {
      console.error("[InnerCircleCache] operation failed:", error);
      this.stats.errors += 1;
      return fallback;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return this.safeOperation(
      "set",
      async () => {
        const fullKey = this.getKey(key);
        const ttlSeconds = ttl ?? this.config.ttl;

        this.store.set(fullKey, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });

        this.stats.sets += 1;
        return true;
      },
      false
    );
  }

  async get<T>(key: string): Promise<T | null> {
    return this.safeOperation(
      "get",
      async () => {
        const fullKey = this.getKey(key);
        this.pruneIfExpired(fullKey);

        const entry = this.store.get(fullKey);
        if (!entry) {
          this.stats.misses += 1;
          return null;
        }

        this.stats.hits += 1;
        return entry.value as T;
      },
      null
    );
  }

  async delete(key: string): Promise<boolean> {
    return this.safeOperation(
      "delete",
      async () => {
        const fullKey = this.getKey(key);
        const existed = this.store.delete(fullKey);
        if (existed) this.stats.deletes += 1;
        return existed;
      },
      false
    );
  }

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

  async cacheMember(memberId: string, data: unknown): Promise<boolean> {
    return this.set(`member:${memberId}`, data, 3600);
  }

  async getCachedMember<T = unknown>(memberId: string): Promise<T | null> {
    return this.get<T>(`member:${memberId}`);
  }

  async cacheKeyVerification(keyHash: string, result: unknown): Promise<boolean> {
    return this.set(`verify:${keyHash}`, result, 60);
  }

  async getCachedKeyVerification<T = unknown>(keyHash: string): Promise<T | null> {
    return this.get<T>(`verify:${keyHash}`);
  }

  async cacheMemberKeys(memberId: string, keys: unknown[]): Promise<boolean> {
    return this.set(`member-keys:${memberId}`, keys, 300);
  }

  async getCachedMemberKeys<T = unknown[]>(memberId: string): Promise<T | null> {
    return this.get<T>(`member-keys:${memberId}`);
  }

  async cacheSystemStats(stats: unknown): Promise<boolean> {
    return this.set("system:stats", stats, 900);
  }

  async getCachedSystemStats<T = unknown>(): Promise<T | null> {
    return this.get<T>("system:stats");
  }

  async invalidateMemberCache(memberId: string): Promise<void> {
    await Promise.all([
      this.delete(`member:${memberId}`),
      this.delete(`member-keys:${memberId}`),
      this.delete("system:stats"),
    ]);

    await this.deletePattern("verify:");
  }

  async deletePattern(pattern: string): Promise<number> {
    return this.safeOperation(
      "deletePattern",
      async () => {
        const prefix = this.getKey(pattern);
        let deleted = 0;

        for (const key of Array.from(this.store.keys())) {
          if (key.startsWith(prefix)) {
            this.store.delete(key);
            deleted += 1;
          }
        }

        this.stats.deletes += deleted;
        return deleted;
      },
      0
    );
  }

  async clearAll(): Promise<boolean> {
    return this.safeOperation(
      "clearAll",
      async () => {
        const sizeBefore = this.store.size;
        this.store.clear();
        this.stats.deletes += sizeBefore;

        await logAuditEvent({
          actorType: "system",
          action: AUDIT_ACTIONS.CONFIGURATION_CHANGE,
          resourceType: "cache",
          status: "success",
          details: { action: "cache_cleared" },
        }).catch(() => {});

        return true;
      },
      false
    );
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  isAvailable(): boolean {
    return this.config.enabled;
  }

  async healthCheck(): Promise<{ ok: boolean; details: string }> {
    if (!this.config.enabled) {
      return { ok: true, details: "Cache disabled" };
    }

    return { ok: true, details: "In-memory cache healthy" };
  }

  async close(): Promise<void> {
    this.store.clear();
  }
}

let cacheInstance: InnerCircleCache | null = null;

export function getCache(config?: Partial<CacheConfig>): InnerCircleCache {
  if (!cacheInstance) {
    cacheInstance = new InnerCircleCache(config);
  }
  return cacheInstance;
}

export const CACHE_KEYS = {
  MEMBER: (id: string) => `member:${id}`,
  MEMBER_KEYS: (id: string) => `member-keys:${id}`,
  KEY_VERIFICATION: (hash: string) => `verify:${hash}`,
  SYSTEM_STATS: "system:stats",
  DAILY_STATS: (date: string) => `stats:daily:${date}`,
  MEMBER_ACTIVITY: (id: string) => `activity:${id}`,
  KEY_METRICS: (id: string) => `metrics:key:${id}`,
  SEARCH_RESULTS: (query: string) =>
    `search:${Buffer.from(query).toString("base64")}`,
} as const;

export function withCache(
  key: string,
  ttl = 300,
  options: {
    bypass?: boolean;
    invalidateOnMethods?: string[];
    cacheEmpty?: boolean;
  } = {}
) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cache = getCache();

      const req = args[0] as { method?: string } | undefined;

      const shouldBypass =
        options.bypass === true ||
        (Array.isArray(options.invalidateOnMethods) &&
          typeof req?.method === "string" &&
          options.invalidateOnMethods.includes(req.method));

      if (!cache.isAvailable() || shouldBypass) {
        return originalMethod.apply(this, args);
      }

      const cacheKey = `${propertyKey}:${key}:${JSON.stringify(args)}`;

      try {
        const cached = await cache.get(cacheKey);
        if (cached !== null) {
          return cached;
        }

        const result = await originalMethod.apply(this, args);

        if ((result === null || result === undefined) && !options.cacheEmpty) {
          return result;
        }

        await cache.set(cacheKey, result, ttl);
        return result;
      } catch (error) {
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
  withCache,
};