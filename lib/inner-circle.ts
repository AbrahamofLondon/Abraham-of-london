/* eslint-disable no-console */
import crypto from "node:crypto";
import { Pool, type PoolClient } from "pg";
// Ensure these imports match your actual file structure for audit
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
  CLEANUP_MEMBER_INACTIVE_DAYS: 90,
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
  referrer?: string;
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

// Explicit type for verification results
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

// THIS IS THE TYPE THAT WAS MISSING
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

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>"'`;]/g, "");
}

export function toIso(date: Date | string | null): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function toInt(value: any, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isInteger(num) ? num : fallback;
}

export function toFloat(value: any, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/* =============================================================================
   4. DATABASE CLIENT
   ============================================================================= */

let sharedPool: Pool | null = null;

function getPool(): Pool | null {
  if (process.env.NETLIFY === "true" && !process.env.AWS_LAMBDA_FUNCTION_NAME) return null;
  if (sharedPool) return sharedPool;

  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) return null;

  sharedPool = new Pool({
    connectionString: conn,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: conn.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });

  return sharedPool;
}

export class DatabaseClient {
  private static async withClient<T>(
    operation: string,
    fn: (client: PoolClient) => Promise<T>,
    fallback: T,
    transactional: boolean
  ): Promise<T> {
    const pool = getPool();
    if (!pool) return fallback;

    const client = await pool.connect();
    try {
      if (transactional) await client.query("BEGIN");
      const out = await fn(client);
      if (transactional) await client.query("COMMIT");
      return out;
    } catch (err) {
      if (transactional) {
        try { 
          await client.query("ROLLBACK"); 
        } catch (_rollbackError) { /* Ignore */ }
      }
      console.error(`[InnerCircle] ${operation} failed:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  static query<T>(operation: string, text: string, params: any[], fallback: T): Promise<T> {
    return this.withClient(
      operation,
      async (client) => {
        const r = await client.query(text, params);
        return r.rows as unknown as T;
      },
      fallback,
      false
    );
  }

  static transactional<T>(operation: string, fn: (client: PoolClient) => Promise<T>, fallback: T): Promise<T> {
    return this.withClient(operation, fn, fallback, true);
  }
}

/* =============================================================================
   5. CORE STORE LOGIC
   ============================================================================= */

export async function createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
  const email = sanitizeString(args.email).toLowerCase();
  if (!validateEmail(email)) throw new Error("Invalid email address");

  const emailHash = sha256Hex(email);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + CONFIG.KEY_EXPIRY_DAYS);

  const { key, keyHash, keySuffix } = generateAccessKey();

  const fallback: IssuedKey = {
    key, 
    keySuffix, 
    createdAt: now.toISOString(), 
    expiresAt: expiresAt.toISOString(),
    status: "pending", 
    memberId: "no-db-fallback", 
    keyHash, 
    totalUnlocks: 0
  };

  return DatabaseClient.transactional(
    "createMember",
    async (client) => {
      // Check Limit
      const activeCountRes = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text as count
         FROM inner_circle_keys k
         JOIN inner_circle_members m ON k.member_id = m.id
         WHERE m.email_hash = $1
           AND k.status = 'active'
           AND k.expires_at > NOW()`,
        [emailHash]
      );

      const activeCount = toInt(activeCountRes.rows[0]?.count, 0);
      if (activeCount >= CONFIG.MAX_KEYS_PER_MEMBER) {
        throw new Error(`Member already has ${CONFIG.MAX_KEYS_PER_MEMBER} active keys`);
      }

      // Upsert Member
      const memberRes = await client.query<{ id: string }>(
        `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email_hash) DO UPDATE SET
           name = COALESCE($3, inner_circle_members.name),
           last_ip = COALESCE($4, inner_circle_members.last_ip),
           last_seen_at = NOW(),
           metadata = COALESCE($5, inner_circle_members.metadata)
         RETURNING id`,
        [
          emailHash, 
          emailHash.slice(0, 12), 
          args.name ? sanitizeString(args.name) : null, 
          args.ipAddress || null, 
          args.metadata ? JSON.stringify(args.metadata) : null
        ]
      );

      const memberId = memberRes.rows[0].id;

      // Insert Key
      await client.query(
        `INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status, expires_at, created_by_ip)
         VALUES ($1, $2, $3, 'active', $4, $5)`,
        [memberId, keyHash, keySuffix, expiresAt, args.ipAddress || null]
      );

      // Audit Log
      try {
        await logAuditEvent({
          actorType: args.source === 'admin' ? 'admin' : 'member',
          actorId: memberId,
          actorEmail: args.email,
          ipAddress: args.ipAddress,
          action: AUDIT_ACTIONS.CREATE,
          resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
          resourceId: keySuffix,
          status: 'success',
          details: { 
            source: args.source || 'registration',
            keySuffix,
            expiresAt: expiresAt.toISOString()
          }
        });
      } catch (_auditError) { 
        if (process.env.NODE_ENV === 'development') console.warn('Audit failed:', _auditError);
      }

      return {
        key, 
        keySuffix, 
        createdAt: now.toISOString(), 
        expiresAt: expiresAt.toISOString(),
        status: "active" as InnerCircleStatus, 
        memberId, 
        keyHash, 
        totalUnlocks: 0
      };
    },
    fallback
  );
}

export async function verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
  const cleaned = key.trim();
  if (!cleaned) return { valid: false, reason: "empty" };
  if (!cleaned.startsWith(CONFIG.KEY_PREFIX)) return { valid: false, reason: "invalid_format" };
  
  const keyHash = sha256Hex(cleaned);

  try {
    const rows = await DatabaseClient.query<Array<{
      member_id: string;
      status: InnerCircleStatus;
      expires_at: string;
      key_suffix: string;
    }>>(
      "verifyKey",
      `SELECT k.member_id, k.status, k.expires_at, k.key_suffix 
       FROM inner_circle_keys k 
       WHERE k.key_hash = $1`,
      [keyHash], 
      []
    );

    if (rows.length === 0) {
      try {
        await logAuditEvent({
          actorType: "system",
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
          status: "failed",
          severity: "low",
          details: { reason: "not_found", keyPrefix: cleaned.substring(0, 8) + "..." }
        });
      } catch (_e) { /* ignore */ }
      
      return { valid: false, reason: "not_found" };
    }

    const row = rows[0];
    
    // Strict Status Check
    if (row.status !== 'active') {
      // Map DB status to strict Reason type
      let reasonCode: VerifyInnerCircleKeyResult['reason'] = 'not_found';
      if (row.status === 'revoked') reasonCode = 'revoked';
      else if (row.status === 'suspended') reasonCode = 'suspended';
      else if (row.status === 'expired') reasonCode = 'expired';
      
      return { 
        valid: false, 
        reason: reasonCode, 
        memberId: row.member_id, 
        keySuffix: row.key_suffix, 
        status: row.status 
      };
    }

    const expiresAt = new Date(row.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
      return { 
        valid: false, 
        reason: "expired", 
        memberId: row.member_id, 
        keySuffix: row.key_suffix, 
        status: "expired" as InnerCircleStatus,
        expiresAt: row.expires_at
      };
    }

    // Check Daily Limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usage = await DatabaseClient.query<Array<{ count: string }>>(
      "checkUsage", 
      `SELECT COUNT(*)::text as count 
       FROM key_unlock_logs 
       WHERE key_id = (SELECT id FROM inner_circle_keys WHERE key_hash = $1) 
         AND created_at >= $2`,
      [keyHash, today], 
      []
    );

    const usedToday = toInt(usage[0]?.count, 0);
    const remaining = CONFIG.MAX_UNLOCKS_PER_DAY - usedToday;
    
    if (remaining <= 0) {
      return { 
        valid: false, 
        reason: "rate_limited", 
        memberId: row.member_id, 
        keySuffix: row.key_suffix, 
        status: "active", 
        remainingUnlocks: 0, 
        unlocksToday: usedToday
      };
    }

    return { 
      valid: true, 
      memberId: row.member_id, 
      keySuffix: row.key_suffix, 
      status: "active", 
      expiresAt: row.expires_at, 
      remainingUnlocks: remaining, 
      unlocksToday: usedToday
    };
  } catch (_error) {
    console.error("[InnerCircle] verify error:", _error);
    return { valid: false, reason: "no_db" };
  }
}

export async function recordInnerCircleUnlock(key: string, ip?: string, userAgent?: string): Promise<void> {
  const cleaned = key.trim();
  if (!cleaned) return;
  
  const keyHash = sha256Hex(cleaned);

  await DatabaseClient.query(
    "unlock", 
    `UPDATE inner_circle_keys 
     SET total_unlocks = total_unlocks + 1, 
         last_used_at = NOW(), 
         last_ip = COALESCE($2, last_ip) 
     WHERE key_hash = $1`,
    [keyHash, ip || null], 
    null
  );

  // Best effort log
  try {
    await DatabaseClient.query(
      "log", 
      `INSERT INTO key_unlock_logs (key_id, ip_address, user_agent) 
       SELECT id, $2, $3 
       FROM inner_circle_keys 
       WHERE key_hash = $1`,
      [keyHash, ip || null, userAgent || null], 
      null
    );
  } catch (_logError) { /* ignore */ }

  try {
    await logAuditEvent({
      actorType: "member",
      action: AUDIT_ACTIONS.ACCESS_GRANTED, // Using standard action
      resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
      status: "success",
      ipAddress: ip,
      userAgent,
      details: { action: "key_unlock", keyHashPrefix: keyHash.substring(0, 8) }
    });
  } catch (_e) { /* ignore */ }
}

export async function getPrivacySafeStats(): Promise<InnerCircleStats> {
  const rows = await DatabaseClient.query<any[]>(
    "stats", 
    `SELECT
       (SELECT COUNT(*) FROM inner_circle_members) as "totalMembers",
       (SELECT COUNT(*) FROM inner_circle_keys) as "totalKeys",
       (SELECT COUNT(*) FROM inner_circle_keys WHERE status = 'active') as "activeKeys",
       (SELECT COUNT(*) FROM inner_circle_keys WHERE status = 'revoked') as "revokedKeys",
       (SELECT COUNT(*) FROM inner_circle_keys WHERE status = 'expired') as "expiredKeys",
       COALESCE(AVG(total_unlocks), 0) as "avgUnlocks",
       MAX(last_used_at) as "lastActivity"
     FROM inner_circle_keys`, 
    [], 
    []
  );

  const row = rows?.[0] || {};
  return {
    totalMembers: toInt(row.totalMembers),
    totalKeys: toInt(row.totalKeys),
    activeKeys: toInt(row.activeKeys),
    revokedKeys: toInt(row.revokedKeys),
    expiredKeys: toInt(row.expiredKeys),
    avgUnlocksPerKey: toFloat(row.avgUnlocks),
    lastActivity: row.lastActivity ? toIso(row.lastActivity) : undefined
  };
}

// ----------------------------------------------------------------------
// CLEANUP UTILITY
// ----------------------------------------------------------------------

export async function cleanupExpiredData(): Promise<CleanupResult> {
  return DatabaseClient.transactional(
    "cleanup",
    async (client) => {
      // 1. Mark expired
      await client.query(
        `UPDATE inner_circle_keys SET status = 'expired' WHERE expires_at < NOW() AND status = 'active'`
      );

      // 2. Delete old keys
      const keysRes = await client.query(
        `DELETE FROM inner_circle_keys 
         WHERE (status = 'expired' OR status = 'revoked') 
         AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '${CONFIG.CLEANUP_KEY_TTL_DAYS} days') 
         RETURNING id`
      );
      
      const suspendedRes = await client.query(
        `SELECT COUNT(*)::text as count FROM inner_circle_keys WHERE status = 'suspended'`
      );
      
      // 3. Delete inactive members
      const memberRes = await client.query(
        `DELETE FROM inner_circle_members m 
         WHERE NOT EXISTS (
           SELECT 1 FROM inner_circle_keys k 
           WHERE k.member_id = m.id 
           AND ((k.status = 'active' AND k.expires_at > NOW()) 
           OR (k.last_used_at > NOW() - INTERVAL '${CONFIG.CLEANUP_MEMBER_INACTIVE_DAYS} days'))
         ) RETURNING id`
      );
      
      const suspendedCount = toInt((suspendedRes.rows[0] as any)?.count, 0);

      try {
        await logAuditEvent({
          actorType: "system",
          action: AUDIT_ACTIONS.DELETE, // Using standard action
          resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
          status: "success",
          details: {
            deletedMembers: memberRes.rowCount || 0,
            deletedKeys: keysRes.rowCount || 0,
            suspendedKeys: suspendedCount
          }
        });
      } catch (_e) { /* ignore */ }
      
      return {
        deletedMembers: memberRes.rowCount || 0,
        deletedKeys: keysRes.rowCount || 0,
        totalOrphanedKeys: 0,
        cleanedAt: new Date().toISOString(),
        suspendedKeys: suspendedCount
      };
    },
    { deletedMembers: 0, deletedKeys: 0, totalOrphanedKeys: 0, cleanedAt: "", suspendedKeys: 0 }
  );
}