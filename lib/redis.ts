// lib/redis.ts — SINGLE SOURCE OF TRUTH (SERVER REAL, CLIENT STUB)
// Matches actual call-sites:
// - redisClient.get/set/del/keys
// - redisClient.ping OR redisClient.command('PING')
// - getRedis() used sync in server libs
// - redisPromise used in a few places
//
// IMPORTANT: Keep this file as the canonical "@/lib/redis" target.
// Add tsconfig paths mapping to force resolution.

export type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<any>;
  del(key: string): Promise<number>;
  keys?(pattern: string): Promise<string[]>;
  ping?(): Promise<string>;
  command?(cmd: string, ...args: any[]): Promise<any>;
  quit(): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): any;
};

declare global {
  // eslint-disable-next-line no-var
  var __AOL_REDIS_CLIENT__: RedisLike | undefined;
  // eslint-disable-next-line no-var
  var __AOL_REDIS_PROMISE__: Promise<RedisLike> | undefined;
}

function createClientStub(): RedisLike {
  const stub: RedisLike = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 0,
    keys: async () => [],
    ping: async () => "PONG",
    command: async (cmd: string) => (String(cmd).toUpperCase() === "PING" ? "PONG" : null),
    quit: async () => "OK",
    on: () => stub,
  };
  return stub;
}

function createServerRedisClient(): RedisLike {
  // Require only on server to avoid bundling ioredis into client.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Redis = require("ioredis");

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    // Conservative retry; don’t DOS yourself on failure.
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  });

  client.on("error", (err: any) => {
    // Keep log terse; ioredis can be noisy.
    console.error("[Redis] error:", err?.message || err);
  });

  client.on("connect", () => {
    console.log("[Redis] connected");
  });

  // Ensure type compatibility
  return client as RedisLike;
}

export function getRedis(): RedisLike {
  // Client: always stub
  if (typeof window !== "undefined") {
    if (!globalThis.__AOL_REDIS_CLIENT__) {
      globalThis.__AOL_REDIS_CLIENT__ = createClientStub();
    }
    return globalThis.__AOL_REDIS_CLIENT__!;
  }

  // Server: singleton
  if (!globalThis.__AOL_REDIS_CLIENT__) {
    globalThis.__AOL_REDIS_CLIENT__ = createServerRedisClient();
  }
  return globalThis.__AOL_REDIS_CLIENT__!;
}

// Promise form (some code expects a promise)
export const redisPromise: Promise<RedisLike> =
  globalThis.__AOL_REDIS_PROMISE__ || (globalThis.__AOL_REDIS_PROMISE__ = Promise.resolve(getRedis()));

// Named client used by sessions + health endpoints
export const redisClient: RedisLike = getRedis();

// Default export for compatibility with `import redis from "@/lib/redis"`
export default redisClient;