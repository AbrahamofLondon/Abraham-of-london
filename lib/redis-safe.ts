/* lib/redis-safe.ts — runtime-safe memory Redis shim */
import "server-only";

export type RedisStats = {
  available: boolean;
  type: "memory";
  runtime: "node";
  connectionStatus: "connected" | "disconnected" | "unknown";
  error?: string;
};

export type SafeRedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ...args: unknown[]) => Promise<"OK">;
  del: (...keys: string[]) => Promise<number>;
  ping: () => Promise<"PONG">;
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

type MemRec = {
  v: string;
  exp?: number;
};

const memory = new Map<string, MemRec>();
const memoryHashes = new Map<string, Map<string, string>>();
const memoryLists = new Map<string, string[]>();

function now(): number {
  return Date.now();
}

function normalizeExpiry(rec: MemRec | undefined): MemRec | undefined {
  if (!rec) return undefined;
  if (typeof rec.exp === "number" && now() > rec.exp) return undefined;
  return rec;
}

function memGet(key: string): string | null {
  const rec = normalizeExpiry(memory.get(key));
  if (!rec) {
    memory.delete(key);
    return null;
  }
  return rec.v;
}

function memSet(key: string, value: string, exSeconds?: number): void {
  if (typeof exSeconds === "number" && exSeconds > 0) {
    memory.set(key, {
      v: value,
      exp: now() + exSeconds * 1000,
    });
    return;
  }

  memory.set(key, { v: value });
}

function matchPattern(key: string, pattern: string): boolean {
  if (!pattern || pattern === "*") return true;

  // very small glob support: prefix*, *suffix, exact
  if (pattern.startsWith("*") && pattern.endsWith("*")) {
    const part = pattern.slice(1, -1);
    return key.includes(part);
  }

  if (pattern.startsWith("*")) {
    const suffix = pattern.slice(1);
    return key.endsWith(suffix);
  }

  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return key.startsWith(prefix);
  }

  return key === pattern;
}

const memoryClient: SafeRedisClient = {
  get: async (key) => memGet(key),

  set: async (key, value, ...args) => {
    const mode = args[0];
    const ttl = args[1];

    if (mode === "EX" && typeof ttl === "number") {
      memSet(key, String(value), ttl);
      return "OK";
    }

    if (mode === "EX" && typeof ttl === "string") {
      const parsed = Number(ttl);
      memSet(key, String(value), Number.isFinite(parsed) ? parsed : undefined);
      return "OK";
    }

    memSet(key, String(value));
    return "OK";
  },

  del: async (...keys) => {
    let count = 0;

    for (const key of keys) {
      const hadString = memory.delete(key);
      const hadHash = memoryHashes.delete(key);
      const hadList = memoryLists.delete(key);

      if (hadString || hadHash || hadList) count += 1;
    }

    return count;
  },

  ping: async () => "PONG",

  keys: async (pattern) => {
    const allKeys = new Set<string>([
      ...memory.keys(),
      ...memoryHashes.keys(),
      ...memoryLists.keys(),
    ]);

    const out: string[] = [];
    for (const key of allKeys) {
      // prune expired simple values
      if (memory.has(key) && memGet(key) === null) continue;
      if (matchPattern(key, pattern)) out.push(key);
    }

    return out;
  },

  exists: async (...keys) => {
    let count = 0;

    for (const key of keys) {
      const stringExists = memGet(key) !== null;
      const hashExists = memoryHashes.has(key);
      const listExists = memoryLists.has(key);

      if (stringExists || hashExists || listExists) count += 1;
    }

    return count;
  },

  expire: async (key, seconds) => {
    const value = memGet(key);
    if (value === null) return 0;

    memSet(key, value, seconds);
    return 1;
  },

  ttl: async (key) => {
    const rec = memory.get(key);
    if (!rec) return -2;
    if (typeof rec.exp !== "number") return -1;

    const remaining = rec.exp - now();
    if (remaining <= 0) {
      memory.delete(key);
      return -2;
    }

    return Math.ceil(remaining / 1000);
  },

  incr: async (key) => {
    const current = Number.parseInt(memGet(key) ?? "0", 10);
    const next = Number.isFinite(current) ? current + 1 : 1;
    memSet(key, String(next));
    return next;
  },

  decr: async (key) => {
    const current = Number.parseInt(memGet(key) ?? "0", 10);
    const next = Number.isFinite(current) ? current - 1 : -1;
    memSet(key, String(next));
    return next;
  },

  hget: async (key, field) => {
    const hash = memoryHashes.get(key);
    if (!hash) return null;
    return hash.get(field) ?? null;
  },

  hset: async (key, field, value) => {
    let hash = memoryHashes.get(key);
    if (!hash) {
      hash = new Map<string, string>();
      memoryHashes.set(key, hash);
    }

    const existed = hash.has(field);
    hash.set(field, String(value));
    return existed ? 0 : 1;
  },

  hgetall: async (key) => {
    const hash = memoryHashes.get(key);
    if (!hash) return {};

    const out: Record<string, string> = {};
    for (const [k, v] of hash.entries()) out[k] = v;
    return out;
  },

  lpush: async (key, ...values) => {
    const list = memoryLists.get(key) ?? [];
    for (const value of values) list.unshift(String(value));
    memoryLists.set(key, list);
    return list.length;
  },

  rpush: async (key, ...values) => {
    const list = memoryLists.get(key) ?? [];
    for (const value of values) list.push(String(value));
    memoryLists.set(key, list);
    return list.length;
  },

  lrange: async (key, start, stop) => {
    const list = memoryLists.get(key) ?? [];
    if (list.length === 0) return [];

    const normalizedStart = Math.max(0, start);
    const normalizedStop =
      stop < 0 ? list.length - 1 : Math.min(list.length - 1, stop);

    if (normalizedStart > normalizedStop) return [];
    return list.slice(normalizedStart, normalizedStop + 1);
  },
};

const cached = {
  client: memoryClient as SafeRedisClient,
  type: "memory" as const,
};

export async function getRedis(): Promise<SafeRedisClient> {
  return cached.client;
}

export async function safePing(): Promise<boolean> {
  try {
    const redis = await getRedis();
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

export async function getRedisStats(): Promise<RedisStats> {
  try {
    const redis = await getRedis();
    const pong = await redis.ping();

    return {
      available: pong === "PONG",
      type: "memory",
      runtime: "node",
      connectionStatus: pong === "PONG" ? "connected" : "unknown",
    };
  } catch (error) {
    return {
      available: false,
      type: "memory",
      runtime: "node",
      connectionStatus: "disconnected",
      error: error instanceof Error ? error.message : "Redis shim failed",
    };
  }
}

export async function safeGet(key: string): Promise<string | null> {
  const redis = await getRedis();
  return redis.get(key);
}

export async function safeSet(
  key: string,
  value: string,
  options?: { ex: number }
): Promise<"OK"> {
  const redis = await getRedis();
  return options?.ex
    ? redis.set(key, value, "EX", options.ex)
    : redis.set(key, value);
}

export default {
  getRedis,
  getRedisStats,
  safePing,
  safeGet,
  safeSet,
};