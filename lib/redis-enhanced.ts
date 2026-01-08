/**
 * Enhanced Redis client with fallbacks and error handling
 * Build-safe: avoids ioredis imports during webpack bundling
 */

type StringMap = Record<string, string>;

class MemoryRedis {
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
}

// Underlying client can be ioredis OR memory
type UnderlyingClient = MemoryRedis | any;

let underlying: UnderlyingClient | null = null;

// Safely check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

async function getUnderlyingClient(): Promise<UnderlyingClient> {
  if (underlying) return underlying;

  const hasRedisUrl = !!process.env.REDIS_URL;
  const isEdge = process.env.NEXT_RUNTIME === "edge";

  // Return memory store for browser or if Redis is not configured
  if (isBrowser || !hasRedisUrl || isEdge) {
    underlying = new MemoryRedis();
    return underlying;
  }

  try {
    // Dynamically import ioredis only on the server side
    const mod = await import("ioredis");
    const RedisCtor = (mod as any).default || mod;

    const client = new RedisCtor(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });

    // Don't hard-fail build if ping fails; just fallback to memory
    try {
      await client.ping();
      underlying = client;
      return underlying;
    } catch {
      underlying = new MemoryRedis();
      return underlying;
    }
  } catch {
    underlying = new MemoryRedis();
    return underlying;
  }
}

// Wrapper (stable API regardless of backend)
export const redis = {
  async get(key: string) {
    return (await getUnderlyingClient()).get(key);
  },
  async set(key: string, value: string, options?: { EX?: number }) {
    return (await getUnderlyingClient()).set(key, value, options);
  },
  async setex(key: string, seconds: number, value: string) {
    return (await getUnderlyingClient()).setex(key, seconds, value);
  },
  async del(key: string) {
    return (await getUnderlyingClient()).del(key);
  },
  async keys(pattern: string) {
    return (await getUnderlyingClient()).keys(pattern);
  },
  async ping() {
    return (await getUnderlyingClient()).ping();
  },
  async quit() {
    if (underlying && (underlying as any).quit) await (underlying as any).quit();
    underlying = null;
  },
  async sadd(key: string, member: string) {
    return (await getUnderlyingClient()).sadd(key, member);
  },
  async smembers(key: string) {
    return (await getUnderlyingClient()).smembers(key);
  },
  async srem(key: string, member: string) {
    return (await getUnderlyingClient()).srem(key, member);
  },
  async mget(keys: string[]) {
    return (await getUnderlyingClient()).mget(keys);
  },
  // expose raw client (for advanced libs)
  async raw() {
    return getUnderlyingClient();
  },
  
  // Additional method to check connection status
  isAvailable: async () => {
    try {
      await getUnderlyingClient();
      return true;
    } catch {
      return false;
    }
  },
  
  // Get client instance (for compatibility)
  getClient: async () => {
    return getUnderlyingClient();
  },
  
  // Get stats about the connection
  getStats: async () => {
    const client = await getUnderlyingClient();
    return {
      isConnected: client instanceof MemoryRedis ? true : await client.ping().then(() => true).catch(() => false),
      usingMemoryStore: client instanceof MemoryRedis
    };
  }
};

export type RedisClient = Awaited<ReturnType<typeof redis.raw>>;
export type RedisStats = { isConnected: boolean; usingMemoryStore: boolean };
export type RedisOptions = any; // Add proper type if needed

export function createNamespacedClient(namespace: string) {
  const p = (k: string) => `${namespace}:${k}`;
  return {
    get: (k: string) => redis.get(p(k)),
    set: (k: string, v: string, o?: { EX?: number }) => redis.set(p(k), v, o),
    del: (k: string) => redis.del(p(k)),
    sadd: (k: string, m: string) => redis.sadd(p(k), m),
    smembers: (k: string) => redis.smembers(p(k)),
    srem: (k: string, m: string) => redis.srem(p(k), m),
  };
}

export async function getRedis() {
  return redis;
}

// Export a synchronous getter for the client (returns null if not initialized)
export function getRedisClientSync() {
  return underlying;
}

// Initialize on module load if in Node.js environment
if (!isBrowser && typeof process !== 'undefined') {
  // Initialize in the background but don't block
  getUnderlyingClient().catch(() => {
    // Silent catch - memory store will be used
  });
}

export default redis;