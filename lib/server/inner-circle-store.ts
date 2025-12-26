/* eslint-disable no-console */
import crypto from "node:crypto";
import { Pool, type PoolClient } from "pg";

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
} as const;

/* =============================================================================
   TYPES
   ============================================================================= */

export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired";

export type CreateOrUpdateMemberArgs = {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string;
  metadata?: Record<string, unknown>;
};

export type IssuedKey = {
  key: string;
  keySuffix: string;
  createdAt: string;
  expiresAt: string;
  status: InnerCircleStatus;
  memberId: string;
};

export type VerifyInnerCircleKeyResult = {
  valid: boolean;
  reason?: "empty" | "not_found" | "revoked" | "expired" | "no_db" | "invalid_format";
  memberId?: string;
  keySuffix?: string;
  status?: InnerCircleStatus;
  expiresAt?: string;
};

export type CleanupResult = {
  deletedMembers: number;
  deletedKeys: number;
  totalOrphanedKeys: number;
  cleanedAt: string;
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
};

export type InnerCircleMember = {
  id: string;
  emailHashPrefix: string;
  name: string | null;
  createdAt: string;
  lastSeenAt: string;
  totalKeysIssued: number;
};

export type AdminExportRow = PrivacySafeKeyRow & {
  memberId: string;
  memberCreatedAt: string;
};

export type InnerCircleStats = {
  totalMembers: number;
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  expiredKeys: number;
  avgUnlocksPerKey: number;
  lastCleanup: string | null;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: keyof PrivacySafeKeyRow;
  sortOrder?: "asc" | "desc";
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
};

export type ActiveKeyRow = Pick<
  MemberKeyRow,
  "id" | "keySuffix" | "createdAt" | "expiresAt" | "totalUnlocks" | "lastUsedAt" | "lastIp"
>;

/* =============================================================================
   UTILS
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
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
   DB POOL
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
   DB CLIENT (TYPED)
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
   STORE INTERFACE
   ============================================================================= */

export interface InnerCircleStore {
  createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey>;
  verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult>;
  recordInnerCircleUnlock(key: string, ip?: string): Promise<void>;
  revokeInnerCircleKey(key: string, revokedBy?: string, reason?: string): Promise<boolean>;

  deleteMemberByEmail(email: string): Promise<boolean>;
  getMemberByEmail(email: string): Promise<InnerCircleMember | null>;
  getMemberKeys(memberId: string): Promise<MemberKeyRow[]>;
  getActiveKeysForMember(memberId: string): Promise<ActiveKeyRow[]>;

  getPrivacySafeStats(): Promise<InnerCircleStats>;
  getPrivacySafeKeyRows(params?: PaginationParams): Promise<PaginatedResult<PrivacySafeKeyRow>>;
  getAdminExport(): Promise<AdminExportRow[]>;

  cleanupExpiredData(): Promise<CleanupResult>;

  getClientIp(req: unknown): string | undefined;
  getPrivacySafeKeyExport(key: string): string;
  healthCheck(): Promise<{ ok: boolean; details: string }>;
}

/* =============================================================================
   IMPLEMENTATION
   ============================================================================= */

class PostgresInnerCircleStore implements InnerCircleStore {
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

        return {
          key,
          keySuffix,
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          status: "active",
          memberId,
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

      if (rows.length === 0) return { valid: false, reason: "not_found" };

      const row = rows[0]!;
      if (row.status === "revoked") {
        return { valid: false, reason: "revoked", memberId: row.member_id, keySuffix: row.key_suffix, status: "revoked" };
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

      return {
        valid: true,
        memberId: row.member_id,
        keySuffix: row.key_suffix,
        status: row.status,
        expiresAt: row.expires_at,
      };
    } catch (err) {
      console.error("[InnerCircle] verify error:", err);
      return { valid: false, reason: "no_db" };
    }
  }

  async recordInnerCircleUnlock(key: string, ip?: string): Promise<void> {
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
  }

  async revokeInnerCircleKey(key: string, revokedBy = "admin", reason = "manual_revocation"): Promise<boolean> {
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

    return rows.length > 0;
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
      }>
    >(
      "getMemberByEmail",
      `SELECT
         id,
         email_hash_prefix as "emailHashPrefix",
         name,
         created_at as "createdAt",
         last_seen_at as "lastSeenAt",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE member_id = inner_circle_members.id) as "totalKeysIssued"
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
         revoked_reason as "revokedReason"
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
         last_ip as "lastIp"
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
    }));
  }

  async getPrivacySafeStats(): Promise<InnerCircleStats> {
    const rows = await DatabaseClient.query<
      Array<{
        totalMembers: string;
        totalKeys: string;
        activeKeys: string;
        revokedKeys: string;
        expiredKeys: string;
        avgUnlocks: string;
        lastActivity: string | null;
      }>
    >(
      "getPrivacySafeStats",
      `SELECT
         (SELECT COUNT(*)::text FROM inner_circle_members) as "totalMembers",
         (SELECT COUNT(*)::text FROM inner_circle_keys) as "totalKeys",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE status = 'active') as "activeKeys",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE status = 'revoked') as "revokedKeys",
         (SELECT COUNT(*)::text FROM inner_circle_keys WHERE status = 'expired') as "expiredKeys",
         COALESCE(AVG(total_unlocks), 0)::text as "avgUnlocks",
         MAX(last_used_at) as "lastActivity"
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
      avgUnlocks: "0",
      lastActivity: null,
    };

    return {
      totalMembers: toInt(r.totalMembers, 0),
      totalKeys: toInt(r.totalKeys, 0),
      activeKeys: toInt(r.activeKeys, 0),
      revokedKeys: toInt(r.revokedKeys, 0),
      expiredKeys: toInt(r.expiredKeys, 0),
      avgUnlocksPerKey: toFloat(r.avgUnlocks, 0),
      lastCleanup: r.lastActivity ? toIso(r.lastActivity) : null,
    };
  }

  private validateSortField(field: keyof PrivacySafeKeyRow): string {
    const allowed: Record<keyof PrivacySafeKeyRow, string> = {
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
    return allowed[field] ?? "k.created_at";
  }

  async getPrivacySafeKeyRows(params: PaginationParams = {}): Promise<PaginatedResult<PrivacySafeKeyRow>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(200, Math.max(1, params.limit ?? 50));
    const sortBy = params.sortBy ?? "createdAt";
    const sortOrder = (params.sortOrder ?? "desc") === "asc" ? "ASC" : "DESC";

    const offset = (page - 1) * limit;
    const sortSql = this.validateSortField(sortBy);

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
         m.name as "memberName"
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
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getAdminExport(): Promise<AdminExportRow[]> {
    const rows = await DatabaseClient.query<AdminExportRow[]>(
      "getAdminExport",
      `SELECT
         k.id,
         k.member_id as "memberId",
         k.key_suffix as "keySuffix",
         k.created_at as "createdAt",
         k.expires_at as "expiresAt",
         k.status,
         k.total_unlocks as "totalUnlocks",
         k.last_used_at as "lastUsedAt",
         k.last_ip as "lastIp",
         m.email_hash_prefix as "memberEmailPrefix",
         m.name as "memberName",
         m.created_at as "memberCreatedAt"
       FROM inner_circle_keys k
       JOIN inner_circle_members m ON k.member_id = m.id
       ORDER BY k.created_at DESC`,
      [],
      []
    );

    return rows.map((r) => ({
      ...r,
      createdAt: toIso(r.createdAt),
      expiresAt: toIso(r.expiresAt),
      lastUsedAt: r.lastUsedAt ? toIso(r.lastUsedAt) : null,
      totalUnlocks: toInt(r.totalUnlocks, 0),
      memberCreatedAt: toIso(r.memberCreatedAt),
    }));
  }

  async cleanupExpiredData(): Promise<CleanupResult> {
    const fallback: CleanupResult = {
      deletedMembers: 0,
      deletedKeys: 0,
      totalOrphanedKeys: 0,
      cleanedAt: new Date().toISOString(),
    };

    return DatabaseClient.transactional(
      "cleanupExpiredData",
      async (client) => {
        // 1) mark expired active keys
        await client.query(
          `UPDATE inner_circle_keys
           SET status = 'expired'
           WHERE expires_at < NOW()
             AND status = 'active'`
        );

        // 2) delete expired/revoked keys older than TTL
        const keysRes = await client.query(
          `DELETE FROM inner_circle_keys
           WHERE (status = 'expired' OR status = 'revoked')
             AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '${CONFIG.CLEANUP_KEY_TTL_DAYS} days')
           RETURNING id`
        );

        const deletedKeys = keysRes.rowCount ?? 0;

        // 3) delete members with no active keys and no recent usage
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

        // 4) count orphaned keys
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
}

/* =============================================================================
   SINGLETON + NAMED EXPORTS
   ============================================================================= */

let storeInstance: InnerCircleStore | null = null;
function getStore(): InnerCircleStore {
  if (!storeInstance) storeInstance = new PostgresInnerCircleStore();
  return storeInstance;
}

export const createOrUpdateMemberAndIssueKey = (args: CreateOrUpdateMemberArgs) =>
  getStore().createOrUpdateMemberAndIssueKey(args);

export const verifyInnerCircleKey = (key: string) => getStore().verifyInnerCircleKey(key);

export const recordInnerCircleUnlock = (key: string, ip?: string) =>
  getStore().recordInnerCircleUnlock(key, ip);

export const revokeInnerCircleKey = (key: string, by?: string, reason?: string) =>
  getStore().revokeInnerCircleKey(key, by, reason);

export const deleteMemberByEmail = (email: string) => getStore().deleteMemberByEmail(email);

export const getMemberByEmail = (email: string) => getStore().getMemberByEmail(email);

export const getMemberKeys = (memberId: string) => getStore().getMemberKeys(memberId);

export const getActiveKeysForMember = (memberId: string) => getStore().getActiveKeysForMember(memberId);

export const getPrivacySafeStats = () => getStore().getPrivacySafeStats();

export const getPrivacySafeKeyRows = (params?: PaginationParams) => getStore().getPrivacySafeKeyRows(params);

export const getAdminExport = () => getStore().getAdminExport();

export const cleanupExpiredData = () => getStore().cleanupExpiredData();

export const getClientIp = (req: unknown) => getStore().getClientIp(req);

export const getPrivacySafeKeyExport = (key: string) => getStore().getPrivacySafeKeyExport(key);

export const healthCheck = () => getStore().healthCheck();

/* =============================================================================
   DEFAULT EXPORT (compat)
   ============================================================================= */

const innerCircleStore: InnerCircleStore = {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  recordInnerCircleUnlock,
  revokeInnerCircleKey,
  deleteMemberByEmail,
  getMemberByEmail,
  getMemberKeys,
  getActiveKeysForMember,
  getPrivacySafeStats,
  getPrivacySafeKeyRows,
  getAdminExport,
  cleanupExpiredData,
  getClientIp,
  getPrivacySafeKeyExport,
  healthCheck,
};

export default innerCircleStore;