/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { getRedis } from "@/lib/redis";

export type KeyTier = "member" | "patron" | "founder";

export type StoredKey = {
  key: string;
  memberId: string;
  tier: KeyTier;
  createdAt: string; // ISO
  expiresAt?: string; // ISO
  revoked?: boolean;
  revokedAt?: string; // ISO;
  maxUses?: number;
  usedCount?: number;
  metadata?: Record<string, any>;
};

const mem = new Map<string, StoredKey>();
const PREFIX = "ic:key:";
const INDEX_PREFIX = "ic:index:";

export function generateAccessKey(): string {
  return `IC-${crypto.randomBytes(20).toString("hex").toUpperCase()}`;
}

export async function storeKey(record: StoredKey): Promise<void> {
  const redis = getRedis();
  
  // Always store in memory as fallback
  mem.set(record.key, record);
  
  if (!redis) return;

  try {
    // Store the key
    await redis.set(`${PREFIX}${record.key}`, JSON.stringify(record));
    
    // Set TTL if expiresAt exists
    if (record.expiresAt) {
      const ttl = Math.max(1, Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000));
      if (ttl > 0) {
        await redis.expire(`${PREFIX}${record.key}`, ttl);
      }
    }
    
    // Create member index
    await redis.sadd(`${INDEX_PREFIX}member:${record.memberId}`, record.key);
    
    // Create tier index
    await redis.sadd(`${INDEX_PREFIX}tier:${record.tier}`, record.key);
    
    // Create active keys index
    if (!record.revoked && (!record.expiresAt || new Date(record.expiresAt) > new Date())) {
      await redis.sadd(`${INDEX_PREFIX}active`, record.key);
    }
  } catch (error) {
    console.error("[InnerCircleKeys] Redis store error:", error);
    // Continue with memory store only
  }
}

export async function getKey(key: string): Promise<StoredKey | null> {
  // Try memory first
  const memKey = mem.get(key);
  if (memKey) return memKey;
  
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(`${PREFIX}${key}`);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    // Update memory cache
    mem.set(key, parsed);
    return parsed;
  } catch (error) {
    console.error("[InnerCircleKeys] Redis get error:", error);
    return null;
  }
}

export async function revokeKey(key: string): Promise<boolean> {
  const existing = await getKey(key);
  if (!existing) return false;

  const updated: StoredKey = {
    ...existing,
    revoked: true,
    revokedAt: new Date().toISOString(),
  };

  await storeKey(updated);
  
  // Remove from active index
  const redis = getRedis();
  if (redis) {
    try {
      await redis.srem(`${INDEX_PREFIX}active`, key);
    } catch (error) {
      console.error("[InnerCircleKeys] Redis index removal error:", error);
    }
  }
  
  return true;
}

export async function renewKey(
  key: string, 
  newExpiresAt?: string,
  resetUsage?: boolean
): Promise<StoredKey | null> {
  const existing = await getKey(key);
  if (!existing || existing.revoked) return null;

  const updated: StoredKey = {
    ...existing,
    expiresAt: newExpiresAt || existing.expiresAt,
    usedCount: resetUsage ? 0 : existing.usedCount,
    revoked: false,
    revokedAt: undefined
  };

  await storeKey(updated);
  
  // Add back to active index if not expired
  if (!newExpiresAt || new Date(newExpiresAt) > new Date()) {
    const redis = getRedis();
    if (redis) {
      try {
        await redis.sadd(`${INDEX_PREFIX}active`, key);
      } catch (error) {
        console.error("[InnerCircleKeys] Redis index update error:", error);
      }
    }
  }
  
  return updated;
}

export async function incrementKeyUsage(key: string): Promise<boolean> {
  const existing = await getKey(key);
  if (!existing || existing.revoked) return false;
  
  if (existing.expiresAt && isExpired(existing.expiresAt)) {
    return false;
  }
  
  if (existing.maxUses && (existing.usedCount || 0) >= existing.maxUses) {
    return false;
  }

  const updated: StoredKey = {
    ...existing,
    usedCount: (existing.usedCount || 0) + 1
  };

  await storeKey(updated);
  return true;
}

export async function getKeysByMember(memberId: string): Promise<StoredKey[]> {
  const redis = getRedis();
  const results: StoredKey[] = [];
  
  if (!redis) {
    // Memory-only lookup
    for (const key of mem.values()) {
      if (key.memberId === memberId) {
        results.push(key);
      }
    }
    return results;
  }

  try {
    const memberKeys = await redis.smembers(`${INDEX_PREFIX}member:${memberId}`);
    
    for (const key of memberKeys) {
      const keyData = await getKey(key);
      if (keyData) {
        results.push(keyData);
      }
    }
  } catch (error) {
    console.error("[InnerCircleKeys] Redis member lookup error:", error);
    // Fallback to memory
    for (const key of mem.values()) {
      if (key.memberId === memberId) {
        results.push(key);
      }
    }
  }
  
  return results;
}

export async function getKeysByTier(tier: KeyTier): Promise<StoredKey[]> {
  const redis = getRedis();
  const results: StoredKey[] = [];
  
  if (!redis) {
    // Memory-only lookup
    for (const key of mem.values()) {
      if (key.tier === tier) {
        results.push(key);
      }
    }
    return results;
  }

  try {
    const tierKeys = await redis.smembers(`${INDEX_PREFIX}tier:${tier}`);
    
    for (const key of tierKeys) {
      const keyData = await getKey(key);
      if (keyData) {
        results.push(keyData);
      }
    }
  } catch (error) {
    console.error("[InnerCircleKeys] Redis tier lookup error:", error);
    // Fallback to memory
    for (const key of mem.values()) {
      if (key.tier === tier) {
        results.push(key);
      }
    }
  }
  
  return results;
}

export async function getActiveKeys(): Promise<StoredKey[]> {
  const redis = getRedis();
  const results: StoredKey[] = [];
  
  if (!redis) {
    // Memory-only lookup
    for (const key of mem.values()) {
      if (!key.revoked && (!key.expiresAt || !isExpired(key.expiresAt))) {
        results.push(key);
      }
    }
    return results;
  }

  try {
    const activeKeys = await redis.smembers(`${INDEX_PREFIX}active`);
    
    for (const key of activeKeys) {
      const keyData = await getKey(key);
      if (keyData && !keyData.revoked && (!keyData.expiresAt || !isExpired(keyData.expiresAt))) {
        results.push(keyData);
      } else {
        // Clean up invalid active keys
        await redis.srem(`${INDEX_PREFIX}active`, key);
      }
    }
  } catch (error) {
    console.error("[InnerCircleKeys] Redis active keys lookup error:", error);
    // Fallback to memory
    for (const key of mem.values()) {
      if (!key.revoked && (!key.expiresAt || !isExpired(key.expiresAt))) {
        results.push(key);
      }
    }
  }
  
  return results;
}

export async function cleanupExpiredKeys(): Promise<{ cleaned: number }> {
  const redis = getRedis();
  const now = new Date();
  let cleaned = 0;
  
  const allKeys = redis ? await getActiveKeys() : Array.from(mem.values());
  
  for (const key of allKeys) {
    if (key.expiresAt && new Date(key.expiresAt) <= now) {
      if (redis) {
        await redis.srem(`${INDEX_PREFIX}active`, key.key);
        await redis.srem(`${INDEX_PREFIX}member:${key.memberId}`, key.key);
        await redis.srem(`${INDEX_PREFIX}tier:${key.tier}`, key.key);
      }
      mem.delete(key.key);
      cleaned++;
    }
  }
  
  return { cleaned };
}

export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

// Export memory store size for debugging
export function getMemoryStoreSize(): number {
  return mem.size;
}