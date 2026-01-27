// lib/server/redis.ts
import "server-only";

export type RedisClient = any;

let _client: RedisClient | null = null;

export async function getRedis(): Promise<RedisClient> {
  if (_client) return _client;

  // Lazy import so bundlers don't pull ioredis into non-node graphs
  const { default: Redis } = await import("ioredis");

  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is missing");

  _client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  return _client;
}