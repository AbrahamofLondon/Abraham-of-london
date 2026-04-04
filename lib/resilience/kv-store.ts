/* lib/resilience/kv-store.ts */

import { RESILIENCE_CONFIG } from "@/lib/resilience/config";
import { logger } from "@/lib/observability/logger";

type MemoryRecord = {
  value: string;
  expiresAt?: number;
};

const memory = new Map<string, MemoryRecord>();

function cleanupIfExpired(key: string) {
  const rec = memory.get(key);
  if (!rec) return;

  if (typeof rec.expiresAt === "number" && Date.now() > rec.expiresAt) {
    memory.delete(key);
  }
}

export async function kvGet(key: string): Promise<string | null> {
  if (RESILIENCE_CONFIG.runtime.useRedis) {
    try {
      const mod = await import("@/lib/redis-edge").catch(() => null as any);
      const client = mod?.default || mod?.redis || null;
      if (client?.get) return await client.get(key);
    } catch (error) {
      logger.warn("Redis get failed, falling back to memory", "kv", { key });
    }
  }

  cleanupIfExpired(key);
  return memory.get(key)?.value ?? null;
}

export async function kvSet(key: string, value: string, ttlMs?: number): Promise<void> {
  if (RESILIENCE_CONFIG.runtime.useRedis) {
    try {
      const mod = await import("@/lib/redis-edge").catch(() => null as any);
      const client = mod?.default || mod?.redis || null;
      if (client?.set) {
        const ex = ttlMs ? Math.ceil(ttlMs / 1000) : undefined;
        await client.set(key, value, ex ? { ex } : undefined);
        return;
      }
    } catch (error) {
      logger.warn("Redis set failed, falling back to memory", "kv", { key });
    }
  }

  memory.set(key, {
    value,
    expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
  });
}

export async function kvDelete(key: string): Promise<void> {
  if (RESILIENCE_CONFIG.runtime.useRedis) {
    try {
      const mod = await import("@/lib/redis-edge").catch(() => null as any);
      const client = mod?.default || mod?.redis || null;
      if (client?.del) {
        await client.del(key);
        return;
      }
    } catch (error) {
      logger.warn("Redis delete failed, falling back to memory", "kv", { key });
    }
  }

  memory.delete(key);
}