/* lib/server/inner-circle-store.ts */
/* eslint-disable no-console */
import crypto from "node:crypto";
import { Pool, type PoolClient } from "pg";

// Import audit logging - make sure this file exists
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "./audit";

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
  RATE_LIMIT_CREATE_KEY_PER_IP: 5,
  RATE_LIMIT_CREATE_KEY_PER_EMAIL: 3,
  MAX_UNLOCKS_PER_DAY: 100,
  JWT_EXPIRY_HOURS: 24,
} as const;

/* =============================================================================
   TYPES - Define them here to avoid imports
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

export type CleanupResult = {
  deletedMembers: number;
  deletedKeys: number;
  totalOrphanedKeys: number;
  cleanedAt: string;
  suspendedKeys: number;
};

export type PrivacySafeKeyRow = {
  id: string;
  keySuffix: string;
  createdAt: string;
  expiresAt: string;
  status: InnerCircleStatus;
  totalUnlocks: number;
  lastUsedAt: string | null;
  lastIp: string | null;
  memberEmailPrefix: string | null;
  memberName: string | null;
  flags: string[];
};

export type AdminExportRow = PrivacySafeKeyRow & {
  memberId: string;
  memberCreatedAt: string;
  memberStatus: string;
  memberTier?: string;
  revokedAt: string | null;
  revokedBy: string | null;
  revokedReason: string | null;
};

export type InnerCircleMember = {
  id: string;
  emailHashPrefix: string;
  name: string | null;
  createdAt: string;
  lastSeenAt: string;
  totalKeysIssued: number;
  totalUnlocks: number;
  status: "active" | "suspended" | "banned";
  tier?: "basic" | "premium" | "vip";
  metadata?: Record<string, any>;
};

export type InnerCircleStats = {
  totalMembers: number;
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  expiredKeys: number;
  suspendedKeys: number;
  avgUnlocksPerKey: number;
  lastCleanup: string | null;
  dailyUnlocks: number;
  weeklyGrowth: number;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: keyof PrivacySafeKeyRow;
  sortOrder?: "asc" | "desc";
  filters?: {
    status?: InnerCircleStatus;
    tier?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: PaginationParams['filters'];
};

export type MemberKeyRow = {
  id: string;
  keySuffix: string;
  status: InnerCircleStatus;
  createdAt: string;
  expiresAt: string;
  totalUnlocks: number;
  lastUsedAt: string | null;
  lastIp: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  revokedReason: string | null;
  flags: string[];
  metadata?: Record<string, any>;
};

export type ActiveKeyRow = Pick<
  MemberKeyRow,
  "id" | "keySuffix" | "createdAt" | "expiresAt" | "totalUnlocks" | "lastUsedAt" | "lastIp" | "flags"
>;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  reason?: string;
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

function isBuildTime(): boolean {
  return (
    process.env.NETLIFY === "true" &&
    (process.env.CONTEXT === "production" ||
      process.env.CONTEXT === "deploy-preview" ||
      process.env.CONTEXT === "branch-deploy") &&
    process.env.AWS_LAMBDA_FUNCTION_NAME == null
  );
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

function sanitizeString(input: string): string {
  return input.trim().replace(/[<>"'`;]/g, "");
}

function toIso(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
}

/* =============================================================================
   DATABASE POOL
   ============================================================================= */

let sharedPool: Pool | null = null;

function getPool(): Pool | null {
  if (isBuildTime()) return null;
  if (sharedPool) return sharedPool;

  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) return null;

  sharedPool = new Pool({
    connectionString: conn,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl:
      conn.includes("localhost") ||
      conn.includes("127.0.0.1") ||
      conn.includes("192.168.")
        ? undefined
        : { rejectUnauthorized: false },
  });

  sharedPool.on("error", (err) => {
    console.error("[InnerCircle] pool error:", err);
    sharedPool = null;
  });

  return sharedPool;
}

/* =============================================================================
   DATABASE CLIENT
   ============================================================================= */

type QueryParams = readonly unknown[];
type TxFn<T> = (client: PoolClient) => Promise<T>;

class DatabaseClient {
  private static async withClient<T>(
    operation: string,
    fn: TxFn<T>,
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
        } catch (rb) {
          console.error("[InnerCircle] rollback failed:", rb);
        }
      }
      console.error(`[InnerCircle] ${operation} failed:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  static query<T>(operation: string, text: string, params: QueryParams, fallback: T): Promise<T> {
    return this.withClient(
      operation,
      async (client) => {
        const r = await client.query(text, params as any[]);
        return r.rows as unknown as T;
      },
      fallback,
      false
    );
  }

  static transactional<T>(operation: string, fn: TxFn<T>, fallback: T): Promise<T> {
    return this.withClient(operation, fn, fallback, true);
  }
}

/* =============================================================================
   MAIN STORE CLASS
   ============================================================================= */

class InnerCircleStore {
  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
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
      totalUnlocks: 0,
    };

    return DatabaseClient.transactional(
      "createOrUpdateMemberAndIssueKey",
      async (client) => {
        const activeCountRows = await client.query<{ active_count: string }>(
          `SELECT COUNT(*)::text as active_count
           FROM inner_circle_keys k
           JOIN inner_circle_members m ON k.member_id = m.id
           WHERE m.email_hash = $1
             AND k.status = 'active'
             AND k.expires_at > NOW()`,
          [emailHash]
        );

        const activeCount = toInt(activeCountRows.rows[0]?.active_count, 0);
        if (activeCount >= CONFIG.MAX_KEYS_PER_MEMBER) {
          throw new Error(`Member already has ${CONFIG.MAX_KEYS_PER_MEMBER} active keys`);
        }

        const memberRes = await client.query<{ id: string }>(
          `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip, metadata)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email_hash)
           DO UPDATE SET
             name = COALESCE($3, inner_circle_members.name),
             last_ip = COALESCE($4, inner_circle_members.last_ip),
             last_seen_at = NOW(),
             metadata = COALESCE($5, inner_circle_members.metadata)
           RETURNING id`,
          [
            emailHash,
            emailHash.slice(0, 12),
            args.name ? sanitizeString(args.name) : null,
            args.ipAddress ?? null,
            args.metadata ? JSON.stringify(args.metadata) : null,
          ]
        );

        const memberId = memberRes.rows[0]!.id;

        await client.query(
          `INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status, expires_at, created_by_ip)
           VALUES ($1, $2, $3, 'active', $4, $5)`,
          [memberId, keyHash, keySuffix, expiresAt, args.ipAddress ?? null]
        );

        // Log audit event
        try {
          await logAuditEvent({
            actorType: args.source === 'admin' ? 'admin' : 'member',
            actorId: memberId,
            actorEmail: args.email,
            actorIp: args.ipAddress,
            action: AUDIT_ACTIONS.CREATE,
            resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
            resourceId: keySuffix,
            status: 'success',
            details: {
              keySuffix,
              expiresAt: expiresAt.toISOString(),
              source: args.source || 'registration'
            }
          });
        } catch (e) {
          console.error('Failed to log audit event:', e);
        }

        return {
          key,
          keySuffix,
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          status: "active",
          memberId,
          keyHash,
          totalUnlocks: 0,
        };
      },
      fallback
    );
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const cleaned = key.trim();
    if (!cleaned) return { valid: false, reason: "empty" };
    if (!cleaned.startsWith(CONFIG.KEY_PREFIX)) return { valid: false, reason: "invalid_format" };

    const keyHash = sha256Hex(cleaned);

    try {
      const rows = await DatabaseClient.query<
        Array<{ member_id: string; status: InnerCircleStatus; expires_at: string; key_suffix: string }>
      >(
        "verifyInnerCircleKey",
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
            severity: "medium",
            details: {
              reason: "not_found",
              keyPrefix: cleaned.substring(0, 8) + "..."
            }
          });
        } catch (e) {
          console.error('Failed to log audit event:', e);
        }
        
        return { valid: false, reason: "not_found" };
      }

      const row = rows[0]!;
      if (row.status === "revoked") {
        return { valid: false, reason: "revoked", memberId: row.member_id, keySuffix: row.key_suffix, status: "revoked" };
      }

      if (row.status === "suspended") {
        return { valid: false, reason: "suspended", memberId: row.member_id, keySuffix: row.key_suffix, status: "suspended" };
      }

      const exp = new Date(row.expires_at);
      if (Number.isNaN(exp.getTime()) || exp < new Date()) {
        return {
          valid: false,
          reason: "expired",
          memberId: row.member_id,
          keySuffix: row.key_suffix,
          status: "expired",
          expiresAt: row.expires_at,
        };
      }

      // Check daily unlock limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const usageResult = await DatabaseClient.query<
        Array<{ unlocks_today: string }>
      >(
        "checkDailyUsage",
        `SELECT COUNT(*)::text as unlocks_today
         FROM key_unlock_logs
         WHERE key_id = (SELECT id FROM inner_circle_keys WHERE key_hash = $1)
           AND created_at >= $2`,
        [keyHash, today],
        []
      );

      const unlocksToday = toInt(usageResult[0]?.unlocks_today, 0);
      if (unlocksToday >= CONFIG.MAX_UNLOCKS_PER_DAY) {
        return { 
          valid: false, 
          reason: "rate_limited", 
          memberId: row.member_id, 
          keySuffix: row.key_suffix, 
          status: row.status,
          remainingUnlocks: 0,
          unlocksToday
        };
      }

      return {
        valid: true,
        memberId: row.member_id,
        keySuffix: row.key_suffix,
        status: row.status,
        expiresAt: row.expires_at,
        remainingUnlocks: CONFIG.MAX_UNLOCKS_PER_DAY - unlocksToday,
        unlocksToday,
      };
    } catch (err) {
      console.error("[InnerCircle] verify error:", err);
      return { valid: false, reason: "no_db" };
    }
  }

  async recordInnerCircleUnlock(key: string, ip?: string, userAgent?: string): Promise<void> {
    const cleaned = key.trim();
    if (!cleaned) return;

    const keyHash = sha256Hex(cleaned);

    await DatabaseClient.query(
      "recordInnerCircleUnlock",
      `UPDATE inner_circle_keys
       SET total_unlocks = total_unlocks + 1,
           last_used_at = NOW(),
           last_ip = COALESCE($2, last_ip)
       WHERE key_hash = $1`,
      [keyHash, ip ?? null],
      null
    );

    // Log unlock in audit logs table if it exists
    try {
      await DatabaseClient.query(
        "logUnlockEvent",
        `INSERT INTO key_unlock_logs (key_id, ip_address, user_agent)
         SELECT id, $2, $3 FROM inner_circle_keys WHERE key_hash = $1`,
        [keyHash, ip ?? null, userAgent ?? null],
        null
      );
    } catch (e) {
      // Table might not exist yet, that's okay
      console.log('Note: key_unlock_logs table might not exist yet');
    }

    // Log audit event
    try {
      await logAuditEvent({
        actorType: "member",
        action: AUDIT_ACTIONS.API_CALL,
        resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
        status: "success",
        ipAddress: ip,
        userAgent,
        details: {
          action: "key_unlock",
          keyHashPrefix: keyHash.substring(0, 8)
        }
      });
    } catch (e) {
      console.error('Failed to log audit event:', e);
    }
  }

  async revokeInnerCircleKey(key: string, revokedBy = "admin", reason = "manual_revocation", actorId?: string): Promise<boolean> {
    const cleaned = key.trim();
    if (!cleaned) return false;

    const keyHash = sha256Hex(cleaned);

    const rows = await DatabaseClient.query<Array<{ id: string }>>(
      "revokeInnerCircleKey",
      `UPDATE inner_circle_keys
       SET status = 'revoked',
           revoked_at = NOW(),
           revoked_by = $2,
           revoked_reason = $3
       WHERE key_hash = $1
         AND status = 'active'
       RETURNING id`,
      [keyHash, sanitizeString(revokedBy), sanitizeString(reason)],
      []
    );

    if (rows.length > 0) {
      try {
        await logAuditEvent({
          actorType: "admin",
          actorId,
          actorEmail: revokedBy,
          action: AUDIT_ACTIONS.DELETE,
          resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
          status: "success",
          details: {
            key: cleaned.substring(0, 8) + "...",
            reason,
            revokedBy
          }
        });
      } catch (e) {
        console.error('Failed to log audit event:', e);
      }
    }

    return rows.length > 0;
  }

  async getPrivacySafeStats(): Promise<InnerCircleStats> {
    const rows = await DatabaseClient.query<
      Array<{
        totalMembers: string;
        totalKeys: string;
        activeKeys: string;
        revokedKeys: string;
        expiredKeys: string;
        suspendedKeys: string;
        avgUnlocks: string;
        lastActivity: string | null;
        dailyUnlocks: string;
        weeklyGrowth: string;
      }>
    >(
      "getPrivacySafeStats",
      `SELECT
         (SELECT COUNT(*)::text FROM inner_circle_members) as "totalMembers",
         (SELECT COUNT(*)::text FROM inner_circle_keys) as "totalKeys",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE status = 'active') as "activeKeys",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE status = 'revoked') as "revokedKeys",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE status = 'expired') as "expiredKeys",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE status = 'suspended') as "suspendedKeys",
         COALESCE(AVG(total_unlocks), 0)::text as "avgUnlocks",
         MAX(last_used_at) as "lastActivity",
         (SELECT COUNT(*)::text FROM key_unlock_logs WHERE created_at >= CURRENT_DATE) as "dailyUnlocks",
         (SELECT COUNT(*)::text FROM inner_circle_members WHERE created_at >= NOW() - INTERVAL '7 days') as "weeklyGrowth"
       FROM inner_circle_keys`,
      [],
      []
    );

    const r = rows[0] ?? {
      totalMembers: "0",
      totalKeys: "0",
      activeKeys: "0",
      revokedKeys: "0",
      expiredKeys: "0",
      suspendedKeys: "0",
      avgUnlocks: "0",
      lastActivity: null,
      dailyUnlocks: "0",
      weeklyGrowth: "0",
    };

    return {
      totalMembers: toInt(r.totalMembers, 0),
      totalKeys: toInt(r.totalKeys, 0),
      activeKeys: toInt(r.activeKeys, 0),
      revokedKeys: toInt(r.revokedKeys, 0),
      expiredKeys: toInt(r.expiredKeys, 0),
      suspendedKeys: toInt(r.suspendedKeys, 0),
      avgUnlocksPerKey: toFloat(r.avgUnlocks, 0),
      lastCleanup: r.lastActivity ? toIso(r.lastActivity) : null,
      dailyUnlocks: toInt(r.dailyUnlocks, 0),
      weeklyGrowth: toInt(r.weeklyGrowth, 0),
    };
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const cleaned = email.trim().toLowerCase();
    if (!validateEmail(cleaned)) throw new Error("Invalid email address");

    const emailHash = sha256Hex(cleaned);

    return DatabaseClient.transactional(
      "deleteMemberByEmail",
      async (client) => {
        await client.query(
          `DELETE FROM inner_circle_keys
           WHERE member_id IN (SELECT id FROM inner_circle_members WHERE email_hash = $1)`,
          [emailHash]
        );

        const res = await client.query(
          `DELETE FROM inner_circle_members WHERE email_hash = $1 RETURNING id`,
          [emailHash]
        );

        return (res.rowCount ?? 0) > 0;
      },
      false
    );
  }

  async getMemberByEmail(email: string): Promise<InnerCircleMember | null> {
    const cleaned = email.trim().toLowerCase();
    if (!validateEmail(cleaned)) throw new Error("Invalid email address");

    const emailHash = sha256Hex(cleaned);

    const rows = await DatabaseClient.query<
      Array<{
        id: string;
        emailHashPrefix: string;
        name: string | null;
        createdAt: string;
        lastSeenAt: string;
        totalKeysIssued: string;
        totalUnlocks: string;
        status: string;
        tier: string | null;
        metadata: string;
      }>
    >(
      "getMemberByEmail",
      `SELECT
         id,
         email_hash_prefix as "emailHashPrefix",
         name,
         created_at as "createdAt",
         last_seen_at as "lastSeenAt",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE member_id = inner_circle_members.id) as "totalKeysIssued",
         COALESCE((SELECT SUM(total_unlocks)::text FROM inner_circle_keys WHERE member_id = inner_circle_members.id), '0') as "totalUnlocks",
         status,
         tier,
         metadata::text
       FROM inner_circle_members
       WHERE email_hash = $1`,
      [emailHash],
      []
    );

    if (rows.length === 0) return null;

    const r = rows[0]!;
    return {
      id: r.id,
      emailHashPrefix: r.emailHashPrefix,
      name: r.name,
      createdAt: toIso(r.createdAt),
      lastSeenAt: toIso(r.lastSeenAt),
      totalKeysIssued: toInt(r.totalKeysIssued, 0),
      totalUnlocks: toInt(r.totalUnlocks, 0),
      status: r.status as InnerCircleMember['status'],
      tier: r.tier as InnerCircleMember['tier'],
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    };
  }

  async getMemberKeys(memberId: string): Promise<MemberKeyRow[]> {
    if (!memberId || memberId === "no-db-fallback") return [];

    const rows = await DatabaseClient.query<MemberKeyRow[]>(
      "getMemberKeys",
      `SELECT
         id,
         key_suffix as "keySuffix",
         status,
         created_at as "createdAt",
         expires_at as "expiresAt",
         total_unlocks as "totalUnlocks",
         last_used_at as "lastUsedAt",
         last_ip as "lastIp",
         revoked_at as "revokedAt",
         revoked_by as "revokedBy",
         revoked_reason as "revokedReason",
         COALESCE(flags::text, '[]') as "flags",
         metadata::text
       FROM inner_circle_keys
       WHERE member_id = $1
       ORDER BY created_at DESC`,
      [memberId],
      []
    );

    return rows.map((r) => ({
      ...r,
      createdAt: toIso(r.createdAt),
      expiresAt: toIso(r.expiresAt),
      lastUsedAt: r.lastUsedAt ? toIso(r.lastUsedAt) : null,
      totalUnlocks: toInt(r.totalUnlocks, 0),
      flags: r.flags ? JSON.parse(r.flags) : [],
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    }));
  }

  async getActiveKeysForMember(memberId: string): Promise<ActiveKeyRow[]> {
    if (!memberId || memberId === "no-db-fallback") return [];

    const rows = await DatabaseClient.query<ActiveKeyRow[]>(
      "getActiveKeysForMember",
      `SELECT
         id,
         key_suffix as "keySuffix",
         created_at as "createdAt",
         expires_at as "expiresAt",
         total_unlocks as "totalUnlocks",
         last_used_at as "lastUsedAt",
         last_ip as "lastIp",
         COALESCE(flags::text, '[]') as "flags"
       FROM inner_circle_keys
       WHERE member_id = $1
         AND status = 'active'
         AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [memberId],
      []
    );

    return rows.map((r) => ({
      ...r,
      createdAt: toIso(r.createdAt),
      expiresAt: toIso(r.expiresAt),
      lastUsedAt: r.lastUsedAt ? toIso(r.lastUsedAt) : null,
      totalUnlocks: toInt(r.totalUnlocks, 0),
      flags: r.flags ? JSON.parse(r.flags) : [],
    }));
  }

  async getPrivacySafeKeyRows(params: PaginationParams = {}): Promise<PaginatedResult<PrivacySafeKeyRow>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(200, Math.max(1, params.limit ?? 50));
    const sortBy = params.sortBy ?? "createdAt";
    const sortOrder = (params.sortOrder ?? "desc") === "asc" ? "ASC" : "DESC";

    const offset = (page - 1) * limit;
    
    const allowedSortFields: Record<string, string> = {
      id: "k.id",
      keySuffix: "k.key_suffix",
      createdAt: "k.created_at",
      expiresAt: "k.expires_at",
      status: "k.status",
      totalUnlocks: "k.total_unlocks",
      lastUsedAt: "k.last_used_at",
      lastIp: "k.last_ip",
      memberEmailPrefix: "m.email_hash_prefix",
      memberName: "m.name",
    };
    
    const sortSql = allowedSortFields[sortBy] ?? "k.created_at";

    const rows = await DatabaseClient.query<PrivacySafeKeyRow[]>(
      "getPrivacySafeKeyRows",
      `SELECT
         k.id,
         k.key_suffix as "keySuffix",
         k.created_at as "createdAt",
         k.expires_at as "expiresAt",
         k.status,
         k.total_unlocks as "totalUnlocks",
         k.last_used_at as "lastUsedAt",
         k.last_ip as "lastIp",
         m.email_hash_prefix as "memberEmailPrefix",
         m.name as "memberName",
         COALESCE(k.flags::text, '[]') as "flags"
       FROM inner_circle_keys k
       LEFT JOIN inner_circle_members m ON k.member_id = m.id
       ORDER BY ${sortSql} ${sortOrder}
       LIMIT $1 OFFSET $2`,
      [limit, offset],
      []
    );

    const countRows = await DatabaseClient.query<Array<{ total: string }>>(
      "getPrivacySafeKeyRowsCount",
      `SELECT COUNT(*)::text as total FROM inner_circle_keys`,
      [],
      [{ total: "0" }]
    );

    const total = toInt(countRows[0]?.total, 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: rows.map((r) => ({
        ...r,
        createdAt: toIso(r.createdAt),
        expiresAt: toIso(r.expiresAt),
        lastUsedAt: r.lastUsedAt ? toIso(r.lastUsedAt) : null,
        totalUnlocks: toInt(r.totalUnlocks, 0),
        flags: r.flags ? JSON.parse(r.flags) : [],
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: params.filters,
    };
  }

  async cleanupExpiredData(): Promise<CleanupResult> {
    const fallback: CleanupResult = {
      deletedMembers: 0,
      deletedKeys: 0,
      totalOrphanedKeys: 0,
      cleanedAt: new Date().toISOString(),
      suspendedKeys: 0,
    };

    return DatabaseClient.transactional(
      "cleanupExpiredData",
      async (client) => {
        // 1) Mark expired active keys
        await client.query(
          `UPDATE inner_circle_keys
           SET status = 'expired'
           WHERE expires_at < NOW()
             AND status = 'active'`
        );

        // 2) Delete expired/revoked keys older than TTL
        const keysRes = await client.query(
          `DELETE FROM inner_circle_keys
           WHERE (status = 'expired' OR status = 'revoked')
             AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '${CONFIG.CLEANUP_KEY_TTL_DAYS} days')
           RETURNING id`
        );

        const deletedKeys = keysRes.rowCount ?? 0;

        // 3) Count suspended keys
        const suspendedRes = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text as count FROM inner_circle_keys WHERE status = 'suspended'`
        );
        const suspendedKeys = toInt(suspendedRes.rows[0]?.count, 0);

        // 4) Delete members with no active keys and no recent usage
        const membersRes = await client.query(
          `DELETE FROM inner_circle_members m
           WHERE NOT EXISTS (
             SELECT 1 FROM inner_circle_keys k
             WHERE k.member_id = m.id
               AND (
                 (k.status = 'active' AND k.expires_at > NOW())
                 OR (k.last_used_at > NOW() - INTERVAL '${CONFIG.CLEANUP_MEMBER_INACTIVE_DAYS} days')
               )
           )
           RETURNING id`
        );

        const deletedMembers = membersRes.rowCount ?? 0;

        // 5) Count orphaned keys
        const orphaned = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text as count
           FROM inner_circle_keys k
           WHERE NOT EXISTS (
             SELECT 1 FROM inner_circle_members m WHERE m.id = k.member_id
           )`
        );

        const totalOrphanedKeys = toInt(orphaned.rows[0]?.count, 0);

        return {
          deletedMembers,
          deletedKeys,
          totalOrphanedKeys,
          cleanedAt: new Date().toISOString(),
          suspendedKeys,
        };
      },
      fallback
    );
  }

  getClientIp(req: unknown): string | undefined {
    const r = req as { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
    if (!r?.headers) return r?.socket?.remoteAddress;

    const headers = r.headers;
    const candidates = [
      "cf-connecting-ip",
      "x-client-ip",
      "x-forwarded-for",
      "x-real-ip",
      "x-cluster-client-ip",
      "forwarded-for",
      "forwarded",
    ] as const;

    for (const h of candidates) {
      const v = headers[h] ?? headers[h.toLowerCase()];
      if (!v) continue;

      const raw = Array.isArray(v) ? v[0] : v;
      if (!raw) continue;

      const ip = raw.split(",")[0]?.trim();
      if (ip && ip !== "unknown") return ip;
    }

    return r.socket?.remoteAddress;
  }

  getPrivacySafeKeyExport(key: string): string {
    if (!key || key.length < 8) return "***";
    if (!key.startsWith(CONFIG.KEY_PREFIX)) return "***";
    return `${CONFIG.KEY_PREFIX}***${key.slice(-6)}`;
  }

  async healthCheck(): Promise<{ ok: boolean; details: string }> {
    const pool = getPool();
    if (!pool) return { ok: false, details: "Database pool not initialized" };

    try {
      const client = await pool.connect();
      try {
        await client.query("SELECT 1");
        return { ok: true, details: "Database connection healthy" };
      } finally {
        client.release();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, details: `Database health check failed: ${msg}` };
    }
  }

  // Additional methods for enhanced features
  async suspendKey(key: string, reason: string, actorId?: string): Promise<boolean> {
    const cleaned = key.trim();
    if (!cleaned) return false;

    const keyHash = sha256Hex(cleaned);

    const rows = await DatabaseClient.query<Array<{ id: string }>>(
      "suspendKey",
      `UPDATE inner_circle_keys
       SET status = 'suspended',
           revoked_at = NOW(),
           revoked_by = $2,
           revoked_reason = $3
       WHERE key_hash = $1
         AND status = 'active'
       RETURNING id`,
      [keyHash, 'admin', reason],
      []
    );

    if (rows.length > 0) {
      try {
        await logAuditEvent({
          actorType: "admin",
          actorId,
          action: AUDIT_ACTIONS.USER_BLOCKED,
          resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
          status: "success",
          details: { key: cleaned.substring(0, 8) + "...", reason }
        });
      } catch (e) {
        console.error('Failed to log audit event:', e);
      }
    }

    return rows.length > 0;
  }

  async renewKey(key: string, extensionDays: number = 30): Promise<boolean> {
    const cleaned = key.trim();
    if (!cleaned) return false;

    const keyHash = sha256Hex(cleaned);

    const rows = await DatabaseClient.query<Array<{ id: string }>>(
      "renewKey",
      `UPDATE inner_circle_keys
       SET expires_at = GREATEST(expires_at, NOW()) + INTERVAL '${extensionDays} days',
           status = 'active'
       WHERE key_hash = $1
         AND status IN ('active', 'expired')
       RETURNING id`,
      [keyHash],
      []
    );

    return rows.length > 0;
  }
}

/* =============================================================================
   SINGLETON & EXPORTS
   ============================================================================= */

let storeInstance: InnerCircleStore | null = null;

function getStore(): InnerCircleStore {
  if (!storeInstance) {
    storeInstance = new InnerCircleStore();
  }
  return storeInstance;
}

// Export all methods
export const createOrUpdateMemberAndIssueKey = (args: CreateOrUpdateMemberArgs) =>
  getStore().createOrUpdateMemberAndIssueKey(args);

export const verifyInnerCircleKey = (key: string) => 
  getStore().verifyInnerCircleKey(key);

export const recordInnerCircleUnlock = (key: string, ip?: string, userAgent?: string) =>
  getStore().recordInnerCircleUnlock(key, ip, userAgent);

export const revokeInnerCircleKey = (key: string, by?: string, reason?: string, actorId?: string) =>
  getStore().revokeInnerCircleKey(key, by, reason, actorId);

export const suspendKey = (key: string, reason: string, actorId?: string) =>
  getStore().suspendKey(key, reason, actorId);

export const renewKey = (key: string, extensionDays?: number) =>
  getStore().renewKey(key, extensionDays);

export const deleteMemberByEmail = (email: string) => getStore().deleteMemberByEmail(email);

export const getMemberByEmail = (email: string) => getStore().getMemberByEmail(email);

export const getMemberKeys = (memberId: string) => getStore().getMemberKeys(memberId);

export const getActiveKeysForMember = (memberId: string) => getStore().getActiveKeysForMember(memberId);

export const getPrivacySafeStats = () => getStore().getPrivacySafeStats();

export const getPrivacySafeKeyRows = (params?: PaginationParams) => getStore().getPrivacySafeKeyRows(params);

export const cleanupExpiredData = () => getStore().cleanupExpiredData();

export const getClientIp = (req: unknown) => getStore().getClientIp(req);

export const getPrivacySafeKeyExport = (key: string) => getStore().getPrivacySafeKeyExport(key);

export const healthCheck = () => getStore().healthCheck();

/* =============================================================================
   DEFAULT EXPORT
   ============================================================================= */

const innerCircleStore = {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  recordInnerCircleUnlock,
  revokeInnerCircleKey,
  suspendKey,
  renewKey,
  deleteMemberByEmail,
  getMemberByEmail,
  getMemberKeys,
  getActiveKeysForMember,
  getPrivacySafeStats,
  getPrivacySafeKeyRows,
  cleanupExpiredData,
  getClientIp,
  getPrivacySafeKeyExport,
  healthCheck,
};

export default innerCircleStore;