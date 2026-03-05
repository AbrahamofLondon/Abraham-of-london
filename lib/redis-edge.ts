/* lib/redis-edge.ts — EDGE ONLY (Upstash + memory fallback) */

export type EdgeRedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<any>;
  del: (...keys: string[]) => Promise<number>;
  ping: () => Promise<any>;
};

type MemRec = { v: string; exp?: number };
const memory = new Map<string, MemRec>();

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

const memoryClient: EdgeRedisClient = {
  get: async (k) => memGet(k),
  set: async (k, v, options) => {
    const ex = options?.ex;
    if (typeof ex === "number" && ex > 0) {
      memory.set(k, { v: String(v), exp: now() + ex * 1000 });
    } else {
      memory.set(k, { v: String(v) });
    }
    return "OK";
  },
  del: async (...keys) => {
    let count = 0;
    for (const k of keys) {
      if (memory.delete(k)) count += 1;
    }
    return count;
  },
  ping: async () => "PONG",
};

let cached: EdgeRedisClient | null = null;

export async function getEdgeRedis(): Promise<EdgeRedisClient> {
  if (cached) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    cached = memoryClient;
    return cached;
  }

  try {
    const mod = await import("@upstash/redis/cloudflare");
    const Redis = (mod as any).Redis;
    const r = new Redis({ url, token });

    cached = {
      get: async (k) => {
        const v = await r.get(k);
        return v === null ? null : String(v);
      },
      set: async (k, v, options) => {
        return r.set(k, v, options?.ex ? { ex: options.ex } : undefined);
      },
      del: async (...keys) => {
        const results = await Promise.all(keys.map((k) => r.del(k)));
        return results.reduce((acc: number, item: unknown) => acc + Number(item), 0);
      },
      ping: async () => r.ping(),
    };

    return cached;
  } catch {
    cached = memoryClient;
    return cached;
  }
}

export default { getEdgeRedis };