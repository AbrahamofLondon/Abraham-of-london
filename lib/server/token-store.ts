// lib/server/token-store.ts
import type { RedisClientType } from "redis";

let _redis: RedisClientType | null = null;
let _redisConnecting: Promise<RedisClientType | null> | null = null;

function getRedisUrl(): string | null {
  return process.env.REDIS_URL || process.env.INNER_CIRCLE_REDIS_URL || null;
}

async function getRedis(): Promise<RedisClientType | null> {
  if (_redis) return _redis;
  if (_redisConnecting) return _redisConnecting;

  _redisConnecting = (async () => {
    const url = getRedisUrl();
    if (!url) return null;

    try {
      const { createClient } = await import("redis");
      const client = createClient({ url });

      client.on("error", (err) => {
        // keep log minimal in production
        console.warn("[redis] client error", err?.message || err);
      });

      await client.connect();
      _redis = client;
      return _redis;
    } catch (e: any) {
      console.warn("[redis] connect failed; redis disabled", e?.message || e);
      _redis = null;
      return null;
    } finally {
      _redisConnecting = null;
    }
  })();

  return _redisConnecting;
}

const PREFIX = "aol:";

export type Tier = "public" | "inner-circle" | "private";

export async function tokenStoreSet(key: string, value: any, ttlSeconds: number) {
  const redis = await getRedis();
  if (!redis) return;
  await redis.set(`${PREFIX}${key}`, JSON.stringify(value), { EX: ttlSeconds });
}

export async function tokenStoreGet<T = any>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (!redis) return null;
  const raw = await redis.get(`${PREFIX}${key}`);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function tokenStoreDel(key: string) {
  const redis = await getRedis();
  if (!redis) return;
  await redis.del(`${PREFIX}${key}`);
}