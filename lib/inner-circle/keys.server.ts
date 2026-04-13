/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/inner-circle/keys.server.ts — ESM & REDIS ALIGNED
import "server-only";

import type { AccessTier } from "@prisma/client";
import { normalizeUserTier } from "@/lib/access/tier-policy";
import { auditLogger } from "@/lib/server/db/audit"; 
import * as clientImpl from "./keys.client";
import type { StoredKey } from "./keys.client";

// Re-export client types/logic for the UI and higher-level consumers
export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired" | "suspended";
export * from "./keys.client";

const PREFIX = "ic:key:";
const INDEX_PREFIX = "ic:index:";

/**
 * 2026 ESM-Safe Redis Loader
 * Resolved: Uses the 'redisClient' named export or 'default' from lib/redis
 */
async function getRedis(): Promise<any | null> {
  try {
    // Dynamic import to prevent Edge Runtime or build-time worker crashes
    const redisModule = await import("@/lib/redis") as any;
    
    // Check our prioritized export chain defined in lib/redis.ts
    return (
      redisModule.redisClient || 
      redisModule.redis || 
      redisModule.default?.redisClient || 
      redisModule.default || 
      null
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("[InnerCircle] Redis connection unavailable, falling back to Memory Store.");
    }
    return null;
  }
}

/**
 * SSOT TIER NORMALIZATION
 * Ensures compatibility between Contentlayer strings and Prisma AccessTier Enums.
 */
export function normalizeTier(tier: string | undefined | null): AccessTier {
  return normalizeUserTier(tier) as AccessTier;
}

function withCanonicalTier(record: StoredKey): StoredKey {
  return {
    ...record,
    tier: normalizeTier((record as any).tier) as any,
  };
}

// --- SERVER-SIDE PERSISTENCE LOGIC ---

/**
 * STORES KEY: Syncs the local memory store with the Redis Persistence layer.
 */
export async function storeKey(record: StoredKey): Promise<void> {
  const canonical = withCanonicalTier(record);
  await clientImpl.storeKey(canonical);

  const redis = await getRedis();
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

    // Update Set-based Indices for fast lookups in the Admin Export API
    await redis.sadd(`${INDEX_PREFIX}member:${canonical.memberId}`, canonical.key);
    await redis.sadd(`${INDEX_PREFIX}tier:${canonical.tier}`, canonical.key);

    const isActuallyActive =
      !canonical.revoked && (!canonical.expiresAt || new Date(canonical.expiresAt) > new Date());

    if (isActuallyActive) await redis.sadd(`${INDEX_PREFIX}active`, canonical.key);
    else await redis.srem(`${INDEX_PREFIX}active`, canonical.key);
  } catch (e) {
    console.error("[InnerCircle/Server] Redis sync failed:", e);
  }
}

/**
 * GET KEY: Checks local cache first, then falls back to Redis.
 */
export async function getKey(key: string): Promise<StoredKey | null> {
  const mem = await clientImpl.getKey(key);
  if (mem) return withCanonicalTier(mem);

  const redis = await getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(`${PREFIX}${key}`);
    if (!raw) return null;

    const parsed = withCanonicalTier(JSON.parse(raw) as StoredKey);
    // Hydrate local memory cache for subsequent requests in the same lambda execution
    await clientImpl.storeKey(parsed);
    return parsed;
  } catch {
    return null;
  }
}

/**
 * REVOKE KEY: Updates status and logs to the Security Audit Ledger.
 */
export async function revokeKey(key: string, reason?: string): Promise<boolean> {
  const existing = await getKey(key);
  if (!existing) return false;

  const startTime = Date.now();
  const updated: StoredKey = {
    ...existing,
    revoked: true,
    revokedAt: new Date().toISOString(),
  };

  await storeKey(updated);

  await auditLogger.log({
    action: "KEY_REVOCATION_SERVER",
    severity: "warn",
    actorId: existing.memberId || null,
    actorType: "system",
    resourceId: key,
    resourceType: "ACCESS_KEY",
    resourceName: `IC-KEY-${key.slice(-6)}`,
    category: "SECURITY",
    subCategory: "KEY_MANAGEMENT",
    status: "success",
    durationMs: Date.now() - startTime,
    metadata: { 
      reason: reason || "server_revocation",
      originalExpiry: existing.expiresAt 
    },
  });

  const redis = await getRedis();
  if (redis) await redis.srem(`${INDEX_PREFIX}active`, key).catch(() => {});
  return true;
}

/**
 * RENEW KEY: Extends the life of an existing access key.
 */
export async function renewKey(
  key: string,
  newExpiresAt?: string,
  resetUsage?: boolean
): Promise<StoredKey | null> {
  const existing = await getKey(key);
  if (!existing || existing.revoked) return null;

  const startTime = Date.now();
  const updated: StoredKey = {
    ...existing,
    expiresAt: newExpiresAt || existing.expiresAt,
    usedCount: resetUsage ? 0 : (existing.usedCount || 0),
  };

  await storeKey(updated);

  await auditLogger.log({
    action: "KEY_RENEWAL",
    severity: "info",
    actorId: existing.memberId || null,
    actorType: "system",
    resourceId: key,
    resourceType: "ACCESS_KEY",
    category: "SECURITY",
    subCategory: "KEY_MANAGEMENT",
    durationMs: Date.now() - startTime,
    metadata: { 
      keySuffix: key.slice(-6), 
      newExpiresAt,
      wasReset: resetUsage 
    },
  });

  return updated;
}

/**
 * GET KEYS BY MEMBER: High-performance set lookup via Redis.
 */
export async function getKeysByMember(memberId: string): Promise<StoredKey[]> {
  const redis = await getRedis();
  if (!redis) return (await clientImpl.getKeysByMember(memberId)).map(withCanonicalTier);

  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}member:${memberId}`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null);
  } catch {
    return (await clientImpl.getKeysByMember(memberId)).map(withCanonicalTier);
  }
}

/**
 * GET KEYS BY TIER: Used by Admin dashboard to monitor access distribution.
 */
export async function getKeysByTier(tier: any): Promise<StoredKey[]> {
  const canonicalTier = normalizeTier(tier);
  const redis = await getRedis();
  if (!redis) return (await clientImpl.getKeysByTier(tier)).map(withCanonicalTier);

  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}tier:${canonicalTier}`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null);
  } catch {
    return (await clientImpl.getKeysByTier(tier)).map(withCanonicalTier);
  }
}

/**
 * GET ACTIVE KEYS: Returns all keys that are neither revoked nor expired.
 */
export async function getActiveKeys(): Promise<StoredKey[]> {
  const redis = await getRedis();
  if (!redis) return (await clientImpl.getActiveKeys()).map(withCanonicalTier);

  try {
    const keys: string[] = await redis.smembers(`${INDEX_PREFIX}active`);
    const results = await Promise.all(keys.map((k: string) => getKey(k)));
    return results.filter((k): k is StoredKey => k !== null && !k.revoked);
  } catch {
    return (await clientImpl.getActiveKeys()).map(withCanonicalTier);
  }
}

/**
 * GENERATE ACCESS KEY: Creates a secure, random hex key with the IC- prefix.
 */
export async function generateAccessKey(): Promise<string> {
  try {
    const { randomBytes } = await import("node:crypto");
    return `IC-${randomBytes(20).toString("hex").toUpperCase()}`;
  } catch {
    return clientImpl.generateAccessKey();
  }
}

/**
 * EMAIL HASH: One-way SHA256 for privacy-preserving member lookups.
 */
export async function getEmailHash(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  try {
    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(normalized).digest("hex");
  } catch {
    return clientImpl.getEmailHash(email);
  }
}

// Pass-through exports from the client implementation for unified API access
export const incrementKeyUsage = clientImpl.incrementKeyUsage;
export const cleanupExpiredKeys = clientImpl.cleanupExpiredKeys;
export const isExpired = clientImpl.isExpired;
export const getMemoryStoreSize = clientImpl.getMemoryStoreSize;
export const createOrUpdateMemberAndIssueKey = clientImpl.createOrUpdateMemberAndIssueKey;
export const verifyInnerCircleKey = clientImpl.verifyInnerCircleKey;
export const recordInnerCircleUnlock = clientImpl.recordInnerCircleUnlock;
export const getPrivacySafeStats = clientImpl.getPrivacySafeStats;
export const cleanupExpiredData = clientImpl.cleanupExpiredData;

/**
 * Unified Internal API Object
 */
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
