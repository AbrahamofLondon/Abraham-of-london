/* lib/redis-edge.ts — EDGE ONLY (Upstash-compatible + memory fallback) */

export type EdgeRedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    options?: { ex?: number }
  ) => Promise<"OK" | string>;
  del: (...keys: string[]) => Promise<number>;
  ping: () => Promise<"PONG" | string>;
};

type MemRec = {
  v: string;
  exp?: number;
};

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

function memSet(key: string, value: string, ex?: number): void {
  if (typeof ex === "number" && ex > 0) {
    memory.set(key, {
      v: String(value),
      exp: now() + ex * 1000,
    });
    return;
  }

  memory.set(key, { v: String(value) });
}

const memoryClient: EdgeRedisClient = {
  get: async (key: string) => memGet(key),

  set: async (
    key: string,
    value: string,
    options?: { ex?: number }
  ): Promise<"OK"> => {
    memSet(key, value, options?.ex);
    return "OK";
  },

  del: async (...keys: string[]): Promise<number> => {
    let count = 0;

    for (const key of keys) {
      if (memory.delete(key)) count += 1;
    }

    return count;
  },

  ping: async (): Promise<"PONG"> => "PONG",
};

type UpstashCloudflareRedisInstance = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: string,
    options?: { ex?: number }
  ) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  ping: () => Promise<unknown>;
};

type UpstashCloudflareModule = {
  Redis: new (config: {
    url: string;
    token: string;
  }) => UpstashCloudflareRedisInstance;
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
    const mod =
      (await import("@upstash/redis/cloudflare")) as UpstashCloudflareModule;

    const RedisCtor = mod.Redis;

    if (!RedisCtor) {
      cached = memoryClient;
      return cached;
    }

    const redis = new RedisCtor({ url, token });

    const client: EdgeRedisClient = {
      get: async (key: string): Promise<string | null> => {
        const result = await redis.get(key);
        return result === null ? null : String(result);
      },

      set: async (
        key: string,
        value: string,
        options?: { ex?: number }
      ): Promise<"OK" | string> => {
        const result =
          options?.ex && options.ex > 0
            ? await redis.set(key, value, { ex: options.ex })
            : await redis.set(key, value);

        return typeof result === "string" ? result : "OK";
      },

      del: async (...keys: string[]): Promise<number> => {
        if (keys.length === 0) return 0;

        const results = await Promise.all(
          keys.map(async (key) => {
            const result = await redis.del(key);
            return Number(result);
          })
        );

        return results.reduce((acc, value) => acc + value, 0);
      },

      ping: async (): Promise<"PONG" | string> => {
        const result = await redis.ping();
        return typeof result === "string" ? result : "PONG";
      },
    };

    cached = client;
    return cached;
  } catch {
    cached = memoryClient;
    return cached;
  }
}

export default { getEdgeRedis };