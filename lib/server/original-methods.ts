/* lib/server/original-methods.ts */
// This file contains the original methods extracted from the enhanced implementation
// to maintain backward compatibility
import { safeSlice } from "@/lib/utils/safe";
import type { PoolClient } from 'pg';
import type {
  InnerCircleMember,
  MemberKeyRow,
  ActiveKeyRow,
  PrivacySafeKeyRow,
  AdminExportRow,
  InnerCircleStats,
  CleanupResult,
  PaginationParams,
  PaginatedResult
} from './inner-circle';
// Re-export types
export type {
  InnerCircleMember,
  MemberKeyRow,
  ActiveKeyRow,
  PrivacySafeKeyRow,
  AdminExportRow,
  InnerCircleStats,
  CleanupResult,
  PaginationParams,
  PaginatedResult
};
// Import utility functions from a separate file to avoid circular dependencies
import { DatabaseClient, toIso, toInt, toFloat, sanitizeString } from './inner-circle-utils';
// Export the extracted methods for use in the enhanced implementation
export async function deleteMemberByEmail(email: string): Promise<boolean> {
  const cleaned = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    throw new Error("Invalid email address");
  }
  // Import crypto here to avoid top-level issues
  const crypto = await import('crypto');
  const emailHash = crypto.createHash("sha256").update(cleaned, "utf8").digest("hex");
  return DatabaseClient.transactional(
    "deleteMemberByEmail",
    async (client: PoolClient) => {
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
export async function getMemberByEmail(email: string): Promise<InnerCircleMember | null> {
  const cleaned = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    throw new Error("Invalid email address");
  }
  const crypto = await import('crypto');
  const emailHash = crypto.createHash("sha256").update(cleaned, "utf8").digest("hex");
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
export async function getMemberKeys(memberId: string): Promise<MemberKeyRow[]> {
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
export async function getActiveKeysForMember(memberId: string): Promise<ActiveKeyRow[]> {
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
export async function getPrivacySafeStats(): Promise<InnerCircleStats> {
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
export async function getPrivacySafeKeyRows(
  params: PaginationParams = {}
): Promise<PaginatedResult<PrivacySafeKeyRow>> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const sortBy = params.sortBy ?? "createdAt";
  const sortOrder = (params.sortOrder ?? "desc") === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * limit;
  // Validate sort field
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
export async function getAdminExport(): Promise<AdminExportRow[]> {
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
export async function cleanupExpiredData(): Promise<CleanupResult> {
  const fallback: CleanupResult = {
    deletedMembers: 0,
    deletedKeys: 0,
    totalOrphanedKeys: 0,
    cleanedAt: new Date().toISOString(),
  };
  return DatabaseClient.transactional(
    "cleanupExpiredData",
    async (client: PoolClient) => {
      // 1) Mark expired active keys
      await client.query(
        `UPDATE inner_circle_keys
         SET status = 'expired'
         WHERE expires_at < NOW()
           AND status = 'active'`
      );
      // 2) Delete expired/revoked keys older than TTL (30 days)
      const keysRes = await client.query(
        `DELETE FROM inner_circle_keys
         WHERE (status = 'expired' OR status = 'revoked')
           AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '30 days')
         RETURNING id`
      );
      const deletedKeys = keysRes.rowCount ?? 0;
      // 3) Delete members with no active keys and no recent usage (90 days)
      const membersRes = await client.query(
        `DELETE FROM inner_circle_members m
         WHERE NOT EXISTS (
           SELECT 1 FROM inner_circle_keys k
           WHERE k.member_id = m.id
             AND (
               (k.status = 'active' AND k.expires_at > NOW())
               OR (k.last_used_at > NOW() - INTERVAL '90 days')
             )
         )
         RETURNING id`
      );
      const deletedMembers = membersRes.rowCount ?? 0;
      // 4) Count orphaned keys
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
export function getClientIp(req: unknown): string | undefined {
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
export function getPrivacySafeKeyExport(key: string): string {
  const KEY_PREFIX = "icl_";
  if (!key || key.length < 8) return "***";
  if (!key.startsWith(KEY_PREFIX)) return "***";
  return `${KEY_PREFIX}***${safeSlice(key, -6)}`;
}
export async function healthCheck(): Promise<{ ok: boolean; details: string }> {
  // Import pool dynamically to avoid circular dependencies
  const { getPool } = await import('./inner-circle-utils');
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