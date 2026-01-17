/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/inner-circle/keys.ts - CLIENT-SAFE VERSION

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

export type CreateOrUpdateMemberArgs = {
  email: string;
  name?: string;
  ipAddress: string;
  source: 'api' | 'web' | 'admin';
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
  reason: 'valid' | 'invalid_format' | 'not_found' | 'revoked' | 'expired' | 'rate_limited';
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

// In-memory storage (client-safe)
const mem = new Map<string, StoredKey>();
const PREFIX = "ic:key:";
const INDEX_PREFIX = "ic:index:";

// Helper to get Redis only on server
const getRedis = () => {
  if (typeof window !== 'undefined') {
    // Client-side: return null or a stub
    return null;
  }
  
  // Server-side: dynamic import to avoid bundling ioredis on client
  try {
    const redis = require('@/lib/redis').redisClient;
    return redis;
  } catch (error) {
    console.warn('Redis not available:', error.message);
    return null;
  }
};

export function generateAccessKey(): string {
  // Use crypto only on server, fallback on client
  if (typeof window !== 'undefined') {
    // Client-side fallback
    const array = new Uint8Array(20);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for older browsers
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `IC-${hex.toUpperCase()}`;
  }
  
  // Server-side: dynamic import to avoid bundling Node crypto on client
  try {
    const crypto = require('crypto');
    return `IC-${crypto.randomBytes(20).toString("hex").toUpperCase()}`;
  } catch (error) {
    // Fallback if crypto not available
    const array = new Uint8Array(20);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `IC-${hex.toUpperCase()}`;
  }
}

export async function storeKey(record: StoredKey): Promise<void> {
  // Always store in memory as fallback
  mem.set(record.key, record);
  
  // Only use Redis on server
  if (typeof window !== 'undefined') {
    return; // Client-side: memory only
  }
  
  const redis = getRedis();
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
  
  // Only use Redis on server
  if (typeof window !== 'undefined') {
    return null;
  }
  
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
  
  // Remove from active index (server only)
  if (typeof window === 'undefined') {
    const redis = getRedis();
    if (redis) {
      try {
        await redis.srem(`${INDEX_PREFIX}active`, key);
      } catch (error) {
        console.error("[InnerCircleKeys] Redis index removal error:", error);
      }
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
  
  // Add back to active index if not expired (server only)
  if (typeof window === 'undefined' && (!newExpiresAt || new Date(newExpiresAt) > new Date())) {
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
  const results: StoredKey[] = [];
  
  // Client-side: memory only
  if (typeof window !== 'undefined') {
    for (const key of mem.values()) {
      if (key.memberId === memberId) {
        results.push(key);
      }
    }
    return results;
  }
  
  // Server-side: try Redis, fallback to memory
  const redis = getRedis();
  
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
  const results: StoredKey[] = [];
  
  // Client-side: memory only
  if (typeof window !== 'undefined') {
    for (const key of mem.values()) {
      if (key.tier === tier) {
        results.push(key);
      }
    }
    return results;
  }
  
  // Server-side: try Redis, fallback to memory
  const redis = getRedis();
  
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
  const results: StoredKey[] = [];
  
  // Client-side: memory only
  if (typeof window !== 'undefined') {
    for (const key of mem.values()) {
      if (!key.revoked && (!key.expiresAt || !isExpired(key.expiresAt))) {
        results.push(key);
      }
    }
    return results;
  }
  
  // Server-side: try Redis, fallback to memory
  const redis = getRedis();
  
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
  const now = new Date();
  let cleaned = 0;
  
  const allKeys = Array.from(mem.values());
  
  for (const key of allKeys) {
    if (key.expiresAt && new Date(key.expiresAt) <= now) {
      // Server-side: clean Redis indices
      if (typeof window === 'undefined') {
        const redis = getRedis();
        if (redis) {
          await redis.srem(`${INDEX_PREFIX}active`, key.key);
          await redis.srem(`${INDEX_PREFIX}member:${key.memberId}`, key.key);
          await redis.srem(`${INDEX_PREFIX}tier:${key.tier}`, key.key);
        }
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

// Fixed: Proper async email hash function with correct crypto usage
export async function getEmailHash(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();

  // Client-side: Web Crypto
  if (typeof window !== "undefined" && globalThis.crypto?.subtle) {
    try {
      const data = new TextEncoder().encode(normalized);
      const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
      const hex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      return hex.substring(0, 32);
    } catch (error) {
      console.warn("[getEmailHash] Web Crypto failed, using fallback:", error);
      // Fallback for older browsers or errors
      let hash = 0;
      for (let i = 0; i < normalized.length; i++) {
        hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
    }
  }

  // Server-side: Node crypto (dynamic import avoids bundling)
  try {
    // Use dynamic import to avoid bundling Node crypto on client
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256")
      .update(normalized)
      .digest("hex")
      .substring(0, 32);
  } catch (error) {
    console.error("[getEmailHash] Node crypto import failed:", error);
    // Final fallback
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
  }
}

// ==================== MISSING EXPORTS (NEW IMPLEMENTATIONS) ====================

// Simple in-memory member store
const memberStore = new Map<string, {
  email: string;
  name?: string;
  createdAt: Date;
  lastSeen: Date;
}>();

const keyUsageStore = new Map<string, {
  keySuffix: string;
  memberId: string;
  timestamp: Date;
  ipAddress?: string;
}>();

export async function createOrUpdateMemberAndIssueKey(
  args: CreateOrUpdateMemberArgs
): Promise<IssuedKey> {
  // Generate member ID from email hash - NOW AWAITED
  const memberId = await getEmailHash(args.email);
  
  // Create or update member
  const existingMember = memberStore.get(memberId);
  if (!existingMember) {
    memberStore.set(memberId, {
      email: args.email,
      name: args.name,
      createdAt: new Date(),
      lastSeen: new Date()
    });
  } else {
    memberStore.set(memberId, {
      ...existingMember,
      name: args.name || existingMember.name,
      lastSeen: new Date()
    });
  }
  
  // Generate key
  const key = generateAccessKey();
  const keySuffix = key.slice(-8); // Last 8 chars
  
  // Store the key
  const storedKey: StoredKey = {
    key,
    memberId,
    tier: 'member' as KeyTier,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    maxUses: 1000,
    usedCount: 0,
    metadata: {
      source: args.source,
      ipAddress: args.ipAddress
    }
  };
  
  await storeKey(storedKey);
  
  return {
    key,
    keySuffix,
    expiresAt: storedKey.expiresAt!,
    memberId,
    tier: 'member'
  };
}

export async function verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
  // Basic format validation
  if (!key.startsWith('IC-') || key.length !== 44) { // IC- + 40 hex chars
    return { valid: false, reason: 'invalid_format' };
  }
  
  const storedKey = await getKey(key);
  
  if (!storedKey) {
    return { valid: false, reason: 'not_found' };
  }
  
  if (storedKey.revoked) {
    return { valid: false, reason: 'revoked' };
  }
  
  if (storedKey.expiresAt && isExpired(storedKey.expiresAt)) {
    return { valid: false, reason: 'expired' };
  }
  
  if (storedKey.maxUses && (storedKey.usedCount || 0) >= storedKey.maxUses) {
    return { valid: false, reason: 'rate_limited' };
  }
  
  // Increment usage
  await incrementKeyUsage(key);
  
  return {
    valid: true,
    reason: 'valid',
    memberId: storedKey.memberId,
    keySuffix: key.slice(-8),
    tier: storedKey.tier
  };
}

export async function getPrivacySafeStats(): Promise<InnerCircleStats> {
  const activeKeys = await getActiveKeys();
  const allKeys = Array.from(mem.values());
  
  // Count by tier
  const byTier: Record<KeyTier, number> = {
    member: 0,
    patron: 0,
    founder: 0
  };
  
  activeKeys.forEach(key => {
    byTier[key.tier] = (byTier[key.tier] || 0) + 1;
  });
  
  // Count recent unlocks (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentUnlocks = Array.from(keyUsageStore.values())
    .filter(usage => usage.timestamp > twentyFourHoursAgo)
    .length;
  
  return {
    totalMembers: memberStore.size,
    totalKeys: allKeys.length,
    activeKeys: activeKeys.length,
    byTier,
    recentUnlocks,
    memoryStoreSize: mem.size
  };
}

export async function recordInnerCircleUnlock(
  memberId: string,
  keySuffix: string
): Promise<{ success: boolean; timestamp: string }> {
  const timestamp = new Date();
  const key = `unlock:${memberId}:${keySuffix}:${timestamp.getTime()}`;
  
  keyUsageStore.set(key, {
    keySuffix,
    memberId,
    timestamp
  });
  
  // Clean old records (older than 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  for (const [key, record] of keyUsageStore.entries()) {
    if (record.timestamp < thirtyDaysAgo) {
      keyUsageStore.delete(key);
    }
  }
  
  return {
    success: true,
    timestamp: timestamp.toISOString()
  };
}

export async function cleanupExpiredData(): Promise<CleanupResult> {
  let deleted = 0;
  const details: Record<string, number> = {
    keys: 0,
    members: 0,
    unlocks: 0
  };
  
  // Clean expired keys
  const keyResult = await cleanupExpiredKeys();
  deleted += keyResult.cleaned;
  details.keys = keyResult.cleaned;
  
  // Clean old members (inactive for 180 days)
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  for (const [memberId, member] of memberStore.entries()) {
    if (member.lastSeen < sixMonthsAgo) {
      // Check if member has any active keys
      const memberKeys = await getKeysByMember(memberId);
      const hasActiveKeys = memberKeys.some(key => 
        !key.revoked && (!key.expiresAt || !isExpired(key.expiresAt))
      );
      
      if (!hasActiveKeys) {
        memberStore.delete(memberId);
        deleted++;
        details.members++;
      }
    }
  }
  
  // Clean old unlock records (older than 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  for (const [key, record] of keyUsageStore.entries()) {
    if (record.timestamp < ninetyDaysAgo) {
      keyUsageStore.delete(key);
      deleted++;
      details.unlocks++;
    }
  }
  
  return {
    deleted,
    message: `Cleaned ${deleted} items`,
    details
  };
}

/// Export everything for backward compatibility
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
  cleanupExpiredData

};
export default keysApi;
