// lib/innerCircleMembership.ts
// =======================================================================
// Inner Circle Membership Store (In-Memory, Privacy-First)
// =======================================================================
//
// NOTES:
// - This implementation is intentionally in-memory.
// - On Netlify / Vercel, each function invocation may see a cold start,
//   so do NOT treat this as a permanent DB.
// - It is designed as a clean abstraction so you can later plug in
//   Postgres / DynamoDB / Redis without touching API routes.
//
// PRIVACY / SECURITY:
// - We NEVER store raw email addresses.
// - We store only a SHA-256 hash and a short hash prefix.
// - We NEVER store or export full keys; only their hash and suffix.
// - Admin export is deliberately de-identified.
//
// =======================================================================

import crypto from "node:crypto";

export type InnerCircleStatus = "pending" | "active" | "revoked";

export interface InnerCircleKeyRecord {
  keyHash: string; // SHA-256 of the full key
  keySuffix: string; // last 4–5 chars, for admin reference only
  createdAt: string; // ISO string
  lastUsedAt?: string; // ISO string
  status: InnerCircleStatus;
  totalUnlocks: number;
  lastIp?: string;
}

export interface InnerCircleMember {
  id: string;
  emailHash: string; // SHA-256 hex
  emailHashPrefix: string; // first 10 chars of emailHash
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
  context?: "register" | "manual" | "import" | string;
}

export interface IssuedKey {
  key: string; // full key (only returned once, to caller)
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

// Shape used by /api/admin/inner-circle/export
export interface InnerCircleAdminExportRow {
  created_at: string;
  status: InnerCircleStatus;
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
}

// =======================================================================
// In-memory store
// =======================================================================

const members: InnerCircleMember[] = [];

// Fast index from keyHash -> member + key
const keyHashIndex = new Map<
  string,
  { memberId: string; keyIndex: number }
>();

// Fast index from emailHash -> member
const emailHashIndex = new Map<string, string>(); // emailHash -> memberId

const KEY_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year

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
  return crypto.randomUUID
    ? crypto.randomUUID()
    : sha256Hex(`${Date.now()}-${Math.random()}`).slice(0, 32);
}

function generateAccessKey(): { key: string; keyHash: string; keySuffix: string } {
  // 20 random bytes -> base32-ish string, grouped for readability
  const raw = crypto.randomBytes(20).toString("base64url"); // URL-safe
  const key = raw.slice(0, 24); // trim to a nice length

  const keyHash = sha256Hex(key);
  const keySuffix = key.slice(-4);

  return { key, keyHash, keySuffix };
}

function nowIso(): string {
  return new Date().toISOString();
}

function getMemberByEmailHash(emailHash: string): InnerCircleMember | null {
  const id = emailHashIndex.get(emailHash);
  if (!id) return null;
  return members.find((m) => m.id === id) ?? null;
}

function getMemberById(id: string): InnerCircleMember | null {
  return members.find((m) => m.id === id) ?? null;
}

function indexMember(member: InnerCircleMember): void {
  emailHashIndex.set(member.emailHash, member.id);

  member.keys.forEach((key, idx) => {
    keyHashIndex.set(key.keyHash, { memberId: member.id, keyIndex: idx });
  });
}

// =======================================================================
// Public API
// =======================================================================

/**
 * Create or update a member, issue a fresh access key.
 *
 * Returns the full key exactly once, for emailing to the user.
 */
export function createOrUpdateMemberAndIssueKey(
  args: CreateOrUpdateMemberArgs,
): IssuedKey {
  const emailNormalised = normaliseEmail(args.email);
  const emailHash = sha256Hex(emailNormalised);
  const emailHashPrefix = emailHash.slice(0, 10);

  const now = nowIso();

  let member = getMemberByEmailHash(emailHash);

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
  } else {
    member.lastSeenAt = now;
    if (args.name && args.name.trim().length > 0) {
      member.name = args.name.trim();
    }
    if (args.ipAddress) {
      member.lastIp = args.ipAddress;
    }
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
  keyHashIndex.set(keyHash, {
    memberId: member.id,
    keyIndex: member.keys.length - 1,
  });

  return {
    key,
    keySuffix,
    createdAt: keyRecord.createdAt,
    status: keyRecord.status,
  };
}

/**
 * Verify a supplied key WITHOUT mutating the store.
 * Use recordInnerCircleUnlock to record successful usage.
 */
export function verifyInnerCircleKey(
  key: string,
): VerifyInnerCircleKeyResult {
  const safeKey = key.trim();
  if (!safeKey) {
    return { valid: false, reason: "missing-key" };
  }

  const keyHash = sha256Hex(safeKey);
  const hit = keyHashIndex.get(keyHash);
  if (!hit) {
    return { valid: false, reason: "not-found" };
  }

  const member = getMemberById(hit.memberId);
  if (!member) {
    return { valid: false, reason: "member-missing" };
  }

  const record = member.keys[hit.keyIndex];
  if (!record) {
    return { valid: false, reason: "record-missing" };
  }

  if (record.status === "revoked") {
    return { valid: false, reason: "revoked" };
  }

  const created = new Date(record.createdAt).getTime();
  const ageMs = Date.now() - created;

  if (ageMs > KEY_TTL_MS) {
    return { valid: false, reason: "expired" };
  }

  return {
    valid: true,
    memberId: member.id,
    keySuffix: record.keySuffix,
    createdAt: record.createdAt,
  };
}

/**
 * Record a successful unlock event for analytics / governance.
 */
export function recordInnerCircleUnlock(
  key: string,
  ipAddress?: string,
): void {
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
  if (ipAddress) {
    record.lastIp = ipAddress;
    member.lastIp = ipAddress;
  }
  member.lastSeenAt = record.lastUsedAt;
}

/**
 * Export a privacy-safe admin view of the keys.
 * NO raw emails. NO full keys. No reversible identifiers.
 */
export function exportInnerCircleAdminSummary(): InnerCircleAdminExportRow[] {
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

  // Sort newest first for admin convenience
  rows.sort((a, b) => {
    const tA = new Date(a.created_at).getTime();
    const tB = new Date(b.created_at).getTime();
    return tB - tA;
  });

  return rows;
}

/**
 * Optional: revoke a key (not currently wired to any API route,
 * but available for future admin tooling).
 */
export function revokeInnerCircleKey(key: string): boolean {
  const safeKey = key.trim();
  if (!safeKey) return false;

  const keyHash = sha256Hex(safeKey);
  const hit = keyHashIndex.get(keyHash);
  if (!hit) return false;

  const member = getMemberById(hit.memberId);
  if (!member) return false;

  const record = member.keys[hit.keyIndex];
  if (!record) return false;

  record.status = "revoked";
  record.lastUsedAt = nowIso();

  return true;
}