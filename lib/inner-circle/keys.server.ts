/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/inner-circle/keys.server.ts

export * from "./keys.client"; // re-export types + memory fallback

import type {
  StoredKey,
  KeyTier,
  InnerCircleStats,
  CleanupResult,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
} from "./keys.client";

import * as clientImpl from "./keys.client";

const PREFIX = "ic:key:";
const INDEX_PREFIX = "ic:index:";

function getRedis(): any | null {
  try {
    // IMPORTANT: this must exist as a named export
    // Ensure lib/redis exports redisClient
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { redisClient } = require("@/lib/redis");
    return redisClient || null;
  } catch {
    return null;
  }
}

export async function storeKey(record: StoredKey): Promise<void> {
  await clientImpl.storeKey(record);

  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`${PREFIX}${record.key}`, JSON.stringify(record));

    if (record.expiresAt) {
      const ttl = Math.max(
        1,
        Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000)
      );
      if (ttl > 0) await redis.expire(`${PREFIX}${record.key}`, ttl);
    }

    await redis.sadd(`${INDEX_PREFIX}member:${record.memberId}`, record.key);
    await redis.sadd(`${INDEX_PREFIX}tier:${record.tier}`, record.key);

    if (!record.revoked && (!record.expiresAt || new Date(record.expiresAt) > new Date())) {
      await redis.sadd(`${INDEX_PREFIX}active`, record.key);
    }
  } catch (e) {
    console.error("[InnerCircleKeys/server] Redis store error:", e);
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
    const parsed = JSON.parse(raw);
    await clientImpl.storeKey(parsed);
    return parsed;
  } catch (e) {
    console.error("[InnerCircleKeys/server] Redis get error:", e);
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
  if (redis) {
    try {
      await redis.srem(`${INDEX_PREFIX}active`, key);
    } catch (e) {
      console.error("[InnerCircleKeys/server] Redis srem error:", e);
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
    revokedAt: undefined,
  };

  await storeKey(updated);

  const redis = getRedis();
  if (redis && (!newExpiresAt || new Date(newExpiresAt) > new Date())) {
    try {
      await redis.sadd(`${INDEX_PREFIX}active`, key);
    } catch (e) {
      console.error("[InnerCircleKeys/server] Redis sadd error:", e);
    }
  }

  return updated;
}

export async function getKeysByMember(memberId: string): Promise<StoredKey[]> {
  const redis = getRedis();
  if (!redis) return clientImpl.getKeysByMember(memberId);

  try {
    const keys = await redis.smembers(`${INDEX_PREFIX}member:${memberId}`);
    const out: StoredKey[] = [];
    for (const k of keys) {
      const kd = await getKey(k);
      if (kd) out.push(kd);
    }
    return out;
  } catch (e) {
    console.error("[InnerCircleKeys/server] member lookup error:", e);
    return clientImpl.getKeysByMember(memberId);
  }
}

export async function getKeysByTier(tier: KeyTier): Promise<StoredKey[]> {
  const redis = getRedis();
  if (!redis) return clientImpl.getKeysByTier(tier);

  try {
    const keys = await redis.smembers(`${INDEX_PREFIX}tier:${tier}`);
    const out: StoredKey[] = [];
    for (const k of keys) {
      const kd = await getKey(k);
      if (kd) out.push(kd);
    }
    return out;
  } catch (e) {
    console.error("[InnerCircleKeys/server] tier lookup error:", e);
    return clientImpl.getKeysByTier(tier);
  }
}

export async function getActiveKeys(): Promise<StoredKey[]> {
  const redis = getRedis();
  if (!redis) return clientImpl.getActiveKeys();

  try {
    const keys = await redis.smembers(`${INDEX_PREFIX}active`);
    const out: StoredKey[] = [];
    for (const k of keys) {
      const kd = await getKey(k);
      if (kd && !kd.revoked && (!kd.expiresAt || !clientImpl.isExpired(kd.expiresAt))) out.push(kd);
      else await redis.srem(`${INDEX_PREFIX}active`, k);
    }
    return out;
  } catch (e) {
    console.error("[InnerCircleKeys/server] active lookup error:", e);
    return clientImpl.getActiveKeys();
  }
}

// Override generateAccessKey + getEmailHash server-side to use Node crypto safely
export function generateAccessKey(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require("crypto");
    return `IC-${crypto.randomBytes(20).toString("hex").toUpperCase()}`;
  } catch {
    return clientImpl.generateAccessKey();
  }
}

export async function getEmailHash(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  try {
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256").update(normalized).digest("hex").substring(0, 32);
  } catch {
    return clientImpl.getEmailHash(email);
  }
}

// These remain identical exports so the build can never complain
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