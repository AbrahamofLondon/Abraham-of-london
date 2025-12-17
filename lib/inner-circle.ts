/* eslint-disable no-console */
import crypto from "crypto";
import { Pool, type PoolClient } from "pg";

// ---------------------------------------------------------------------------
// Configuration & Types
// ---------------------------------------------------------------------------
const CONFIG = {
  KEY_EXPIRY_DAYS: 90,
  DATA_RETENTION_DAYS: 365,
  KEY_PREFIX: "icl_",
};

export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired";

export interface CreateOrUpdateMemberArgs {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string;
}

export interface IssuedKey {
  key: string;
  keySuffix: string;
  createdAt: string;
  expiresAt: string;
  status: InnerCircleStatus;
}

export interface VerifyInnerCircleKeyResult {
  valid: boolean;
  reason?: string;
  memberId?: string;
  keySuffix?: string;
}

export interface InnerCircleStore {
  createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey>;
  verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult>;
  recordInnerCircleUnlock(key: string, ip?: string): Promise<void>;
  revokeInnerCircleKey(key: string, revokedBy?: string, reason?: string): Promise<boolean>;
  deleteMemberByEmail(email: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function generateAccessKey(): { key: string; keyHash: string; keySuffix: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const key = `${CONFIG.KEY_PREFIX}${raw.slice(0, 28)}`;
  const keyHash = sha256Hex(key);
  const keySuffix = key.slice(-6);
  return { key, keyHash, keySuffix };
}

// ---------------------------------------------------------------------------
// Postgres Implementation (Enhanced)
// ---------------------------------------------------------------------------
let sharedPool: Pool | null = null;
function getPool(): Pool {
  if (sharedPool) return sharedPool;
  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) throw new Error("[InnerCircle] Database URL missing.");
  sharedPool = new Pool({ connectionString: conn, max: 5 });
  return sharedPool;
}

class PostgresInnerCircleStore implements InnerCircleStore {
  private async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try { return await fn(client); } finally { client.release(); }
  }

  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
    const emailHash = sha256Hex(args.email.trim().toLowerCase());
    const { key, keyHash, keySuffix } = generateAccessKey();
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + CONFIG.KEY_EXPIRY_DAYS);

    return await this.withClient(async (client) => {
      await client.query("BEGIN");
      const memberRes = await client.query(
        `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip) 
         VALUES ($1, $2, $3, $4) ON CONFLICT (email_hash) 
         DO UPDATE SET last_seen_at = NOW(), name = COALESCE($3, inner_circle_members.name)
         RETURNING id`,
        [emailHash, emailHash.slice(0, 10), args.name || null, args.ipAddress || null]
      );

      await client.query(
        `INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status, expires_at) 
         VALUES ($1, $2, $3, 'active', $4)`,
        [memberRes.rows[0].id, keyHash, keySuffix, expiresAt]
      );
      await client.query("COMMIT");
      return { 
        key, 
        keySuffix, 
        createdAt: now.toISOString(), 
        expiresAt: expiresAt.toISOString(), 
        status: "active" 
      };
    });
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const keyHash = sha256Hex(key.trim());
    const res = await this.withClient(c => c.query(
      `SELECT member_id, status, expires_at, key_suffix 
       FROM inner_circle_keys WHERE key_hash = $1`,
      [keyHash]
    ));
    const row = res.rows[0];

    if (!row) return { valid: false, reason: "not_found" };
    if (row.status === "revoked") return { valid: false, reason: "revoked" };
    if (new Date(row.expires_at) < new Date()) return { valid: false, reason: "expired" };

    return { valid: true, memberId: row.member_id, keySuffix: row.key_suffix };
  }

  async recordInnerCircleUnlock(key: string, ip?: string): Promise<void> {
    await this.withClient(c => c.query(
      `UPDATE inner_circle_keys 
       SET total_unlocks = total_unlocks + 1, last_used_at = NOW(), last_ip = $2
       WHERE key_hash = $1`,
      [sha256Hex(key.trim()), ip || null]
    ));
  }

  async revokeInnerCircleKey(key: string, revokedBy: string = "admin", reason: string = "manual"): Promise<boolean> {
    const res = await this.withClient(c => c.query(
      `UPDATE inner_circle_keys 
       SET status = 'revoked', revoked_at = NOW(), revoked_by = $2, revoked_reason = $3
       WHERE key_hash = $1`,
      [sha256Hex(key.trim()), revokedBy, reason]
    ));
    return (res.rowCount ?? 0) > 0;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const res = await this.withClient(c => c.query(
      `DELETE FROM inner_circle_members WHERE email_hash = $1`,
      [sha256Hex(email.trim().toLowerCase())]
    ));
    return (res.rowCount ?? 0) > 0;
  }
}

// ---------------------------------------------------------------------------
// Store Selection Facade
// ---------------------------------------------------------------------------
let storeInstance: InnerCircleStore | null = null;

function getStore(): InnerCircleStore {
  if (storeInstance) return storeInstance;
  const usePostgres = process.env.NODE_ENV === "production" || process.env.INNER_CIRCLE_STORE === "postgres";
  // For this outcome-focused update, we focus on the Postgres implementation
  storeInstance = new PostgresInnerCircleStore();
  return storeInstance;
}

export const createOrUpdateMemberAndIssueKey = (args: CreateOrUpdateMemberArgs) => getStore().createOrUpdateMemberAndIssueKey(args);
export const verifyInnerCircleKey = (key: string) => getStore().verifyInnerCircleKey(key);
export const recordInnerCircleUnlock = (key: string, ip?: string) => getStore().recordInnerCircleUnlock(key, ip);
export const revokeInnerCircleKey = (key: string, by?: string, reason?: string) => getStore().revokeInnerCircleKey(key, by, reason);
export const deleteMemberByEmail = (email: string) => getStore().deleteMemberByEmail(email);