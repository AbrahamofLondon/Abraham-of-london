/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib//keys.ts

import { safeSlice } from "@/lib/utils/safe";
import crypto from "crypto";
import { Pool, type PoolClient } from "pg";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";

/* =============================================================================
   1. CONFIGURATION
   ============================================================================= */
const CONFIG = {
  KEY_EXPIRY_DAYS: Number(process.env.INNER_CIRCLE_KEY_EXPIRY_DAYS || 90),
  KEY_PREFIX: "icl_",
  KEY_LENGTH: 32,
  MAX_KEYS_PER_MEMBER: 3,
  CLEANUP_KEY_TTL_DAYS: 30,
  MAX_UNLOCKS_PER_DAY: 100,
} as const;

/* =============================================================================
   2. TYPE DEFINITIONS
   ============================================================================= */
export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired" | "suspended";

export type CreateOrUpdateMemberArgs = {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string;
  metadata?: Record<string, unknown>;
  source?: "registration" | "invite" | "admin" | "api";
};

export type IssuedKey = {
  key: string;
  keySuffix: string;
  createdAt: string;
  expiresAt: string;
  status: InnerCircleStatus;
  memberId: string;
  keyHash: string;
  totalUnlocks: number;
};

export type VerifyInnerCircleKeyResult = {
  valid: boolean;
  reason?: "empty" | "not_found" | "revoked" | "expired" | "no_db" | "invalid_format" | "suspended" | "rate_limited";
  memberId?: string;
  keySuffix?: string;
  status?: InnerCircleStatus;
  expiresAt?: string;
  remainingUnlocks?: number;
  unlocksToday?: number;
};

export type InnerCircleStats = {
  totalMembers: number;
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  expiredKeys: number;
  avgUnlocksPerKey: number;
  lastActivity?: string;
};

export type CleanupResult = {
  deletedMembers: number;
  deletedKeys: number;
  totalOrphanedKeys: number;
  cleanedAt: string;
  suspendedKeys: number;
};

/* =============================================================================
   3. UTILITY FUNCTIONS
   ============================================================================= */
export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function generateAccessKey(): { key: string; keyHash: string; keySuffix: string } {
  const raw = crypto.randomBytes(CONFIG.KEY_LENGTH).toString("base64url");
  const key = `${CONFIG.KEY_PREFIX}${raw}`;
  return {
    key,
    keyHash: sha256Hex(key),
    keySuffix: key.slice(-8),
  };
}

const toInt = (val: any, fallback: number = 0): number => {
  const n = parseInt(val);
  return isNaN(n) ? fallback : n;
};

/* =============================================================================
   4. DATABASE CLIENT
   ============================================================================= */
let sharedPool: Pool | null = null;

function getPool(): Pool | null {
  if (sharedPool) return sharedPool;
  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) return null;
  sharedPool = new Pool({
    connectionString: conn,
    max: 10,
    ssl: conn.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
  return sharedPool;
}

export class DatabaseClient {
  static async transactional<T>(operation: string, fn: (client: PoolClient) => Promise<T>, fallback: T): Promise<T> {
    const pool = getPool();
    if (!pool) return fallback;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const out = await fn(client);
      await client.query("COMMIT");
      return out;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`[InnerCircle] ${operation} failed:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  static async query<T>(operation: string, text: string, params: any[], fallback: T): Promise<T> {
    const pool = getPool();
    if (!pool) return fallback;
    try {
      const res = await pool.query(text, params);
      return res.rows as unknown as T;
    } catch (err) {
      console.error(`[InnerCircle] Query ${operation} failed:`, err);
      return fallback;
    }
  }
}

/* =============================================================================
   5. CORE LOGIC
   ============================================================================= */

export async function createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
  const emailHash = sha256Hex(args.email.trim().toLowerCase());
  const { key, keyHash, keySuffix } = generateAccessKey();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CONFIG.KEY_EXPIRY_DAYS);

  return DatabaseClient.transactional(
    "createMemberAndKey",
    async (client) => {
      // 1. Check existing key count
      const countRes = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text FROM inner_circle_keys k JOIN inner_circle_members m ON k.member_id = m.id WHERE m.email_hash = $1 AND k.status = 'active'",
        [emailHash]
      );
      if (toInt(countRes.rows[0]?.count) >= CONFIG.MAX_KEYS_PER_MEMBER) {
        throw new Error("Max keys reached");
      }

      // 2. Upsert Member
      const memberRes = await client.query<{ id: string }>(
        `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email_hash) DO UPDATE SET last_seen_at = NOW(), last_ip = EXCLUDED.last_ip
         RETURNING id`,
        [emailHash, safeSlice(emailHash, 0, 12), args.name || null, args.ipAddress || null, args.metadata ? JSON.stringify(args.metadata) : null]
      );

      // --- SYSTEMIC GUARD ---
      const memberId = memberRes.rows?.[0]?.id;
      if (!memberId) throw new Error("Member creation failed - No ID returned");

      // 3. Issue Key
      await client.query(
        "INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status, expires_at) VALUES ($1, $2, $3, 'active', $4)",
        [memberId, keyHash, keySuffix, expiresAt]
      );

      return {
        key,
        keySuffix,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: "active",
        memberId,
        keyHash,
        totalUnlocks: 0
      };
    },
    {} as IssuedKey
  );
}

export async function verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
  const keyHash = sha256Hex(key.trim());
  const rows = await DatabaseClient.query<any[]>(
    "verify",
    "SELECT * FROM inner_circle_keys WHERE key_hash = $1",
    [keyHash],
    []
  );

  const row = rows[0];
  if (!row) return { valid: false, reason: "not_found" };
  if (row.status !== "active") return { valid: false, reason: row.status };
  if (new Date(row.expires_at) < new Date()) return { valid: false, reason: "expired" };

  return {
    valid: true,
    memberId: row.member_id,
    keySuffix: row.key_suffix,
    status: row.status,
    expiresAt: row.expires_at
  };
}

export async function recordInnerCircleUnlock(key: string, ip?: string): Promise<void> {
  const keyHash = sha256Hex(key.trim());
  await DatabaseClient.query(
    "unlock",
    "UPDATE inner_circle_keys SET total_unlocks = total_unlocks + 1, last_used_at = NOW(), last_ip = $2 WHERE key_hash = $1",
    [keyHash, ip || null],
    null
  );
}

export async function getPrivacySafeStats(): Promise<InnerCircleStats> {
  const rows = await DatabaseClient.query<any[]>(
    "stats",
    `SELECT 
      (SELECT COUNT(*) FROM inner_circle_members) as "totalMembers",
      (SELECT COUNT(*) FROM inner_circle_keys) as "totalKeys",
      (SELECT COUNT(*) FROM inner_circle_keys WHERE status = 'active') as "activeKeys"`,
    [],
    []
  );
  const r = rows[0] || {};
  return {
    totalMembers: toInt(r.totalMembers),
    totalKeys: toInt(r.totalKeys),
    activeKeys: toInt(r.activeKeys),
    revokedKeys: 0,
    expiredKeys: 0,
    avgUnlocksPerKey: 0
  };
}

export async function cleanupExpiredData(): Promise<CleanupResult> {
  return DatabaseClient.transactional(
    "cleanup",
    async (client) => {
      const expired = await client.query("UPDATE inner_circle_keys SET status = 'expired' WHERE expires_at < NOW() AND status = 'active'");
      return {
        deletedMembers: 0,
        deletedKeys: expired.rowCount || 0,
        totalOrphanedKeys: 0,
        cleanedAt: new Date().toISOString(),
        suspendedKeys: 0
      };
    },
    { deletedMembers: 0, deletedKeys: 0, totalOrphanedKeys: 0, cleanedAt: "", suspendedKeys: 0 }
  );
}