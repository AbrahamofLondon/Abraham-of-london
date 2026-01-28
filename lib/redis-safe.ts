// lib/redis-safe.ts — PRODUCTION HARDENED, EDGE-SAFE, NO @vercel/kv
/**
 * Safe Redis access that works in both Node + Edge without bundling hazards.
 *
 * Strategy:
 * - Prefer Upstash REST (Edge-safe) if UPSTASH_REDIS_REST_URL/TOKEN are present.
 * - In Node runtime only, fall back to your local ioredis client via "@/lib/redis".
 * - Final fallback: in-memory store (process-local; best-effort).
 *
 * RULE: This module must NEVER import "@vercel/kv".
 */

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export type RedisStats = {
  available: boolean;
  type: "upstash" | "ioredis" | "memory" | "none";
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

// -------------------- runtime detection (edge-safe) --------------------

const isEdgeRuntime =
  typeof (globalThis as any).EdgeRuntime !== "undefined" ||
  typeof (globalThis as any).caches !== "undefined" ||
  (typeof globalThis !== "undefined" && "caches" in globalThis);

function isNodeRuntime(): boolean {
  try {
    return (
      typeof process !== "undefined" &&
      typeof process.release === "object" &&
      process.release?.name === "node"
    );
  } catch {
    return false;
  }
}

function getRuntime(): RedisStats["runtime"] {
  return isEdgeRuntime ? "edge" : isNodeRuntime() ? "node" : "unknown";
}

function getEnv(name: string): string | undefined {
  try {
    return typeof process !== "undefined" && process.env ? process.env[name] : undefined;
  } catch {
    return undefined;
  }
}

function getUpstashEnv(): { url?: string; token?: string } {
  return {
    url: getEnv("UPSTASH_REDIS_REST_URL"),
    token: getEnv("UPSTASH_REDIS_REST_TOKEN"),
  };
}

// -------------------- in-memory fallback store --------------------

type MemRec = { v: string; expiresAt?: number };
const memory = new Map<string, MemRec>();

function memGet(key: string): string | null {
  const rec = memory.get(key);
  if (!rec) return null;
  if (rec.expiresAt && Date.now() > rec.expiresAt) {
    memory.delete(key);
    return null;
  }
  return rec.v ?? null;
}

function memSet(key: string, value: string, exSeconds?: number): void {
  const expiresAt = exSeconds ? Date.now() + exSeconds * 1000 : undefined;
  memory.set(key, { v: value, expiresAt });
}

function memDel(...keys: string[]): number {
  let n = 0;
  for (const k of keys) if (memory.delete(k)) n++;
  return n;
}

function memKeys(pattern: string): string[] {
  // very light glob: "*" only
  if (pattern === "*") return Array.from(memory.keys());
  if (!pattern.includes("*")) return memory.has(pattern) ? [pattern] : [];
  const prefix = pattern.split("*")[0] ?? "";
  return Array.from(memory.keys()).filter((k) => k.startsWith(prefix));
}

export const redisStub: SafeRedisClient = {
  get: async () => null,
  set: async () => null,
  del: async () => 0,
  ping: async () => "PONG",
  keys: async () => [],
  exists: async () => 0,
  expire: async () => 0,
  ttl: async () => -1,
  incr: async () => 0,
  decr: async () => 0,
  hget: async () => null,
  hset: async () => 0,
  hgetall: async () => ({}),
  lpush: async () => 0,
  rpush: async () => 0,
  lrange: async () => [],
};

// -------------------- client resolution (cached) --------------------

type Resolved = { client: SafeRedisClient; type: RedisStats["type"] };

let cached: Resolved | null | false = null;

async function makeUpstashClient(): Promise<Resolved | null> {
  const { url, token } = getUpstashEnv();
  if (!url || !token) return null;

  try {
    const { Redis } = await import("@upstash/redis");
    const r = new Redis({ url, token });

    const client: SafeRedisClient = {
      get: async (k) => {
        const v = await r.get(k);
        return typeof v === "string" ? v : v == null ? null : String(v);
      },
      set: async (k, v, ...args) => {
        // support "EX seconds" or "PX ms" style calls
        if (args?.length >= 2 && typeof args[0] === "string") {
          const mode = String(args[0]).toUpperCase();
          const n = Number(args[1]);
          if (mode === "EX" && Number.isFinite(n)) return r.set(k, v, { ex: n });
          if (mode === "PX" && Number.isFinite(n)) return r.set(k, v, { px: n });
        }
        return r.set(k, v);
      },
      del: async (...keys) => {
        // upstash del accepts variadic keys in newer versions; be defensive:
        if (keys.length === 1) return (await r.del(keys[0])) as any;
        const results = await Promise.all(keys.map((k) => r.del(k)));
        return results.reduce((a, b) => a + (Number(b) || 0), 0);
      },
      ping: async () => r.ping(),
      keys: async (pattern) => {
        // Upstash REST keys() exists; if not, return []
        const anyR: any = r as any;
        if (typeof anyR.keys === "function") return (await anyR.keys(pattern)) as string[];
        return [];
      },
      exists: async (...keys) => {
        const anyR: any = r as any;
        if (typeof anyR.exists === "function") return (await anyR.exists(...keys)) as number;
        // fallback: probe
        const vals = await Promise.all(keys.map((k) => r.get(k)));
        return vals.filter((v) => v != null).length;
      },
      expire: async (key, seconds) => {
        const anyR: any = r as any;
        if (typeof anyR.expire === "function") return (await anyR.expire(key, seconds)) as number;
        // emulate by reset
        const v = await r.get(key);
        if (v == null) return 0;
        await r.set(key, v as any, { ex: seconds });
        return 1;
      },
      ttl: async (key) => {
        const anyR: any = r as any;
        if (typeof anyR.ttl === "function") return (await anyR.ttl(key)) as number;
        return -1;
      },
      incr: async (key) => {
        const anyR: any = r as any;
        if (typeof anyR.incr === "function") return (await anyR.incr(key)) as number;
        const cur = await r.get(key);
        const next = (Number(cur) || 0) + 1;
        await r.set(key, String(next));
        return next;
      },
      decr: async (key) => {
        const anyR: any = r as any;
        if (typeof anyR.decr === "function") return (await anyR.decr(key)) as number;
        const cur = await r.get(key);
        const next = (Number(cur) || 0) - 1;
        await r.set(key, String(next));
        return next;
      },
      hget: async (key, field) => {
        const anyR: any = r as any;
        if (typeof anyR.hget === "function") return (await anyR.hget(key, field)) as string | null;
        return null;
      },
      hset: async (key, field, value) => {
        const anyR: any = r as any;
        if (typeof anyR.hset === "function") return (await anyR.hset(key, field, value)) as number;
        return 0;
      },
      hgetall: async (key) => {
        const anyR: any = r as any;
        if (typeof anyR.hgetall === "function") return (await anyR.hgetall(key)) as Record<string, string>;
        return {};
      },
      lpush: async (key, ...values) => {
        const anyR: any = r as any;
        if (typeof anyR.lpush === "function") return (await anyR.lpush(key, ...values)) as number;
        return 0;
      },
      rpush: async (key, ...values) => {
        const anyR: any = r as any;
        if (typeof anyR.rpush === "function") return (await anyR.rpush(key, ...values)) as number;
        return 0;
      },
      lrange: async (key, start, stop) => {
        const anyR: any = r as any;
        if (typeof anyR.lrange === "function") return (await anyR.lrange(key, start, stop)) as string[];
        return [];
      },
    };

    return { client, type: "upstash" };
  } catch {
    return null;
  }
}

async function makeNodeIoredisClient(): Promise<Resolved | null> {
  if (isEdgeRuntime) return null;
  if (!isNodeRuntime()) return null;

  // Only attempt if REDIS_URL exists (avoid pointless imports)
  const redisUrl = getEnv("REDIS_URL");
  if (!redisUrl) return null;

  try {
    const mod: any = await import("@/lib/redis");
    const r =
      typeof mod.getRedis === "function"
        ? mod.getRedis()
        : mod.redisClient
          ? mod.redisClient
          : null;

    if (!r) return null;

    const client: SafeRedisClient = {
      get: (k) => r.get(k),
      set: (k, v, ...args) => r.set(k, v, ...args),
      del: (...keys) => r.del(...keys),
      ping: () => r.ping(),
      keys: (pattern) => r.keys(pattern),
      exists: (...keys) => r.exists(...keys),
      expire: (k, s) => r.expire(k, s),
      ttl: (k) => r.ttl(k),
      incr: (k) => r.incr(k),
      decr: (k) => r.decr(k),
      hget: (k, f) => r.hget(k, f),
      hset: (k, f, v) => r.hset(k, f, v),
      hgetall: (k) => r.hgetall(k),
      lpush: (k, ...v) => r.lpush(k, ...v),
      rpush: (k, ...v) => r.rpush(k, ...v),
      lrange: (k, s, e) => r.lrange(k, s, e),
    };

    return { client, type: "ioredis" };
  } catch {
    return null;
  }
}

function makeMemoryClient(): Resolved {
  const client: SafeRedisClient = {
    get: async (k) => memGet(k),
    set: async (k, v, ...args) => {
      // support set(key,val,'EX',seconds)
      if (args?.length >= 2 && typeof args[0] === "string") {
        const mode = String(args[0]).toUpperCase();
        const n = Number(args[1]);
        if (mode === "EX" && Number.isFinite(n)) {
          memSet(k, v, n);
          return "OK";
        }
      }
      memSet(k, v);
      return "OK";
    },
    del: async (...keys) => memDel(...keys),
    ping: async () => "PONG",
    keys: async (pattern) => memKeys(pattern),
    exists: async (...keys) => keys.filter((k) => memGet(k) != null).length,
    expire: async (k, s) => {
      const v = memGet(k);
      if (v == null) return 0;
      memSet(k, v, s);
      return 1;
    },
    ttl: async () => -1,
    incr: async (k) => {
      const cur = Number(memGet(k) ?? "0") || 0;
      const next = cur + 1;
      memSet(k, String(next));
      return next;
    },
    decr: async (k) => {
      const cur = Number(memGet(k) ?? "0") || 0;
      const next = cur - 1;
      memSet(k, String(next));
      return next;
    },
    hget: async () => null,
    hset: async () => 0,
    hgetall: async () => ({}),
    lpush: async () => 0,
    rpush: async () => 0,
    lrange: async () => [],
  };

  return { client, type: "memory" };
}

async function resolveClient(): Promise<Resolved | null> {
  if (cached !== null) return cached || null;

  // Upstash first (works in Edge + Node)
  const upstash = await makeUpstashClient();
  if (upstash) {
    cached = upstash;
    return upstash;
  }

  // Node ioredis second (Node only)
  const node = await makeNodeIoredisClient();
  if (node) {
    cached = node;
    return node;
  }

  // Memory fallback last
  const mem = makeMemoryClient();
  cached = mem;
  return mem;
}

// -------------------- public API --------------------

export async function getRedis(): Promise<SafeRedisClient | null> {
  try {
    const r = await resolveClient();
    return r?.client ?? null;
  } catch {
    return null;
  }
}

export async function getRedisStats(): Promise<RedisStats> {
  const runtime = getRuntime();

  try {
    const r = await resolveClient();
    if (!r) {
      return {
        available: false,
        type: "none",
        runtime,
        connectionStatus: "disconnected",
      };
    }

    let status: RedisStats["connectionStatus"] = "unknown";
    try {
      await r.client.ping();
      status = "connected";
    } catch {
      status = "disconnected";
    }

    return {
      available: status === "connected" && r.type !== "memory",
      type: r.type,
      runtime,
      connectionStatus: status,
    };
  } catch (e: any) {
    return {
      available: false,
      type: "none",
      runtime,
      connectionStatus: "disconnected",
      error: e?.message ? String(e.message) : "unknown error",
    };
  }
}

// Convenience helpers (never throw)
export async function safeGet(key: string): Promise<string | null> {
  try {
    const r = await getRedis();
    return r?.get ? await r.get(key) : null;
  } catch {
    return null;
  }
}

export async function safeSet(
  key: string,
  value: string,
  options?: { ex?: number; px?: number }
): Promise<boolean> {
  try {
    const r = await getRedis();
    if (!r?.set) return false;

    if (options?.ex) {
      await r.set(key, value, "EX", options.ex);
      return true;
    }
    if (options?.px) {
      await r.set(key, value, "PX", options.px);
      return true;
    }

    await r.set(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function safeDel(...keys: string[]): Promise<number> {
  try {
    const r = await getRedis();
    return r?.del ? await r.del(...keys) : 0;
  } catch {
    return 0;
  }
}

export async function safePing(): Promise<boolean> {
  try {
    const r = await getRedis();
    if (!r?.ping) return false;
    const out = await r.ping();
    return out === "PONG" || out === true;
  } catch {
    return false;
  }
}

export async function redisHealthCheck(): Promise<{
  healthy: boolean;
  details: RedisStats;
  latencyMs?: number;
}> {
  const start = Date.now();
  const details = await getRedisStats();
  return {
    healthy: details.connectionStatus === "connected",
    details,
    latencyMs: Date.now() - start,
  };
}

export function isRedisConfigured(): boolean {
  const { url, token } = getUpstashEnv();
  const nodeUrl = getEnv("REDIS_URL");
  return Boolean((url && token) || nodeUrl);
}

export default {
  getRedis,
  getRedisStats,
  safeGet,
  safeSet,
  safeDel,
  safePing,
  redisHealthCheck,
  isRedisConfigured,
  redisStub,
};