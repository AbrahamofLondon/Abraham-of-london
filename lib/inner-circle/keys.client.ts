import { safeSlice } from "@/lib/utils/safe";
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/inner-circle/keys.client.ts
export type KeyTier = "member" | "patron" | "founder";
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
  reason:
    | "valid"
    | "invalid_format"
    | "not_found"
    | "revoked"
    | "expired"
    | "rate_limited";
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
const mem = new Map<string, StoredKey>();
const memberStore = new Map<
  string,
  { email: string; name?: string; createdAt: Date; lastSeen: Date }
>();
const keyUsageStore = new Map<
  string,
  { keySuffix: string; memberId: string; timestamp: Date; ipAddress?: string }
>();
export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}
export function getMemoryStoreSize(): number {
  return mem.size;
}
export function generateAccessKey(): string {
  const array = new Uint8Array(20);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(array);
  else for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
  const hex = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  return `IC-${hex.toUpperCase()}`;
}
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
  // fallback
  let h = 0;
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) - h + normalized.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(32, "0").substring(0, 32);
}
export async function storeKey(record: StoredKey): Promise<void> {
  mem.set(record.key, record);
}
export async function getKey(key: string): Promise<StoredKey | null> {
  return mem.get(key) || null;
}
export async function revokeKey(key: string): Promise<boolean> {
  const existing = await getKey(key);
  if (!existing) return false;
  await storeKey({ ...existing, revoked: true, revokedAt: new Date().toISOString() });
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
export async function getKeysByMember(memberId: string): Promise<StoredKey[]> {
  return Array.from(mem.values()).filter((k) => k.memberId === memberId);
}
export async function getKeysByTier(tier: KeyTier): Promise<StoredKey[]> {
  return Array.from(mem.values()).filter((k) => k.tier === tier);
}
export async function getActiveKeys(): Promise<StoredKey[]> {
  return Array.from(mem.values()).filter(
    (k) => !k.revoked && (!k.expiresAt || !isExpired(k.expiresAt))
  );
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
// These higher level APIs still exist client-side (memory only)
export async function createOrUpdateMemberAndIssueKey(
  args: CreateOrUpdateMemberArgs
): Promise<IssuedKey> {
  const memberId = await getEmailHash(args.email);
  const existing = memberStore.get(memberId);
  memberStore.set(memberId, {
    email: args.email,
    name: args.name || existing?.name,
    createdAt: existing?.createdAt || new Date(),
    lastSeen: new Date(),
  });
  const key = generateAccessKey();
  const keySuffix = safeSlice(key, -8);
  const storedKey: StoredKey = {
    key,
    memberId,
    tier: "member",
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
    tier: "member",
  };
}
export async function verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
  if (!key.startsWith("IC-") || key.length !== 44) return { valid: false, reason: "invalid_format" };
  const storedKey = await getKey(key);
  if (!storedKey) return { valid: false, reason: "not_found" };
  if (storedKey.revoked) return { valid: false, reason: "revoked" };
  if (storedKey.expiresAt && isExpired(storedKey.expiresAt)) return { valid: false, reason: "expired" };
  if (storedKey.maxUses && (storedKey.usedCount || 0) >= storedKey.maxUses)
    return { valid: false, reason: "rate_limited" };
  await incrementKeyUsage(key);
  return {
    valid: true,
    reason: "valid",
    memberId: storedKey.memberId,
    keySuffix: safeSlice(key, -8),
    tier: storedKey.tier,
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
  const byTier: Record<KeyTier, number> = { member: 0, patron: 0, founder: 0 };
  for (const k of activeKeys) byTier[k.tier] = (byTier[k.tier] || 0) + 1;
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