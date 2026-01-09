// lib/redis-enhanced.node.ts
import Redis from "ioredis";

type StoredValue = { value: string; expiresAt?: number };

class MemoryRedis {
  private store = new Map<string, StoredValue>();
  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  async set(key: string, value: string, options?: { EX?: number }) {
    const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }
  async setex(key: string, seconds: number, value: string) {
    return this.set(key, value, { EX: seconds });
  }
  async del(key: string) {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }
  async keys(pattern: string) {
    const allKeys = Array.from(this.store.keys());
    if (pattern === "*") return allKeys;
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return allKeys.filter((k) => regex.test(k));
  }
  async ping() {
    return "PONG";
  }
  async quit() {}
  async sadd(key: string, member: string) {
    const current = (await this.get(key)) || "[]";
    const set = new Set<string>(JSON.parse(current));
    set.add(member);
    await this.set(key, JSON.stringify(Array.from(set)));
    return 1;
  }
  async smembers(key: string) {
    const value = await this.get(key);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  async srem(key: string, member: string) {
    const current = (await this.get(key)) || "[]";
    const set = new Set<string>(JSON.parse(current));
    const existed = set.delete(member);
    if (existed) {
      await this.set(key, JSON.stringify(Array.from(set)));
      return 1;
    }
    return 0;
  }
  async mget(keys: string[]) {
    return Promise.all(keys.map((k) => this.get(k)));
  }
  async exists(key: string) {
    const v = await this.get(key);
    return v === null ? 0 : 1;
  }
}

let underlying: any | MemoryRedis | null = null;

function hasRedisUrl(): boolean {
  return !!process.env.REDIS_URL;
}

async function createUnderlying() {
  if (!hasRedisUrl()) return new MemoryRedis();

  try {
    const client = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

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

async function getUnderlyingClient() {
  if (underlying) return underlying;
  underlying = await createUnderlying();
  return underlying;
}

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
    const c = underlying;
    underlying = null;
    if (c && typeof c.quit === "function") await c.quit();
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
  async exists(key: string) {
    const c = await getUnderlyingClient();
    if (typeof c.exists === "function") return c.exists(key);
    const v = await c.get(key);
    return v === null ? 0 : 1;
  },
};

export default redis;
export type RedisInterface = typeof redis;