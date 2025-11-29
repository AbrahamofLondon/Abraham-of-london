// lib/innerCircleMembership.ts
// =======================================================================
// Inner Circle Membership Store (In-Memory, Privacy-First)
// =======================================================================
//
// - No raw emails or full keys are ever stored.
// - Everything is hashed with SHA-256, only short prefixes/suffixes exposed.
// - Designed so you can later swap this out for a real DB without
//   touching API routes.
//
// =======================================================================

import crypto from "node:crypto";

export type InnerCircleStatus = "active" | "revoked";

export interface InnerCircleKeyRecord {
  keyHash: string;          // SHA-256 of full key
  keySuffix: string;        // last 4 chars for admin reference
  createdAt: string;        // ISO string
  lastUsedAt?: string;      // ISO string
  status: InnerCircleStatus;
  totalUnlocks: number;
  lastIp?: string;
}

export interface InnerCircleMember {
  id: string;
  emailHash: string;        // SHA-256 hex of normalised email
  emailHashPrefix: string;  // first 10 chars for admin view
  name?: string;
  createdAt: string;
  lastSeenAt: string;
  keys: InnerCircleKeyRecord[];
  lastIp?: string;
}

export interface CreateOrUpdateMemberArgs {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string;
}

export interface IssuedKey {
  key: string;              // full key (only returned once)
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

export interface CleanupStats {
  deletedMembers: number;
  deletedKeys: number;
}

// =======================================================================
// Configuration
// =======================================================================

const DATA_RETENTION_DAYS = 365; // 1 year
const KEY_TTL_MS = 1000 * 60 * 60 * 24 * DATA_RETENTION_DAYS;
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60 * 24; // 1 day

// =======================================================================
// In-memory data structures
// =======================================================================

const members: InnerCircleMember[] = [];

const keyHashIndex = new Map<string, { memberId: string; keyIndex: number }>();
const emailHashIndex = new Map<string, string>(); // emailHash -> memberId

// =======================================================================
// Helpers
// =======================================================================

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function generateId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return sha256Hex(`${Date.now()}-${Math.random()}`).slice(0, 32);
}

function generateAccessKey(): { key: string; keyHash: string; keySuffix: string } {
  const raw = crypto.randomBytes(20).toString("base64url"); // URL-safe
  const key = raw.slice(0, 24); // nice length
  const keyHash = sha256Hex(key);
  const keySuffix = key.slice(-4);
  return { key, keyHash, keySuffix };
}

function nowIso(): string {
  return new Date().toISOString();
}

function getMemberById(id: string): InnerCircleMember | null {
  return members.find((m) => m.id === id) ?? null;
}

function getMemberByEmailHash(emailHash: string): InnerCircleMember | null {
  const id = emailHashIndex.get(emailHash);
  if (!id) return null;
  return getMemberById(id);
}

function indexMember(member: InnerCircleMember): void {
  emailHashIndex.set(member.emailHash, member.id);
  member.keys.forEach((key, idx) => {
    keyHashIndex.set(key.keyHash, { memberId: member.id, keyIndex: idx });
  });
}

function unindexMember(member: InnerCircleMember): void {
  emailHashIndex.delete(member.emailHash);
  member.keys.forEach((key) => {
    keyHashIndex.delete(key.keyHash);
  });
}

function logPrivacy(action: string, metadata?: unknown): void {
  // Do not log PII; metadata is already privacy-safe by design
  // eslint-disable-next-line no-console
  console.log(`🔒 InnerCircle: ${action}`, {
    timestamp: new Date().toISOString(),
    metadata,
  });
}

// =======================================================================
// Cleanup & GDPR utilities
// =======================================================================

export function cleanupOldData(): CleanupStats {
  const cutoff = Date.now() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let deletedMembers = 0;
  let deletedKeys = 0;

  for (let i = members.length - 1; i >= 0; i--) {
    const member = members[i];
    const lastSeen = new Date(member.lastSeenAt).getTime();

    if (lastSeen < cutoff) {
      unindexMember(member);
      deletedMembers += 1;
      deletedKeys += member.keys.length;
      members.splice(i, 1);
    }
  }

  if (deletedMembers > 0) {
    logPrivacy("cleanup", { deletedMembers, deletedKeys, retentionDays: DATA_RETENTION_DAYS });
  }

  return { deletedMembers, deletedKeys };
}

export function deleteMemberByEmail(email: string): boolean {
  const emailNormalised = normaliseEmail(email);
  const emailHash = sha256Hex(emailNormalised);
  const member = getMemberByEmailHash(emailHash);
  if (!member) {
    logPrivacy("delete_not_found", { emailHash: sha256Hex(emailHash) }); // double-hash for audit
    return false;
  }

  unindexMember(member);
  const idx = members.findIndex((m) => m.id === member.id);
  if (idx !== -1) {
    members.splice(idx, 1);
  }

  logPrivacy("delete_member", {
    memberId: member.id,
    emailHashPrefix: member.emailHashPrefix,
    keysCount: member.keys.length,
  });

  return true;
}

export function getPrivacySafeStats(): PrivacySafeStats {
  const now = Date.now();

  const activeMembers = members.filter((m) =>
    m.keys.some(
      (k) => k.status === "active" && now - new Date(k.createdAt).getTime() < KEY_TTL_MS,
    ),
  ).length;

  const totalUnlocks = members.reduce(
    (sum, m) => sum + m.keys.reduce((ks, k) => ks + k.totalUnlocks, 0),
    0,
  );

  return {
    totalMembers: members.length,
    activeMembers,
    totalKeys: keyHashIndex.size,
    totalUnlocks,
    dataRetentionDays: DATA_RETENTION_DAYS,
    estimatedMemoryBytes: members.length * 600 + keyHashIndex.size * 120, // rough
    lastCleanup: new Date().toISOString(),
  };
}

// =======================================================================
// Public API – create / verify / record / export
// =======================================================================

export function createOrUpdateMemberAndIssueKey(
  args: CreateOrUpdateMemberArgs,
): IssuedKey {
  const emailNormalised = normaliseEmail(args.email);
  const emailHash = sha256Hex(emailNormalised);
  const emailHashPrefix = emailHash.slice(0, 10);
  const now = nowIso();

  let member = getMemberByEmailHash(emailHash);
  const isNew = !member;

  if (!member) {
    member = {
      id: generateId(),
      emailHash,
      emailHashPrefix,
      name: args.name?.trim() || undefined,
      createdAt: now,
      lastSeenAt: now,
      keys: [],
      lastIp: args.ipAddress,
    };

    members.push(member);
    indexMember(member);

    logPrivacy("member_created", {
      memberId: member.id,
      emailHashPrefix: member.emailHashPrefix,
      hasName: !!member.name,
      context: args.context,
    });
  } else {
    member.lastSeenAt = now;
    if (args.name && args.name.trim()) {
      member.name = args.name.trim();
    }
    if (args.ipAddress) {
      member.lastIp = args.ipAddress;
    }

    logPrivacy("member_updated", {
      memberId: member.id,
      emailHashPrefix: member.emailHashPrefix,
      context: args.context,
    });
  }

  const { key, keyHash, keySuffix } = generateAccessKey();

  const keyRecord: InnerCircleKeyRecord = {
    keyHash,
    keySuffix,
    createdAt: now,
    status: "active",
    totalUnlocks: 0,
  };

  member.keys.push(keyRecord);
  keyHashIndex.set(keyHash, { memberId: member.id, keyIndex: member.keys.length - 1 });

  logPrivacy("key_issued", {
    memberId: member.id,
    keySuffix,
    isNewMember: isNew,
    context: args.context,
  });

  return {
    key,
    keySuffix,
    createdAt: keyRecord.createdAt,
    status: keyRecord.status,
  };
}

export function verifyInnerCircleKey(key: string): VerifyInnerCircleKeyResult {
  const safeKey = key.trim();
  if (!safeKey) return { valid: false, reason: "missing-key" };

  const keyHash = sha256Hex(safeKey);
  const hit = keyHashIndex.get(keyHash);
  if (!hit) return { valid: false, reason: "not-found" };

  const member = getMemberById(hit.memberId);
  if (!member) return { valid: false, reason: "member-missing" };

  const record = member.keys[hit.keyIndex];
  if (!record) return { valid: false, reason: "record-missing" };

  if (record.status === "revoked") return { valid: false, reason: "revoked" };

  const ageMs = Date.now() - new Date(record.createdAt).getTime();
  if (ageMs > KEY_TTL_MS) return { valid: false, reason: "expired" };

  return {
    valid: true,
    memberId: member.id,
    keySuffix: record.keySuffix,
    createdAt: record.createdAt,
  };
}

export function recordInnerCircleUnlock(key: string, ipAddress?: string): void {
  const safeKey = key.trim();
  if (!safeKey) return;

  const keyHash = sha256Hex(safeKey);
  const hit = keyHashIndex.get(keyHash);
  if (!hit) return;

  const member = getMemberById(hit.memberId);
  if (!member) return;

  const record = member.keys[hit.keyIndex];
  if (!record) return;

  record.totalUnlocks += 1;
  record.lastUsedAt = nowIso();
  member.lastSeenAt = record.lastUsedAt;
  if (ipAddress) {
    record.lastIp = ipAddress;
    member.lastIp = ipAddress;
  }

  logPrivacy("key_used", {
    memberId: member.id,
    keySuffix: record.keySuffix,
    totalUnlocks: record.totalUnlocks,
    hasIp: !!ipAddress,
  });
}

export function exportInnerCircleAdminSummary(): InnerCircleAdminExportRow[] {
  logPrivacy("admin_export");

  const rows: InnerCircleAdminExportRow[] = [];

  members.forEach((member) => {
    member.keys.forEach((key) => {
      rows.push({
        created_at: key.createdAt,
        status: key.status,
        key_suffix: key.keySuffix,
        email_hash_prefix: member.emailHashPrefix,
        total_unlocks: key.totalUnlocks,
      });
    });
  });

  rows.sort((a, b) => {
    const tA = new Date(a.created_at).getTime();
    const tB = new Date(b.created_at).getTime();
    return tB - tA;
  });

  return rows;
}

// =======================================================================
// Automatic cleanup scheduling (server-side only)
// =======================================================================

if (typeof process !== "undefined" && typeof setInterval !== "undefined") {
  // daily cleanup
  setInterval(() => {
    const stats = cleanupOldData();
    if (stats.deletedMembers > 0 || stats.deletedKeys > 0) {
      logPrivacy("cleanup_run", stats);
    }
  }, CLEANUP_INTERVAL_MS);
}