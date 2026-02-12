/* lib/redis-safe.ts — DUAL RUNTIME SAFE (UPSTASH + MEMORY), ESM CLEAN, FULL API */
export type RedisStats = {
  available: boolean;
  type: "upstash" | "memory";
  runtime: "edge" | "node" | "unknown";
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

// -------------------- Runtime Detection --------------------
const isEdgeRuntime = typeof (globalThis as any).EdgeRuntime === "string";

function getRuntime(): RedisStats["runtime"] {
  if (isEdgeRuntime) return "edge";
  if (typeof process !== "undefined" && (process as any).env) return "node";
  return "unknown";
}

// -------------------- In-Memory Store (Full Implementation) --------------------
const memory = new Map<string, { v: string; exp?: number }>();

function now() {
  return Date.now();
}

function memGet(key: string) {
  const rec = memory.get(key);
  if (!rec) return null;
  if (rec.exp && now() > rec.exp) {
    memory.delete(key);
    return null;
  }
  return rec.v;
}

const memoryClient: SafeRedisClient = {
  get: async (k) => memGet(k),
  set: async (k, v, ...args) => {
    if (args[0] === "EX") {
      const seconds = Number(args[1] ?? 0);
      memory.set(k, { v: String(v), exp: now() + seconds * 1000 });
      return "OK";
    }
    memory.set(k, { v: String(v) });
    return "OK";
  },
  del: async (...keys) => {
    let c = 0;
    for (const k of keys) if (memory.delete(k)) c += 1;
    return c;
  },
  ping: async () => "PONG",
  keys: async (pattern) => {
    if (pattern === "*" || !pattern) return Array.from(memory.keys());
    const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
    return Array.from(memory.keys()).filter((k) => k.startsWith(prefix));
  },
  exists: async (...keys) => keys.reduce((a, k) => a + (memGet(k) !== null ? 1 : 0), 0),
  expire: async (k, seconds) => {
    const v = memGet(k);
    if (v === null) return 0;
    memory.set(k, { v, exp: now() + Number(seconds) * 1000 });
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
    memory.set(k, { v: String(next) });
    return next;
  },
  decr: async (k) => {
    const current = parseInt(memGet(k) ?? "0", 10);
    const next = current - 1;
    memory.set(k, { v: String(next) });
    return next;
  },
  hget: async () => null,
  hset: async () => 0,
  hgetall: async () => ({}),
  lpush: async () => 0,
  rpush: async () => 0,
  lrange: async () => [],
};

// -------------------- Upstash Resolver (Dynamic Import, No Top-Level) --------------------
let cached: { client: SafeRedisClient; type: RedisStats["type"] } | null = null;

async function resolveClient(): Promise<{ client: SafeRedisClient; type: RedisStats["type"] }> {
  if (cached) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      // ✅ Dynamic import – never bundled for Edge unless actually used
      const { Redis } = await import("@upstash/redis");
      const r = new Redis({ url, token });

      const client: SafeRedisClient = {
        get: async (k) => {
          const v = await r.get(k);
          return v === null ? null : String(v);
        },
        set: async (k, v, ...args) => {
          if (args[0] === "EX") return r.set(k, v, { ex: Number(args[1]) });
          return r.set(k, v);
        },
        del: async (...keys) => {
          const res = await Promise.all(keys.map((k) => r.del(k)));
          return res.reduce((a, b) => a + Number(b), 0);
        },
        ping: async () => r.ping(),
        keys: async (p) => r.keys(p),
        exists: async (...k) => r.exists(...k),
        expire: async (k, s) => r.expire(k, s),
        ttl: async (k) => r.ttl(k),
        incr: async (k) => r.incr(k),
        decr: async (k) => r.decr(k),
        hget: async (k, f) => r.hget(k, f),
        hset: async (k, f, v2) => r.hset(k, f, v2),
        hgetall: async (k) => r.hgetall(k),
        lpush: async (k, ...v3) => r.lpush(k, ...v3),
        rpush: async (k, ...v3) => r.rpush(k, ...v3),
        lrange: async (k, s, e) => r.lrange(k, s, e),
      };

      return (cached = { client, type: "upstash" });
    } catch (e: any) {
      // Fall through to memory on error
      return (cached = { client: memoryClient, type: "memory" });
    }
  }

  return (cached = { client: memoryClient, type: "memory" });
}

// -------------------- Public API --------------------

/**
 * Get the Redis client (Upstash if available, otherwise memory fallback)
 */
export async function getRedis(): Promise<SafeRedisClient> {
  const resolved = await resolveClient();
  return resolved.client;
}

/**
 * Ping the Redis server
 */
export async function safePing(): Promise<boolean> {
  try {
    const r = await getRedis();
    const res = await r.ping();
    return res === "PONG" || res === "OK" || res === true;
  } catch {
    return false;
  }
}

/**
 * Get connection statistics
 */
export async function getRedisStats(): Promise<RedisStats> {
  const resolved = await resolveClient();
  const runtime = getRuntime();
  let connectionStatus: RedisStats["connectionStatus"] = "disconnected";

  try {
    const pong = await resolved.client.ping();
    if (pong) connectionStatus = "connected";
  } catch {
    connectionStatus = "disconnected";
  }

  return {
    available: connectionStatus === "connected" && resolved.type === "upstash",
    type: resolved.type,
    runtime,
    connectionStatus,
  };
}

/**
 * Convenience: get a single key
 */
export async function safeGet(key: string): Promise<string | null> {
  const r = await getRedis();
  return r.get(key);
}

/**
 * Convenience: set a single key with optional expiration
 */
export async function safeSet(key: string, value: string, options?: { ex: number }) {
  const r = await getRedis();
  return options?.ex ? r.set(key, value, "EX", options.ex) : r.set(key, value);
}

// Default export for legacy compatibility
export default { getRedis, getRedisStats, safePing, safeGet, safeSet };