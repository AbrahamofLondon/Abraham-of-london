// lib/server/inner-circle-store.ts - CORRECTED WITH PROPER EXPORTS
/* eslint-disable no-console */
import crypto from "node:crypto";
import { Pool, type PoolClient } from "pg";

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

const CONFIG = {
  KEY_EXPIRY_DAYS: Number(process.env.INNER_CIRCLE_KEY_EXPIRY_DAYS || 90),
  KEY_PREFIX: "icl_",
} as const;

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired";

export interface CreateOrUpdateMemberArgs {
  email: string;
  name?: string;
  ipAddress?: string;
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
  reason?: string;
  memberId?: string;
  keySuffix?: string;
}

export interface InnerCircleMember {
  id: string;
  name: string | null;
}

export interface AdminExportRow {
  created_at: string;
  status: "active" | "revoked";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
}

/* -------------------------------------------------------------------------- */
/* Crypto                                                                     */
/* -------------------------------------------------------------------------- */

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function generateAccessKey() {
  const raw = crypto.randomBytes(32).toString("base64url");
  const key = `${CONFIG.KEY_PREFIX}${raw.slice(0, 28)}`;
  return {
    key,
    keyHash: sha256Hex(key),
    keySuffix: key.slice(-6),
  };
}

/* -------------------------------------------------------------------------- */
/* DB                                                                         */
/* -------------------------------------------------------------------------- */

let sharedPool: Pool | null = null;

function getPool(): Pool | null {
  if (sharedPool) return sharedPool;

  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) {
    console.warn("[InnerCircle] No DB configured.");
    return null;
  }

  sharedPool = new Pool({
    connectionString: conn,
    max: 5,
    ssl: conn.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });

  return sharedPool;
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

class Store {
  private async withClient<T>(
    fn: (c: PoolClient) => Promise<T>,
    fallback: T
  ): Promise<T> {
    const pool = getPool();
    if (!pool) return fallback;

    try {
      const client = await pool.connect();
      try {
        return await fn(client);
      } finally {
        client.release();
      }
    } catch {
      return fallback;
    }
  }

  async createOrUpdateMemberAndIssueKey(
    args: CreateOrUpdateMemberArgs
  ): Promise<IssuedKey> {
    const emailHash = sha256Hex(args.email.toLowerCase());
    const { key, keyHash, keySuffix } = generateAccessKey();

    const now = new Date();
    const expires = new Date(now);
    expires.setDate(now.getDate() + CONFIG.KEY_EXPIRY_DAYS);

    return this.withClient(async (c) => {
      await c.query("BEGIN");

      const m = await c.query(
        `INSERT INTO inner_circle_members (email_hash, name, last_ip)
         VALUES ($1, $2, $3)
         ON CONFLICT (email_hash)
         DO UPDATE SET last_seen_at = NOW(), name = COALESCE($2, name)
         RETURNING id`,
        [emailHash, args.name ?? null, args.ipAddress ?? null]
      );

      const memberId = m.rows[0].id;

      await c.query(
        `INSERT INTO inner_circle_keys
         (member_id, key_hash, key_suffix, status, expires_at)
         VALUES ($1, $2, $3, 'active', $4)`,
        [memberId, keyHash, keySuffix, expires]
      );

      await c.query("COMMIT");

      return {
        key,
        keySuffix,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        status: "active",
        memberId,
      };
    }, {
      key,
      keySuffix,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: "active",
      memberId: "no-db",
    });
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const hash = sha256Hex(key.trim());

    return this.withClient(async (c) => {
      const r = await c.query(
        `SELECT member_id, status, expires_at, key_suffix
         FROM inner_circle_keys WHERE key_hash = $1`,
        [hash]
      );

      const row = r.rows[0];
      if (!row) return { valid: false, reason: "not_found" };
      if (row.status !== "active") return { valid: false, reason: row.status };
      if (new Date(row.expires_at) < new Date())
        return { valid: false, reason: "expired" };

      return {
        valid: true,
        memberId: row.member_id,
        keySuffix: row.key_suffix,
      };
    }, { valid: false, reason: "no_db" });
  }

  async getPrivacySafeStats() {
    return this.withClient(async (c) => {
      const m = await c.query(`SELECT COUNT(*) FROM inner_circle_members`);
      const k = await c.query(`SELECT COUNT(*) FROM inner_circle_keys`);
      return {
        totalMembers: Number(m.rows[0].count),
        totalKeys: Number(k.rows[0].count),
      };
    }, { totalMembers: 0, totalKeys: 0 });
  }

  async getPrivacySafeKeyRows(): Promise<AdminExportRow[]> {
    return this.withClient(async (c) => {
      const result = await c.query(`
        SELECT 
          k.created_at,
          k.status,
          k.key_suffix,
          SUBSTRING(m.email_hash, 1, 8) as email_hash_prefix,
          0 as total_unlocks -- Placeholder for now
        FROM inner_circle_keys k
        LEFT JOIN inner_circle_members m ON k.member_id = m.id
        WHERE k.status IN ('active', 'revoked')
        ORDER BY k.created_at DESC
      `);
      return result.rows.map(row => ({
        created_at: row.created_at,
        status: row.status,
        key_suffix: row.key_suffix,
        email_hash_prefix: row.email_hash_prefix || 'unknown',
        total_unlocks: row.total_unlocks
      }));
    }, []);
  }
}

const store = new Store();

/* -------------------------------------------------------------------------- */
/* Named Exports                                                              */
/* -------------------------------------------------------------------------- */

export const createOrUpdateMemberAndIssueKey = (a: CreateOrUpdateMemberArgs) =>
  store.createOrUpdateMemberAndIssueKey(a);

export const verifyInnerCircleKey = (k: string) =>
  store.verifyInnerCircleKey(k);

export const getPrivacySafeStats = () =>
  store.getPrivacySafeStats();

export const getPrivacySafeKeyRows = () =>
  store.getPrivacySafeKeyRows();

export function getClientIp(req: any): string | undefined {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) return Array.isArray(realIp) ? realIp[0] : realIp;
  const cfConnectingIp = req.headers?.['cf-connecting-ip'];
  if (cfConnectingIp) return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  return req.socket?.remoteAddress;
}

export function getPrivacySafeKeyExport(key: string): string {
  if (!key || key.length < 6) return '***';
  return `***${key.slice(-6)}`;
}

export function deleteMemberByEmail(email: string): Promise<boolean> {
  console.log('[deleteMemberByEmail] Not implemented yet for:', email);
  return Promise.resolve(false);
}

/* -------------------------------------------------------------------------- */
/* Default Export (for backward compatibility)                                */
/* -------------------------------------------------------------------------- */

const innerCircleStore = {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  getPrivacySafeKeyRows,
  getClientIp,
  getPrivacySafeKeyExport,
  deleteMemberByEmail,
};

export default innerCircleStore;