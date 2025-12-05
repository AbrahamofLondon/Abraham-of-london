// lib/innerCircleMembership.ts
/* eslint-disable no-console */

import crypto from "node:crypto";
import { Pool, type PoolClient } from "pg";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type InnerCircleStatus = "pending" | "active" | "revoked";

export interface InnerCircleKeyRecord {
  keyHash: string;
  keySuffix: string;
  createdAt: string;
  lastUsedAt?: string | null;
  status: InnerCircleStatus;
  totalUnlocks: number;
  lastIp?: string | null;
}

export interface InnerCircleMember {
  id: string;
  emailHash: string;
  emailHashPrefix: string;
  name?: string | null;
  createdAt: string;
  lastSeenAt: string;
  lastIp?: string | null;
  keys: InnerCircleKeyRecord[];
}

export interface CreateOrUpdateMemberArgs {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: "register" | "manual" | "import" | string;
}

export interface IssuedKey {
  key: string;
  keySuffix: string;
  createdAt: string;
  status: InnerCircleStatus;
}

export interface VerifyInnerCircleKeyResult {
  valid: boolean;
  reason?: string;
  memberId?: string;
  keySuffix?: string;
  createdAt?: string;
}

export interface InnerCircleAdminExportRow {
  created_at: string;
  status: InnerCircleStatus;
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
}

export interface PrivacySafeStats {
  totalMembers: number;
  activeMembers: number;
  totalKeys: number;
  totalUnlocks: number;
  dataRetentionDays: number;
  estimatedMemoryBytes: number;
  lastCleanup: string;
}

export interface InnerCircleStore {
  createOrUpdateMemberAndIssueKey(
    args: CreateOrUpdateMemberArgs
  ): Promise<IssuedKey>;

  verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult>;

  recordInnerCircleUnlock(key: string, ipAddress?: string): Promise<void>;

  revokeInnerCircleKey(key: string): Promise<boolean>;

  deleteMemberByEmail(email: string): Promise<boolean>;

  cleanupOldData(): Promise<{ deletedMembers: number; deletedKeys: number }>;

  getPrivacySafeStats(): Promise<PrivacySafeStats>;

  exportInnerCircleAdminSummary(): Promise<InnerCircleAdminExportRow[]>;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const DATA_RETENTION_DAYS = 365;
const KEY_TTL_MS = 1000 * 60 * 60 * 24 * DATA_RETENTION_DAYS;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

function generateAccessKey(): {
  key: string;
  keyHash: string;
  keySuffix: string;
} {
  const raw = crypto.randomBytes(20).toString("base64url");
  const key = raw.slice(0, 24);
  const keyHash = sha256Hex(key);
  const keySuffix = key.slice(-4);
  return { key, keyHash, keySuffix };
}

function logPrivacyAction(
  action: string,
  metadata: Record<string, unknown> = {}
): void {
  console.log(`🔒 InnerCircle: ${action}`, {
    ts: new Date().toISOString(),
    ...metadata,
  });
}

// ---------------------------------------------------------------------------
// Memory implementation (used in dev / fallback)
// ---------------------------------------------------------------------------

class MemoryInnerCircleStore implements InnerCircleStore {
  private members: InnerCircleMember[] = [];
  private keyHashIndex = new Map<
    string,
    { memberId: string; keyIndex: number }
  >();
  private emailHashIndex = new Map<string, string>();
  private lastCleanup = nowIso();

  private getMemberByEmailHash(emailHash: string): InnerCircleMember | null {
    const id = this.emailHashIndex.get(emailHash);
    if (!id) return null;
    return this.members.find((m) => m.id === id) ?? null;
  }

  private getMemberById(id: string): InnerCircleMember | null {
    return this.members.find((m) => m.id === id) ?? null;
  }

  private indexMember(member: InnerCircleMember): void {
    this.emailHashIndex.set(member.emailHash, member.id);
    member.keys.forEach((key, idx) => {
      this.keyHashIndex.set(key.keyHash, {
        memberId: member.id,
        keyIndex: idx,
      });
    });
  }

  async createOrUpdateMemberAndIssueKey(
    args: CreateOrUpdateMemberArgs
  ): Promise<IssuedKey> {
    const emailNormalised = normaliseEmail(args.email);
    const emailHash = sha256Hex(emailNormalised);
    const emailHashPrefix = emailHash.slice(0, 10);
    const now = nowIso();

    let member = this.getMemberByEmailHash(emailHash);
    const isNewMember = !member;

    if (!member) {
      member = {
        id: crypto.randomUUID(),
        emailHash,
        emailHashPrefix,
        name: args.name?.trim() || undefined,
        createdAt: now,
        lastSeenAt: now,
        lastIp: args.ipAddress,
        keys: [],
      };
      this.members.push(member);
      this.indexMember(member);
      logPrivacyAction("member_created", {
        store: "memory",
        memberId: member.id,
        emailHashPrefix: member.emailHashPrefix,
        context: args.context,
      });
    } else {
      member.lastSeenAt = now;
      if (args.name && args.name.trim()) member.name = args.name.trim();
      if (args.ipAddress) member.lastIp = args.ipAddress;
      logPrivacyAction("member_updated", {
        store: "memory",
        memberId: member.id,
        emailHashPrefix: member.emailHashPrefix,
        context: args.context,
      });
    }

    const { key, keyHash, keySuffix } = generateAccessKey();
    const keyRecord: InnerCircleKeyRecord = {
      keyHash,
      keySuffix,
      createdAt: now,
      status: "active",
      totalUnlocks: 0,
      lastUsedAt: null,
    };

    member.keys.push(keyRecord);
    this.keyHashIndex.set(keyHash, {
      memberId: member.id,
      keyIndex: member.keys.length - 1,
    });

    logPrivacyAction("key_issued", {
      store: "memory",
      memberId: member.id,
      keySuffix,
      isNewMember,
    });

    return {
      key,
      keySuffix,
      createdAt: keyRecord.createdAt,
      status: keyRecord.status,
    };
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const safeKey = key.trim();
    if (!safeKey) return { valid: false, reason: "missing-key" };

    const keyHash = sha256Hex(safeKey);
    const hit = this.keyHashIndex.get(keyHash);
    if (!hit) return { valid: false, reason: "not-found" };

    const member = this.getMemberById(hit.memberId);
    if (!member) return { valid: false, reason: "member-missing" };

    const record = member.keys[hit.keyIndex];
    if (!record) return { valid: false, reason: "record-missing" };

    if (record.status === "revoked") return { valid: false, reason: "revoked" };

    const created = new Date(record.createdAt).getTime();
    const ageMs = Date.now() - created;
    if (ageMs > KEY_TTL_MS) return { valid: false, reason: "expired" };

    return {
      valid: true,
      memberId: member.id,
      keySuffix: record.keySuffix,
      createdAt: record.createdAt,
    };
  }

  async recordInnerCircleUnlock(
    key: string,
    ipAddress?: string
  ): Promise<void> {
    const safeKey = key.trim();
    if (!safeKey) return;

    const keyHash = sha256Hex(safeKey);
    const hit = this.keyHashIndex.get(keyHash);
    if (!hit) return;

    const member = this.getMemberById(hit.memberId);
    if (!member) return;

    const record = member.keys[hit.keyIndex];
    if (!record) return;

    record.totalUnlocks += 1;
    record.lastUsedAt = nowIso();
    if (ipAddress) {
      record.lastIp = ipAddress;
      member.lastIp = ipAddress;
    }
    member.lastSeenAt = record.lastUsedAt;

    logPrivacyAction("key_used", {
      store: "memory",
      memberId: member.id,
      keySuffix: record.keySuffix,
      totalUnlocks: record.totalUnlocks,
    });
  }

  async revokeInnerCircleKey(key: string): Promise<boolean> {
    const safeKey = key.trim();
    if (!safeKey) return false;

    const keyHash = sha256Hex(safeKey);
    const hit = this.keyHashIndex.get(keyHash);
    if (!hit) return false;

    const member = this.getMemberById(hit.memberId);
    if (!member) return false;

    const record = member.keys[hit.keyIndex];
    if (!record) return false;

    record.status = "revoked";
    record.lastUsedAt = nowIso();

    logPrivacyAction("key_revoked", {
      store: "memory",
      memberId: member.id,
      keySuffix: record.keySuffix,
      totalUnlocks: record.totalUnlocks,
    });

    return true;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const emailNormalised = normaliseEmail(email);
    const emailHash = sha256Hex(emailNormalised);
    const member = this.getMemberByEmailHash(emailHash);
    if (!member) return false;

    this.emailHashIndex.delete(member.emailHash);
    member.keys.forEach((key) => this.keyHashIndex.delete(key.keyHash));
    const index = this.members.findIndex((m) => m.id === member.id);
    if (index !== -1) this.members.splice(index, 1);

    logPrivacyAction("delete_member", {
      store: "memory",
      memberId: member.id,
      emailHashPrefix: member.emailHashPrefix,
    });

    return true;
  }

  async cleanupOldData(): Promise<{
    deletedMembers: number;
    deletedKeys: number;
  }> {
    const cutoff = Date.now() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedMembers = 0;
    let deletedKeys = 0;

    for (let i = this.members.length - 1; i >= 0; i--) {
      const member = this.members[i];
      const lastActivity = new Date(member.lastSeenAt).getTime();
      if (lastActivity < cutoff) {
        this.emailHashIndex.delete(member.emailHash);
        member.keys.forEach((k) => this.keyHashIndex.delete(k.keyHash));
        deletedKeys += member.keys.length;
        this.members.splice(i, 1);
        deletedMembers++;
      }
    }

    if (deletedMembers > 0) {
      logPrivacyAction("cleanup_completed", {
        store: "memory",
        deletedMembers,
        deletedKeys,
      });
    }
    this.lastCleanup = nowIso();

    return { deletedMembers, deletedKeys };
  }

  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
    const now = Date.now();
    const activeMembers = this.members.filter((m) =>
      m.keys.some(
        (k) =>
          k.status === "active" &&
          now - new Date(k.createdAt).getTime() < KEY_TTL_MS
      )
    ).length;

    const totalUnlocks = this.members.reduce(
      (sum, m) =>
        sum + m.keys.reduce((keySum, k) => keySum + k.totalUnlocks, 0),
      0
    );

    return {
      totalMembers: this.members.length,
      activeMembers,
      totalKeys: this.keyHashIndex.size,
      totalUnlocks,
      dataRetentionDays: DATA_RETENTION_DAYS,
      estimatedMemoryBytes:
        this.members.length * 500 + this.keyHashIndex.size * 100,
      lastCleanup: this.lastCleanup,
    };
  }

  async exportInnerCircleAdminSummary(): Promise<InnerCircleAdminExportRow[]> {
    const rows: InnerCircleAdminExportRow[] = [];

    this.members.forEach((member) => {
      member.keys.forEach((key) => {
        rows.push({
          created_at: key.createdAt,
          status: key.status,
          key_suffix: key.keySuffix,
          email_hash_prefix: member.emailHashPrefix,
          total_unlocks: key.totalUnlocks,
        });
      });
    });

    rows.sort((a, b) => {
      const tA = new Date(a.created_at).getTime();
      const tB = new Date(b.created_at).getTime();
      return tB - tA;
    });

    return rows;
  }
}

// ---------------------------------------------------------------------------
// Postgres implementation (production)
// ---------------------------------------------------------------------------

let sharedPool: Pool | null = null;

function getPool(): Pool {
  if (sharedPool) return sharedPool;

  const conn =
    process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL ?? "";
  if (!conn) {
    throw new Error(
      "[InnerCircle] No INNER_CIRCLE_DB_URL/DATABASE_URL configured."
    );
  }

  sharedPool = new Pool({
    connectionString: conn,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  return sharedPool;
}

class PostgresInnerCircleStore implements InnerCircleStore {
  private async withClient<T>(
    fn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async createOrUpdateMemberAndIssueKey(
    args: CreateOrUpdateMemberArgs
  ): Promise<IssuedKey> {
    const emailNormalised = normaliseEmail(args.email);
    const emailHash = sha256Hex(emailNormalised);
    const emailHashPrefix = emailHash.slice(0, 10);
    const now = nowIso();
    const { key, keyHash, keySuffix } = generateAccessKey();

    await this.withClient(async (client) => {
      await client.query("BEGIN");

      // Ensure member exists
      const memberRes = await client.query<{ id: string }>(
        `
        INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip)
        VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''))
        ON CONFLICT (email_hash)
        DO UPDATE SET
          name = COALESCE(NULLIF($3, ''), inner_circle_members.name),
          last_seen_at = NOW(),
          last_ip = COALESCE(NULLIF($4, ''), inner_circle_members.last_ip)
        RETURNING id
      `,
        [emailHash, emailHashPrefix, args.name ?? "", args.ipAddress ?? ""]
      );

      const memberId = memberRes.rows[0].id;

      // Mark previous keys as replaced/revoked? Here we simply leave them;
      // they remain valid until TTL. If you want strict single-key policy,
      // uncomment the update:
      //
      // await client.query(
      //   "UPDATE inner_circle_keys SET status = 'revoked' WHERE member_id = $1 AND status = 'active'",
      //   [memberId],
      // );

      await client.query(
        `
        INSERT INTO inner_circle_keys (
          member_id, key_hash, key_suffix, status, total_unlocks
        )
        VALUES ($1, $2, $3, 'active', 0)
      `,
        [memberId, keyHash, keySuffix]
      );

      await client.query("COMMIT");

      logPrivacyAction("pg_key_issued", {
        memberId,
        emailHashPrefix,
        keySuffix,
        context: args.context,
      });
    });

    return {
      key,
      keySuffix,
      createdAt: now,
      status: "active",
    };
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const safeKey = key.trim();
    if (!safeKey) return { valid: false, reason: "missing-key" };

    const keyHash = sha256Hex(safeKey);

    const res = await this.withClient((client) =>
      client.query<{
        id: string;
        status: InnerCircleStatus;
        created_at: string;
      }>(
        `
        SELECT k.id, k.status, k.created_at
        FROM inner_circle_keys k
        WHERE k.key_hash = $1
        LIMIT 1
      `,
        [keyHash]
      )
    );

    const row = res.rows[0];
    if (!row) return { valid: false, reason: "not-found" };
    if (row.status === "revoked") return { valid: false, reason: "revoked" };

    const created = new Date(row.created_at).getTime();
    const ageMs = Date.now() - created;
    if (ageMs > KEY_TTL_MS) return { valid: false, reason: "expired" };

    return {
      valid: true,
      memberId: row.id,
      keySuffix: safeKey.slice(-4),
      createdAt: row.created_at,
    };
  }

  async recordInnerCircleUnlock(
    key: string,
    ipAddress?: string
  ): Promise<void> {
    const safeKey = key.trim();
    if (!safeKey) return;

    const keyHash = sha256Hex(safeKey);

    await this.withClient(async (client) => {
      await client.query("BEGIN");

      const keyRes = await client.query<{
        id: string;
        member_id: string;
      }>(
        `
        SELECT id, member_id
        FROM inner_circle_keys
        WHERE key_hash = $1
        LIMIT 1
      `,
        [keyHash]
      );

      const row = keyRes.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return;
      }

      await client.query(
        `
        UPDATE inner_circle_keys
        SET total_unlocks = total_unlocks + 1,
            last_used_at = NOW()
        WHERE id = $1
      `,
        [row.id]
      );

      await client.query(
        `
        UPDATE inner_circle_members
        SET last_seen_at = NOW(),
            last_ip = COALESCE($2, last_ip)
        WHERE id = $1
      `,
        [row.member_id, ipAddress ?? null]
      );

      await client.query("COMMIT");

      logPrivacyAction("pg_key_used", {
        keyId: row.id,
        memberId: row.member_id,
        hasIp: !!ipAddress,
      });
    });
  }

  async revokeInnerCircleKey(key: string): Promise<boolean> {
    const safeKey = key.trim();
    if (!safeKey) return false;

    const keyHash = sha256Hex(safeKey);

    const res = await this.withClient((client) =>
      client.query(
        `
        UPDATE inner_circle_keys
        SET status = 'revoked',
            last_used_at = NOW()
        WHERE key_hash = $1
      `,
        [keyHash]
      )
    );

    return (res.rowCount ?? 0) > 0;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const emailNormalised = normaliseEmail(email);
    const emailHash = sha256Hex(emailNormalised);

    const res = await this.withClient((client) =>
      client.query(
        `
        DELETE FROM inner_circle_members
        WHERE email_hash = $1
      `,
        [emailHash]
      )
    );

    return (res.rowCount ?? 0) > 0;
  }

  async cleanupOldData(): Promise<{
    deletedMembers: number;
    deletedKeys: number;
  }> {
    const result = await this.withClient(async (client) => {
      await client.query("BEGIN");

      const oldMembers = await client.query<{ id: string }>(
        `
        SELECT id
        FROM inner_circle_members
        WHERE last_seen_at < NOW() - INTERVAL '${DATA_RETENTION_DAYS} days'
      `
      );

      const memberIds = oldMembers.rows.map((r) => r.id);
      let deletedKeys = 0;

      if (memberIds.length > 0) {
        const keyDel = await client.query(
          `
          DELETE FROM inner_circle_keys
          WHERE member_id = ANY($1)
        `,
          [memberIds]
        );
        deletedKeys = keyDel.rowCount ?? 0;

        await client.query(
          `
          DELETE FROM inner_circle_members
          WHERE id = ANY($1)
        `,
          [memberIds]
        );
      }

      await client.query("COMMIT");

      return {
        deletedMembers: memberIds.length,
        deletedKeys,
      };
    });

    if (result.deletedMembers > 0) {
      logPrivacyAction("pg_cleanup_completed", {
        deletedMembers: result.deletedMembers,
        deletedKeys: result.deletedKeys,
      });
    }

    return result;
  }

  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const [membersRes, keysRes, unlocksRes] = await Promise.all([
        client.query<{ count: string }>(
          "SELECT COUNT(*) AS count FROM inner_circle_members"
        ),
        client.query<{ count: string }>(
          "SELECT COUNT(*) AS count FROM inner_circle_keys"
        ),
        client.query<{ total: string }>(
          "SELECT COALESCE(SUM(total_unlocks), 0) AS total FROM inner_circle_keys"
        ),
      ]);

      const totalMembers = Number(membersRes.rows[0].count ?? "0");
      const totalKeys = Number(keysRes.rows[0].count ?? "0");
      const totalUnlocks = Number(unlocksRes.rows[0].total ?? "0");

      // Active members: any with a non-revoked, non-expired key
      const activeRes = await client.query<{ count: string }>(
        `
        SELECT COUNT(DISTINCT m.id) AS count
        FROM inner_circle_members m
        JOIN inner_circle_keys k ON k.member_id = m.id
        WHERE k.status = 'active'
          AND k.created_at > NOW() - INTERVAL '${DATA_RETENTION_DAYS} days'
      `
      );

      return {
        totalMembers,
        activeMembers: Number(activeRes.rows[0].count ?? "0"),
        totalKeys,
        totalUnlocks,
        dataRetentionDays: DATA_RETENTION_DAYS,
        estimatedMemoryBytes: totalMembers * 1024, // heuristic
        lastCleanup: nowIso(),
      };
    } finally {
      client.release();
    }
  }

  async exportInnerCircleAdminSummary(): Promise<InnerCircleAdminExportRow[]> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const res = await client.query<InnerCircleAdminExportRow>(
        `
        SELECT
          k.created_at,
          k.status,
          k.key_suffix,
          m.email_hash_prefix,
          k.total_unlocks
        FROM inner_circle_keys k
        JOIN inner_circle_members m ON m.id = k.member_id
        ORDER BY k.created_at DESC
      `
      );
      return res.rows;
    } finally {
      client.release();
    }
  }
}

// ---------------------------------------------------------------------------
// Store selection + public facade
// ---------------------------------------------------------------------------

let storeInstance: InnerCircleStore | null = null;

function getStore(): InnerCircleStore {
  if (storeInstance) return storeInstance;

  const mode = process.env.INNER_CIRCLE_STORE ?? "memory";

  if (mode === "postgres") {
    storeInstance = new PostgresInnerCircleStore();
    logPrivacyAction("store_init", { mode: "postgres" });
  } else {
    storeInstance = new MemoryInnerCircleStore();
    logPrivacyAction("store_init", { mode: "memory" });
  }

  return storeInstance;
}

// Public functions used by API routes
export async function createOrUpdateMemberAndIssueKey(
  args: CreateOrUpdateMemberArgs
): Promise<IssuedKey> {
  return getStore().createOrUpdateMemberAndIssueKey(args);
}

export async function verifyInnerCircleKey(
  key: string
): Promise<VerifyInnerCircleKeyResult> {
  return getStore().verifyInnerCircleKey(key);
}

export async function recordInnerCircleUnlock(
  key: string,
  ipAddress?: string
): Promise<void> {
  return getStore().recordInnerCircleUnlock(key, ipAddress);
}

export async function revokeInnerCircleKey(key: string): Promise<boolean> {
  return getStore().revokeInnerCircleKey(key);
}

export async function deleteMemberByEmail(email: string): Promise<boolean> {
  return getStore().deleteMemberByEmail(email);
}

export async function cleanupOldData(): Promise<{
  deletedMembers: number;
  deletedKeys: number;
}> {
  return getStore().cleanupOldData();
}

export async function getPrivacySafeStats(): Promise<PrivacySafeStats> {
  return getStore().getPrivacySafeStats();
}

export async function exportInnerCircleAdminSummary(): Promise<
  InnerCircleAdminExportRow[]
> {
  return getStore().exportInnerCircleAdminSummary();
}

