/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/inner-circle/keys.server.ts
import "server-only";

// Ensure the implementation exports the status type used by the bridge
export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired" | "suspended";

// Re-export types from the client implementation
export * from "./keys.client"; 
import type { StoredKey, KeyTier } from "./keys.client";
import * as clientImpl from "./keys.client";

const PREFIX = "ic:key:";
const INDEX_PREFIX = "ic:index:";

function getRedis(): any | null {
  try {
    const redisModule = require("@/lib/redis");
    return redisModule.redisClient || redisModule.default || null;
  } catch {
    return null;
  }
}

/**
 * TIER NORMALIZATION (REFACTORED FOR CLIENT TYPES)
 * Maps input to: "member" | "patron" | "founder"
 */
export function normalizeTier(tier: string | undefined | null): KeyTier {
  if (!tier) return "member";
  const normalized = tier.toLowerCase().trim();
  
  if (normalized === "founder" || normalized === "patron") {
    return normalized as KeyTier;
  }
  
  // Map institutional/premium aliases if they come from legacy exports
  if (normalized === "institutional") return "founder";
  if (normalized === "premium") return "patron";
  
  return "member";
}

// --- SERVER-SIDE PERSISTENCE LOGIC ---

export async function storeKey(record: StoredKey): Promise<void> {
  await clientImpl.storeKey(record);
  const redis = getRedis();
  if (!redis) return;

  try {
    const keyPath = `${PREFIX}${record.key}`;
    await redis.set(keyPath, JSON.stringify(record));
    
    if (record.expiresAt) {
      const ttl = Math.max(1, Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000));
      if (ttl > 0) await redis.expire(keyPath, ttl);
    }

    await redis.sadd(`${INDEX_PREFIX}member:${record.memberId}`, record.key);
    await redis.sadd(`${INDEX_PREFIX}tier:${record.tier}`, record.key);
    
    const isActuallyActive = !record.revoked && (!record.expiresAt || new Date(record.expiresAt) > new Date());
    if (isActuallyActive) {
      await redis.sadd(`${INDEX_PREFIX}active`, record.key);
    } else {
      await redis.srem(`${INDEX_PREFIX}active`, record.key);
    }
  } catch (e) {
    console.error("[InnerCircle/Server] Redis sync failed:", e);
  }
}

export async function getKey(key: string): Promise<StoredKey | null> {
  const mem = await clientImpl.getKey(key);
  if (mem) return mem;
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(`${PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredKey;
    await clientImpl.storeKey(parsed);
    return parsed;
  } catch { return null; }
}

export async function revokeKey(key: string): Promise<boolean> {
  const existing = await getKey(key);
  if (!existing) return false;
  const updated: StoredKey = { ...existing, revoked: true, revokedAt: new Date().toISOString() };
  await storeKey(updated);
  const redis = getRedis();
  if (redis) await redis.srem(`${INDEX_PREFIX}active`, key).catch(() => {});
  return true;
}

export async function renewKey(key: string, newExpiresAt?: string, resetUsage?: boolean): Promise<StoredKey | null> {
  const existing = await getKey(key);
  if (!existing || existing.revoked) return null;
  const updated: StoredKey = {
    ...existing,
    expiresAt: newExpiresAt || existing.expiresAt,
    usedCount: resetUsage ? 0 : (existing.usedCount || 0),
  };
  await storeKey(updated);
  return updated;
}

export async function getKeysByMember(memberId: string): Promise<StoredKey[]> {
  const redis = getRedis();
  if (!redis) return clientImpl.getKeysByMember(memberId);
  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}member:${memberId}`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null);
  } catch { return clientImpl.getKeysByMember(memberId); }
}

export async function getKeysByTier(tier: KeyTier): Promise<StoredKey[]> {
  const redis = getRedis();
  if (!redis) return clientImpl.getKeysByTier(tier);
  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}tier:${tier}`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null);
  } catch { return clientImpl.getKeysByTier(tier); }
}

export async function getActiveKeys(): Promise<StoredKey[]> {
  const redis = getRedis();
  if (!redis) return clientImpl.getActiveKeys();
  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}active`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null && !k.revoked);
  } catch { return clientImpl.getActiveKeys(); }
}

export function generateAccessKey(): string {
  try {
    const crypto = require("crypto");
    return `IC-${crypto.randomBytes(20).toString("hex").toUpperCase()}`;
  } catch { return clientImpl.generateAccessKey(); }
}

export async function getEmailHash(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  try {
    const { createHash } = await import("crypto");
    return createHash("sha256").update(normalized).digest("hex");
  } catch { return clientImpl.getEmailHash(email); }
}

export const incrementKeyUsage = clientImpl.incrementKeyUsage;
export const cleanupExpiredKeys = clientImpl.cleanupExpiredKeys;
export const isExpired = clientImpl.isExpired;
export const getMemoryStoreSize = clientImpl.getMemoryStoreSize;
export const createOrUpdateMemberAndIssueKey = clientImpl.createOrUpdateMemberAndIssueKey;
export const verifyInnerCircleKey = clientImpl.verifyInnerCircleKey;
export const recordInnerCircleUnlock = clientImpl.recordInnerCircleUnlock;
export const getPrivacySafeStats = clientImpl.getPrivacySafeStats;
export const cleanupExpiredData = clientImpl.cleanupExpiredData;

const keysApi = {
  normalizeTier,
  generateAccessKey,
  storeKey,
  getKey,
  revokeKey,
  renewKey,
  incrementKeyUsage,
  getKeysByMember,
  getKeysByTier,
  getActiveKeys,
  cleanupExpiredKeys,
  isExpired,
  getMemoryStoreSize,
  getEmailHash,
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
};

export default keysApi;