/* eslint-disable no-console */

import crypto from "crypto";
import { Pool, type PoolClient, type QueryResult } from "pg";

// ---------------------------------------------------------------------------
// Shared Types & Interfaces
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
// Constants & Helpers
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

function generateAccessKey(): { key: string; keyHash: string; keySuffix: string } {
  const raw = crypto.randomBytes(20).toString("base64url");
  const key = raw.slice(0, 24);
  const keyHash = sha256Hex(key);
  const keySuffix = key.slice(-4);
  return { key, keyHash, keySuffix };
}

function logPrivacyAction(action: string, metadata: Record<string, unknown> = {}): void {
  console.log(`🔒 InnerCircle: ${action}`, { ts: new Date().toISOString(), ...metadata });
}

// ---------------------------------------------------------------------------
// Memory Implementation (Dev Fallback)
// ---------------------------------------------------------------------------

class MemoryInnerCircleStore implements InnerCircleStore {
  private members: InnerCircleMember[] = [];
  private keyHashIndex = new Map<string, { memberId: string; keyIndex: number }>();
  private emailHashIndex = new Map<string, string>();
  private lastCleanup = nowIso();

  private getMemberByEmailHash(emailHash: string): InnerCircleMember | null {
    const id = this.emailHashIndex.get(emailHash);
    return id ? (this.members.find((m) => m.id === id) ?? null) : null;
  }

  private getMemberById(id: string): InnerCircleMember | null {
    return this.members.find((m) => m.id === id) ?? null;
  }

  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
    const emailHash = sha256Hex(normaliseEmail(args.email));
    const now = nowIso();
    let member = this.getMemberByEmailHash(emailHash);

    if (!member) {
      member = {
        id: crypto.randomUUID(),
        emailHash,
        emailHashPrefix: emailHash.slice(0, 10),
        name: args.name?.trim(),
        createdAt: now,
        lastSeenAt: now,
        lastIp: args.ipAddress,
        keys: [],
      };
      this.members.push(member);
      this.emailHashIndex.set(emailHash, member.id);
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
    this.keyHashIndex.set(keyHash, { memberId: member.id, keyIndex: member.keys.length - 1 });

    return { key, keySuffix, createdAt: now, status: "active" };
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const keyHash = sha256Hex(key.trim());
    const hit = this.keyHashIndex.get(keyHash);
    if (!hit) return { valid: false, reason: "not-found" };

    const member = this.getMemberById(hit.memberId);
    const record = member?.keys[hit.keyIndex];

    if (!record || record.status === "revoked") return { valid: false, reason: "invalid" };
    return { valid: true, memberId: member!.id, keySuffix: record.keySuffix };
  }

  async recordInnerCircleUnlock(key: string, ipAddress?: string): Promise<void> {
    const keyHash = sha256Hex(key.trim());
    const hit = this.keyHashIndex.get(keyHash);
    if (!hit) return;
    const member = this.getMemberById(hit.memberId);
    const record = member?.keys[hit.keyIndex];
    if (record) {
      record.totalUnlocks++;
      record.lastUsedAt = nowIso();
    }
  }

  async revokeInnerCircleKey(key: string): Promise<boolean> {
    const keyHash = sha256Hex(key.trim());
    const hit = this.keyHashIndex.get(keyHash);
    if (!hit) return false;
    const member = this.getMemberById(hit.memberId);
    if (member?.keys[hit.keyIndex]) {
      member.keys[hit.keyIndex].status = "revoked";
      return true;
    }
    return false;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const emailHash = sha256Hex(normaliseEmail(email));
    const member = this.getMemberByEmailHash(emailHash);
    if (!member) return false;
    this.members = this.members.filter(m => m.id !== member.id);
    return true;
  }

  async cleanupOldData() { return { deletedMembers: 0, deletedKeys: 0 }; }
  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
    return { totalMembers: this.members.length, activeMembers: 0, totalKeys: 0, totalUnlocks: 0, dataRetentionDays: 365, estimatedMemoryBytes: 0, lastCleanup: nowIso() };
  }
  async exportInnerCircleAdminSummary() { return []; }
}

// ---------------------------------------------------------------------------
// Postgres Implementation (Production)
// ---------------------------------------------------------------------------

let sharedPool: Pool | null = null;

function getPool(): Pool {
  if (sharedPool) return sharedPool;
  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) throw new Error("[InnerCircle] No Database URL configured.");
  sharedPool = new Pool({ connectionString: conn, max: 5 });
  return sharedPool;
}

class PostgresInnerCircleStore implements InnerCircleStore {
  private async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try { return await fn(client); } finally { client.release(); }
  }

  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
    const emailHash = sha256Hex(normaliseEmail(args.email));
    const { key, keyHash, keySuffix } = generateAccessKey();

    return await this.withClient(async (client) => {
      await client.query("BEGIN");
      const memberRes = await client.query(
        `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, last_ip) 
         VALUES ($1, $2, $3, $4) ON CONFLICT (email_hash) 
         DO UPDATE SET last_seen_at = NOW() RETURNING id`,
        [emailHash, emailHash.slice(0, 10), args.name || null, args.ipAddress || null]
      );
      await client.query(
        `INSERT INTO inner_circle_keys (member_id, key_hash, key_suffix, status) VALUES ($1, $2, $3, 'active')`,
        [memberRes.rows[0].id, keyHash, keySuffix]
      );
      await client.query("COMMIT");
      return { key, keySuffix, createdAt: nowIso(), status: "active" };
    });
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const res = await this.withClient(c => c.query(
      `SELECT member_id, status, created_at, key_suffix FROM inner_circle_keys WHERE key_hash = $1`,
      [sha256Hex(key.trim())]
    ));
    const row = res.rows[0];
    if (!row || row.status === 'revoked') return { valid: false };
    return { valid: true, memberId: row.member_id, keySuffix: row.key_suffix };
  }

  async recordInnerCircleUnlock(key: string, ipAddress?: string): Promise<void> {
    await this.withClient(c => c.query(
      `UPDATE inner_circle_keys SET total_unlocks = total_unlocks + 1, last_used_at = NOW() WHERE key_hash = $1`,
      [sha256Hex(key.trim())]
    ));
  }

  async revokeInnerCircleKey(key: string): Promise<boolean> {
    const res = await this.withClient(c => c.query(
      `UPDATE inner_circle_keys SET status = 'revoked' WHERE key_hash = $1`,
      [sha256Hex(key.trim())]
    ));
    return (res.rowCount ?? 0) > 0;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const res = await this.withClient(c => c.query(
      `DELETE FROM inner_circle_members WHERE email_hash = $1`,
      [sha256Hex(normaliseEmail(email))]
    ));
    return (res.rowCount ?? 0) > 0;
  }

  async cleanupOldData() { return { deletedMembers: 0, deletedKeys: 0 }; }
  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
     return { totalMembers: 0, activeMembers: 0, totalKeys: 0, totalUnlocks: 0, dataRetentionDays: 365, estimatedMemoryBytes: 0, lastCleanup: nowIso() };
  }
  async exportInnerCircleAdminSummary() {
    const res = await this.withClient(c => c.query(`SELECT created_at, status, key_suffix, total_unlocks FROM inner_circle_keys`));
    return res.rows;
  }
}

// ---------------------------------------------------------------------------
// Store Selection Facade
// ---------------------------------------------------------------------------

let storeInstance: InnerCircleStore | null = null;

function getStore(): InnerCircleStore {
  if (storeInstance) return storeInstance;
  // If we are on Netlify/Production, use Postgres. Otherwise, Memory.
  const usePostgres = process.env.NODE_ENV === "production" || process.env.INNER_CIRCLE_STORE === "postgres";
  storeInstance = usePostgres ? new PostgresInnerCircleStore() : new MemoryInnerCircleStore();
  return storeInstance;
}

export const createOrUpdateMemberAndIssueKey = (args: CreateOrUpdateMemberArgs) => getStore().createOrUpdateMemberAndIssueKey(args);
export const verifyInnerCircleKey = (key: string) => getStore().verifyInnerCircleKey(key);
export const recordInnerCircleUnlock = (key: string, ip?: string) => getStore().recordInnerCircleUnlock(key, ip);
export const revokeInnerCircleKey = (key: string) => getStore().revokeInnerCircleKey(key);
export const deleteMemberByEmail = (email: string) => getStore().deleteMemberByEmail(email);
export const getPrivacySafeStats = () => getStore().getPrivacySafeStats();
export const exportInnerCircleAdminSummary = () => getStore().exportInnerCircleAdminSummary();
export const cleanupOldData = () => getStore().cleanupOldData();