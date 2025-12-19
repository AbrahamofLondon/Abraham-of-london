/* eslint-disable no-console */
import crypto from "node:crypto";
import { Pool, type PoolClient } from "pg";
import type { NextApiRequest } from "next";

const CONFIG = {
  KEY_EXPIRY_DAYS: Number(process.env.INNER_CIRCLE_KEY_EXPIRY_DAYS || 90),
  KEY_PREFIX: "icl_",
} as const;

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

export interface InnerCircleStore {
  createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey>;
  verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult>;
  recordInnerCircleUnlock(key: string, ip?: string): Promise<void>;
  revokeInnerCircleKey(key: string, revokedBy?: string, reason?: string): Promise<boolean>;
  deleteMemberByEmail(email: string): Promise<boolean>;
  getMemberKeys(memberId: string): Promise<any[]>;
  getPrivacySafeStats(): Promise<{ totalMembers: number; totalKeys: number }>;
}

/** ✅ matches your API usage */
export type InnerCircleEmailType = "welcome" | "resend";
export type SendInnerCircleEmailArgs = {
  to: string;
  type: InnerCircleEmailType;
  data: {
    name: string;
    accessKey: string;
    unlockUrl: string;
  };
};

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function generateAccessKey(): { key: string; keyHash: string; keySuffix: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const key = `${CONFIG.KEY_PREFIX}${raw.slice(0, 28)}`;
  return { key, keyHash: sha256Hex(key), keySuffix: key.slice(-6) };
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

let sharedPool: Pool | null = null;

function getPool(): Pool | null {
  if (isBuildTime()) return null;

  if (sharedPool) return sharedPool;

  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) {
    console.warn("[InnerCircle] No DATABASE_URL/INNER_CIRCLE_DB_URL set; running in no-db mode.");
    return null;
  }

  sharedPool = new Pool({
    connectionString: conn,
    max: 5,
    ssl: conn.includes("localhost") || conn.includes("127.0.0.1")
      ? undefined
      : { rejectUnauthorized: false },
  });

  return sharedPool;
}

class PostgresInnerCircleStore implements InnerCircleStore {
  private async withClient<T>(fn: (client: PoolClient) => Promise<T>, fallback: T): Promise<T> {
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
      console.warn("[InnerCircle] DB unavailable; returning fallback.");
      return fallback;
    }
  }

  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
    const emailHash = sha256Hex(args.email.trim().toLowerCase());
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
      memberId: "no-db",
    };

    return this.withClient(async (client) => {
      await client.query("BEGIN");

      const memberRes = await client.query(
        `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email_hash)
         DO UPDATE SET last_seen_at = NOW(), name = COALESCE($3, inner_circle_members.name)
         RETURNING id`,
        [emailHash, emailHash.slice(0, 10), args.name || null, args.ipAddress || null]
      );

      const memberId: string = memberRes.rows[0].id;

      await client.query(
        `INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status, expires_at)
         VALUES ($1, $2, $3, 'active', $4)`,
        [memberId, keyHash, keySuffix, expiresAt]
      );

      await client.query("COMMIT");

      return {
        key,
        keySuffix,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: "active",
        memberId,
      };
    }, fallback);
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const cleaned = key.trim();
    if (!cleaned) return { valid: false, reason: "empty" };

    const keyHash = sha256Hex(cleaned);

    return this.withClient(async (client) => {
      const res = await client.query(
        `SELECT member_id, status, expires_at, key_suffix
         FROM inner_circle_keys
         WHERE key_hash = $1`,
        [keyHash]
      );

      const row = res.rows[0];
      if (!row) return { valid: false, reason: "not_found" };
      if (row.status === "revoked") return { valid: false, reason: "revoked" };
      if (new Date(row.expires_at) < new Date()) return { valid: false, reason: "expired" };

      return { valid: true, memberId: row.member_id, keySuffix: row.key_suffix };
    }, { valid: false, reason: "no_db" });
  }

  async recordInnerCircleUnlock(key: string, ip?: string): Promise<void> {
    const cleaned = key.trim();
    if (!cleaned) return;

    await this.withClient(
      async (client) => {
        await client.query(
          `UPDATE inner_circle_keys
           SET total_unlocks = total_unlocks + 1,
               last_used_at = NOW(),
               last_ip = $2
           WHERE key_hash = $1`,
          [sha256Hex(cleaned), ip || null]
        );
      },
      undefined
    );
  }

  async revokeInnerCircleKey(key: string, revokedBy = "admin", reason = "manual"): Promise<boolean> {
    const cleaned = key.trim();
    if (!cleaned) return false;

    return this.withClient(async (client) => {
      const res = await client.query(
        `UPDATE inner_circle_keys
         SET status = 'revoked', revoked_at = NOW(), revoked_by = $2, revoked_reason = $3
         WHERE key_hash = $1`,
        [sha256Hex(cleaned), revokedBy, reason]
      );
      return (res.rowCount ?? 0) > 0;
    }, false);
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned) return false;

    return this.withClient(async (client) => {
      const res = await client.query(
        `DELETE FROM inner_circle_members WHERE email_hash = $1`,
        [sha256Hex(cleaned)]
      );
      return (res.rowCount ?? 0) > 0;
    }, false);
  }

  async getMemberKeys(memberId: string): Promise<any[]> {
    if (!memberId) return [];
    return this.withClient(async (client) => {
      const res = await client.query(
        `SELECT * FROM inner_circle_keys WHERE member_id = $1 ORDER BY created_at DESC`,
        [memberId]
      );
      return res.rows || [];
    }, []);
  }

  async getPrivacySafeStats(): Promise<{ totalMembers: number; totalKeys: number }> {
    return this.withClient(async (client) => {
      const m = await client.query(`SELECT COUNT(*) FROM inner_circle_members`);
      const k = await client.query(`SELECT COUNT(*) FROM inner_circle_keys`);
      return {
        totalMembers: Number(m.rows?.[0]?.count ?? 0),
        totalKeys: Number(k.rows?.[0]?.count ?? 0),
      };
    }, { totalMembers: 0, totalKeys: 0 });
  }
}

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

export const getPrivacySafeStats = () => getStore().getPrivacySafeStats();

export async function getActiveKeysForMember(memberId: string) {
  const keys = await getStore().getMemberKeys(memberId);
  return keys.filter((k: any) => k?.status === "active");
}

/** ✅ used by unlock/register/resend */
export function getClientIp(req: NextApiRequest): string | undefined {
  const xf = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined;
  return ip;
}

/**
 * ✅ REAL email contract (no stub shape mismatch)
 * Implementation: plug into your existing email engine.
 *
 * If you already have Resend helpers somewhere else, import + call them here.
 * This file is the single choke-point so all APIs stay consistent.
 */
export async function sendInnerCircleEmail(args: SendInnerCircleEmailArgs): Promise<void> {
  const { to, type, data } = args;

  // ---- Replace this section with your actual provider call ----
  // Example (pseudo):
  // await sendEmail({
  //   to,
  //   from: process.env.MAIL_FROM!,
  //   subject: type === "welcome" ? "Your Inner Circle access key" : "Your refreshed Inner Circle access key",
  //   html: renderTemplate(type, data),
  // });

  // Until wired, keep log output *minimal* and safe:
  console.info(`[InnerCircleEmail] type=${type} -> ${to}`);
  console.info(`[InnerCircleEmail] unlockUrl=${data.unlockUrl}`);
}