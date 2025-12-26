// lib/server/inner-circle-store.ts
/* eslint-disable no-console */
/**
 * Inner Circle store (server-only).
 *
 * Goals:
 * - Provide a stable, typed surface for API routes and server utilities.
 * - Avoid "default export is a handler" mistakes by exporting real methods.
 * - Compile cleanly even if you later swap the storage engine (DB, KV, etc.).
 *
 * NOTE:
 * This implementation uses an in-memory store as a safe baseline.
 * Replace the internal persistence layer later (Postgres/KV) without changing imports.
 */

import type { NextApiRequest } from "next";
import crypto from "crypto";

export type InnerCircleStatus = "active" | "revoked" | "expired";

export type CreateOrUpdateMemberArgs = {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string; // e.g. "web-registration" | "web-resend"
};

export type IssuedKey = {
  key: string;
  keySuffix: string;
  email: string;
  name?: string;
  status: InnerCircleStatus;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  lastIssuedAt: string; // ISO
  lastSeenIp?: string;
  lastSeenAt?: string; // ISO
};

export type VerifyInnerCircleKeyResult =
  | {
      ok: true;
      email: string;
      name?: string;
      status: InnerCircleStatus;
      expiresAt: string;
    }
  | {
      ok: false;
      reason:
        | "missing_key"
        | "invalid_key"
        | "revoked"
        | "expired"
        | "unknown_error";
    };

export type InnerCircleMember = {
  email: string;
  name?: string;
  status: InnerCircleStatus;
  createdAt: string;
  lastIssuedAt: string;
  expiresAt: string;
};

export type AdminExportRow = {
  email: string;
  name?: string;
  status: InnerCircleStatus;
  createdAt: string;
  lastIssuedAt: string;
  expiresAt: string;
  keySuffix: string;
};

type StoreRecord = {
  email: string;
  name?: string;
  status: InnerCircleStatus;
  keyHash: string;
  keySuffix: string;
  createdAt: number;
  lastIssuedAt: number;
  expiresAt: number;
  lastSeenIp?: string;
  lastSeenAt?: number;
};

const DEFAULT_KEY_TTL_DAYS = Math.max(1, Number(process.env.INNER_CIRCLE_KEY_TTL_DAYS || 90));
const KEY_BYTES = 24; // 32-ish chars in base64url
const KEY_PREFIX = "IC";

/**
 * In-memory indexes
 * - byEmail: stable member record
 * - byKeyHash: lookup on verify
 */
const byEmail = new Map<string, StoreRecord>();
const byKeyHash = new Map<string, string>(); // keyHash -> email

function now() {
  return Date.now();
}

function toIso(ts: number) {
  return new Date(ts).toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function issueKey(): { key: string; keyHash: string; keySuffix: string } {
  const raw = `${KEY_PREFIX}_${base64Url(crypto.randomBytes(KEY_BYTES))}`;
  const hash = sha256(raw);
  const suffix = raw.slice(-6);
  return { key: raw, keyHash: hash, keySuffix: suffix };
}

function ttlMs(): number {
  return DEFAULT_KEY_TTL_DAYS * 24 * 60 * 60 * 1000;
}

export function getClientIp(req: NextApiRequest): string | undefined {
  const xfwd = req.headers["x-forwarded-for"];
  if (typeof xfwd === "string") return xfwd.split(",")[0]?.trim();
  if (Array.isArray(xfwd)) return xfwd[0]?.split(",")[0]?.trim();
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") return realIp.trim();
  return undefined;
}

/**
 * Create or update a member record and issue a new key (single active key per email).
 */
export async function createOrUpdateMemberAndIssueKey(
  args: CreateOrUpdateMemberArgs
): Promise<IssuedKey> {
  const email = normalizeEmail(args.email);
  const t = now();
  const expiresAt = t + ttlMs();
  const { key, keyHash, keySuffix } = issueKey();

  const existing = byEmail.get(email);

  // Remove old keyHash index if rotating
  if (existing?.keyHash) {
    byKeyHash.delete(existing.keyHash);
  }

  const record: StoreRecord = {
    email,
    name: args.name?.trim() || existing?.name,
    status: "active",
    keyHash,
    keySuffix,
    createdAt: existing?.createdAt ?? t,
    lastIssuedAt: t,
    expiresAt,
    lastSeenIp: args.ipAddress || existing?.lastSeenIp,
    lastSeenAt: existing?.lastSeenAt,
  };

  byEmail.set(email, record);
  byKeyHash.set(keyHash, email);

  // Optional audit log (keep minimal)
  if (process.env.NODE_ENV !== "production") {
    console.info("[InnerCircle] issued key", {
      email,
      keySuffix,
      context: args.context || "unknown",
    });
  }

  return {
    key,
    keySuffix,
    email,
    name: record.name,
    status: record.status,
    createdAt: toIso(record.createdAt),
    lastIssuedAt: toIso(record.lastIssuedAt),
    expiresAt: toIso(record.expiresAt),
    lastSeenIp: record.lastSeenIp,
    lastSeenAt: record.lastSeenAt ? toIso(record.lastSeenAt) : undefined,
  };
}

/**
 * Verify a key (hash lookup) and optionally update last-seen metadata.
 */
export async function verifyInnerCircleKey(
  key: string,
  opts?: { ipAddress?: string }
): Promise<VerifyInnerCircleKeyResult> {
  if (!key || typeof key !== "string") {
    return { ok: false, reason: "missing_key" };
  }

  const keyHash = sha256(key);
  const email = byKeyHash.get(keyHash);
  if (!email) return { ok: false, reason: "invalid_key" };

  const rec = byEmail.get(email);
  if (!rec) return { ok: false, reason: "invalid_key" };

  if (rec.status === "revoked") return { ok: false, reason: "revoked" };

  const t = now();
  if (rec.expiresAt <= t) {
    // Mark as expired (idempotent)
    rec.status = "expired";
    byEmail.set(email, rec);
    return { ok: false, reason: "expired" };
  }

  // Update last-seen (best effort)
  if (opts?.ipAddress) rec.lastSeenIp = opts.ipAddress;
  rec.lastSeenAt = t;
  byEmail.set(email, rec);

  return {
    ok: true,
    email: rec.email,
    name: rec.name,
    status: rec.status,
    expiresAt: toIso(rec.expiresAt),
  };
}

export async function deleteMemberByEmail(email: string): Promise<boolean> {
  const e = normalizeEmail(email);
  const rec = byEmail.get(e);
  if (!rec) return false;

  byEmail.delete(e);
  byKeyHash.delete(rec.keyHash);
  return true;
}

// lib/server/inner-circle-store.ts - Update cleanupExpiredData function

// Replace the existing cleanupExpiredData function (around line 153) with:
export async function cleanupExpiredData(): Promise<{
  deletedMembers: number;
  deletedKeys: number;
  remainingTotal: number;
}> {
  const t = now();
  let deletedMembers = 0;
  let deletedKeys = 0;

  // Collect expired emails first to avoid mutation during iteration
  const expiredEmails: string[] = [];
  const expiredKeyHashes: string[] = [];

  for (const [email, rec] of byEmail.entries()) {
    if (rec.expiresAt <= t || rec.status === "expired") {
      expiredEmails.push(email);
      expiredKeyHashes.push(rec.keyHash);
    }
  }

  // Remove expired records
  for (const email of expiredEmails) {
    const rec = byEmail.get(email);
    if (rec) {
      byEmail.delete(email);
      deletedMembers++;
    }
  }

  for (const keyHash of expiredKeyHashes) {
    if (byKeyHash.delete(keyHash)) {
      deletedKeys++;
    }
  }

  const remainingTotal = byEmail.size;

  if (process.env.NODE_ENV !== "production" && (deletedMembers > 0 || deletedKeys > 0)) {
    console.info(`[InnerCircle Cleanup] Deleted ${deletedMembers} members and ${deletedKeys} keys. ${remainingTotal} remaining.`);
  }

  return {
    deletedMembers,
    deletedKeys,
    remainingTotal,
  };
}

// Also update the default export to maintain consistency:
const innerCircleStore = {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  getPrivacySafeKeyRows,
  getPrivacySafeKeyExport,
  deleteMemberByEmail,
  cleanupExpiredData, // ✅ Now returns the correct type
  getClientIp,
};

export default innerCircleStore;