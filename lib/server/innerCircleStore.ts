// lib/server/innerCircleStore.ts
// ---------------------------------------------------------------------------
// Server-only Inner Circle store with persistence and enhanced features
// ---------------------------------------------------------------------------

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";

// Types - extended with persistence support
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
  keys: string[]; // Array of key hashes
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

// Configuration
const CONFIG = {
  DATA_RETENTION_DAYS: 365,
  KEY_EXPIRY_DAYS: 90,
  BACKUP_INTERVAL_HOURS: 24,
  MAX_KEYS_PER_MEMBER: 5,
  STORAGE_DIR: path.join(process.cwd(), ".data", "inner-circle"),
  BACKUP_DIR: path.join(process.cwd(), ".data", "backups", "inner-circle"),
} as const;

// Helper functions
function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generateAccessKey(): {
  key: string;
  keyHash: string;
  keySuffix: string;
} {
  const raw = crypto.randomBytes(32).toString("base64url");
  const key = `icl_${raw.slice(0, 28)}`;
  const keyHash = sha256Hex(key);
  const keySuffix = key.slice(-6);
  return { key, keyHash, keySuffix };
}

function logPrivacyAction(
  action: string,
  metadata: Record<string, unknown> = {},
  level: "info" | "warn" | "error" = "info"
): void {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, action, ...metadata };
  
  switch (level) {
    case "error":
      console.error(`🔴 InnerCircle: ${action}`, logEntry);
      break;
    case "warn":
      console.warn(`🟡 InnerCircle: ${action}`, logEntry);
      break;
    default:
      console.log(`🔵 InnerCircle: ${action}`, logEntry);
  }
}

// Storage interface for persistence
interface StorageBackend {
  saveMembers(members: Map<string, InnerCircleMember>): Promise<void>;
  saveKeys(keys: Map<string, InnerCircleKey>): Promise<void>;
  saveEmailMap(emailMap: Map<string, string>): Promise<void>;
  loadMembers(): Promise<Map<string, InnerCircleMember>>;
  loadKeys(): Promise<Map<string, InnerCircleKey>>;
  loadEmailMap(): Promise<Map<string, string>>;
  backup(): Promise<void>;
  cleanup(): Promise<void>;
}

// File-based storage implementation
class FileStorage implements StorageBackend {
  private membersPath: string;
  private keysPath: string;
  private emailMapPath: string;

  constructor() {
    // Ensure storage directories exist
    if (!existsSync(CONFIG.STORAGE_DIR)) {
      mkdirSync(CONFIG.STORAGE_DIR, { recursive: true });
    }
    if (!existsSync(CONFIG.BACKUP_DIR)) {
      mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
    }

    this.membersPath = path.join(CONFIG.STORAGE_DIR, "members.json");
    this.keysPath = path.join(CONFIG.STORAGE_DIR, "keys.json");
    this.emailMapPath = path.join(CONFIG.STORAGE_DIR, "emailMap.json");
  }

  private async readJsonFile<T>(filePath: string): Promise<T> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {} as T;
      }
      throw error;
    }
  }

  private async writeJsonFile(filePath: string, data: any): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
    await fs.rename(tempPath, filePath);
  }

  async saveMembers(members: Map<string, InnerCircleMember>): Promise<void> {
    const data = Object.fromEntries(members);
    await this.writeJsonFile(this.membersPath, data);
  }

  async saveKeys(keys: Map<string, InnerCircleKey>): Promise<void> {
    const data = Object.fromEntries(keys);
    await this.writeJsonFile(this.keysPath, data);
  }

  async saveEmailMap(emailMap: Map<string, string>): Promise<void> {
    const data = Object.fromEntries(emailMap);
    await this.writeJsonFile(this.emailMapPath, data);
  }

  async loadMembers(): Promise<Map<string, InnerCircleMember>> {
    const data = await this.readJsonFile<Record<string, InnerCircleMember>>(this.membersPath);
    return new Map(Object.entries(data));
  }

  async loadKeys(): Promise<Map<string, InnerCircleKey>> {
    const data = await this.readJsonFile<Record<string, InnerCircleKey>>(this.keysPath);
    return new Map(Object.entries(data));
  }

  async loadEmailMap(): Promise<Map<string, string>> {
    const data = await this.readJsonFile<Record<string, string>>(this.emailMapPath);
    return new Map(Object.entries(data));
  }

  async backup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(CONFIG.BACKUP_DIR, timestamp);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    const files = [this.membersPath, this.keysPath, this.emailMapPath];
    for (const file of files) {
      if (existsSync(file)) {
        const backupFile = path.join(backupDir, path.basename(file));
        await fs.copyFile(file, backupFile);
      }
    }
    
    logPrivacyAction("backup_created", { backupDir, files: files.length });
  }

  async cleanup(): Promise<void> {
    // Keep only last 7 days of backups
    try {
      const backups = await fs.readdir(CONFIG.BACKUP_DIR);
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      for (const backup of backups) {
        const backupPath = path.join(CONFIG.BACKUP_DIR, backup);
        const stat = await fs.stat(backupPath);
        
        if (stat.mtimeMs < cutoff) {
          await fs.rm(backupPath, { recursive: true });
          logPrivacyAction("old_backup_removed", { backupPath });
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Enhanced Inner Circle store with persistence
class EnhancedInnerCircleStore {
  private members: Map<string, InnerCircleMember> = new Map();
  private keys: Map<string, InnerCircleKey> = new Map();
  private emailToMember: Map<string, string> = new Map();
  private storage: StorageBackend;
  private lastCleanup = nowIso();
  private lastBackup?: string;
  private cleanupInterval?: NodeJS.Timeout;
  private backupInterval?: NodeJS.Timeout;

  constructor(storageBackend?: StorageBackend) {
    this.storage = storageBackend || new FileStorage();
    this.startBackgroundJobs();
  }

  private startBackgroundJobs(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupOldData();
    }, 60 * 60 * 1000);

    // Run backup every 24 hours
    this.backupInterval = setInterval(async () => {
      await this.storage.backup();
      this.lastBackup = nowIso();
    }, CONFIG.BACKUP_INTERVAL_HOURS * 60 * 60 * 1000);
  }

  async initialize(): Promise<void> {
    try {
      this.members = await this.storage.loadMembers();
      this.keys = await this.storage.loadKeys();
      this.emailToMember = await this.storage.loadEmailMap();
      
      logPrivacyAction("store_initialized", {
        members: this.members.size,
        keys: this.keys.size,
        emailMappings: this.emailToMember.size,
      });
    } catch (error) {
      logPrivacyAction("store_initialization_failed", { error }, "error");
      // Continue with empty store if loading fails
    }
  }

  private async persist(): Promise<void> {
    try {
      await Promise.all([
        this.storage.saveMembers(this.members),
        this.storage.saveKeys(this.keys),
        this.storage.saveEmailMap(this.emailToMember),
      ]);
    } catch (error) {
      logPrivacyAction("persistence_failed", { error }, "error");
    }
  }

  private validateMemberKeys(memberId: string): void {
    const member = this.members.get(memberId);
    if (!member) return;

    const activeKeys = member.keys.filter(keyHash => {
      const key = this.keys.get(keyHash);
      return key && key.status === "active" && new Date(key.expiresAt) > new Date();
    });

    // If member has too many active keys, revoke the oldest
    while (activeKeys.length > CONFIG.MAX_KEYS_PER_MEMBER) {
      const oldestKeyHash = activeKeys.sort((a, b) => {
        const keyA = this.keys.get(a);
        const keyB = this.keys.get(b);
        return new Date(keyA?.createdAt || 0).getTime() - 
               new Date(keyB?.createdAt || 0).getTime();
      })[0];

      this.revokeKeyByHash(oldestKeyHash, "system", "exceeded_key_limit");
      activeKeys.shift();
    }
  }

  private revokeKeyByHash(
    keyHash: string, 
    revokedBy: string = "system", 
    reason: string = "auto_revoke"
  ): boolean {
    const key = this.keys.get(keyHash);
    if (!key || key.status === "revoked") return false;

    key.status = "revoked";
    key.revokedAt = nowIso();
    key.revokedBy = revokedBy;
    key.revokedReason = reason;

    logPrivacyAction("key_revoked_by_hash", {
      keySuffix: key.keySuffix,
      memberId: key.memberId,
      revokedBy,
      reason,
    });

    return true;
  }

  async createOrUpdateMemberAndIssueKey(
    args: CreateOrUpdateMemberArgs
  ): Promise<IssuedKey> {
    const emailNormalised = normaliseEmail(args.email);
    const emailHash = sha256Hex(emailNormalised);
    const emailHashPrefix = emailHash.slice(0, 10);
    const now = nowIso();
    const expiresAt = addDays(new Date(), CONFIG.KEY_EXPIRY_DAYS).toISOString();
    const { key, keyHash, keySuffix } = generateAccessKey();

    let memberId = this.emailToMember.get(emailHash);
    const isNewMember = !memberId;

    if (!memberId) {
      memberId = crypto.randomUUID();
      const member: InnerCircleMember = {
        id: memberId,
        emailHash,
        emailHashPrefix,
        name: args.name?.trim() || undefined,
        createdAt: now,
        lastSeenAt: now,
        lastIp: args.ipAddress,
        status: "active",
        totalUnlocks: 0,
        keys: [keyHash],
        metadata: args.metadata,
        context: args.context,
      };
      
      this.members.set(memberId, member);
      this.emailToMember.set(emailHash, memberId);
    } else {
      const member = this.members.get(memberId);
      if (member) {
        member.lastSeenAt = now;
        if (args.name && args.name.trim()) member.name = args.name.trim();
        if (args.ipAddress) member.lastIp = args.ipAddress;
        if (args.metadata) member.metadata = { ...member.metadata, ...args.metadata };
        if (args.context) member.context = args.context;
        
        member.keys.push(keyHash);
        this.validateMemberKeys(memberId);
      }
    }

    const keyRecord: InnerCircleKey = {
      keyHash,
      keySuffix,
      createdAt: now,
      expiresAt,
      status: "active",
      totalUnlocks: 0,
      memberId,
    };

    this.keys.set(keyHash, keyRecord);

    await this.persist();

    logPrivacyAction("key_issued", {
      memberId,
      emailHashPrefix,
      keySuffix,
      isNewMember,
      expiresAt,
    });

    return {
      key,
      keySuffix,
      createdAt: now,
      expiresAt,
      status: "active",
      memberId,
    };
  }

  async verifyInnerCircleKey(key: string): Promise<VerifyInnerCircleKeyResult> {
    const safeKey = key.trim();
    if (!safeKey) return { valid: false, reason: "missing_key" };

    const keyHash = sha256Hex(safeKey);
    const keyRecord = this.keys.get(keyHash);

    if (!keyRecord) return { valid: false, reason: "key_not_found" };
    
    const now = new Date();
    const expiresAt = new Date(keyRecord.expiresAt);
    
    // Check status
    if (keyRecord.status === "revoked") {
      return { 
        valid: false, 
        reason: "key_revoked",
        memberId: keyRecord.memberId,
        keySuffix: keyRecord.keySuffix,
        createdAt: keyRecord.createdAt,
        expiresAt: keyRecord.expiresAt,
        status: keyRecord.status,
      };
    }
    
    // Check expiration
    if (now > expiresAt) {
      // Auto-mark as expired
      keyRecord.status = "expired";
      await this.persist();
      
      return { 
        valid: false, 
        reason: "key_expired",
        memberId: keyRecord.memberId,
        keySuffix: keyRecord.keySuffix,
        createdAt: keyRecord.createdAt,
        expiresAt: keyRecord.expiresAt,
        status: "expired",
      };
    }

    const member = this.members.get(keyRecord.memberId);
    
    return {
      valid: true,
      memberId: keyRecord.memberId,
      keySuffix: keyRecord.keySuffix,
      createdAt: keyRecord.createdAt,
      expiresAt: keyRecord.expiresAt,
      status: keyRecord.status,
      metadata: member?.metadata,
    };
  }

  async recordInnerCircleUnlock(
    key: string,
    ipAddress?: string,
    unlockContext?: Record<string, any>
  ): Promise<VerifyInnerCircleKeyResult> {
    const verification = await this.verifyInnerCircleKey(key);
    
    if (!verification.valid || !verification.memberId) {
      return verification;
    }

    const keyHash = sha256Hex(key.trim());
    const keyRecord = this.keys.get(keyHash);
    const member = this.members.get(verification.memberId);

    if (keyRecord && member) {
      keyRecord.totalUnlocks += 1;
      keyRecord.lastUsedAt = nowIso();
      
      member.totalUnlocks += 1;
      member.lastSeenAt = keyRecord.lastUsedAt;
      if (ipAddress) member.lastIp = ipAddress;
      
      // Store unlock context in metadata
      if (unlockContext) {
        member.metadata = {
          ...member.metadata,
          lastUnlockContext: unlockContext,
          lastUnlockAt: keyRecord.lastUsedAt,
        };
      }

      await this.persist();

      logPrivacyAction("key_unlocked", {
        memberId: verification.memberId,
        keySuffix: verification.keySuffix,
        totalUnlocks: keyRecord.totalUnlocks,
        ipAddress,
      });
    }

    return verification;
  }

  async revokeInnerCircleKey(
    key: string, 
    revokedBy: string = "admin", 
    reason: string = "manual_revocation"
  ): Promise<boolean> {
    const safeKey = key.trim();
    if (!safeKey) return false;

    const keyHash = sha256Hex(safeKey);
    const keyRecord = this.keys.get(keyHash);

    if (!keyRecord || keyRecord.status === "revoked") return false;

    keyRecord.status = "revoked";
    keyRecord.revokedAt = nowIso();
    keyRecord.revokedBy = revokedBy;
    keyRecord.revokedReason = reason;

    await this.persist();

    logPrivacyAction("key_revoked", {
      memberId: keyRecord.memberId,
      keySuffix: keyRecord.keySuffix,
      revokedBy,
      reason,
    });

    return true;
  }

  async revokeAllMemberKeys(
    email: string, 
    revokedBy: string = "admin", 
    reason: string = "member_deletion"
  ): Promise<number> {
    const emailNormalised = normaliseEmail(email);
    const emailHash = sha256Hex(emailNormalised);
    const memberId = this.emailToMember.get(emailHash);

    if (!memberId) return 0;

    const member = this.members.get(memberId);
    if (!member) return 0;

    let revokedCount = 0;
    for (const keyHash of member.keys) {
      if (this.revokeKeyByHash(keyHash, revokedBy, reason)) {
        revokedCount++;
      }
    }

    await this.persist();

    logPrivacyAction("all_member_keys_revoked", {
      memberId,
      emailHashPrefix: member.emailHashPrefix,
      revokedCount,
      revokedBy,
      reason,
    });

    return revokedCount;
  }

  async deleteMemberByEmail(email: string): Promise<boolean> {
    const emailNormalised = normaliseEmail(email);
    const emailHash = sha256Hex(emailNormalised);
    const memberId = this.emailToMember.get(emailHash);

    if (!memberId) return false;

    // First revoke all keys
    await this.revokeAllMemberKeys(email, "system", "member_deletion");

    // Remove from mappings
    this.emailToMember.delete(emailHash);
    this.members.delete(memberId);

    await this.persist();

    logPrivacyAction("member_deleted", {
      memberId,
      emailHash: emailHash.slice(0, 10) + "...",
    });

    return true;
  }

  async cleanupOldData(): Promise<{
    deletedMembers: number;
    deletedKeys: number;
    expiredKeys: number;
  }> {
    const cutoff = Date.now() - CONFIG.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedMembers = 0;
    let deletedKeys = 0;
    let expiredKeys = 0;

    // Clean up expired keys
    for (const [keyHash, keyRecord] of this.keys.entries()) {
      const expiresAt = new Date(keyRecord.expiresAt).getTime();
      if (expiresAt < Date.now() && keyRecord.status === "active") {
        keyRecord.status = "expired";
        expiredKeys++;
      }
      
      const lastUsed = keyRecord.lastUsedAt 
        ? new Date(keyRecord.lastUsedAt).getTime() 
        : new Date(keyRecord.createdAt).getTime();
        
      if (lastUsed < cutoff) {
        this.keys.delete(keyHash);
        deletedKeys++;
      }
    }

    // Clean up inactive members
    for (const [memberId, member] of this.members.entries()) {
      const lastSeen = new Date(member.lastSeenAt).getTime();
      if (lastSeen < cutoff) {
        // Remove from email mapping
        this.emailToMember.delete(member.emailHash);
        this.members.delete(memberId);
        deletedMembers++;
      }
    }

    this.lastCleanup = nowIso();

    if (deletedMembers > 0 || deletedKeys > 0 || expiredKeys > 0) {
      await this.persist();
      logPrivacyAction("cleanup_completed", {
        deletedMembers,
        deletedKeys,
        expiredKeys,
      });
    }

    // Run storage cleanup
    await this.storage.cleanup();

    return { deletedMembers, deletedKeys, expiredKeys };
  }

  async getPrivacySafeStats(): Promise<PrivacySafeStats> {
    const totalMembers = this.members.size;
    const totalKeys = this.keys.size;

    let activeMembers = 0;
    let pendingMembers = 0;
    let revokedMembers = 0;
    let activeKeys = 0;
    let expiredKeys = 0;
    let revokedKeys = 0;
    let totalUnlocks = 0;

    const now = new Date();

    for (const member of this.members.values()) {
      switch (member.status) {
        case "active":
          activeMembers++;
          break;
        case "pending":
          pendingMembers++;
          break;
        case "revoked":
          revokedMembers++;
          break;
      }
      totalUnlocks += member.totalUnlocks;
    }

    for (const key of this.keys.values()) {
      switch (key.status) {
        case "active":
          if (new Date(key.expiresAt) > now) {
            activeKeys++;
          } else {
            expiredKeys++;
          }
          break;
        case "expired":
          expiredKeys++;
          break;
        case "revoked":
          revokedKeys++;
          break;
      }
    }

    const avgUnlocksPerKey = totalKeys > 0 ? totalUnlocks / totalKeys : 0;

    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      revokedMembers,
      totalKeys,
      activeKeys,
      expiredKeys,
      revokedKeys,
      totalUnlocks,
      avgUnlocksPerKey,
      dataRetentionDays: CONFIG.DATA_RETENTION_DAYS,
      estimatedMemoryBytes: totalMembers * 1024 + totalKeys * 256,
      lastCleanup: this.lastCleanup,
      lastBackup: this.lastBackup,
      storagePath: CONFIG.STORAGE_DIR,
    };
  }

  async exportInnerCircleAdminSummary(): Promise<InnerCircleAdminExportRow[]> {
    const rows: InnerCircleAdminExportRow[] = [];

    for (const keyRecord of this.keys.values()) {
      const member = this.members.get(keyRecord.memberId);
      if (member) {
        rows.push({
          created_at: keyRecord.createdAt,
          status: keyRecord.status,
          key_suffix: keyRecord.keySuffix,
          email_hash_prefix: member.emailHashPrefix,
          total_unlocks: keyRecord.totalUnlocks,
          last_used_at: keyRecord.lastUsedAt,
          expires_at: keyRecord.expiresAt,
        });
      }
    }

    // Sort by creation date, newest first
    rows.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return rows;
  }

  async getMemberByEmail(email: string): Promise<InnerCircleMember | null> {
    const emailNormalised = normaliseEmail(email);
    const emailHash = sha256Hex(emailNormalised);
    const memberId = this.emailToMember.get(emailHash);
    
    if (!memberId) return null;
    
    return this.members.get(memberId) || null;
  }

  async getMemberKeys(memberId: string): Promise<InnerCircleKey[]> {
    const member = this.members.get(memberId);
    if (!member) return [];

    return member.keys
      .map(keyHash => this.keys.get(keyHash))
      .filter((key): key is InnerCircleKey => key !== undefined);
  }

  async updateMemberMetadata(
    memberId: string, 
    metadata: Record<string, any>
  ): Promise<boolean> {
    const member = this.members.get(memberId);
    if (!member) return false;

    member.metadata = { ...member.metadata, ...metadata };
    await this.persist();
    
    return true;
  }

  async searchMembers(
    query: string,
    options?: {
      status?: InnerCircleStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<InnerCircleMember[]> {
    const searchTerm = query.toLowerCase().trim();
    let results: InnerCircleMember[] = [];

    for (const member of this.members.values()) {
      // Filter by status if specified
      if (options?.status && member.status !== options.status) {
        continue;
      }

      // Search in name and email hash prefix
      const matches = 
        (member.name?.toLowerCase().includes(searchTerm)) ||
        (member.emailHashPrefix.includes(searchTerm)) ||
        (member.context?.toLowerCase().includes(searchTerm));

      if (matches) {
        results.push(member);
      }
    }

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || results.length;
    
    return results.slice(offset, offset + limit);
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    
    await this.persist();
    logPrivacyAction("store_shutdown");
  }
}

// Create and export singleton instance
let storeInstance: EnhancedInnerCircleStore | null = null;

export async function getInnerCircleStore(): Promise<EnhancedInnerCircleStore> {
  if (!storeInstance) {
    storeInstance = new EnhancedInnerCircleStore();
    await storeInstance.initialize();
  }
  return storeInstance;
}

// Export individual functions for API routes
export async function createOrUpdateMemberAndIssueKey(
  args: CreateOrUpdateMemberArgs
): Promise<IssuedKey> {
  const store = await getInnerCircleStore();
  return store.createOrUpdateMemberAndIssueKey(args);
}

export async function verifyInnerCircleKey(
  key: string
): Promise<VerifyInnerCircleKeyResult> {
  const store = await getInnerCircleStore();
  return store.verifyInnerCircleKey(key);
}

export async function recordInnerCircleUnlock(
  key: string,
  ipAddress?: string,
  unlockContext?: Record<string, any>
): Promise<VerifyInnerCircleKeyResult> {
  const store = await getInnerCircleStore();
  return store.recordInnerCircleUnlock(key, ipAddress, unlockContext);
}

export async function revokeInnerCircleKey(
  key: string,
  revokedBy?: string,
  reason?: string
): Promise<boolean> {
  const store = await getInnerCircleStore();
  return store.revokeInnerCircleKey(key, revokedBy, reason);
}

export async function deleteMemberByEmail(email: string): Promise<boolean> {
  const store = await getInnerCircleStore();
  return store.deleteMemberByEmail(email);
}

export async function cleanupOldData(): Promise<{
  deletedMembers: number;
  deletedKeys: number;
  expiredKeys: number;
}> {
  const store = await getInnerCircleStore();
  return store.cleanupOldData();
}

export async function getPrivacySafeStats(): Promise<PrivacySafeStats> {
  const store = await getInnerCircleStore();
  return store.getPrivacySafeStats();
}

export async function exportInnerCircleAdminSummary(): Promise<
  InnerCircleAdminExportRow[]
> {
  const store = await getInnerCircleStore();
  return store.exportInnerCircleAdminSummary();
}

export async function getMemberByEmail(email: string): Promise<InnerCircleMember | null> {
  const store = await getInnerCircleStore();
  return store.getMemberByEmail(email);
}

export async function searchMembers(
  query: string,
  options?: {
    status?: InnerCircleStatus;
    limit?: number;
    offset?: number;
  }
): Promise<InnerCircleMember[]> {
  const store = await getInnerCircleStore();
  return store.searchMembers(query, options);
}

export async function shutdownInnerCircleStore(): Promise<void> {
  if (storeInstance) {
    await storeInstance.shutdown();
    storeInstance = null;
  }
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await shutdownInnerCircleStore();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownInnerCircleStore();
  process.exit(0);
});