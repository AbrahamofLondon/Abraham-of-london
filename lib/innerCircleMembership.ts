/* eslint-disable no-console */
import { safeSliceString, safeSubstring } from "@/lib/utils/safe";
import crypto from "crypto";
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
  createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey>;
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

/**
 * INSTITUTIONAL KEY GENERATION
 * Fixed: Uses safeSliceString to ensure cryptographic integrity.
 */
function generateAccessKey(): {
  key: string;
  keyHash: string;
  keySuffix: string;
} {
  const raw = crypto.randomBytes(20).toString("base64url");
  
  // Use the string-specific slice from your safe.ts
  const key = safeSliceString(raw, 0, 24);
  const keyHash = sha256Hex(key);
  const keySuffix = safeSliceString(key, -4);
  
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
  private keyHashIndex = new Map<string, { memberId: string; keyIndex: number }>();
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

  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
    const emailNormalised = normaliseEmail(args.email);
    const emailHash = sha256Hex(emailNormalised);
    const emailHashPrefix = safeSubstring(emailHash, 0, 10);
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
    } else {
      member.lastSeenAt = now;
      if (args.name && args.name.trim()) member.name = args.name.trim();
      if (args.ipAddress) member.lastIp = args.ipAddress;
    }

    const { key, keyHash, keySuffix } = generateAccessKey();
    const keyRecord: InnerCircleKeyRecord = {
      keyHash,
      keySuffix,
      createdAt: now,
      status: "active",
      totalUnlocks: 0,
      lastUsedAt: null,
      lastIp: args.ipAddress,
    };

    member.keys.push(keyRecord);
    this.keyHashIndex.set(keyHash, {
      memberId: member.id,
      keyIndex: member.keys.length - 1,
    });

    logPrivacyAction("key_issued", { 
      memberId: member.id, 
      isNewMember,
      context: args.context 
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
    
    return {
      valid: true,
      memberId: member.id,
      keySuffix: record.keySuffix,
      createdAt: record.createdAt,
    };
  }

  async recordInnerCircleUnlock(key: string, ipAddress?: string): Promise<void> {
    const safeKey = key.trim();
    const keyHash = sha256Hex(safeKey);
    const hit = this.keyHashIndex.get(keyHash);
    if (!hit) return;
    const member = this.getMemberById(hit.memberId);
    if (!member) return;
    const record = member.keys[hit.keyIndex];
    if (record) {
      record.totalUnlocks += 1;
      record.lastUsedAt = nowIso();
      if (ipAddress) record.lastIp = ipAddress;
    }
  }

  async revokeInnerCircleKey(key: string): Promise<boolean> {
    const keyHash = sha256Hex(key.trim());
    const hit = this.keyHashIndex.get(keyHash);
    if (!hit) return false;
    const member = this.getMemberById(hit.memberId);
    if (!member) return false;
    const record = member.keys[hit.keyIndex];
    if (record) {
      record.status = "revoked";
      logPrivacyAction("key_revoked", { memberId: member.id, keySuffix: record.keySuffix });
      return true;
    }
    return false;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const emailHash = sha256Hex(normaliseEmail(email));
    const member = this.getMemberByEmailHash(emailHash);
    if (!member) return false;
    this.members = this.members.filter(m => m.id !== member.id);
    this.emailHashIndex.delete(emailHash);
    logPrivacyAction("member_deleted", { emailHashPrefix: member.emailHashPrefix });
    return true;
  }

  async cleanupOldData() {
    const now = Date.now();
    let deletedKeys = 0;
    let deletedMembers = 0;

    this.members = this.members.map(member => {
      const originalLength = member.keys.length;
      member.keys = member.keys.filter(key => {
        const keyAge = now - new Date(key.createdAt).getTime();
        return keyAge < KEY_TTL_MS;
      });
      deletedKeys += originalLength - member.keys.length;
      return member;
    });

    const beforeMembers = this.members.length;
    this.members = this.members.filter(m => m.keys.length > 0);
    deletedMembers = beforeMembers - this.members.length;

    this.keyHashIndex.clear();
    this.emailHashIndex.clear();
    this.members.forEach(m => this.indexMember(m));

    this.lastCleanup = nowIso();
    
    logPrivacyAction("cleanup_completed", { deletedMembers, deletedKeys });
    return { deletedMembers, deletedKeys };
  }

  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
    const totalUnlocks = this.members.reduce(
      (sum, m) => sum + m.keys.reduce((keySum, k) => keySum + k.totalUnlocks, 0), 
      0
    );

    return {
      totalMembers: this.members.length,
      activeMembers: this.members.filter(m => 
        m.keys.some(k => k.status === "active")
      ).length,
      totalKeys: this.keyHashIndex.size,
      totalUnlocks,
      dataRetentionDays: DATA_RETENTION_DAYS,
      estimatedMemoryBytes: JSON.stringify(this.members).length,
      lastCleanup: this.lastCleanup,
    };
  }

  async exportInnerCircleAdminSummary(): Promise<InnerCircleAdminExportRow[]> {
    return this.members.flatMap(member => 
      member.keys.map(key => ({
        created_at: key.createdAt,
        status: key.status,
        key_suffix: key.keySuffix,
        email_hash_prefix: member.emailHashPrefix,
        total_unlocks: key.totalUnlocks,
      }))
    );
  }
}

// ---------------------------------------------------------------------------
// Postgres implementation (production)
// ---------------------------------------------------------------------------
let sharedPool: Pool | null = null;

function getPool(): Pool {
  if (sharedPool) return sharedPool;
  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL ?? "";
  if (!conn) throw new Error("[InnerCircle] No DB URL configured. Set INNER_CIRCLE_DB_URL or DATABASE_URL");
  sharedPool = new Pool({ 
    connectionString: conn, 
    max: 5, 
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  
  sharedPool.on('error', (err) => {
    console.error('[InnerCircle] Unexpected pool error:', err);
  });
  
  return sharedPool;
}

class PostgresInnerCircleStore implements InnerCircleStore {
  private async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
    const emailNormalised = normaliseEmail(args.email);
    const emailHash = sha256Hex(emailNormalised);
    const emailHashPrefix = safeSubstring(emailHash, 0, 10);
    const { key, keyHash, keySuffix } = generateAccessKey();
    const now = nowIso();
    
    let memberId: string;

    await this.withClient(async (client) => {
      await client.query("BEGIN");
      try {
        const memberRes = await client.query<{ id: string }>(
          `INSERT INTO inner_circle_members (id, email_hash, email_hash_prefix, name, last_ip, created_at, last_seen_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (email_hash) DO UPDATE SET
             name = COALESCE($3, inner_circle_members.name),
             last_seen_at = NOW(),
             last_ip = COALESCE($4, inner_circle_members.last_ip)
           RETURNING id`,
          [emailHash, emailHashPrefix, args.name || null, args.ipAddress || null]
        );
        
        if (!memberRes.rows[0]) throw new Error("Failed to secure member identity.");
        memberId = memberRes.rows[0].id;

        await client.query(
          `INSERT INTO inner_circle_keys (id, member_id, key_hash, key_suffix, status, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, 'active', NOW())`,
          [memberId, keyHash, keySuffix]
        );
        
        await client.query("COMMIT");
        
        logPrivacyAction("key_issued_postgres", { 
          memberId, 
          context: args.context 
        });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("[InnerCircle] DB transaction failed:", error);
        throw error;
      }
    });

    return { 
      key, 
      keySuffix, 
      createdAt: now, 
      status: "active" 
    };
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const keyHash = sha256Hex(key.trim());
    const res = await this.withClient(client => 
      client.query<{ member_id: string; status: InnerCircleStatus; created_at: string; key_suffix: string }>(
        `SELECT member_id, status, created_at::text, key_suffix 
         FROM inner_circle_keys 
         WHERE key_hash = $1 
         LIMIT 1`,
        [keyHash]
      )
    );

    const row = res.rows[0];
    if (!row) return { valid: false, reason: "not-found" };
    if (row.status === "revoked") return { valid: false, reason: "revoked" };

    return {
      valid: true,
      memberId: row.member_id,
      keySuffix: row.key_suffix,
      createdAt: row.created_at,
    };
  }

  async recordInnerCircleUnlock(key: string, ipAddress?: string): Promise<void> {
    const keyHash = sha256Hex(key.trim());
    await this.withClient(async (client) => {
      const res = await client.query<{ id: string; member_id: string }>(
        `SELECT id, member_id FROM inner_circle_keys WHERE key_hash = $1 LIMIT 1`,
        [keyHash]
      );
      const row = res.rows[0];
      if (row) {
        await client.query(
          `UPDATE inner_circle_keys 
           SET total_unlocks = total_unlocks + 1, 
               last_used_at = NOW(), 
               last_ip = COALESCE($2, last_ip) 
           WHERE id = $1`,
          [row.id, ipAddress || null]
        );
      }
    });
  }

  async revokeInnerCircleKey(key: string): Promise<boolean> {
    const keyHash = sha256Hex(key.trim());
    const res = await this.withClient(client => 
      client.query(
        `UPDATE inner_circle_keys 
         SET status = 'revoked', updated_at = NOW() 
         WHERE key_hash = $1`,
        [keyHash]
      )
    );
    
    if ((res.rowCount ?? 0) > 0) {
      logPrivacyAction("key_revoked_postgres", { keyHash: keyHash.substring(0, 8) });
      return true;
    }
    return false;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const emailHash = sha256Hex(normaliseEmail(email));
    const res = await this.withClient(client => 
      client.query(
        `DELETE FROM inner_circle_members WHERE email_hash = $1`,
        [emailHash]
      )
    );
    return (res.rowCount ?? 0) > 0;
  }

  async cleanupOldData() {
    const cutoffDate = new Date(Date.now() - KEY_TTL_MS).toISOString();
    
    const keyRes = await this.withClient(client => 
      client.query(
        `DELETE FROM inner_circle_keys 
         WHERE created_at < $1::timestamp 
         RETURNING id`,
        [cutoffDate]
      )
    );

    const memberRes = await this.withClient(client => 
      client.query(
        `DELETE FROM inner_circle_members m
         WHERE NOT EXISTS (
           SELECT 1 FROM inner_circle_keys k WHERE k.member_id = m.id
         )
         RETURNING id`
      )
    );

    const deletedKeys = keyRes.rowCount ?? 0;
    const deletedMembers = memberRes.rowCount ?? 0;

    if (deletedKeys > 0 || deletedMembers > 0) {
      logPrivacyAction("cleanup_completed_postgres", { deletedMembers, deletedKeys });
    }

    return { deletedMembers, deletedKeys };
  }

  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
    const memberRes = await this.withClient(client => 
      client.query<{ total: string; active: string }>(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM inner_circle_keys k WHERE k.member_id = m.id AND k.status = 'active'
          )) as active
         FROM inner_circle_members m`
      )
    );

    const keyRes = await this.withClient(client => 
      client.query<{ total: string; unlocks: string }>(
        `SELECT 
          COUNT(*) as total,
          COALESCE(SUM(total_unlocks), 0) as unlocks
         FROM inner_circle_keys`
      )
    );

    return {
      totalMembers: parseInt(memberRes.rows[0]?.total || "0"),
      activeMembers: parseInt(memberRes.rows[0]?.active || "0"),
      totalKeys: parseInt(keyRes.rows[0]?.total || "0"),
      totalUnlocks: parseInt(keyRes.rows[0]?.unlocks || "0"),
      dataRetentionDays: DATA_RETENTION_DAYS,
      estimatedMemoryBytes: 0,
      lastCleanup: nowIso(),
    };
  }

  async exportInnerCircleAdminSummary(): Promise<InnerCircleAdminExportRow[]> {
    const res = await this.withClient(client => 
      client.query<InnerCircleAdminExportRow>(
        `SELECT 
          k.created_at::text as created_at, 
          k.status, 
          k.key_suffix, 
          m.email_hash_prefix, 
          k.total_unlocks
         FROM inner_circle_keys k 
         JOIN inner_circle_members m ON m.id = k.member_id
         ORDER BY k.created_at DESC`
      )
    );
    return res.rows;
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
    try {
      storeInstance = new PostgresInnerCircleStore();
      logPrivacyAction("store_initialized", { mode: "postgres" });
    } catch (error) {
      console.error("[InnerCircle] Failed to initialize Postgres store, falling back to memory:", error);
      storeInstance = new MemoryInnerCircleStore();
      logPrivacyAction("store_initialized", { mode: "memory (fallback)" });
    }
  } else {
    storeInstance = new MemoryInnerCircleStore();
    logPrivacyAction("store_initialized", { mode: "memory" });
  }
  
  return storeInstance;
}

// Public API
export const createOrUpdateMemberAndIssueKey = (args: CreateOrUpdateMemberArgs) => 
  getStore().createOrUpdateMemberAndIssueKey(args);

export const verifyInnerCircleKey = (key: string) => 
  getStore().verifyInnerCircleKey(key);

export const recordInnerCircleUnlock = (key: string, ip?: string) => 
  getStore().recordInnerCircleUnlock(key, ip);

export const revokeInnerCircleKey = (key: string) => 
  getStore().revokeInnerCircleKey(key);

export const deleteMemberByEmail = (email: string) => 
  getStore().deleteMemberByEmail(email);

export const cleanupOldData = () => 
  getStore().cleanupOldData();

export const getPrivacySafeStats = () => 
  getStore().getPrivacySafeStats();

export const exportInnerCircleAdminSummary = () => 
  getStore().exportInnerCircleAdminSummary();

export async function closeInnerCircleStore(): Promise<void> {
  if (sharedPool) {
    await sharedPool.end();
    sharedPool = null;
    storeInstance = null;
    logPrivacyAction("store_closed", {});
  }
}