/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import crypto from "node:crypto";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  KEY_EXPIRY_DAYS: Number(process.env.INNER_CIRCLE_KEY_EXPIRY_DAYS || 90),
  KEY_PREFIX: "icl_",
  KEY_LENGTH: 32,
  MAX_KEYS_PER_MEMBER: 3,
  CLEANUP_KEY_TTL_DAYS: 30,
  CLEANUP_MEMBER_INACTIVE_DAYS: 90,
  MAX_UNLOCKS_PER_DAY: 100,
} as const;

// ============================================================================
// TYPES (Added missing exports)
// ============================================================================

export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired" | "suspended";

export type InnerCircleMember = {
  id: string;
  emailHashPrefix: string;
  name: string | null;
  createdAt: string;
  lastSeenAt: string;
  totalKeysIssued: number;
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

export type ActiveKeyRow = {
  id: string;
  keySuffix: string;
  createdAt: string;
  expiresAt: string;
  totalUnlocks: number;
  lastUsedAt: string | null;
  lastIp: string | null;
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

export type CleanupResult = {
  deletedMembers: number;
  deletedKeys: number;
  totalOrphanedKeys: number;
  cleanedAt: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
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

// ============================================================================
// UTILITIES
// ============================================================================

export function toIso(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
}

export function toFloat(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>"'`;]/g, "");
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

// ============================================================================
// DATABASE CLIENT
// ============================================================================

export interface DatabaseConfig {
  connectionString?: string;
  ssl?: any;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  [key: string]: any;
}

export interface QueryOptions {
  timeout?: number;
  transaction?: boolean;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
  fields?: Array<{ name: string }>;
}

export interface Transaction {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export class DatabaseClient {
  private static pool: any = null;
  private static config: DatabaseConfig = {};
  private static isInitialized = false;

  static async initialize(config: DatabaseConfig = {}): Promise<void> {
    if (this.isInitialized) return;

    try {
      const { Pool } = await import('pg');
      
      const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
      const connectionString = conn || 'postgresql://neondb_owner:npg_lVTc95DapNuM@ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech/abraham_of_london?sslmode=require';

      this.config = {
        connectionString,
        ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        ...config
      };

      this.pool = new Pool(this.config);
      
      this.pool.on('error', (err: Error) => {
        console.error('Database pool error:', err);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize DatabaseClient:', error);
      this.isInitialized = true;
    }
  }

  static async getClient(): Promise<any> {
    if (!this.isInitialized) await this.initialize();
    
    if (!this.pool) {
      return {
        query: async () => ({ rows: [], rowCount: 0 }),
        release: () => {}
      };
    }
    
    return await this.pool.connect();
  }

  static async query<T = any>(
    operation: string,
    sql: string,
    params: any[] = [],
    defaultValue: T | null = null,
    options: QueryOptions = {}
  ): Promise<T | T[] | null> {
    if (!this.pool && !this.isInitialized) await this.initialize();
    if (!this.pool) return defaultValue;

    const client = await this.getClient();
    
    try {
      if (options.timeout) {
        await client.query(`SET LOCAL statement_timeout = ${options.timeout}`);
      }

      const result = await client.query(sql, params);

      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return result.rows as T[];
      } else {
        return result.rowCount as any;
      }
    } catch (error) {
      console.error(`❌ Database query failed (${operation}):`, error);
      return defaultValue;
    } finally {
      if (client && client.release) client.release();
    }
  }

  static async transaction<T>(
    operation: string,
    callback: (client: any) => Promise<T>,
    fallback: T,
    useTransaction = true
  ): Promise<T> {
    if (!this.pool && !this.isInitialized) await this.initialize();
    if (!this.pool) return fallback;

    const client = await this.getClient();
    
    try {
      if (useTransaction) await client.query('BEGIN');

      const result = await callback(client);
      
      if (useTransaction) await client.query('COMMIT');
      return result;
    } catch (error) {
      if (useTransaction) {
        try { 
          await client.query('ROLLBACK'); 
        } catch (_rollbackError) { 
          console.error(`[InnerCircle] Rollback failed (${operation}):`, _rollbackError);
        }
      }
      console.error(`[InnerCircle] Transaction failed (${operation}):`, error);
      return fallback;
    } finally {
      client.release();
    }
  }
  
  static async batch(
    queries: Array<{ operation: string; sql: string; params?: any[] }>,
    options: QueryOptions = {}
  ): Promise<Array<any>> {
    if (!this.pool && !this.isInitialized) await this.initialize();
    if (!this.pool) return queries.map(() => []);

    const client = await this.getClient();
    
    try {
      if (options.transaction) await client.query('BEGIN');

      const results: any[] = [];
      for (const query of queries) {
        const result = await client.query(query.sql, query.params || []);
        results.push(result.rows);
      }

      if (options.transaction) await client.query('COMMIT');

      return results;
    } catch (error) {
      if (options.transaction) {
        try { 
          await client.query('ROLLBACK'); 
        } catch (_rollbackError) { 
          console.error('[InnerCircle] Batch rollback failed:', _rollbackError);
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  static async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    try {
      await this.query('healthCheck', 'SELECT 1');
      return { healthy: true, latency: Date.now() - startTime };
    } catch (_healthCheckError) {
      return { healthy: false, latency: Date.now() - startTime, error: String(_healthCheckError) };
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function generateAccessKey(): { key: string; keyHash: string; keySuffix: string } {
  const raw = crypto.randomBytes(CONFIG.KEY_LENGTH).toString("base64url");
  const key = `${CONFIG.KEY_PREFIX}${raw}`;
  return { key, keyHash: sha256Hex(key), keySuffix: key.slice(-8) };
}

// ============================================================================
// BUSINESS LOGIC
// ============================================================================

export async function createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
  const email = sanitizeString(args.email).toLowerCase();
  
  // Validate email format
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  const emailHash = sha256Hex(email);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + CONFIG.KEY_EXPIRY_DAYS);
  const { key, keyHash, keySuffix } = generateAccessKey();

  const fallback: IssuedKey = {
    key, keySuffix, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
    status: "pending", memberId: "no-db", keyHash, totalUnlocks: 0
  };

  return await DatabaseClient.transaction(
    "createMember",
    async (client) => {
      const memberRes = await client.query(
        `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email_hash) DO UPDATE SET
           name = COALESCE($3, inner_circle_members.name),
           last_ip = COALESCE($4, inner_circle_members.last_ip),
           last_seen_at = NOW()
         RETURNING id`,
        [emailHash, emailHash.slice(0, 12), args.name || null, args.ipAddress || null, args.metadata ? JSON.stringify(args.metadata) : null]
      );

      if (!memberRes.rows[0]) throw new Error("Failed to create member");
      const memberId = memberRes.rows[0].id;

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
      } catch (_auditError) { 
        console.warn('[InnerCircle] Audit logging failed:', _auditError);
      }

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
      [keyHash],
      []
    );

    if (!rows || rows.length === 0) return { valid: false, reason: "not_found" };
    const row = rows[0];

    if (row.status !== 'active') return { valid: false, reason: row.status as any };
    if (new Date(row.expires_at) < new Date()) return { valid: false, reason: "expired", memberId: row.member_id, keySuffix: row.key_suffix, status: "expired" };

    // Daily limit check...
    return { valid: true, memberId: row.member_id, keySuffix: row.key_suffix, status: "active" };
  } catch (_verifyError) {
    console.error('[InnerCircle] Key verification failed:', _verifyError);
    return { valid: false, reason: "no_db" };
  }
}

export async function recordInnerCircleUnlock(key: string, ip?: string): Promise<void> {
  const keyHash = sha256Hex(key.trim());
  await DatabaseClient.query(
    "unlock", 
    `UPDATE inner_circle_keys SET total_unlocks = total_unlocks + 1, last_used_at = NOW(), last_ip = COALESCE($2, last_ip) WHERE key_hash = $1`,
    [keyHash, ip || null]
  );
  try {
    await DatabaseClient.query(
      "log", 
      `INSERT INTO key_unlock_logs (key_id, ip_address) SELECT id, $2 FROM inner_circle_keys WHERE key_hash = $1`,
      [keyHash, ip || null]
    );
  } catch (_logError) { 
    console.warn('[InnerCircle] Unlock logging failed:', _logError);
  }
}

export async function revokeInnerCircleKey(key: string, by = "admin", reason = "manual"): Promise<boolean> {
  const keyHash = sha256Hex(key.trim());
  const res = await DatabaseClient.query<any>(
    "revoke", 
    `UPDATE inner_circle_keys SET status='revoked', revoked_at=NOW(), revoked_by=$2, revoked_reason=$3 WHERE key_hash=$1 RETURNING id`,
    [keyHash, by, reason],
    []
  );
  return (res as any).length > 0;
}

export async function deleteMemberByEmail(email: string): Promise<boolean> {
  const emailHash = sha256Hex(email.trim().toLowerCase());
  return await DatabaseClient.transaction(
    "deleteMember",
    async (client) => {
      await client.query(`DELETE FROM inner_circle_keys WHERE member_id IN (SELECT id FROM inner_circle_members WHERE email_hash = $1)`, [emailHash]);
      const res = await client.query(`DELETE FROM inner_circle_members WHERE email_hash = $1`, [emailHash]);
      return (res.rowCount || 0) > 0;
    },
    false
  );
}

export async function getMemberKeys(memberId: string): Promise<any[]> {
  if (!memberId) return [];
  const rows = await DatabaseClient.query("getKeys", `SELECT * FROM inner_circle_keys WHERE member_id = $1 ORDER BY created_at DESC`, [memberId], []);
  return (rows as any[]) || [];
}

export async function getPrivacySafeStats() {
  const stats = await DatabaseClient.query<any>(
    "stats", 
    `SELECT (SELECT COUNT(*) FROM inner_circle_members) as "totalMembers", (SELECT COUNT(*) FROM inner_circle_keys) as "totalKeys"`, 
    [], 
    { totalMembers: 0, totalKeys: 0 }
  );
  return Array.isArray(stats) ? stats[0] : stats;
}

// ============================================================================
// EXPORT
// ============================================================================

const InnerCircleAPI = {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  recordInnerCircleUnlock,
  revokeInnerCircleKey,
  deleteMemberByEmail,
  getMemberKeys,
  getPrivacySafeStats,
  validateEmail
};

export default InnerCircleAPI;

