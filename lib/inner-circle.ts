/* eslint-disable no-console */
import crypto from "node:crypto";
import { Pool, type PoolClient } from "pg";

// Use absolute path to ensure we find the audit module
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";

/* =============================================================================
   CONFIGURATION & CONSTANTS
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
   TYPES
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

/* =============================================================================
   UTILITY FUNCTIONS
   ============================================================================= */

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function generateAccessKey(): { key: string; keyHash: string; keySuffix: string } {
  const raw = crypto.randomBytes(CONFIG.KEY_LENGTH).toString("base64url");
  const key = `${CONFIG.KEY_PREFIX}${raw}`;
  return {
    key,
    keyHash: sha256Hex(key),
    keySuffix: key.slice(-8),
  };
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

function sanitizeString(input: string): string {
  return input.trim().replace(/[<>"'`;]/g, "");
}

/* =============================================================================
   DATABASE CLIENT
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

class DatabaseClient {
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
        try { await client.query("ROLLBACK"); } catch (rb) { /* ignore */ }
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
   STORE LOGIC
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
    key, keySuffix, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
    status: "pending", memberId: "no-db", keyHash, totalUnlocks: 0
  };

  return DatabaseClient.transactional(
    "createMember",
    async (client) => {
      const memberRes = await client.query<{ id: string }>(
        `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email_hash) DO UPDATE SET
           name = COALESCE($3, inner_circle_members.name),
           last_ip = COALESCE($4, inner_circle_members.last_ip),
           last_seen_at = NOW()
         RETURNING id`,
        [emailHash, emailHash.slice(0, 12), args.name || null, args.ipAddress || null, args.metadata ? JSON.stringify(args.metadata) : null]
      );

      const memberRow = memberRes.rows[0];
      if (!memberRow) throw new Error("Database failed to return member ID");
      const memberId = memberRow.id;

      await client.query(
        `INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status, expires_at, created_by_ip)
         VALUES ($1, $2, $3, 'active', $4, $5)`,
        [memberId, keyHash, keySuffix, expiresAt, args.ipAddress || null]
      );

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
          details: { source: args.source || 'registration' }
        });
      } catch (e) { /* silent audit fail */ }

      return {
        key, keySuffix, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
        status: "active", memberId, keyHash, totalUnlocks: 0
      };
    },
    fallback
  );
}

export async function verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
  const cleaned = key.trim();
  if (!cleaned.startsWith(CONFIG.KEY_PREFIX)) return { valid: false, reason: "invalid_format" };
  const keyHash = sha256Hex(cleaned);

  try {
    const rows = await DatabaseClient.query<any[]>(
      "verifyKey",
      `SELECT k.member_id, k.status, k.expires_at, k.key_suffix FROM inner_circle_keys k WHERE k.key_hash = $1`,
      [keyHash], []
    );

    if (rows.length === 0) return { valid: false, reason: "not_found" };
    const row = rows[0];

    if (row.status !== 'active') return { valid: false, reason: row.status, memberId: row.member_id, keySuffix: row.key_suffix, status: row.status };
    if (new Date(row.expires_at) < new Date()) return { valid: false, reason: "expired", memberId: row.member_id, keySuffix: row.key_suffix, status: "expired" };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const usage = await DatabaseClient.query<any[]>("checkUsage", 
      `SELECT COUNT(*) as count FROM key_unlock_logs WHERE key_id = (SELECT id FROM inner_circle_keys WHERE key_hash = $1) AND created_at >= $2`,
      [keyHash, today], []
    );
    const used = Number(usage[0]?.count || 0);
    
    if (used >= CONFIG.MAX_UNLOCKS_PER_DAY) {
      return { valid: false, reason: "rate_limited", memberId: row.member_id, keySuffix: row.key_suffix, status: "active", remainingUnlocks: 0 };
    }

    return { valid: true, memberId: row.member_id, keySuffix: row.key_suffix, status: "active", remainingUnlocks: CONFIG.MAX_UNLOCKS_PER_DAY - used };
  } catch (e) {
    return { valid: false, reason: "no_db" };
  }
}

export async function recordInnerCircleUnlock(key: string, ip?: string): Promise<void> {
  const keyHash = sha256Hex(key.trim());
  await DatabaseClient.query("unlock", 
    `UPDATE inner_circle_keys SET total_unlocks = total_unlocks + 1, last_used_at = NOW(), last_ip = COALESCE($2, last_ip) WHERE key_hash = $1`,
    [keyHash, ip || null], null
  );
  try {
    await DatabaseClient.query("log", 
      `INSERT INTO key_unlock_logs (key_id, ip_address) SELECT id, $2 FROM inner_circle_keys WHERE key_hash = $1`,
      [keyHash, ip || null], null
    );
  } catch (e) { /* safe fail */ }
}

export async function revokeInnerCircleKey(key: string, by = "admin", reason = "manual"): Promise<boolean> {
  const keyHash = sha256Hex(key.trim());
  const res = await DatabaseClient.query<any>("revoke", 
    `UPDATE inner_circle_keys SET status='revoked', revoked_at=NOW(), revoked_by=$2, revoked_reason=$3 WHERE key_hash=$1 RETURNING id`,
    [keyHash, by, reason], []
  );
  return (res as any).length > 0;
}

export async function deleteMemberByEmail(email: string): Promise<boolean> {
  const emailHash = sha256Hex(email.trim().toLowerCase());
  return DatabaseClient.transactional("delete", async (client) => {
    await client.query(`DELETE FROM inner_circle_keys WHERE member_id IN (SELECT id FROM inner_circle_members WHERE email_hash = $1)`, [emailHash]);
    const res = await client.query(`DELETE FROM inner_circle_members WHERE email_hash = $1`, [emailHash]);
    return (res.rowCount || 0) > 0;
  }, false);
}

export async function getMemberKeys(memberId: string): Promise<any[]> {
  if (!memberId) return [];
  return DatabaseClient.query("getKeys", `SELECT * FROM inner_circle_keys WHERE member_id = $1 ORDER BY created_at DESC`, [memberId], []);
}

export async function getPrivacySafeStats() {
  return DatabaseClient.query<any>("stats", 
    `SELECT (SELECT COUNT(*) FROM inner_circle_members) as "totalMembers", (SELECT COUNT(*) FROM inner_circle_keys) as "totalKeys"`, 
    [], { totalMembers: 0, totalKeys: 0 }
  ).then(rows => rows[0] || { totalMembers: 0, totalKeys: 0 });
}

/* =============================================================================
   EMAIL LOGIC
   ============================================================================= */

export async function sendInnerCircleEmail(a: any, b?: any, c?: any): Promise<void> {
  if (a && typeof a === "object" && "to" in a) {
    console.log(`📧 [InnerCircle Email] Sending ${a.type} to ${a.to}`, a.data);
    return;
  }
  const email = String(a);
  const key = String(b || "");
  const name = c;
  console.log(`📧 [InnerCircle Email] Sending key to ${email} (${name})`, { key });
}

/* =============================================================================
   DEFAULT EXPORT
   ============================================================================= */

// FIX: Renamed variable to guarantee uniqueness
const InnerCircleService_FINAL = {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  recordInnerCircleUnlock,
  revokeInnerCircleKey,
  deleteMemberByEmail,
  getMemberKeys,
  getPrivacySafeStats,
  sendInnerCircleEmail
};

export default InnerCircleService_FINAL;