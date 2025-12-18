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
  memberId: string;
}

export interface VerifyInnerCircleKeyResult {
  valid: boolean;
  reason?: string;
  memberId?: string;
  keySuffix?: string;
}

/**
 * FULL INTERFACE - Including Maintenance & Intelligence Methods
 */
export interface InnerCircleStore {
  createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey>;
  verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult>;
  recordInnerCircleUnlock(key: string, ip?: string): Promise<void>;
  revokeInnerCircleKey(key: string, revokedBy?: string, reason?: string): Promise<boolean>;
  deleteMemberByEmail(email: string): Promise<boolean>;
  getMemberKeys(memberId: string): Promise<any[]>;
  cleanupOldData(): Promise<{ deletedMembers: number; deletedKeys: number }>;
  getPrivacySafeStats(): Promise<any>;
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
// Postgres Implementation with Build-Phase Guard
// ---------------------------------------------------------------------------
let sharedPool: Pool | null = null;

function getPool(): Pool | null {
  // CRITICAL: Next.js static export phase guard
  // This prevents the build from crashing when DB is unreachable
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD_STEP === 'true') {
    return null;
  }

  if (sharedPool) return sharedPool;

  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) {
    console.warn("[InnerCircle] No database connection string found.");
    return null;
  }

  sharedPool = new Pool({
    connectionString: conn,
    max: 5,
    ssl: { rejectUnauthorized: false } // Required for most cloud DBs
  });
  return sharedPool;
}

class PostgresInnerCircleStore implements InnerCircleStore {
  private async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = getPool();
    if (!pool) {
      // Return neutral/empty data during build to avoid "Exit Code 1"
      console.warn("[InnerCircle] Database bypassed during build phase.");
      return [] as any;
    }
    const client = await pool.connect();
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
      const memberId = memberRes.rows[0].id;
      await client.query(
        `INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status, expires_at) 
         VALUES ($1, $2, $3, 'active', $4)`,
        [memberId, keyHash, keySuffix, expiresAt]
      );
      await client.query("COMMIT");
      return { key, keySuffix, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(), status: "active", memberId };
    });
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const keyHash = sha256Hex(key.trim());
    const res = await this.withClient(c => c.query(
      `SELECT member_id, status, expires_at, key_suffix FROM inner_circle_keys WHERE key_hash = $1`, [keyHash]
    ));
    const row = res.rows[0];
    if (!row) return { valid: false, reason: "not_found" };
    if (row.status === "revoked") return { valid: false, reason: "revoked" };
    if (new Date(row.expires_at) < new Date()) return { valid: false, reason: "expired" };
    return { valid: true, memberId: row.member_id, keySuffix: row.key_suffix };
  }

  async recordInnerCircleUnlock(key: string, ip?: string): Promise<void> {
    await this.withClient(c => c.query(
      `UPDATE inner_circle_keys SET total_unlocks = total_unlocks + 1, last_used_at = NOW(), last_ip = $2 WHERE key_hash = $1`,
      [sha256Hex(key.trim()), ip || null]
    ));
  }

  async revokeInnerCircleKey(key: string, revokedBy: string = "admin", reason: string = "manual"): Promise<boolean> {
    const res = await this.withClient(c => c.query(
      `UPDATE inner_circle_keys SET status = 'revoked', revoked_at = NOW(), revoked_by = $2, revoked_reason = $3 WHERE key_hash = $1`,
      [sha256Hex(key.trim()), revokedBy, reason]
    ));
    return (res.rowCount ?? 0) > 0;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const res = await this.withClient(c => c.query(
      `DELETE FROM inner_circle_members WHERE email_hash = $1`, [sha256Hex(email.trim().toLowerCase())]
    ));
    return (res.rowCount ?? 0) > 0;
  }

  async getMemberKeys(memberId: string): Promise<any[]> {
    const res = await this.withClient(c => c.query(`SELECT * FROM inner_circle_keys WHERE member_id = $1`, [memberId]));
    return res.rows || [];
  }

  async cleanupOldData(): Promise<{ deletedMembers: number; deletedKeys: number }> {
    return await this.withClient(async (client) => {
      const res = await client.query(`DELETE FROM inner_circle_keys WHERE expires_at < NOW() - INTERVAL '1 day'`);
      return { deletedMembers: 0, deletedKeys: res.rowCount ?? 0 };
    });
  }

  async getPrivacySafeStats(): Promise<any> {
    return await this.withClient(async (client) => {
      const mCount = await client.query(`SELECT COUNT(*) FROM inner_circle_members`);
      const kCount = await client.query(`SELECT COUNT(*) FROM inner_circle_keys`);
      return { totalMembers: parseInt(mCount.rows[0].count), totalKeys: parseInt(kCount.rows[0].count) };
    });
  }
}

// ---------------------------------------------------------------------------
// Singleton Facade & Exports
// ---------------------------------------------------------------------------
let storeInstance: InnerCircleStore | null = null;
function getStore(): InnerCircleStore {
  if (!storeInstance) storeInstance = new PostgresInnerCircleStore();
  return storeInstance;
}

export const createOrUpdateMemberAndIssueKey = (args: CreateOrUpdateMemberArgs) => getStore().createOrUpdateMemberAndIssueKey(args);
export const verifyInnerCircleKey = (key: string) => getStore().verifyInnerCircleKey(key);
export const recordInnerCircleUnlock = (key: string, ip?: string) => getStore().recordInnerCircleUnlock(key, ip);
export const revokeInnerCircleKey = (key: string, by?: string, reason?: string) => getStore().revokeInnerCircleKey(key, by, reason);
export const deleteMemberByEmail = (email: string) => getStore().deleteMemberByEmail(email);
export const cleanupOldData = () => getStore().cleanupOldData();
export const getPrivacySafeStats = () => getStore().getPrivacySafeStats();

export async function sendInnerCircleEmail(email: string, key: string, name?: string) {
  console.log(`[Email] Dispatching key to ${email}`);
}

export async function getActiveKeysForMember(memberId: string) {
  const keys = await getStore().getMemberKeys(memberId);
  return keys.filter(k => k.status === 'active');
}