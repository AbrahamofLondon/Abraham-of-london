// lib/server/inner-circle-store.ts
// ---------------------------------------------------------------------------
// Server-only Inner Circle store with persistence and enhanced features
// ---------------------------------------------------------------------------

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { Mutex } from 'async-mutex';

// --- Types ---
export type InnerCircleStatus = "pending" | "active" | "revoked" | "expired";

export interface CreateOrUpdateMemberArgs {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string;
  metadata?: Record<string, any>;
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
  createdAt?: string;
  expiresAt?: string;
  status?: InnerCircleStatus;
  metadata?: Record<string, any>;
}

export interface InnerCircleAdminExportRow {
  created_at: string;
  status: InnerCircleStatus;
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
  last_used_at?: string;
  expires_at: string;
}

export interface PrivacySafeStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  revokedMembers: number;
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  revokedKeys: number;
  totalUnlocks: number;
  avgUnlocksPerKey: number;
  dataRetentionDays: number;
  estimatedMemoryBytes: number;
  lastCleanup: string;
  lastBackup?: string;
  storagePath?: string;
}

export interface InnerCircleMember {
  id: string;
  emailHash: string;
  emailHashPrefix: string;
  name?: string;
  createdAt: string;
  lastSeenAt: string;
  lastIp?: string;
  status: InnerCircleStatus;
  totalUnlocks: number;
  keys: string[]; 
  metadata?: Record<string, any>;
  context?: string;
}

export interface InnerCircleKey {
  keyHash: string;
  keySuffix: string;
  createdAt: string;
  expiresAt: string;
  status: InnerCircleStatus;
  totalUnlocks: number;
  lastUsedAt?: string;
  memberId: string;
  revokedAt?: string;
  revokedBy?: string;
  revokedReason?: string;
}

// --- Configuration ---
const CONFIG = {
  DATA_RETENTION_DAYS: parseInt(process.env.INNER_CIRCLE_DATA_RETENTION_DAYS || '365', 10),
  KEY_EXPIRY_DAYS: parseInt(process.env.INNER_CIRCLE_KEY_EXPIRY_DAYS || '90', 10),
  STORAGE_DIR: path.join(process.cwd(), process.env.INNER_CIRCLE_STORAGE_DIR || '.data/inner-circle'),
} as const;

// --- Helpers ---
const normaliseEmail = (email: string) => email.trim().toLowerCase();
const sha256Hex = (value: string) => crypto.createHash("sha256").update(value, "utf8").digest("hex");
const nowIso = () => new Date().toISOString();
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

function generateAccessKey() {
  const raw = crypto.randomBytes(32).toString("base64url");
  const key = `icl_${raw.slice(0, 28)}`;
  return { key, keyHash: sha256Hex(key), keySuffix: key.slice(-6) };
}

// --- Persistence Layer ---
class FileStorage {
  private paths = {
    members: path.join(CONFIG.STORAGE_DIR, "members.json"),
    keys: path.join(CONFIG.STORAGE_DIR, "keys.json"),
    emailMap: path.join(CONFIG.STORAGE_DIR, "emailMap.json"),
  };

  constructor() {
    if (!existsSync(CONFIG.STORAGE_DIR)) mkdirSync(CONFIG.STORAGE_DIR, { recursive: true });
  }

  async save(members: Map<string, any>, keys: Map<string, any>, emailMap: Map<string, any>) {
    await fs.writeFile(this.paths.members, JSON.stringify(Object.fromEntries(members), null, 2));
    await fs.writeFile(this.paths.keys, JSON.stringify(Object.fromEntries(keys), null, 2));
    await fs.writeFile(this.paths.emailMap, JSON.stringify(Object.fromEntries(emailMap), null, 2));
  }

  async load() {
    const loadFile = async (p: string) => {
      try { return JSON.parse(await fs.readFile(p, "utf-8")); }
      catch { return {}; }
    };
    return {
      members: new Map(Object.entries(await loadFile(this.paths.members))),
      keys: new Map(Object.entries(await loadFile(this.paths.keys))),
      emailMap: new Map(Object.entries(await loadFile(this.paths.emailMap))),
    };
  }
}

// --- Main Store Class ---
class EnhancedInnerCircleStore {
  private members = new Map<string, InnerCircleMember>();
  private keys = new Map<string, InnerCircleKey>();
  private emailToMember = new Map<string, string>();
  private storage = new FileStorage();
  private mutex = new Mutex();
  private lastCleanup = nowIso();

  async initialize() {
    return this.mutex.runExclusive(async () => {
      const data = await this.storage.load();
      this.members = data.members;
      this.keys = data.keys;
      this.emailToMember = data.emailMap;
    });
  }

  private async persist() {
    await this.storage.save(this.members, this.keys, this.emailToMember);
  }

  // Surgical Deletion logic for Identity Termination
  async deleteMemberByEmail(email: string): Promise<boolean> {
    return this.mutex.runExclusive(async () => {
      const emailHash = sha256Hex(normaliseEmail(email));
      const memberId = this.emailToMember.get(emailHash);
      if (!memberId) return false;

      const member = this.members.get(memberId);
      if (member) {
        // Remove all associated keys first
        member.keys.forEach(kHash => this.keys.delete(kHash));
      }

      this.members.delete(memberId);
      this.emailToMember.delete(emailHash);
      await this.persist();
      return true;
    });
  }

  // Hygiene logic for Maintenance Engine
  async cleanupOldData() {
    return this.mutex.runExclusive(async () => {
      const cutoff = Date.now() - (CONFIG.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      let deletedMembers = 0;
      let deletedKeys = 0;

      for (const [id, member] of this.members.entries()) {
        if (new Date(member.createdAt).getTime() < cutoff) {
          member.keys.forEach(kHash => {
            this.keys.delete(kHash);
            deletedKeys++;
          });
          this.emailToMember.delete(member.emailHash);
          this.members.delete(id);
          deletedMembers++;
        }
      }

      this.lastCleanup = nowIso();
      await this.persist();
      return { deletedMembers, deletedKeys };
    });
  }

  // Intelligence logic for Telemetry
  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
    const membersArray = Array.from(this.members.values());
    const keysArray = Array.from(this.keys.values());
    const totalUnlocks = membersArray.reduce((acc, m) => acc + (m.totalUnlocks || 0), 0);

    return {
      totalMembers: this.members.size,
      activeMembers: membersArray.filter(m => m.status === "active").length,
      pendingMembers: membersArray.filter(m => m.status === "pending").length,
      revokedMembers: membersArray.filter(m => m.status === "revoked").length,
      totalKeys: this.keys.size,
      activeKeys: keysArray.filter(k => k.status === "active").length,
      expiredKeys: keysArray.filter(k => k.status === "expired").length,
      revokedKeys: keysArray.filter(k => k.status === "revoked").length,
      totalUnlocks,
      avgUnlocksPerKey: keysArray.length > 0 ? totalUnlocks / keysArray.length : 0,
      dataRetentionDays: CONFIG.DATA_RETENTION_DAYS,
      estimatedMemoryBytes: (this.members.size * 500) + (this.keys.size * 200),
      lastCleanup: this.lastCleanup,
      storagePath: CONFIG.STORAGE_DIR
    };
  }

  async getPrivacySafeKeyExport(): Promise<InnerCircleAdminExportRow[]> {
    return Array.from(this.keys.values()).map(k => {
      const m = this.members.get(k.memberId);
      return {
        created_at: k.createdAt,
        status: k.status,
        key_suffix: k.keySuffix,
        email_hash_prefix: m?.emailHashPrefix || "unknown",
        total_unlocks: k.totalUnlocks,
        last_used_at: k.lastUsedAt,
        expires_at: k.expiresAt
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Standard Logic
  async createOrUpdateMemberAndIssueKey(args: CreateOrUpdateMemberArgs): Promise<IssuedKey> {
    return this.mutex.runExclusive(async () => {
      const emailHash = sha256Hex(normaliseEmail(args.email));
      let memberId = this.emailToMember.get(emailHash);

      if (!memberId) {
        memberId = crypto.randomUUID();
        this.members.set(memberId, {
          id: memberId, emailHash, emailHashPrefix: emailHash.slice(0, 10),
          name: args.name, createdAt: nowIso(), lastSeenAt: nowIso(),
          status: "active", totalUnlocks: 0, keys: []
        });
        this.emailToMember.set(emailHash, memberId);
      }

      const { key, keyHash, keySuffix } = generateAccessKey();
      const expiresAt = addDays(new Date(), CONFIG.KEY_EXPIRY_DAYS).toISOString();
      const keyRecord: InnerCircleKey = { keyHash, keySuffix, createdAt: nowIso(), expiresAt, status: "active", totalUnlocks: 0, memberId };

      this.keys.set(keyHash, keyRecord);
      this.members.get(memberId)!.keys.push(keyHash);
      await this.persist();
      return { key, keySuffix, createdAt: keyRecord.createdAt, expiresAt, status: "active", memberId };
    });
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const hash = sha256Hex(key.trim());
    const k = this.keys.get(hash);
    if (!k || k.status !== "active" || new Date() > new Date(k.expiresAt)) return { valid: false };
    return { valid: true, memberId: k.memberId, keySuffix: k.keySuffix };
  }

  async revokeInnerCircleKey(key: string): Promise<boolean> {
    return this.mutex.runExclusive(async () => {
      const hash = sha256Hex(key.trim());
      const k = this.keys.get(hash);
      if (!k) return false;
      k.status = "revoked";
      await this.persist();
      return true;
    });
  }
}

// --- Singleton Interface ---
let instance: EnhancedInnerCircleStore | null = null;
async function getStore() {
  if (!instance) { instance = new EnhancedInnerCircleStore(); await instance.initialize(); }
  return instance;
}

export const createOrUpdateMemberAndIssueKey = async (args: CreateOrUpdateMemberArgs) => (await getStore()).createOrUpdateMemberAndIssueKey(args);
export const verifyInnerCircleKey = async (key: string) => (await getStore()).verifyInnerCircleKey(key);
export const revokeInnerCircleKey = async (key: string) => (await getStore()).revokeInnerCircleKey(key);
export const deleteMemberByEmail = async (email: string) => (await getStore()).deleteMemberByEmail(email);
export const cleanupOldData = async () => (await getStore()).cleanupOldData();
export const getPrivacySafeStats = async () => (await getStore()).getPrivacySafeStats();
export const getPrivacySafeKeyExport = async () => (await getStore()).getPrivacySafeKeyExport();