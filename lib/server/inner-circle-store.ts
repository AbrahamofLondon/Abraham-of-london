/* eslint-disable no-console */
import crypto from "node:crypto";

// 1. Import Shared Utilities
import { 
  DatabaseClient, 
  toInt, 
  toFloat, 
  toIso, 
  sanitizeString 
} from "./inner-circle-utils";

// 2. Import Audit Logging
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

/* =============================================================================
   STORE-SPECIFIC HELPERS
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

function handleAuditError(_error: unknown, context: string): void {
  // Log audit error for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[InnerCircle] Audit log failed for ${context}:`, _error);
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
        // Check Limit
        const activeCountRows = await client.query<{ active_count: string }>(
          `SELECT COUNT(*)::text as active_count
           FROM inner_circle_keys k
           JOIN inner_circle_members m ON k.member_id = m.id
           WHERE m.email_hash = $1
             AND k.status = 'active'
             AND k.expires_at > NOW()`,
          [emailHash]
        );

        // FIX: Explicitly cast row access
        const acRow = activeCountRows.rows[0] as any;
        const activeCount = toInt(acRow?.active_count, 0);
        
        if (activeCount >= CONFIG.MAX_KEYS_PER_MEMBER) {
          throw new Error(`Member already has ${CONFIG.MAX_KEYS_PER_MEMBER} active keys`);
        }

        // Upsert Member
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

        const memberId = (memberRes.rows[0] as any).id;

        // Insert Key
        await client.query(
          `INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status, expires_at, created_by_ip)
           VALUES ($1, $2, $3, 'active', $4, $5)`,
          [memberId, keyHash, keySuffix, expiresAt, args.ipAddress ?? null]
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
              keySuffix,
              expiresAt: expiresAt.toISOString(),
              source: args.source || 'registration'
            }
          });
        } catch (_error) {
          handleAuditError(_error, 'createOrUpdateMemberAndIssueKey');
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
      // Note: We use any[] for the query type to avoid complex type mismatches
      const rows = await DatabaseClient.query<any[]>(
        "verifyInnerCircleKey",
        `SELECT k.member_id, k.status, k.expires_at, k.key_suffix
         FROM inner_circle_keys k
         WHERE k.key_hash = $1`,
        [keyHash],
        []
      );

      if (!rows || rows.length === 0) {
        // Log failures for security monitoring
        try {
          await logAuditEvent({
            actorType: "system",
            action: AUDIT_ACTIONS.LOGIN_FAILED,
            resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
            status: "failed",
            severity: "medium",
            details: { reason: "not_found", keyPrefix: cleaned.substring(0, 8) + "..." }
          });
        } catch (_error) { 
          handleAuditError(_error, 'verifyInnerCircleKey-login-failed');
        }
        
        return { valid: false, reason: "not_found" };
      }

      // FIX: Explicit cast to handle potential any/unknown issues
      const row = rows[0] as any;
      if (row.status === "revoked") return { valid: false, reason: "revoked", memberId: row.member_id, keySuffix: row.key_suffix, status: "revoked" };
      if (row.status === "suspended") return { valid: false, reason: "suspended", memberId: row.member_id, keySuffix: row.key_suffix, status: "suspended" };

      const exp = new Date(row.expires_at);
      if (Number.isNaN(exp.getTime()) || exp < new Date()) {
        return { valid: false, reason: "expired", memberId: row.member_id, keySuffix: row.key_suffix, status: "expired", expiresAt: row.expires_at };
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const usageResult = await DatabaseClient.query<any[]>(
        "checkDailyUsage",
        `SELECT COUNT(*)::text as unlocks_today
         FROM key_unlock_logs
         WHERE key_id = (SELECT id FROM inner_circle_keys WHERE key_hash = $1)
           AND created_at >= $2`,
        [keyHash, today],
        []
      );

      const unlocksRow = usageResult[0] as any;
      const unlocksToday = toInt(unlocksRow?.unlocks_today, 0);
      
      if (unlocksToday >= CONFIG.MAX_UNLOCKS_PER_DAY) {
        return { valid: false, reason: "rate_limited", memberId: row.member_id, keySuffix: row.key_suffix, status: row.status, remainingUnlocks: 0, unlocksToday };
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
    } catch (error) {
      console.error("[InnerCircle] verify error:", error);
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
       SET total_unlocks = total_unlocks + 1, last_used_at = NOW(), last_ip = COALESCE($2, last_ip)
       WHERE key_hash = $1`,
      [keyHash, ip ?? null],
      null
    );

    // Log to key_unlock_logs (Best Effort)
    try {
      await DatabaseClient.query(
        "logUnlockEvent",
        `INSERT INTO key_unlock_logs (key_id, ip_address, user_agent)
         SELECT id, $2, $3 FROM inner_circle_keys WHERE key_hash = $1`,
        [keyHash, ip ?? null, userAgent ?? null],
        null
      );
    } catch (_error) { 
      // Ignore table missing error
    }

    // Log to System Audit
    try {
      await logAuditEvent({
        actorType: "member",
        action: AUDIT_ACTIONS.API_CALL,
        resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
        status: "success",
        ipAddress: ip,
        userAgent,
        details: { action: "key_unlock", keyHashPrefix: keyHash.substring(0, 8) }
      });
    } catch (_error) { 
      handleAuditError(_error, 'recordInnerCircleUnlock');
    }
  }

  async revokeInnerCircleKey(key: string, revokedBy = "admin", reason = "manual_revocation", actorId?: string): Promise<boolean> {
    const cleaned = key.trim();
    if (!cleaned) return false;
    const keyHash = sha256Hex(cleaned);

    const rows = await DatabaseClient.query<any[]>(
      "revokeInnerCircleKey",
      `UPDATE inner_circle_keys
       SET status = 'revoked', revoked_at = NOW(), revoked_by = $2, revoked_reason = $3
       WHERE key_hash = $1 AND status = 'active'
       RETURNING id`,
      [keyHash, sanitizeString(revokedBy), sanitizeString(reason)],
      []
    );

    if (rows && rows.length > 0) {
      try {
        await logAuditEvent({
          actorType: "admin",
          actorId: actorId ?? null,
          actorEmail: revokedBy,
          action: AUDIT_ACTIONS.DELETE,
          resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
          resourceId: keyHash.substring(0, 8),
          status: "success",
          details: { 
            keySuffix: cleaned.substring(cleaned.length - 8),
            reason, 
            revokedBy 
          }
        });
      } catch (_error) { 
        handleAuditError(_error, 'revokeInnerCircleKey');
      }
    }
    return (rows?.length ?? 0) > 0;
  }

  async getPrivacySafeStats(): Promise<InnerCircleStats> {
    const result = await DatabaseClient.query<any[]>(
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

    const rows = result || [];
    const r = (rows[0] as any) ?? {};
    
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
          `DELETE FROM inner_circle_keys WHERE member_id IN (SELECT id FROM inner_circle_members WHERE email_hash = $1)`, 
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

    const result = await DatabaseClient.query<any[]>(
      "getMemberByEmail",
      `SELECT id, email_hash_prefix, name, created_at, last_seen_at, status, tier, metadata::text
       FROM inner_circle_members WHERE email_hash = $1`,
      [emailHash],
      []
    );

    const rows = result || [];
    if (rows.length === 0) return null;
    
    const r = rows[0] as any;
    return {
      id: r.id,
      emailHashPrefix: r.email_hash_prefix,
      name: r.name,
      createdAt: toIso(r.created_at),
      lastSeenAt: toIso(r.last_seen_at),
      totalKeysIssued: 0, // Simplified for brevity in fetch
      totalUnlocks: 0,
      status: r.status,
      tier: r.tier,
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    };
  }

  // --- Helpers for Admin Table Views ---

  async getPrivacySafeKeyRows(params: PaginationParams = {}): Promise<PaginatedResult<PrivacySafeKeyRow>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(200, Math.max(1, params.limit ?? 50));
    const offset = (page - 1) * limit;
    
    // Sort Mapping
    const sortField = params.sortBy === 'createdAt' ? 'k.created_at' : 'k.created_at';
    const sortDir = (params.sortOrder ?? "desc") === "asc" ? "ASC" : "DESC";

    const rowsResult = await DatabaseClient.query<any[]>(
      "getPrivacySafeKeyRows",
      `SELECT k.id, k.key_suffix, k.created_at, k.expires_at, k.status, k.total_unlocks, k.last_used_at, k.last_ip, 
              m.email_hash_prefix, m.name, COALESCE(k.flags::text, '[]') as flags
       FROM inner_circle_keys k
       LEFT JOIN inner_circle_members m ON k.member_id = m.id
       ORDER BY ${sortField} ${sortDir}
       LIMIT $1 OFFSET $2`,
      [limit, offset],
      []
    );

    const rows = rowsResult || [];

    // Get total count
    const countResult = await DatabaseClient.query<any[]>("count", `SELECT COUNT(*)::text as total FROM inner_circle_keys`, [], [{total: "0"}]);
    const countRows = countResult || [];
    const countRow = countRows[0] as any;
    const total = toInt(countRow?.total, 0);

    return {
      data: rows.map((r: any) => ({
        id: r.id,
        keySuffix: r.key_suffix,
        createdAt: toIso(r.created_at),
        expiresAt: toIso(r.expires_at),
        status: r.status,
        totalUnlocks: toInt(r.total_unlocks),
        lastUsedAt: r.last_used_at ? toIso(r.last_used_at) : null,
        lastIp: r.last_ip,
        memberEmailPrefix: r.email_hash_prefix,
        memberName: r.name,
        flags: r.flags ? JSON.parse(r.flags) : [],
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total/limit), hasNext: page * limit < total, hasPrev: page > 1 },
      filters: params.filters
    };
  }

  // --- Maintenance & Extras ---

  async cleanupExpiredData(): Promise<CleanupResult> {
    return DatabaseClient.transactional("cleanup", async (client) => {
      await client.query(
        `UPDATE inner_circle_keys SET status = 'expired' WHERE expires_at < NOW() AND status = 'active'`
      );
      const keysRes = await client.query(
        `DELETE FROM inner_circle_keys 
         WHERE (status = 'expired' OR status = 'revoked') 
         AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '${CONFIG.CLEANUP_KEY_TTL_DAYS} days') 
         RETURNING id`
      );
      
      const suspendedRes = await client.query(
        `SELECT COUNT(*)::text as count FROM inner_circle_keys WHERE status = 'suspended'`
      );
      
      const memberRes = await client.query(
        `DELETE FROM inner_circle_members m 
         WHERE NOT EXISTS (
           SELECT 1 FROM inner_circle_keys k 
           WHERE k.member_id = m.id 
           AND ((k.status = 'active' AND k.expires_at > NOW()) 
           OR (k.last_used_at > NOW() - INTERVAL '${CONFIG.CLEANUP_MEMBER_INACTIVE_DAYS} days'))
         ) RETURNING id`
      );
      
      const suspendedCount = toInt((suspendedRes.rows[0] as any)?.count as unknown, 0);

      // Record cleanup in audit log
      try {
        // FIX: AUDIT_ACTIONS.CLEANUP does not exist -> used DELETE
        // FIX: AUDIT_CATEGORIES.SYSTEM does not exist -> used SYSTEM_OPERATION
        await logAuditEvent({
          actorType: "system",
          action: AUDIT_ACTIONS.DELETE,
          resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
          status: "success",
          details: {
            deletedMembers: memberRes.rowCount ?? 0,
            deletedKeys: keysRes.rowCount ?? 0,
            suspendedKeys: suspendedCount
          }
        });
      } catch (_error) {
        handleAuditError(_error, 'cleanupExpiredData');
      }
      
      return {
        deletedMembers: memberRes.rowCount ?? 0,
        deletedKeys: keysRes.rowCount ?? 0,
        totalOrphanedKeys: 0,
        cleanedAt: new Date().toISOString(),
        suspendedKeys: suspendedCount
      };
    }, { deletedMembers: 0, deletedKeys: 0, totalOrphanedKeys: 0, cleanedAt: "", suspendedKeys: 0 });
  }

  getClientIp(req: unknown): string | undefined {
    const r = req as { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
    if (!r?.headers) return r?.socket?.remoteAddress;
    const h = r.headers['x-forwarded-for'];
    return Array.isArray(h) ? h[0] : (h?.split(',')[0] || r.socket?.remoteAddress);
  }

  getPrivacySafeKeyExport(key: string): string {
    if (!key || key.length < 8) return "***";
    if (!key.startsWith(CONFIG.KEY_PREFIX)) return "***";
    return `${CONFIG.KEY_PREFIX}***${key.slice(-6)}`;
  }

  async healthCheck(): Promise<{ ok: boolean; details: string }> {
    try {
      await DatabaseClient.query("health", "SELECT 1", [], null);
      
      // Additional health checks
      const stats = await this.getPrivacySafeStats();
      const details = [
        "Database connection healthy",
        `Total members: ${stats.totalMembers}`,
        `Active keys: ${stats.activeKeys}`,
        `Daily unlocks: ${stats.dailyUnlocks}`
      ].join(", ");
      
      return { ok: true, details };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, details: `Database health check failed: ${msg}` };
    }
  }

  async getMemberKeys(memberId: string): Promise<MemberKeyRow[]> {
    if (!memberId) return [];
    const result = await DatabaseClient.query<any[]>(
      "keys", 
      "SELECT * FROM inner_circle_keys WHERE member_id = $1", 
      [memberId], 
      []
    );
    
    const rows = result || [];
    return rows.map((r: any) => ({ 
      id: r.id,
      keySuffix: r.key_suffix,
      status: r.status,
      createdAt: toIso(r.created_at), 
      expiresAt: toIso(r.expires_at), 
      totalUnlocks: toInt(r.total_unlocks), 
      lastUsedAt: r.last_used_at ? toIso(r.last_used_at) : null,
      lastIp: r.last_ip,
      revokedAt: r.revoked_at ? toIso(r.revoked_at) : null,
      revokedBy: r.revoked_by,
      revokedReason: r.revoked_reason,
      flags: r.flags || [],
      metadata: r.metadata
    }));
  }

  async getActiveKeysForMember(memberId: string): Promise<ActiveKeyRow[]> {
    if (!memberId) return [];
    const result = await DatabaseClient.query<any[]>(
      "active_keys", 
      "SELECT * FROM inner_circle_keys WHERE member_id = $1 AND status = 'active'", 
      [memberId], 
      []
    );
    
    const rows = result || [];
    return rows.map((r: any) => ({ 
      id: r.id,
      keySuffix: r.key_suffix,
      createdAt: toIso(r.created_at), 
      expiresAt: toIso(r.expires_at), 
      totalUnlocks: toInt(r.total_unlocks), 
      lastUsedAt: r.last_used_at ? toIso(r.last_used_at) : null,
      lastIp: r.last_ip,
      flags: r.flags || []
    }));
  }

  async suspendKey(key: string, reason: string, actorId?: string): Promise<boolean> {
    const cleaned = key.trim();
    if (!cleaned) return false;
    const keyHash = sha256Hex(cleaned);
    const result = await DatabaseClient.query<any[]>(
      "suspend", 
      "UPDATE inner_circle_keys SET status='suspended', revoked_reason=$2 WHERE key_hash=$1 RETURNING id", 
      [keyHash, reason], 
      []
    );
    
    const rows = result || [];
    if (rows.length > 0) {
      try {
        // FIX: AUDIT_ACTIONS.SUSPEND does not exist -> used USER_BLOCKED
        await logAuditEvent({
          actorType: "admin",
          actorId: actorId ?? null,
          action: AUDIT_ACTIONS.USER_BLOCKED,
          resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
          resourceId: keyHash.substring(0, 8),
          status: "success",
          details: { 
            keySuffix: cleaned.substring(cleaned.length - 8),
            reason 
          }
        });
      } catch (_error) {
        handleAuditError(_error, 'suspendKey');
      }
    }
    
    return rows.length > 0;
  }

  async renewKey(key: string, extensionDays: number = 30): Promise<boolean> {
    const cleaned = key.trim();
    if (!cleaned) return false;
    const keyHash = sha256Hex(cleaned);
    const result = await DatabaseClient.query<any[]>(
      "renew", 
      `UPDATE inner_circle_keys 
       SET expires_at = GREATEST(expires_at, NOW()) + INTERVAL '${extensionDays} days', 
           status = 'active' 
       WHERE key_hash = $1 
       RETURNING id`, 
      [keyHash], 
      []
    );
    
    const rows = result || [];
    if (rows.length > 0) {
      try {
        // FIX: AUDIT_ACTIONS.RENEW does not exist -> used UPDATE
        await logAuditEvent({
          actorType: "system",
          action: AUDIT_ACTIONS.UPDATE,
          resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
          resourceId: keyHash.substring(0, 8),
          status: "success",
          details: { 
            keySuffix: cleaned.substring(cleaned.length - 8),
            extensionDays 
          }
        });
      } catch (_error) {
        handleAuditError(_error, 'renewKey');
      }
    }
    
    return rows.length > 0;
  }
}

/* =============================================================================
   SINGLETON EXPORT
   ============================================================================= */

const storeInstance = new InnerCircleStore();

// Default Export Object (Legacy Compatibility)
const innerCircleStore = {
  createOrUpdateMemberAndIssueKey: storeInstance.createOrUpdateMemberAndIssueKey.bind(storeInstance),
  verifyInnerCircleKey: storeInstance.verifyInnerCircleKey.bind(storeInstance),
  recordInnerCircleUnlock: storeInstance.recordInnerCircleUnlock.bind(storeInstance),
  revokeInnerCircleKey: storeInstance.revokeInnerCircleKey.bind(storeInstance),
  suspendKey: storeInstance.suspendKey.bind(storeInstance),
  renewKey: storeInstance.renewKey.bind(storeInstance),
  deleteMemberByEmail: storeInstance.deleteMemberByEmail.bind(storeInstance),
  getMemberByEmail: storeInstance.getMemberByEmail.bind(storeInstance),
  getMemberKeys: storeInstance.getMemberKeys.bind(storeInstance),
  getActiveKeysForMember: storeInstance.getActiveKeysForMember.bind(storeInstance),
  getPrivacySafeStats: storeInstance.getPrivacySafeStats.bind(storeInstance),
  getPrivacySafeKeyRows: storeInstance.getPrivacySafeKeyRows.bind(storeInstance),
  cleanupExpiredData: storeInstance.cleanupExpiredData.bind(storeInstance),
  getClientIp: storeInstance.getClientIp.bind(storeInstance),
  getPrivacySafeKeyExport: storeInstance.getPrivacySafeKeyExport.bind(storeInstance),
  healthCheck: storeInstance.healthCheck.bind(storeInstance),
};

export default innerCircleStore;

// Named Exports
export const {
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
} = innerCircleStore;

