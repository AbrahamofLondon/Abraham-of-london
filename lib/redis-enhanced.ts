// lib/redis-enhanced.ts
/**
 * Build-safe Redis wrapper:
 * - No top-level process/env mutation (prevents SWC weirdness)
 * - Uses MemoryRedis when REDIS_URL missing, on Edge runtime, or during build analysis
 * - Dynamically imports ioredis only on Node runtime
 */

type StoredValue = { value: string; expiresAt?: number };

class MemoryRedis {
  private store = new Map<string, StoredValue>();

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
    const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : undefined;
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
    if (pattern === "*") return allKeys;
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return allKeys.filter((k) => regex.test(k));
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async quit(): Promise<void> {}

  async sadd(key: string, member: string): Promise<number> {
    const current = (await this.get(key)) || "[]";
    const set = new Set<string>(JSON.parse(current));
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
    const current = (await this.get(key)) || "[]";
    const set = new Set<string>(JSON.parse(current));
    const existed = set.delete(member);
    if (existed) {
      await this.set(key, JSON.stringify(Array.from(set)));
      return 1;
    }
    return 0;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map((k) => this.get(k)));
  }

  // Optional compat for callers that check exists()
  async exists(key: string): Promise<number> {
    const v = await this.get(key);
    return v === null ? 0 : 1;
  }
}

type UnderlyingClient = any | MemoryRedis;

let underlying: UnderlyingClient | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isEdgeRuntime(): boolean {
  // Next.js sets NEXT_RUNTIME="edge" in Edge contexts
  return typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge";
}

function hasRedisUrl(): boolean {
  return typeof process !== "undefined" && !!process.env?.REDIS_URL;
}

async function createUnderlying(): Promise<UnderlyingClient> {
  // Always memory in browser/edge or if no REDIS_URL
  if (isBrowser() || isEdgeRuntime() || !hasRedisUrl()) return new MemoryRedis();

  // Node runtime + REDIS_URL: try ioredis (dynamic import)
  try {
    const mod = await import("ioredis");
    const RedisCtor = (mod as any).default ?? (mod as any);
    const client = new RedisCtor(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });

    // Don’t fail build if ping fails—fallback to memory
    try {
      await client.ping();
      return client;
    } catch {
      return new MemoryRedis();
    }
  } catch {
    return new MemoryRedis();
  }
}

async function getUnderlyingClient(): Promise<UnderlyingClient> {
  if (underlying) return underlying;
  underlying = await createUnderlying();
  return underlying;
}

export interface RedisInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  ping(): Promise<string>;
  quit(): Promise<void>;
  sadd(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, member: string): Promise<number>;
  mget(keys: string[]): Promise<(string | null)[]>;
  exists?(key: string): Promise<number>;
  getClient(): Promise<UnderlyingClient>;
  getStats(): Promise<{ isConnected: boolean; usingMemoryStore: boolean }>;
}

export const redis: RedisInterface = {
  async get(key) {
    return (await getUnderlyingClient()).get(key);
  },
  async set(key, value, options) {
    return (await getUnderlyingClient()).set(key, value, options);
  },
  async setex(key, seconds, value) {
    return (await getUnderlyingClient()).setex(key, seconds, value);
  },
  async del(key) {
    return (await getUnderlyingClient()).del(key);
  },
  async keys(pattern) {
    return (await getUnderlyingClient()).keys(pattern);
  },
  async ping() {
    return (await getUnderlyingClient()).ping();
  },
  async quit() {
    const c = underlying;
    underlying = null;
    if (c && typeof (c as any).quit === "function") await (c as any).quit();
  },
  async sadd(key, member) {
    return (await getUnderlyingClient()).sadd(key, member);
  },
  async smembers(key) {
    return (await getUnderlyingClient()).smembers(key);
  },
  async srem(key, member) {
    return (await getUnderlyingClient()).srem(key, member);
  },
  async mget(keys) {
    return (await getUnderlyingClient()).mget(keys);
  },
  async exists(key) {
    const c = await getUnderlyingClient();
    if (typeof (c as any).exists === "function") return (c as any).exists(key);
    // memory fallback
    const v = await c.get(key);
    return v === null ? 0 : 1;
  },
  async getClient() {
    return getUnderlyingClient();
  },
  async getStats() {
    const c = await getUnderlyingClient();
    const usingMemoryStore = c instanceof MemoryRedis;
    if (usingMemoryStore) return { isConnected: true, usingMemoryStore: true };
    try {
      await (c as any).ping();
      return { isConnected: true, usingMemoryStore: false };
    } catch {
      return { isConnected: false, usingMemoryStore: false };
    }
  },
};

export type RedisClient = Awaited<ReturnType<typeof redis.getClient>>;
export type RedisStats = { isConnected: boolean; usingMemoryStore: boolean };
export type RedisOptions = any;

export interface NamespacedClient {
  get(k: string): Promise<string | null>;
  set(k: string, v: string, o?: { EX?: number }): Promise<void>;
  del(k: string): Promise<number>;
  sadd(k: string, m: string): Promise<number>;
  smembers(k: string): Promise<string[]>;
  srem(k: string, m: string): Promise<number>;
}

export function createNamespacedClient(namespace: string): NamespacedClient {
  const p = (k: string) => `${namespace}:${k}`;
  return {
    get: (k) => redis.get(p(k)),
    set: (k, v, o) => redis.set(p(k), v, o),
    del: (k) => redis.del(p(k)),
    sadd: (k, m) => redis.sadd(p(k), m),
    smembers: (k) => redis.smembers(p(k)),
    srem: (k, m) => redis.srem(p(k), m),
  };
}

export async function getRedis(): Promise<RedisInterface> {
  return redis;
}

export default redis;