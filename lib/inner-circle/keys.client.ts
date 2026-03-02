/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/inner-circle/keys.client.ts — SSOT ALIGNED (Client-safe)

import { safeSlice } from "@/lib/utils/safe";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

/**
 * Key tier is now SSOT AccessTier.
 * We still tolerate legacy strings at runtime via normalizeUserTier().
 */
export type KeyTier = AccessTier;

export type StoredKey = {
  key: string;
  memberId: string;
  tier: KeyTier;
  createdAt: string;
  expiresAt?: string;
  revoked?: boolean;
  revokedAt?: string;
  maxUses?: number;
  usedCount?: number;
  metadata?: Record<string, any>;
};

export type CreateOrUpdateMemberArgs = {
  email: string;
  name?: string;
  ipAddress: string;
  source: "api" | "web" | "admin";
  /**
   * Optional tier request. Legacy tolerated.
   * If omitted, defaults to "member".
   */
  tier?: string | AccessTier;
};

export type IssuedKey = {
  key: string;
  keySuffix: string;
  expiresAt: string;
  memberId: string;
  tier: KeyTier;
};

export type VerifyInnerCircleKeyResult = {
  valid: boolean;
  reason: "valid" | "invalid_format" | "not_found" | "revoked" | "expired" | "rate_limited";
  memberId?: string;
  keySuffix?: string;
  tier?: KeyTier;
};

export type InnerCircleStats = {
  totalMembers: number;
  totalKeys: number;
  activeKeys: number;
  byTier: Record<KeyTier, number>;
  recentUnlocks: number;
  memoryStoreSize: number;
};

export type CleanupResult = {
  deleted: number;
  message: string;
  details?: Record<string, number>;
};

// --- INTERNAL DATA STORES ---
const mem = new Map<string, StoredKey>();
const memberStore = new Map<string, { email: string; name?: string; createdAt: Date; lastSeen: Date }>();
const keyUsageStore = new Map<string, { keySuffix: string; memberId: string; timestamp: Date; ipAddress?: string }>();

// Canonical tier order used only for stats bucketing.
const TIER_ORDER: KeyTier[] = ["public", "member", "inner-circle", "client", "legacy", "architect", "owner"];

// --- UTILITIES ---

export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function getMemoryStoreSize(): number {
  return mem.size;
}

/**
 * Generate an access key (client-safe).
 * NOTE: Server should mint real keys. Client minting is for dev/test or offline.
 */
export function generateAccessKey(): string {
  const array = new Uint8Array(20);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  return `IC-${hex.toUpperCase()}`;
}

/**
 * Stable, client-safe email hash (not cryptographically perfect fallback),
 * used only as an in-memory member key.
 */
export async function getEmailHash(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(normalized);
    const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex.substring(0, 32);
  }

  // Fallback (non-crypto) hashing for runtimes without subtle
  let h = 0;
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) - h + normalized.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(32, "0").substring(0, 32);
}

/**
 * Normalize any tier-like input into SSOT tier.
 * Unknown -> public (never privilege by accident).
 */
export function normalizeKeyTier(input: unknown): KeyTier {
  return normalizeUserTier(input);
}

// --- CORE OPERATIONS ---

export async function storeKey(record: StoredKey): Promise<void> {
  // Ensure tier is canonical on write
  const tier = normalizeKeyTier(record.tier);
  mem.set(record.key, { ...record, tier });
}

export async function getKey(key: string): Promise<StoredKey | null> {
  const v = mem.get(key) || null;
  if (!v) return null;
  // Ensure canonical tier on read too (in case old data exists)
  return { ...v, tier: normalizeKeyTier(v.tier) };
}

export async function revokeKey(key: string): Promise<boolean> {
  const existing = await getKey(key);
  if (!existing) return false;
  await storeKey({ ...existing, revoked: true, revokedAt: new Date().toISOString() });
  return true;
}

export async function renewKey(key: string, newExpiresAt?: string, resetUsage?: boolean): Promise<StoredKey | null> {
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
  return updated;
}

export async function incrementKeyUsage(key: string): Promise<boolean> {
  const existing = await getKey(key);
  if (!existing || existing.revoked) return false;
  if (existing.expiresAt && isExpired(existing.expiresAt)) return false;
  if (existing.maxUses && (existing.usedCount || 0) >= existing.maxUses) return false;

  await storeKey({ ...existing, usedCount: (existing.usedCount || 0) + 1 });
  return true;
}

// --- RETRIEVAL ---

export async function getKeysByMember(memberId: string): Promise<StoredKey[]> {
  return Array.from(mem.values())
    .filter((k) => k.memberId === memberId)
    .map((k) => ({ ...k, tier: normalizeKeyTier(k.tier) }));
}

export async function getKeysByTier(tier: KeyTier): Promise<StoredKey[]> {
  const t = normalizeKeyTier(tier);
  return Array.from(mem.values())
    .filter((k) => normalizeKeyTier(k.tier) === t)
    .map((k) => ({ ...k, tier: normalizeKeyTier(k.tier) }));
}

export async function getActiveKeys(): Promise<StoredKey[]> {
  return Array.from(mem.values())
    .filter((k) => !k.revoked && (!k.expiresAt || !isExpired(k.expiresAt)))
    .map((k) => ({ ...k, tier: normalizeKeyTier(k.tier) }));
}

export async function cleanupExpiredKeys(): Promise<{ cleaned: number }> {
  const now = Date.now();
  let cleaned = 0;
  for (const k of Array.from(mem.values())) {
    if (k.expiresAt && new Date(k.expiresAt).getTime() <= now) {
      mem.delete(k.key);
      cleaned++;
    }
  }
  return { cleaned };
}

// --- HIGH LEVEL API ---

export async function createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
  const memberId = await getEmailHash(args.email);
  const existing = memberStore.get(memberId);

  memberStore.set(memberId, {
    email: args.email,
    name: args.name || existing?.name,
    createdAt: existing?.createdAt || new Date(),
    lastSeen: new Date(),
  });

  const key = generateAccessKey();
  const keySuffix = safeSlice(key, -8) as string;

  // Default SSOT tier: member (unless supplied)
  const tier = normalizeKeyTier(args.tier ?? "member");

  const storedKey: StoredKey = {
    key,
    memberId,
    tier,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 1000,
    usedCount: 0,
    metadata: { source: args.source, ipAddress: args.ipAddress },
  };

  await storeKey(storedKey);

  return {
    key,
    keySuffix,
    expiresAt: storedKey.expiresAt!,
    memberId,
    tier: storedKey.tier,
  };
}

export async function verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
  // Keep your current key format gate
  if (!key.startsWith("IC-") || key.length !== 44) {
    return { valid: false, reason: "invalid_format" };
  }

  const storedKey = await getKey(key);
  if (!storedKey) return { valid: false, reason: "not_found" };
  if (storedKey.revoked) return { valid: false, reason: "revoked" };
  if (storedKey.expiresAt && isExpired(storedKey.expiresAt)) return { valid: false, reason: "expired" };

  if (storedKey.maxUses && (storedKey.usedCount || 0) >= storedKey.maxUses) {
    return { valid: false, reason: "rate_limited" };
  }

  await incrementKeyUsage(key);

  return {
    valid: true,
    reason: "valid",
    memberId: storedKey.memberId,
    keySuffix: safeSlice(key, -8) as string,
    tier: normalizeKeyTier(storedKey.tier),
  };
}

export async function recordInnerCircleUnlock(
  memberId: string,
  keySuffix: string
): Promise<{ success: boolean; timestamp: string }> {
  const timestamp = new Date();
  keyUsageStore.set(`unlock:${memberId}:${keySuffix}:${timestamp.getTime()}`, {
    keySuffix,
    memberId,
    timestamp,
  });
  return { success: true, timestamp: timestamp.toISOString() };
}

export async function getPrivacySafeStats(): Promise<InnerCircleStats> {
  const activeKeys = await getActiveKeys();
  const allKeys = Array.from(mem.values());

  // Initialize all SSOT tiers (stable stats shape)
  const byTier = Object.fromEntries(TIER_ORDER.map((t) => [t, 0])) as Record<KeyTier, number>;

  for (const k of activeKeys) {
    const t = normalizeKeyTier(k.tier);
    byTier[t] = (byTier[t] || 0) + 1;
  }

  return {
    totalMembers: memberStore.size,
    totalKeys: allKeys.length,
    activeKeys: activeKeys.length,
    byTier,
    recentUnlocks: 0,
    memoryStoreSize: mem.size,
  };
}

export async function cleanupExpiredData(): Promise<CleanupResult> {
  const keyResult = await cleanupExpiredKeys();
  return {
    deleted: keyResult.cleaned,
    message: `Cleaned ${keyResult.cleaned} items`,
    details: { keys: keyResult.cleaned },
  };
}

const keysApi = {
  normalizeKeyTier,
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