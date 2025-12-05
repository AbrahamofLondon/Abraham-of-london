// lib/server/innerCircleStore.ts
// ---------------------------------------------------------------------------
// Server-only Inner Circle store implementation
// ---------------------------------------------------------------------------

import crypto from "node:crypto";

// Types - make sure these match the ones in innerCircleMembership.ts
export type InnerCircleStatus = "pending" | "active" | "revoked";

export interface CreateOrUpdateMemberArgs {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string;
}

export interface IssuedKey {
  key: string;
  keySuffix: string;
  createdAt: string;
  status: InnerCircleStatus;
}

export interface VerifyInnerCircleKeyResult {
  valid: boolean;
  reason?: string;
  memberId?: string;
  keySuffix?: string;
  createdAt?: string;
}

export interface InnerCircleAdminExportRow {
  created_at: string;
  status: InnerCircleStatus;
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
}

export interface PrivacySafeStats {
  totalMembers: number;
  activeMembers: number;
  totalKeys: number;
  totalUnlocks: number;
  dataRetentionDays: number;
  estimatedMemoryBytes: number;
  lastCleanup: string;
}

// Helper functions
function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

function generateAccessKey(): {
  key: string;
  keyHash: string;
  keySuffix: string;
} {
  const raw = crypto.randomBytes(20).toString("base64url");
  const key = raw.slice(0, 24);
  const keyHash = sha256Hex(key);
  const keySuffix = key.slice(-4);
  return { key, keyHash, keySuffix };
}

function logPrivacyAction(
  action: string,
  metadata: Record<string, unknown> = {}
): void {
  console.log(`🔒 InnerCircle: ${action}`, {
    ts: new Date().toISOString(),
    ...metadata,
  });
}

// Simple in-memory store for server use
class ServerInnerCircleStore {
  private members: Map<string, any> = new Map();
  private keys: Map<string, any> = new Map();
  private emailToMember: Map<string, string> = new Map();
  private lastCleanup = nowIso();
  private readonly DATA_RETENTION_DAYS = 365;

  async createOrUpdateMemberAndIssueKey(
    args: CreateOrUpdateMemberArgs
  ): Promise<IssuedKey> {
    const emailNormalised = normaliseEmail(args.email);
    const emailHash = sha256Hex(emailNormalised);
    const emailHashPrefix = emailHash.slice(0, 10);
    const now = nowIso();
    const { key, keyHash, keySuffix } = generateAccessKey();

    let memberId = this.emailToMember.get(emailHash);
    const isNewMember = !memberId;

    if (!memberId) {
      memberId = crypto.randomUUID();
      this.members.set(memberId, {
        id: memberId,
        emailHash,
        emailHashPrefix,
        name: args.name?.trim() || undefined,
        createdAt: now,
        lastSeenAt: now,
        lastIp: args.ipAddress,
        keys: [],
      });
      this.emailToMember.set(emailHash, memberId);
    } else {
      const member = this.members.get(memberId);
      if (member) {
        member.lastSeenAt = now;
        if (args.name && args.name.trim()) member.name = args.name.trim();
        if (args.ipAddress) member.lastIp = args.ipAddress;
      }
    }

    const keyRecord = {
      keyHash,
      keySuffix,
      createdAt: now,
      status: "active" as InnerCircleStatus,
      totalUnlocks: 0,
      lastUsedAt: null,
      memberId,
    };

    this.keys.set(keyHash, keyRecord);

    // Update member's keys array
    const member = this.members.get(memberId);
    if (member) {
      member.keys.push(keyRecord);
    }

    logPrivacyAction("server_key_issued", {
      memberId,
      emailHashPrefix,
      keySuffix,
      isNewMember,
    });

    return {
      key,
      keySuffix,
      createdAt: now,
      status: "active",
    };
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const safeKey = key.trim();
    if (!safeKey) return { valid: false, reason: "missing-key" };

    const keyHash = sha256Hex(safeKey);
    const keyRecord = this.keys.get(keyHash);

    if (!keyRecord) return { valid: false, reason: "not-found" };
    if (keyRecord.status === "revoked")
      return { valid: false, reason: "revoked" };

    // Check expiration (365 days)
    const created = new Date(keyRecord.createdAt).getTime();
    const ageMs = Date.now() - created;
    const keyTtlMs = 1000 * 60 * 60 * 24 * this.DATA_RETENTION_DAYS;

    if (ageMs > keyTtlMs) return { valid: false, reason: "expired" };

    return {
      valid: true,
      memberId: keyRecord.memberId,
      keySuffix: keyRecord.keySuffix,
      createdAt: keyRecord.createdAt,
    };
  }

  async recordInnerCircleUnlock(
    key: string,
    ipAddress?: string
  ): Promise<void> {
    const safeKey = key.trim();
    if (!safeKey) return;

    const keyHash = sha256Hex(safeKey);
    const keyRecord = this.keys.get(keyHash);

    if (!keyRecord) return;

    keyRecord.totalUnlocks += 1;
    keyRecord.lastUsedAt = nowIso();

    // Update member last seen
    const member = this.members.get(keyRecord.memberId);
    if (member) {
      member.lastSeenAt = keyRecord.lastUsedAt;
      if (ipAddress) member.lastIp = ipAddress;
    }

    logPrivacyAction("server_key_used", {
      memberId: keyRecord.memberId,
      keySuffix: keyRecord.keySuffix,
      totalUnlocks: keyRecord.totalUnlocks,
    });
  }

  async revokeInnerCircleKey(key: string): Promise<boolean> {
    const safeKey = key.trim();
    if (!safeKey) return false;

    const keyHash = sha256Hex(safeKey);
    const keyRecord = this.keys.get(keyHash);

    if (!keyRecord || keyRecord.status === "revoked") return false;

    keyRecord.status = "revoked";
    keyRecord.lastUsedAt = nowIso();

    logPrivacyAction("server_key_revoked", {
      memberId: keyRecord.memberId,
      keySuffix: keyRecord.keySuffix,
    });

    return true;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const emailNormalised = normaliseEmail(email);
    const emailHash = sha256Hex(emailNormalised);
    const memberId = this.emailToMember.get(emailHash);

    if (!memberId) return false;

    // Remove all keys for this member
    for (const [keyHash, keyRecord] of this.keys.entries()) {
      if (keyRecord.memberId === memberId) {
        this.keys.delete(keyHash);
      }
    }

    this.emailToMember.delete(emailHash);
    this.members.delete(memberId);

    logPrivacyAction("server_member_deleted", {
      memberId,
      emailHash: emailHash.slice(0, 10) + "...",
    });

    return true;
  }

  async cleanupOldData(): Promise<{
    deletedMembers: number;
    deletedKeys: number;
  }> {
    const cutoff = Date.now() - this.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedMembers = 0;
    let deletedKeys = 0;

    // Clean up old keys
    for (const [keyHash, keyRecord] of this.keys.entries()) {
      const lastUsed = keyRecord.lastUsedAt
        ? new Date(keyRecord.lastUsedAt).getTime()
        : new Date(keyRecord.createdAt).getTime();
      if (lastUsed < cutoff) {
        this.keys.delete(keyHash);
        deletedKeys++;
      }
    }

    // Clean up inactive members
    for (const [memberId, member] of this.members.entries()) {
      const lastSeen = new Date(member.lastSeenAt).getTime();
      if (lastSeen < cutoff) {
        // Remove all keys for this member
        for (const [keyHash, keyRecord] of this.keys.entries()) {
          if (keyRecord.memberId === memberId) {
            this.keys.delete(keyHash);
            deletedKeys++;
          }
        }

        this.emailToMember.delete(member.emailHash);
        this.members.delete(memberId);
        deletedMembers++;
      }
    }

    this.lastCleanup = nowIso();

    if (deletedMembers > 0 || deletedKeys > 0) {
      logPrivacyAction("server_cleanup_completed", {
        deletedMembers,
        deletedKeys,
      });
    }

    return { deletedMembers, deletedKeys };
  }

  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
    const totalMembers = this.members.size;
    const totalKeys = this.keys.size;

    let totalUnlocks = 0;
    let activeMembers = 0;

    for (const keyRecord of this.keys.values()) {
      totalUnlocks += keyRecord.totalUnlocks;
      if (keyRecord.status === "active") {
        // Check if key is not expired
        const created = new Date(keyRecord.createdAt).getTime();
        const ageMs = Date.now() - created;
        const keyTtlMs = 1000 * 60 * 60 * 24 * this.DATA_RETENTION_DAYS;
        if (ageMs < keyTtlMs) {
          activeMembers++;
        }
      }
    }

    return {
      totalMembers,
      activeMembers,
      totalKeys,
      totalUnlocks,
      dataRetentionDays: this.DATA_RETENTION_DAYS,
      estimatedMemoryBytes: totalMembers * 1024 + totalKeys * 256,
      lastCleanup: this.lastCleanup,
    };
  }

  async exportInnerCircleAdminSummary(): Promise<InnerCircleAdminExportRow[]> {
    const rows: InnerCircleAdminExportRow[] = [];

    for (const keyRecord of this.keys.values()) {
      const member = this.members.get(keyRecord.memberId);
      if (member) {
        rows.push({
          created_at: keyRecord.createdAt,
          status: keyRecord.status,
          key_suffix: keyRecord.keySuffix,
          email_hash_prefix: member.emailHashPrefix,
          total_unlocks: keyRecord.totalUnlocks,
        });
      }
    }

    // Sort by creation date, newest first
    rows.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return rows;
  }
}

// Create and export singleton instance
let storeInstance: ServerInnerCircleStore | null = null;

export function getInnerCircleStore(): ServerInnerCircleStore {
  if (!storeInstance) {
    storeInstance = new ServerInnerCircleStore();
  }
  return storeInstance;
}

// Export individual functions for API routes
export async function createOrUpdateMemberAndIssueKey(
  args: CreateOrUpdateMemberArgs
): Promise<IssuedKey> {
  return getInnerCircleStore().createOrUpdateMemberAndIssueKey(args);
}

export async function verifyInnerCircleKey(
  key: string
): Promise<VerifyInnerCircleKeyResult> {
  return getInnerCircleStore().verifyInnerCircleKey(key);
}

export async function recordInnerCircleUnlock(
  key: string,
  ipAddress?: string
): Promise<void> {
  return getInnerCircleStore().recordInnerCircleUnlock(key, ipAddress);
}

export async function revokeInnerCircleKey(key: string): Promise<boolean> {
  return getInnerCircleStore().revokeInnerCircleKey(key);
}

export async function deleteMemberByEmail(email: string): Promise<boolean> {
  return getInnerCircleStore().deleteMemberByEmail(email);
}

export async function cleanupOldData(): Promise<{
  deletedMembers: number;
  deletedKeys: number;
}> {
  return getInnerCircleStore().cleanupOldData();
}

export async function getPrivacySafeStats(): Promise<PrivacySafeStats> {
  return getInnerCircleStore().getPrivacySafeStats();
}

export async function exportInnerCircleAdminSummary(): Promise<
  InnerCircleAdminExportRow[]
> {
  return getInnerCircleStore().exportInnerCircleAdminSummary();
}
