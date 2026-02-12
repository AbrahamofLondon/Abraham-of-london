/* lib/redis-safe.ts — PRODUCTION HARDENED, ZERO-TRACE EDGE SAFE */
import { Redis } from "@upstash/redis";

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

// -------------------- Runtime Detection (Edge-Safe) --------------------

const isEdge = typeof (globalThis as any).EdgeRuntime === "string";

function getRuntime(): RedisStats["runtime"] {
  if (isEdge) return "edge";
  // Avoid process.versions.node access to prevent Edge warnings
  if (typeof process !== "undefined" && (process as any).env) return "node";
  return "unknown";
}

// -------------------- In-Memory Store --------------------
const memory = new Map<string, { v: string; exp?: number }>();

// -------------------- Client Logic --------------------
let cachedClient: { client: SafeRedisClient; type: RedisStats["type"] } | null = null;

async function resolveClient() {
  if (cachedClient) return cachedClient;

  const upUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash (Preferred for Edge & Node)
  if (upUrl && upToken) {
    const r = new Redis({ url: upUrl, token: upToken });
    const client: SafeRedisClient = {
      get: async (k) => { const v = await r.get(k); return v === null ? null : String(v); },
      set: async (k, v, ...args) => {
        if (args[0] === "EX") return r.set(k, v, { ex: Number(args[1]) });
        return r.set(k, v);
      },
      del: async (...keys) => {
        const res = await Promise.all(keys.map(k => r.del(k)));
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
      hset: async (k, f, v) => r.hset(k, f, v),
      hgetall: async (k) => r.hgetall(k),
      lpush: async (k, ...v) => r.lpush(k, ...v),
      rpush: async (k, ...v) => r.rpush(k, ...v),
      lrange: async (k, s, e) => r.lrange(k, s, e),
    };
    return (cachedClient = { client, type: "upstash" });
  }

  // 2. Fallback to ioredis (Node Only - Isolated from Edge Bundler)
  if (!isEdge) {
    try {
      // Blinding Webpack: Opaque string prevents static analysis of the @/lib/redis path
      const ioredisPath = ["@", "lib", "redis"].join("/");
      const mod = require(ioredisPath);
      const redisClient = mod.getRedis?.() || mod.redisClient || mod.default;
      
      if (redisClient) {
        return (cachedClient = { client: redisClient, type: "ioredis" });
      }
    } catch (e) {
      console.warn("[REDIS] ioredis fallback failed, proceeding to memory.");
    }
  }

  // 3. Memory Fallback
  const memClient: any = {
    get: async (k: string) => memory.get(k)?.v || null,
    set: async (k: string, v: string) => { memory.set(k, { v }); return "OK"; },
    del: async (k: string) => (memory.delete(k) ? 1 : 0),
    ping: async () => "PONG",
    keys: async () => Array.from(memory.keys()),
    exists: async (...keys: string[]) => keys.filter(k => memory.has(k)).length,
    incr: async (k: string) => {
      const val = parseInt(memory.get(k)?.v || "0") + 1;
      memory.set(k, { v: val.toString() });
      return val;
    }
  };
  return (cachedClient = { client: memClient, type: "memory" });
}

// -------------------- Public Exports --------------------

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
  const runtime = getRuntime();
  let connectionStatus: RedisStats["connectionStatus"] = "disconnected";
  
  try {
    const pong = await resolved.client.ping();
    if (pong) connectionStatus = "connected";
  } catch (e) {}

  return {
    available: connectionStatus === "connected" && resolved.type !== "memory",
    type: resolved.type,
    runtime,
    connectionStatus,
  };
}

export async function safeGet(key: string): Promise<string | null> {
  const r = await getRedis();
  return r.get(key);
}

export async function safeSet(key: string, value: string, options?: { ex: number }) {
  const r = await getRedis();
  return options?.ex ? r.set(key, value, "EX", options.ex) : r.set(key, value);
}

export default { getRedis, getRedisStats, safePing, safeGet, safeSet };