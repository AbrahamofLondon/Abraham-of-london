// lib/server/redis.ts
type RedisGetResult = string | null;

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Simple in-memory fallback for dev if env not set
const mem = new Map<string, { v: string; exp: number }>();

function now() {
  return Date.now();
}

async function upstash(cmd: string, args: (string | number)[]) {
  if (!URL || !TOKEN) return null;

  const res = await fetch(`${URL}/${cmd}/${args.map(a => encodeURIComponent(String(a))).join("/")}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function redisGet(key: string): Promise<RedisGetResult> {
  if (!URL || !TOKEN) {
    const hit = mem.get(key);
    if (!hit) return null;
    if (hit.exp <= now()) {
      mem.delete(key);
      return null;
    }
    return hit.v;
  }

  const j = await upstash("get", [key]);
  // Upstash returns { result: "..." } or { result: null }
  return (j?.result ?? null) as RedisGetResult;
}

export async function redisSetEx(key: string, ttlSeconds: number, value: string): Promise<void> {
  if (!URL || !TOKEN) {
    mem.set(key, { v: value, exp: now() + ttlSeconds * 1000 });
    return;
  }
  await upstash("set", [key, value, "EX", ttlSeconds]);
}
