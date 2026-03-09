// lib/server/token-store.ts
import "server-only";

type MinimalRedisClient = {
  connect: () => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    options?: { EX?: number }
  ) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  on: (event: "error", listener: (err: unknown) => void) => unknown;
};

let redisClient: MinimalRedisClient | null = null;
let redisConnecting: Promise<MinimalRedisClient | null> | null = null;

function getRedisUrl(): string | null {
  return process.env.REDIS_URL || process.env.INNER_CIRCLE_REDIS_URL || null;
}

async function getRedis(): Promise<MinimalRedisClient | null> {
  if (redisClient) return redisClient;
  if (redisConnecting) return redisConnecting;

  redisConnecting = (async () => {
    const url = getRedisUrl();
    if (!url) return null;

    try {
      const mod = await import("redis");

      // Intentionally cast through unknown so we depend only on the tiny surface we use.
      const client = mod.createClient({ url }) as unknown as MinimalRedisClient;

      client.on("error", (err) => {
        const message =
          err instanceof Error ? err.message : String(err ?? "unknown error");
        console.warn("[redis] client error", message);
      });

      await client.connect();
      redisClient = client;
      return redisClient;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? "unknown error");
      console.warn("[redis] connect failed; redis disabled", message);
      redisClient = null;
      return null;
    } finally {
      redisConnecting = null;
    }
  })();

  return redisConnecting;
}

const PREFIX = "aol:";

export type Tier = "public" | "inner-circle" | "private";

export async function tokenStoreSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  await redis.set(`${PREFIX}${key}`, JSON.stringify(value), {
    EX: ttlSeconds,
  });
}

export async function tokenStoreGet<T = unknown>(
  key: string
): Promise<T | null> {
  const redis = await getRedis();
  if (!redis) return null;

  const raw = await redis.get(`${PREFIX}${key}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function tokenStoreDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  await redis.del(`${PREFIX}${key}`);
}

export default {
  tokenStoreSet,
  tokenStoreGet,
  tokenStoreDel,
};