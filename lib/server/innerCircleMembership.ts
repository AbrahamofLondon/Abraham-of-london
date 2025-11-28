// lib/server/innerCircleMembership.ts
/* eslint-disable no-console */
import { Pool, type PoolClient } from "pg";
import { generateDisplayKey, hashEmail, hashKey, normalizeEmail } from "./innerCircleCrypto";

export type InnerCircleMemberStatus = "active" | "replaced" | "revoked";

export interface InnerCircleMember {
  id: string;
  emailHash: string;
  keyHash: string;
  keySuffix: string;
  status: InnerCircleMemberStatus;
  createdAt: string;
  lastUsedAt: string | null;
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString =
    process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "[InnerCircle] No INNER_CIRCLE_DB_URL (or DATABASE_URL) configured for membership store.",
    );
  }

  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  return pool;
}

/**
 * SQL schema to run once in your DB (NOT executed automatically):
 *
 *  CREATE TABLE IF NOT EXISTS inner_circle_members (
 *    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *    email_hash TEXT NOT NULL,
 *    key_hash   TEXT NOT NULL,
 *    key_suffix TEXT NOT NULL,
 *    status     TEXT NOT NULL DEFAULT 'active',
 *    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *    last_used_at TIMESTAMPTZ,
 *    CONSTRAINT inner_circle_members_status_chk
 *      CHECK (status IN ('active','replaced','revoked'))
 *  );
 *
 *  CREATE INDEX IF NOT EXISTS idx_inner_circle_email_hash
 *    ON inner_circle_members (email_hash);
 *
 *  CREATE INDEX IF NOT EXISTS idx_inner_circle_key_hash_active
 *    ON inner_circle_members (key_hash, status);
 */

/**
 * Issue a fresh key for the given email.
 *
 * Security:
 * - we NEVER store the email itself, only a HMAC hash.
 * - we NEVER store the raw key, only its hash and last 4 chars for admin display.
 * - any existing active keys for this email are marked "replaced".
 */
export async function issueMemberKeyForEmail(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const emailHash = hashEmail(normalizedEmail);
  const displayKey = generateDisplayKey();
  const keyHash = hashKey(displayKey);
  const keySuffix = displayKey.slice(-4);

  const poolInstance = getPool();
  const client: PoolClient = await poolInstance.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE inner_circle_members SET status = 'replaced' WHERE email_hash = $1 AND status = 'active'",
      [emailHash],
    );

    await client.query(
      `INSERT INTO inner_circle_members (email_hash, key_hash, key_suffix, status)
       VALUES ($1, $2, $3, 'active')`,
      [emailHash, keyHash, keySuffix],
    );

    await client.query("COMMIT");

    // We return the raw display key ONLY to the caller so it can be emailed.
    return displayKey;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[InnerCircle] Failed to issue member key:", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Validate a submitted key against the membership store.
 * Returns true if the key exists and is active; false otherwise.
 */
export async function validateMemberKey(key: string): Promise<boolean> {
  const poolInstance = getPool();
  const normalizedKey = key.trim().toUpperCase();
  const keyHash = hashKey(normalizedKey);

  const res = await poolInstance.query<{
    id: string;
  }>(
    "SELECT id FROM inner_circle_members WHERE key_hash = $1 AND status = 'active' LIMIT 1",
    [keyHash],
  );

  const row = res.rows[0];
  if (!row) {
    return false;
  }

  // Best-effort: update last_used_at; do not block on failure.
  poolInstance
    .query("UPDATE inner_circle_members SET last_used_at = NOW() WHERE id = $1", [
      row.id,
    ])
    .catch((err) => {
      console.warn("[InnerCircle] Failed to update last_used_at:", err);
    });

  return true;
}