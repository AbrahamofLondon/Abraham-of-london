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
} as const;

/* =============================================================================
   TYPES & INTERFACES
   ============================================================================= */

export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired";

export interface CreateOrUpdateMemberArgs {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

export interface IssuedKey {
  key: string;
  keySuffix: string;
  createdAt: string;
  expiresAt: string;
  status: InnerCircleStatus;
  memberId: string;
}

export interface VerifyInnerCircleKeyResult {
  valid: boolean;
  reason?: "empty" | "not_found" | "revoked" | "expired" | "no_db" | "invalid_format";
  memberId?: string;
  keySuffix?: string;
  status?: InnerCircleStatus;
  expiresAt?: string;
}

export interface CleanupResult {
  deletedMembers: number;
  deletedKeys: number;
  totalOrphanedKeys: number;
  cleanedAt: string;
}

export interface PrivacySafeKeyRow {
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
}

export interface InnerCircleMember {
  id: string;
  emailHashPrefix: string;
  name: string | null;
  createdAt: string;
  lastSeenAt: string;
  totalKeysIssued: number;
}

export interface AdminExportRow extends PrivacySafeKeyRow {
  memberId: string;
  memberCreatedAt: string;
}

export interface InnerCircleStats {
  totalMembers: number;
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  expiredKeys: number;
  avgUnlocksPerKey: number;
  lastCleanup: string | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: keyof PrivacySafeKeyRow;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/* =============================================================================
   UTILITY FUNCTIONS
   ============================================================================= */

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function generateAccessKey(): {
  key: string;
  keyHash: string;
  keySuffix: string;
  rawKey: string;
} {
  const rawKey = crypto.randomBytes(CONFIG.KEY_LENGTH).toString("base64url");
  const key = `${CONFIG.KEY_PREFIX}${rawKey}`;
  return {
    key,
    keyHash: sha256Hex(key),
    keySuffix: key.slice(-8),
    rawKey,
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

/* =============================================================================
   DATABASE POOL MANAGEMENT
   ============================================================================= */

let sharedPool: Pool | null = null;

function getPool(): Pool | null {
  if (isBuildTime()) {
    console.debug("[InnerCircle] Build time detected, skipping DB initialization");
    return null;
  }
  
  if (sharedPool) return sharedPool;

  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) {
    console.warn("[InnerCircle] No DATABASE_URL/INNER_CIRCLE_DB_URL set; running in no-db mode.");
    return null;
  }

  try {
    sharedPool = new Pool({
      connectionString: conn,
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: conn.includes("localhost") || conn.includes("127.0.0.1") || conn.includes("192.168.")
        ? undefined
        : { rejectUnauthorized: false },
    });

    // Test connection
    sharedPool.on("connect", () => {
      console.debug("[InnerCircle] Database connection established");
    });

    sharedPool.on("error", (err) => {
      console.error("[InnerCircle] Database pool error:", err);
      sharedPool = null;
    });

    return sharedPool;
  } catch (error) {
    console.error("[InnerCircle] Failed to create database pool:", error);
    return null;
  }
}

/* =============================================================================
   DATABASE ABSTRACTION LAYER
   ============================================================================= */

type TransactionFunction<T> = (client: PoolClient) => Promise<T>;

class DatabaseClient {
  private static async withClient<T>(
    operation: string,
    fn: TransactionFunction<T>,
    fallback: T,
    requireTransaction: boolean = false
  ): Promise<T> {
    const pool = getPool();
    if (!pool) {
      console.debug(`[InnerCircle] No DB pool for operation: ${operation}, using fallback`);
      return fallback;
    }

    const client = await pool.connect();
    
    try {
      if (requireTransaction) {
        await client.query("BEGIN");
      }

      const result = await fn(client);

      if (requireTransaction) {
        await client.query("COMMIT");
      }

      return result;
    } catch (error) {
      if (requireTransaction) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("[InnerCircle] Rollback failed:", rollbackError);
        }
      }
      
      console.error(`[InnerCircle] DB operation failed (${operation}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async query<T = any[]>(
    operation: string,
    text: string,
    params: any[] = [],
    fallback: T
  ): Promise<T> {
    return this.withClient(
      operation,
      async (client) => {
        const result = await client.query(text, params);
        return result.rows as T;
      },
      fallback
    );
  }

  static async transactional<T>(
    operation: string,
    fn: TransactionFunction<T>,
    fallback: T
  ): Promise<T> {
    return this.withClient(operation, fn, fallback, true);
  }
}

/* =============================================================================
   MAIN STORE IMPLEMENTATION
   ============================================================================= */

export interface InnerCircleStore {
  // Core operations
  createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey>;
  verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult>;
  recordInnerCircleUnlock(key: string, ip?: string): Promise<void>;
  revokeInnerCircleKey(key: string, revokedBy?: string, reason?: string): Promise<boolean>;
  
  // Member management
  deleteMemberByEmail(email: string): Promise<boolean>;
  getMemberByEmail(email: string): Promise<InnerCircleMember | null>;
  getMemberKeys(memberId: string): Promise<any[]>;
  getActiveKeysForMember(memberId: string): Promise<any[]>;
  
  // Admin operations
  getPrivacySafeStats(): Promise<InnerCircleStats>;
  getPrivacySafeKeyRows(params?: PaginationParams): Promise<PaginatedResult<PrivacySafeKeyRow>>;
  getAdminExport(): Promise<AdminExportRow[]>;
  
  // Maintenance
  cleanupExpiredData(): Promise<CleanupResult>;
  rotateMemberKeys(memberId: string): Promise<{ revoked: number; issued: number }>;
  
  // Utilities
  getClientIp(req: any): string | undefined;
  getPrivacySafeKeyExport(key: string): string;
  healthCheck(): Promise<{ ok: boolean; details: string }>;
}

class PostgresInnerCircleStore implements InnerCircleStore {
  /* ===========================================================================
     CORE OPERATIONS
     =========================================================================== */

  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
    // Validate input
    const email = sanitizeString(args.email);
    if (!validateEmail(email)) {
      throw new Error("Invalid email address");
    }

    const emailHash = sha256Hex(email.toLowerCase());
    const { key, keyHash, keySuffix } = generateAccessKey();
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + CONFIG.KEY_EXPIRY_DAYS);

    const fallback: IssuedKey = {
      key,
      keySuffix,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "pending",
      memberId: "no-db-fallback",
    };

    return await DatabaseClient.transactional(
      "createOrUpdateMemberAndIssueKey",
      async (client) => {
        // Check for existing active keys
        const existingKeys = await client.query(
          `SELECT COUNT(*) as active_count 
           FROM inner_circle_keys k
           JOIN inner_circle_members m ON k.member_id = m.id
           WHERE m.email_hash = $1 
           AND k.status = 'active' 
           AND k.expires_at > NOW()`,
          [emailHash]
        );

        const activeCount = parseInt(existingKeys.rows[0]?.active_count || "0");
        if (activeCount >= CONFIG.MAX_KEYS_PER_MEMBER) {
          throw new Error(`Member already has ${CONFIG.MAX_KEYS_PER_MEMBER} active keys`);
        }

        // Create or update member
        const memberRes = await client.query(
          `INSERT INTO inner_circle_members (
            email_hash, 
            email_hash_prefix, 
            name, 
            last_ip, 
            metadata
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (email_hash) 
          DO UPDATE SET 
            name = COALESCE($3, inner_circle_members.name),
            last_ip = COALESCE($4, inner_circle_members.last_ip),
            last_seen_at = NOW(),
            metadata = COALESCE($5, inner_circle_members.metadata)
          RETURNING id, created_at`,
          [
            emailHash,
            emailHash.slice(0, 12),
            args.name ? sanitizeString(args.name) : null,
            args.ipAddress || null,
            args.metadata ? JSON.stringify(args.metadata) : null,
          ]
        );

        const memberId: string = memberRes.rows[0].id;

        // Issue new key
        await client.query(
          `INSERT INTO inner_circle_keys (
            member_id, 
            key_hash, 
            key_suffix, 
            status, 
            expires_at,
            created_by_ip
          ) VALUES ($1, $2, $3, 'active', $4, $5)`,
          [memberId, keyHash, keySuffix, expiresAt, args.ipAddress || null]
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
    
    if (!cleaned) {
      return { valid: false, reason: "empty" };
    }
    
    if (!cleaned.startsWith(CONFIG.KEY_PREFIX)) {
      return { valid: false, reason: "invalid_format" };
    }

    const keyHash = sha256Hex(cleaned);

    try {
      const rows = await DatabaseClient.query<any[]>(
        "verifyInnerCircleKey",
        `SELECT 
           k.member_id,
           k.status,
           k.expires_at,
           k.key_suffix,
           m.email_hash_prefix
         FROM inner_circle_keys k
         JOIN inner_circle_members m ON k.member_id = m.id
         WHERE k.key_hash = $1`,
        [keyHash],
        []
      );

      if (rows.length === 0) {
        return { valid: false, reason: "not_found" };
      }

      const row = rows[0];
      
      if (row.status === "revoked") {
        return { 
          valid: false, 
          reason: "revoked",
          memberId: row.member_id,
          keySuffix: row.key_suffix,
          status: row.status
        };
      }
      
      if (new Date(row.expires_at) < new Date()) {
        return { 
          valid: false, 
          reason: "expired",
          memberId: row.member_id,
          keySuffix: row.key_suffix,
          status: "expired",
          expiresAt: row.expires_at
        };
      }

      return { 
        valid: true, 
        memberId: row.member_id, 
        keySuffix: row.key_suffix,
        status: row.status as InnerCircleStatus,
        expiresAt: row.expires_at
      };
    } catch (error) {
      console.error("[InnerCircle] Verification error:", error);
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
       SET 
         total_unlocks = total_unlocks + 1,
         last_used_at = NOW(),
         last_ip = COALESCE($2, last_ip)
       WHERE key_hash = $1`,
      [keyHash, ip || null],
      undefined
    );
  }

  async revokeInnerCircleKey(
    key: string, 
    revokedBy: string = "admin", 
    reason: string = "manual_revocation"
  ): Promise<boolean> {
    const cleaned = key.trim();
    if (!cleaned) return false;

    const keyHash = sha256Hex(cleaned);

    const rows = await DatabaseClient.query<any[]>(
      "revokeInnerCircleKey",
      `UPDATE inner_circle_keys
       SET 
         status = 'revoked', 
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

  /* ===========================================================================
     MEMBER MANAGEMENT
     =========================================================================== */

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const cleaned = email.trim().toLowerCase();
    if (!validateEmail(cleaned)) {
      throw new Error("Invalid email address");
    }

    const emailHash = sha256Hex(cleaned);

    return await DatabaseClient.transactional(
      "deleteMemberByEmail",
      async (client) => {
        // First delete all keys for this member
        await client.query(
          `DELETE FROM inner_circle_keys 
           WHERE member_id IN (
             SELECT id FROM inner_circle_members WHERE email_hash = $1
           )`,
          [emailHash]
        );

        // Then delete the member
        const res = await client.query(
          `DELETE FROM inner_circle_members WHERE email_hash = $1 RETURNING id`,
          [emailHash]
        );

        return res.rowCount > 0;
      },
      false
    );
  }

  async getMemberByEmail(email: string): Promise<InnerCircleMember | null> {
    const cleaned = email.trim().toLowerCase();
    if (!validateEmail(cleaned)) {
      throw new Error("Invalid email address");
    }

    const emailHash = sha256Hex(cleaned);

    const rows = await DatabaseClient.query<any[]>(
      "getMemberByEmail",
      `SELECT 
         id,
         email_hash_prefix as "emailHashPrefix",
         name,
         created_at as "createdAt",
         last_seen_at as "lastSeenAt",
         (
           SELECT COUNT(*) 
           FROM inner_circle_keys 
           WHERE member_id = inner_circle_members.id
         ) as "totalKeysIssued"
       FROM inner_circle_members
       WHERE email_hash = $1`,
      [emailHash],
      []
    );

    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      emailHashPrefix: row.emailHashPrefix,
      name: row.name,
      createdAt: new Date(row.createdAt).toISOString(),
      lastSeenAt: new Date(row.lastSeenAt).toISOString(),
      totalKeysIssued: parseInt(row.totalKeysIssued) || 0,
    };
  }

  async getMemberKeys(memberId: string): Promise<any[]> {
    if (!memberId || memberId === "no-db-fallback") return [];

    return await DatabaseClient.query<any[]>(
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
  }

  async getActiveKeysForMember(memberId: string): Promise<any[]> {
    if (!memberId || memberId === "no-db-fallback") return [];

    return await DatabaseClient.query<any[]>(
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
  }

  /* ===========================================================================
     ADMIN OPERATIONS
     =========================================================================== */

  async getPrivacySafeStats(): Promise<InnerCircleStats> {
    const rows = await DatabaseClient.query<any[]>(
      "getPrivacySafeStats",
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

    const row = rows[0] || {};
    return {
      totalMembers: parseInt(row.totalMembers) || 0,
      totalKeys: parseInt(row.totalKeys) || 0,
      activeKeys: parseInt(row.activeKeys) || 0,
      revokedKeys: parseInt(row.revokedKeys) || 0,
      expiredKeys: parseInt(row.expiredKeys) || 0,
      avgUnlocksPerKey: parseFloat(row.avgUnlocks) || 0,
      lastCleanup: row.lastActivity ? new Date(row.lastActivity).toISOString() : null,
    };
  }

  async getPrivacySafeKeyRows(
    params: PaginationParams = {}
  ): Promise<PaginatedResult<PrivacySafeKeyRow>> {
    const {
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const offset = (page - 1) * limit;
    const safeSortBy = this.validateSortField(sortBy);

    const rows = await DatabaseClient.query<any[]>(
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
       ORDER BY ${safeSortBy} ${sortOrder === "desc" ? "DESC" : "ASC"}
       LIMIT $1 OFFSET $2`,
      [limit, offset],
      []
    );

    const data = rows.map(row => ({
      id: row.id,
      keySuffix: row.keySuffix,
      createdAt: new Date(row.createdAt).toISOString(),
      expiresAt: new Date(row.expiresAt).toISOString(),
      status: row.status,
      totalUnlocks: parseInt(row.totalUnlocks) || 0,
      lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
      lastIp: row.lastIp,
      memberEmailPrefix: row.memberEmailPrefix,
      memberName: row.memberName,
    }));

    // Get total count
    const countResult = await DatabaseClient.query<any[]>(
      "getPrivacySafeKeyRowsCount",
      `SELECT COUNT(*) as total FROM inner_circle_keys`,
      [],
      []
    );

    const total = parseInt(countResult[0]?.total) || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
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
    const rows = await DatabaseClient.query<any[]>(
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

    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt).toISOString(),
      expiresAt: new Date(row.expiresAt).toISOString(),
      lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
      memberCreatedAt: new Date(row.memberCreatedAt).toISOString(),
    }));
  }

  /* ===========================================================================
     MAINTENANCE OPERATIONS
     =========================================================================== */

  async cleanupExpiredData(): Promise<CleanupResult> {
    return await DatabaseClient.transactional(
      "cleanupExpiredData",
      async (client) => {
        const now = new Date().toISOString();

        // Mark expired keys
        await client.query(
          `UPDATE inner_circle_keys 
           SET status = 'expired'
           WHERE expires_at < NOW() 
           AND status = 'active'`
        );

        // Delete expired and revoked keys older than 30 days
        const keysRes = await client.query(
          `DELETE FROM inner_circle_keys 
           WHERE (status = 'expired' OR status = 'revoked')
           AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '30 days')
           RETURNING id`
        );

        const deletedKeys = keysRes.rowCount || 0;

        // Delete orphaned members (no active or recent keys)
        const membersRes = await client.query(
          `DELETE FROM inner_circle_members 
           WHERE NOT EXISTS (
             SELECT 1 FROM inner_circle_keys 
             WHERE inner_circle_keys.member_id = inner_circle_members.id 
             AND (
               inner_circle_keys.status = 'active' 
               OR inner_circle_keys.last_used_at > NOW() - INTERVAL '90 days'
             )
           )
           RETURNING id`
        );

        const deletedMembers = membersRes.rowCount || 0;

        // Count remaining orphaned keys
        const orphanedRes = await client.query(
          `SELECT COUNT(*) as count
           FROM inner_circle_keys k
           WHERE NOT EXISTS (
             SELECT 1 FROM inner_circle_members m
             WHERE m.id = k.member_id
           )`
        );

        const totalOrphanedKeys = parseInt(orphanedRes.rows[0]?.count) || 0;

        return {
          deletedMembers,
          deletedKeys,
          totalOrphanedKeys,
          cleanedAt: now,
        };
      },
      {
        deletedMembers: 0,
        deletedKeys: 0,
        totalOrphanedKeys: 0,
        cleanedAt: new Date().toISOString(),
      }
    );
  }

  async rotateMemberKeys(memberId: string): Promise<{ revoked: number; issued: number }> {
    if (!memberId || memberId === "no-db-fallback") {
      return { revoked: 0, issued: 0 };
    }

    return await DatabaseClient.transactional(
      "rotateMemberKeys",
      async (client) => {
        // Revoke all active keys
        const revokeRes = await client.query(
          `UPDATE inner_circle_keys
           SET 
             status = 'revoked',
             revoked_at = NOW(),
             revoked_by = 'system',
             revoked_reason = 'key_rotation'
           WHERE member_id = $1
           AND status = 'active'
           RETURNING id`,
          [memberId]
        );

        const revoked = revokeRes.rowCount || 0;

        // Issue a new key
        const { key, keyHash, keySuffix } = generateAccessKey();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + CONFIG.KEY_EXPIRY_DAYS);

        await client.query(
          `INSERT INTO inner_circle_keys (
            member_id, 
            key_hash, 
            key_suffix, 
            status, 
            expires_at,
            created_by_ip
          ) VALUES ($1, $2, $3, 'active', $4, NULL)`,
          [memberId, keyHash, keySuffix, expiresAt]
        );

        return { revoked, issued: 1 };
      },
      { revoked: 0, issued: 0 }
    );
  }

  /* ===========================================================================
     UTILITIES
     =========================================================================== */

  getClientIp(req: any): string | undefined {
    if (!req || !req.headers) return undefined;

    const headers = [
      "cf-connecting-ip",
      "x-client-ip",
      "x-forwarded-for",
      "x-real-ip",
      "x-cluster-client-ip",
      "x-forwarded",
      "forwarded-for",
      "forwarded",
    ];

    for (const header of headers) {
      const value = req.headers[header];
      if (value) {
        if (Array.isArray(value)) {
          const ip = value[0]?.split(",")[0]?.trim();
          if (ip && ip !== "unknown") return ip;
        } else if (typeof value === "string") {
          const ip = value.split(",")[0].trim();
          if (ip && ip !== "unknown") return ip;
        }
      }
    }

    return req.socket?.remoteAddress || req.connection?.remoteAddress;
  }

  getPrivacySafeKeyExport(key: string): string {
    if (!key || key.length < 8) return "***";
    if (!key.startsWith(CONFIG.KEY_PREFIX)) return "***";
    return `${CONFIG.KEY_PREFIX}***${key.slice(-6)}`;
  }

  async healthCheck(): Promise<{ ok: boolean; details: string }> {
    try {
      const pool = getPool();
      if (!pool) {
        return { ok: false, details: "Database pool not initialized" };
      }

      const client = await pool.connect();
      try {
        await client.query("SELECT 1");
        return { ok: true, details: "Database connection healthy" };
      } finally {
        client.release();
      }
    } catch (error) {
      return { 
        ok: false, 
        details: `Database health check failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /* ===========================================================================
     PRIVATE HELPERS
     =========================================================================== */

  private validateSortField(field: string): string {
    const allowedFields: Record<string, string> = {
      "createdAt": "k.created_at",
      "expiresAt": "k.expires_at",
      "lastUsedAt": "k.last_used_at",
      "totalUnlocks": "k.total_unlocks",
      "keySuffix": "k.key_suffix",
      "status": "k.status",
    };

    return allowedFields[field] || "k.created_at";
  }
}

/* =============================================================================
   SINGLETON INSTANCE & PUBLIC API
   ============================================================================= */

let storeInstance: InnerCircleStore | null = null;

function getStore(): InnerCircleStore {
  if (!storeInstance) {
    storeInstance = new PostgresInnerCircleStore();
  }
  return storeInstance;
}

// Named exports
export const createOrUpdateMemberAndIssueKey = (
  args: CreateOrUpdateMemberArgs
): Promise<IssuedKey> => getStore().createOrUpdateMemberAndIssueKey(args);

export const verifyInnerCircleKey = (
  key: string
): Promise<VerifyInnerCircleKeyResult> => getStore().verifyInnerCircleKey(key);

export const recordInnerCircleUnlock = (
  key: string, 
  ip?: string
): Promise<void> => getStore().recordInnerCircleUnlock(key, ip);

export const revokeInnerCircleKey = (
  key: string, 
  by?: string, 
  reason?: string
): Promise<boolean> => getStore().revokeInnerCircleKey(key, by, reason);

export const deleteMemberByEmail = (
  email: string
): Promise<boolean> => getStore().deleteMemberByEmail(email);

export const getMemberByEmail = (
  email: string
): Promise<InnerCircleMember | null> => getStore().getMemberByEmail(email);

export const getMemberKeys = (
  memberId: string
): Promise<any[]> => getStore().getMemberKeys(memberId);

export const getActiveKeysForMember = (
  memberId: string
): Promise<any[]> => getStore().getActiveKeysForMember(memberId);

export const getPrivacySafeStats = (): Promise<InnerCircleStats> => 
  getStore().getPrivacySafeStats();

export const getPrivacySafeKeyRows = (
  params?: PaginationParams
): Promise<PaginatedResult<PrivacySafeKeyRow>> => 
  getStore().getPrivacySafeKeyRows(params);

export const getAdminExport = (): Promise<AdminExportRow[]> => 
  getStore().getAdminExport();

export const cleanupExpiredData = (): Promise<CleanupResult> => 
  getStore().cleanupExpiredData();

export const rotateMemberKeys = (
  memberId: string
): Promise<{ revoked: number; issued: number }> => 
  getStore().rotateMemberKeys(memberId);

export const getClientIp = (req: any): string | undefined => 
  getStore().getClientIp(req);

export const getPrivacySafeKeyExport = (key: string): string => 
  getStore().getPrivacySafeKeyExport(key);

export const healthCheck = (): Promise<{ ok: boolean; details: string }> => 
  getStore().healthCheck();

// Default export object
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
  rotateMemberKeys,
  getClientIp,
  getPrivacySafeKeyExport,
  healthCheck,
};

export default innerCircleStore;

/* =============================================================================
   TYPE GUARDS
   ============================================================================= */

export function isIssuedKey(obj: any): obj is IssuedKey {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.key === "string" &&
    typeof obj.keySuffix === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.expiresAt === "string" &&
    typeof obj.status === "string" &&
    typeof obj.memberId === "string"
  );
}

export function isInnerCircleMember(obj: any): obj is InnerCircleMember {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.emailHashPrefix === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.lastSeenAt === "string" &&
    typeof obj.totalKeysIssued === "number"
  );
}