/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/inner-circle/keys.server.ts
import "server-only";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired" | "suspended";

export * from "./keys.client";
import type { StoredKey } from "./keys.client";
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
 * SSOT TIER NORMALIZATION
 * Accepts legacy ("patron","founder","premium","institutional","private","elite", etc.)
 * and returns canonical AccessTier.
 */
export function normalizeTier(tier: string | undefined | null): AccessTier {
  return normalizeUserTier(tier);
}

/**
 * IMPORTANT:
 * StoredKey.tier should become AccessTier across the codebase.
 * If keys.client still types tier as KeyTier, this bridge keeps builds green
 * while you upgrade keys.client next.
 */
function withCanonicalTier(record: StoredKey): StoredKey {
  return {
    ...record,
    tier: normalizeUserTier((record as any).tier) as any,
  };
}

// --- SERVER-SIDE PERSISTENCE LOGIC ---

export async function storeKey(record: StoredKey): Promise<void> {
  const canonical = withCanonicalTier(record);

  await clientImpl.storeKey(canonical);

  const redis = getRedis();
  if (!redis) return;

  try {
    const keyPath = `${PREFIX}${canonical.key}`;
    await redis.set(keyPath, JSON.stringify(canonical));

    if (canonical.expiresAt) {
      const ttl = Math.max(
        1,
        Math.floor((new Date(canonical.expiresAt).getTime() - Date.now()) / 1000)
      );
      if (ttl > 0) await redis.expire(keyPath, ttl);
    }

    await redis.sadd(`${INDEX_PREFIX}member:${canonical.memberId}`, canonical.key);
    await redis.sadd(`${INDEX_PREFIX}tier:${normalizeUserTier((canonical as any).tier)}`, canonical.key);

    const isActuallyActive =
      !canonical.revoked && (!canonical.expiresAt || new Date(canonical.expiresAt) > new Date());

    if (isActuallyActive) await redis.sadd(`${INDEX_PREFIX}active`, canonical.key);
    else await redis.srem(`${INDEX_PREFIX}active`, canonical.key);
  } catch (e) {
    console.error("[InnerCircle/Server] Redis sync failed:", e);
  }
}

export async function getKey(key: string): Promise<StoredKey | null> {
  const mem = await clientImpl.getKey(key);
  if (mem) return withCanonicalTier(mem);

  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(`${PREFIX}${key}`);
    if (!raw) return null;

    const parsed = withCanonicalTier(JSON.parse(raw) as StoredKey);
    await clientImpl.storeKey(parsed);
    return parsed;
  } catch {
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

  const redis = getRedis();
  if (redis) await redis.srem(`${INDEX_PREFIX}active`, key).catch(() => {});
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
    usedCount: resetUsage ? 0 : (existing.usedCount || 0),
  };

  await storeKey(updated);
  return updated;
}

export async function getKeysByMember(memberId: string): Promise<StoredKey[]> {
  const redis = getRedis();
  if (!redis) return (await clientImpl.getKeysByMember(memberId)).map(withCanonicalTier);

  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}member:${memberId}`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null);
  } catch {
    return (await clientImpl.getKeysByMember(memberId)).map(withCanonicalTier);
  }
}

export async function getKeysByTier(tier: any): Promise<StoredKey[]> {
  const canonicalTier = normalizeUserTier(tier);
  const redis = getRedis();
  if (!redis) return (await clientImpl.getKeysByTier(tier)).map(withCanonicalTier);

  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}tier:${canonicalTier}`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null);
  } catch {
    return (await clientImpl.getKeysByTier(tier)).map(withCanonicalTier);
  }
}

export async function getActiveKeys(): Promise<StoredKey[]> {
  const redis = getRedis();
  if (!redis) return (await clientImpl.getActiveKeys()).map(withCanonicalTier);

  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}active`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null && !k.revoked);
  } catch {
    return (await clientImpl.getActiveKeys()).map(withCanonicalTier);
  }
}

export function generateAccessKey(): string {
  try {
    const crypto = require("crypto");
    return `IC-${crypto.randomBytes(20).toString("hex").toUpperCase()}`;
  } catch {
    return clientImpl.generateAccessKey();
  }
}

export async function getEmailHash(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  try {
    const { createHash } = await import("crypto");
    return createHash("sha256").update(normalized).digest("hex");
  } catch {
    return clientImpl.getEmailHash(email);
  }
}

// passthrough exports
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