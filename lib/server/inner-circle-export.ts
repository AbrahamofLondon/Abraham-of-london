// lib/server/inner-circle-export.ts
import crypto from "node:crypto";
import { Pool } from "pg";

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

let pool: Pool | null = null;

function getPool(): Pool | null {
  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: conn,
      max: 5,
      ssl: conn.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

/**
 * Privacy-safe export for admin dashboards:
 * - Never returns full keys (only suffix + metadata)
 * - Never returns raw email (only hash prefix)
 */
export async function getPrivacySafeKeyExport(): Promise<
  Array<{
    memberId: string;
    emailHashPrefix: string;
    name: string | null;
    keySuffix: string;
    status: string;
    createdAt: string | null;
    expiresAt: string | null;
    totalUnlocks: number;
    lastUsedAt: string | null;
  }>
> {
  const p = getPool();
  if (!p) return [];

  const client = await p.connect();
  try {
    const res = await client.query(
      `
      SELECT
        m.id as "memberId",
        COALESCE(m.email_hash_prefix, SUBSTRING(m.email_hash, 1, 10)) as "emailHashPrefix",
        m.name as "name",
        k.key_suffix as "keySuffix",
        k.status as "status",
        k.created_at as "createdAt",
        k.expires_at as "expiresAt",
        COALESCE(k.total_unlocks, 0) as "totalUnlocks",
        k.last_used_at as "lastUsedAt"
      FROM inner_circle_keys k
      JOIN inner_circle_members m ON m.id = k.member_id
      ORDER BY k.created_at DESC
      LIMIT 2000
      `
    );

    return (res.rows ?? []).map((r: any) => ({
      memberId: String(r.memberId),
      emailHashPrefix: String(r.emailHashPrefix ?? ""),
      name: r.name ?? null,
      keySuffix: String(r.keySuffix ?? ""),
      status: String(r.status ?? ""),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
      totalUnlocks: Number(r.totalUnlocks ?? 0),
      lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt).toISOString() : null,
    }));
  } finally {
    client.release();
  }
}