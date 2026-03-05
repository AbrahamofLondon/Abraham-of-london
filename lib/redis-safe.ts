/* lib/redis-safe.ts — NODE ONLY (Upstash + memory fallback), build-safe */
import "server-only";

export type RedisStats = {
  available: boolean;
  type: "upstash" | "memory";
  runtime: "node";
  connectionStatus: "connected" | "disconnected" | "unknown";
  error?: string;
};

export type SafeRedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ...args: any[]) => Promise<any>;
  del: (...keys: string[]) => Promise<number>;
  ping: () => Promise<any>;
  keys: (pattern: string) => Promise<string[]>;
  exists: (...keys: string[]) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  decr: (key: string) => Promise<number>;
  hget: (key: string, field: string) => Promise<string | null>;
  hset: (key: string, field: string, value: string) => Promise<number>;
  hgetall: (key: string) => Promise<Record<string, string>>;
  lpush: (key: string, ...values: string[]) => Promise<number>;
  rpush: (key: string, ...values: string[]) => Promise<number>;
  lrange: (key: string, start: number, stop: number) => Promise<string[]>;
};

// -----------------------------------------------------------------------------
// In-memory fallback
// -----------------------------------------------------------------------------
type MemRec = { v: string; exp?: number };

const memory = new Map<string, MemRec>();
const memoryHashes = new Map<string, Map<string, string>>();
const memoryLists = new Map<string, string[]>();

function now(): number {
  return Date.now();
}

function memGet(key: string): string | null {
  const rec = memory.get(key);
  if (!rec) return null;

  if (typeof rec.exp === "number" && now() > rec.exp) {
    memory.delete(key);
    return null;
  }

  return rec.v;
}

function memSet(key: string, value: string, exSeconds?: number): void {
  if (typeof exSeconds === "number" && exSeconds > 0) {
    memory.set(key, { v: value, exp: now() + exSeconds * 1000 });
    return;
  }
  memory.set(key, { v: value });
}

const memoryClient: SafeRedisClient = {
  get: async (k) => memGet(k),

  set: async (k, v, ...args) => {
    if (args[0] === "EX") {
      const seconds = Number(args[1] ?? 0);
      memSet(k, String(v), seconds);
      return "OK";
    }

    memSet(k, String(v));
    return "OK";
  },

  del: async (...keys) => {
    let count = 0;

    for (const k of keys) {
      if (memory.delete(k)) count += 1;
      memoryHashes.delete(k);
      memoryLists.delete(k);
    }

    return count;
  },

  ping: async () => "PONG",

  keys: async (pattern) => {
    const all = new Set<string>([
      ...memory.keys(),
      ...memoryHashes.keys(),
      ...memoryLists.keys(),
    ]);

    if (!pattern || pattern === "*") {
      return Array.from(all);
    }

    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      return Array.from(all).filter((k) => k.startsWith(prefix));
    }

    return all.has(pattern) ? [pattern] : [];
  },

  exists: async (...keys) => {
    let count = 0;
    for (const k of keys) {
      if (memGet(k) !== null) count += 1;
    }
    return count;
  },

  expire: async (k, seconds) => {
    const value = memGet(k);
    if (value === null) return 0;
    memSet(k, value, Number(seconds));
    return 1;
  },

  ttl: async (k) => {
    const rec = memory.get(k);
    if (!rec) return -2;
    if (!rec.exp) return -1;

    const ms = rec.exp - now();
    return ms <= 0 ? -2 : Math.ceil(ms / 1000);
  },

  incr: async (k) => {
    const current = parseInt(memGet(k) ?? "0", 10);
    const next = current + 1;
    memSet(k, String(next));
    return next;
  },

  decr: async (k) => {
    const current = parseInt(memGet(k) ?? "0", 10);
    const next = current - 1;
    memSet(k, String(next));
    return next;
  },

  hget: async (k, f) => {
    const h = memoryHashes.get(k);
    if (!h) return null;
    return h.get(f) ?? null;
  },

  hset: async (k, f, v) => {
    let h = memoryHashes.get(k);
    if (!h) {
      h = new Map<string, string>();
      memoryHashes.set(k, h);
    }

    const existed = h.has(f);
    h.set(f, String(v));
    return existed ? 0 : 1;
  },

  hgetall: async (k) => {
    const h = memoryHashes.get(k);
    if (!h) return {};

    const out: Record<string, string> = {};
    for (const [kk, vv] of h.entries()) {
      out[kk] = vv;
    }
    return out;
  },

  lpush: async (k, ...values) => {
    const list = memoryLists.get(k) ?? [];
    for (const v of values) {
      list.unshift(String(v));
    }
    memoryLists.set(k, list);
    return list.length;
  },

  rpush: async (k, ...values) => {
    const list = memoryLists.get(k) ?? [];
    for (const v of values) {
      list.push(String(v));
    }
    memoryLists.set(k, list);
    return list.length;
  },

  lrange: async (k, start, stop) => {
    const list = memoryLists.get(k) ?? [];
    if (!list.length) return [];

    const s = Math.max(0, start);
    const e = stop < 0 ? list.length - 1 : Math.min(list.length - 1, stop);

    if (s > e) return [];
    return list.slice(s, e + 1);
  },
};

// -----------------------------------------------------------------------------
// Upstash Node client
// IMPORTANT:
// - Use plain "@upstash/redis" in Node.
// - DO NOT import this file from Edge runtime code.
// -----------------------------------------------------------------------------
let cached: { client: SafeRedisClient; type: RedisStats["type"] } | null = null;

async function resolveClient(): Promise<{ client: SafeRedisClient; type: RedisStats["type"] }> {
  if (cached) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    cached = { client: memoryClient, type: "memory" };
    return cached;
  }

  try {
    const mod = await import("@upstash/redis");
    const Redis = (mod as any).Redis;

    if (!Redis) {
      cached = { client: memoryClient, type: "memory" };
      return cached;
    }

    const r = new Redis({ url, token });

    const client: SafeRedisClient = {
      get: async (k) => {
        const v = await r.get(k);
        return v === null ? null : String(v);
      },

      set: async (k, v, ...args) => {
        if (args[0] === "EX") {
          return r.set(k, v, { ex: Number(args[1]) });
        }
        return r.set(k, v);
      },

      del: async (...keys) => {
        const results = await Promise.all(keys.map((k) => r.del(k)));
        return results.reduce((acc: number, item: unknown) => acc + Number(item), 0);
      },

      ping: async () => r.ping(),

      keys: async (pattern) => {
        const result = await r.keys(pattern);
        return Array.isArray(result) ? result.map(String) : [];
      },

      exists: async (...keys) => {
        const result = await r.exists(...keys);
        return Number(result);
      },

      expire: async (key, seconds) => {
        const result = await r.expire(key, seconds);
        return Number(result);
      },

      ttl: async (key) => {
        const result = await r.ttl(key);
        return Number(result);
      },

      incr: async (key) => {
        const result = await r.incr(key);
        return Number(result);
      },

      decr: async (key) => {
        const result = await r.decr(key);
        return Number(result);
      },

      hget: async (key, field) => {
        const v = await r.hget(key, field);
        return v === null ? null : String(v);
      },

      hset: async (key, field, value) => {
        const result = await r.hset(key, field, value);
        return Number(result);
      },

      hgetall: async (key) => {
        const obj = await r.hgetall(key);
        const out: Record<string, string> = {};

        for (const [kk, vv] of Object.entries(obj ?? {})) {
          out[String(kk)] = String(vv);
        }

        return out;
      },

      lpush: async (key, ...values) => {
        const result = await r.lpush(key, ...values);
        return Number(result);
      },

      rpush: async (key, ...values) => {
        const result = await r.rpush(key, ...values);
        return Number(result);
      },

      lrange: async (key, start, stop) => {
        const result = await r.lrange(key, start, stop);
        return Array.isArray(result) ? result.map(String) : [];
      },
    };

    cached = { client, type: "upstash" };
    return cached;
  } catch {
    cached = { client: memoryClient, type: "memory" };
    return cached;
  }
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------
export async function getRedis(): Promise<SafeRedisClient> {
  const resolved = await resolveClient();
  return resolved.client;
}

export async function safePing(): Promise<boolean> {
  try {
    const r = await getRedis();
    const res = await r.ping();
    return res === "PONG" || res === "OK" || res === true;
  } catch {
    return false;
  }
}

export async function getRedisStats(): Promise<RedisStats> {
  const resolved = await resolveClient();
  let connectionStatus: RedisStats["connectionStatus"] = "unknown";

  try {
    const pong = await resolved.client.ping();
    connectionStatus = pong ? "connected" : "disconnected";
  } catch (e: any) {
    connectionStatus = "disconnected";
    return {
      available: false,
      type: resolved.type,
      runtime: "node",
      connectionStatus,
      error: e?.message ? String(e.message) : "Redis ping failed",
    };
  }

  return {
    available: connectionStatus === "connected" && resolved.type === "upstash",
    type: resolved.type,
    runtime: "node",
    connectionStatus,
  };
}

export async function safeGet(key: string): Promise<string | null> {
  const r = await getRedis();
  return r.get(key);
}

export async function safeSet(
  key: string,
  value: string,
  options?: { ex: number }
): Promise<any> {
  const r = await getRedis();
  return options?.ex ? r.set(key, value, "EX", options.ex) : r.set(key, value);
}

export default {
  getRedis,
  getRedisStats,
  safePing,
  safeGet,
  safeSet,
};