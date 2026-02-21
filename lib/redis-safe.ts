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

// -------------------- Runtime Detection (SAFE) --------------------
function hasProcessEnv(): boolean {
  return typeof process !== "undefined" && !!(process as any).env;
}

function env(key: string): string | undefined {
  return hasProcessEnv() ? (process as any).env?.[key] : undefined;
}

const isEdgeRuntime =
  // Next Edge runtime global
  typeof (globalThis as any).EdgeRuntime === "string" ||
  // Next also signals this when process exists
  env("NEXT_RUNTIME") === "edge";

function getRuntime(): RedisStats["runtime"] {
  if (isEdgeRuntime) return "edge";
  if (hasProcessEnv()) return "node";
  return "unknown";
}

// -------------------- In-Memory Store (FULL-ish Implementation) --------------------
type MemRec = { v: string; exp?: number };
const memory = new Map<string, MemRec>();
const memoryHashes = new Map<string, Map<string, string>>();
const memoryLists = new Map<string, string[]>();

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

function memSet(key: string, value: string, exSeconds?: number) {
  if (typeof exSeconds === "number" && exSeconds > 0) {
    memory.set(key, { v: value, exp: now() + exSeconds * 1000 });
  } else {
    memory.set(key, { v: value });
  }
}

const memoryClient: SafeRedisClient = {
  get: async (k) => memGet(k),

  set: async (k, v, ...args) => {
    // support: set(key, value, "EX", seconds)
    if (args[0] === "EX") {
      const seconds = Number(args[1] ?? 0);
      memSet(k, String(v), seconds);
      return "OK";
    }
    memSet(k, String(v));
    return "OK";
  },

  del: async (...keys) => {
    let c = 0;
    for (const k of keys) {
      if (memory.delete(k)) c += 1;
      memoryHashes.delete(k);
      memoryLists.delete(k);
    }
    return c;
  },

  ping: async () => "PONG",

  keys: async (pattern) => {
    const all = new Set<string>([
      ...memory.keys(),
      ...memoryHashes.keys(),
      ...memoryLists.keys(),
    ]);

    if (!pattern || pattern === "*") return Array.from(all);

    // simple glob: prefix*
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      return Array.from(all).filter((k) => k.startsWith(prefix));
    }

    // exact match
    return all.has(pattern) ? [pattern] : [];
  },

  exists: async (...keys) =>
    keys.reduce((a, k) => a + (memGet(k) !== null ? 1 : 0), 0),

  expire: async (k, seconds) => {
    const v = memGet(k);
    if (v === null) return 0;
    memSet(k, v, Number(seconds));
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

  // Hashes
  hget: async (k, f) => {
    const h = memoryHashes.get(k);
    if (!h) return null;
    return h.get(f) ?? null;
  },

  hset: async (k, f, v) => {
    let h = memoryHashes.get(k);
    if (!h) {
      h = new Map();
      memoryHashes.set(k, h);
    }
    const existed = h.has(f);
    h.set(f, String(v));
    return existed ? 0 : 1;
  },

  hgetall: async (k) => {
    const h = memoryHashes.get(k);
    if (!h) return {};
    const obj: Record<string, string> = {};
    for (const [kk, vv] of h.entries()) obj[kk] = vv;
    return obj;
  },

  // Lists
  lpush: async (k, ...values) => {
    const list = memoryLists.get(k) ?? [];
    for (const v of values) list.unshift(String(v));
    memoryLists.set(k, list);
    return list.length;
  },

  rpush: async (k, ...values) => {
    const list = memoryLists.get(k) ?? [];
    for (const v of values) list.push(String(v));
    memoryLists.set(k, list);
    return list.length;
  },

  lrange: async (k, start, stop) => {
    const list = memoryLists.get(k) ?? [];
    const s = Math.max(0, start);
    const e = stop < 0 ? list.length : Math.min(list.length - 1, stop);
    if (list.length === 0 || s > e) return [];
    return list.slice(s, e + 1);
  },
};

// -------------------- Upstash Resolver (SAFE, dynamic, Edge-compatible) --------------------
let cached: { client: SafeRedisClient; type: RedisStats["type"] } | null = null;

async function resolveClient(): Promise<{ client: SafeRedisClient; type: RedisStats["type"] }> {
  if (cached) return cached;

  const url = env("UPSTASH_REDIS_REST_URL");
  const token = env("UPSTASH_REDIS_REST_TOKEN");

  // If env missing, go memory (no drama)
  if (!url || !token) {
    return (cached = { client: memoryClient, type: "memory" });
  }

  try {
    // IMPORTANT:
    // - We only use "@upstash/redis" (fetch-based) which works in Edge and Node.
    // - We do NOT import "@upstash/redis/nodejs" at all (avoids Edge bundle trap).
    const mod = await import("@upstash/redis");
    const Redis = mod.Redis;
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
      hget: async (k, f) => {
        const v = await r.hget(k, f);
        return v === null ? null : String(v);
      },
      hset: async (k, f, v2) => Number(await r.hset(k, f, v2)),
      hgetall: async (k) => {
        const obj = await r.hgetall(k);
        // Upstash returns Record<string, string> already, but keep safe:
        const out: Record<string, string> = {};
        for (const [kk, vv] of Object.entries(obj ?? {})) out[kk] = String(vv);
        return out;
      },
      lpush: async (k, ...v3) => Number(await r.lpush(k, ...v3)),
      rpush: async (k, ...v3) => Number(await r.rpush(k, ...v3)),
      lrange: async (k, s, e) => (await r.lrange(k, s, e)).map(String),
    };

    return (cached = { client, type: "upstash" });
  } catch (e: any) {
    return (cached = { client: memoryClient, type: "memory" });
  }
}

// -------------------- Public API --------------------

/** Get the Redis client (Upstash if available, otherwise memory fallback) */
export async function getRedis(): Promise<SafeRedisClient> {
  const resolved = await resolveClient();
  return resolved.client;
}

/** Ping the Redis server */
export async function safePing(): Promise<boolean> {
  try {
    const r = await getRedis();
    const res = await r.ping();
    return res === "PONG" || res === "OK" || res === true;
  } catch {
    return false;
  }
}

/** Get connection statistics */
export async function getRedisStats(): Promise<RedisStats> {
  const resolved = await resolveClient();
  const runtime = getRuntime();
  let connectionStatus: RedisStats["connectionStatus"] = "unknown";

  try {
    const pong = await resolved.client.ping();
    connectionStatus = pong ? "connected" : "disconnected";
  } catch (e: any) {
    connectionStatus = "disconnected";
    return {
      available: false,
      type: resolved.type,
      runtime,
      connectionStatus,
      error: e?.message ? String(e.message) : "Redis ping failed",
    };
  }

  return {
    available: connectionStatus === "connected" && resolved.type === "upstash",
    type: resolved.type,
    runtime,
    connectionStatus,
  };
}

/** Convenience: get a single key */
export async function safeGet(key: string): Promise<string | null> {
  const r = await getRedis();
  return r.get(key);
}

/** Convenience: set a single key with optional expiration */
export async function safeSet(key: string, value: string, options?: { ex: number }) {
  const r = await getRedis();
  return options?.ex ? r.set(key, value, "EX", options.ex) : r.set(key, value);
}

// Default export for legacy compatibility
export default { getRedis, getRedisStats, safePing, safeGet, safeSet };