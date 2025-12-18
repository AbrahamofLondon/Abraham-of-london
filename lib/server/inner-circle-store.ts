/* lib/server/inner-circle-store.ts */
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
}

export interface IssuedKey {
  key: string;
  keySuffix: string;
  createdAt: string;
  expiresAt: string;
  status: InnerCircleStatus;
  memberId: string;
}

// --- Configuration ---
const CONFIG = {
  DATA_RETENTION_DAYS: parseInt(process.env.INNER_CIRCLE_DATA_RETENTION_DAYS || '365', 10),
  KEY_EXPIRY_DAYS: parseInt(process.env.INNER_CIRCLE_KEY_EXPIRY_DAYS || '90', 10),
  STORAGE_DIR: path.join(process.cwd(), process.env.INNER_CIRCLE_STORAGE_DIR || '.data/inner-circle'),
};

// --- Helpers ---
const normaliseEmail = (email: string) => email.trim().toLowerCase();
const sha256Hex = (value: string) => crypto.createHash("sha256").update(value, "utf8").digest("hex");
const nowIso = () => new Date().toISOString();
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// --- Persistence ---
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
    const data = await Promise.all([
        loadFile(this.paths.members),
        loadFile(this.paths.keys),
        loadFile(this.paths.emailMap)
    ]);
    return {
      members: new Map(Object.entries(data[0])),
      keys: new Map(Object.entries(data[1])),
      emailMap: new Map(Object.entries(data[2])),
    };
  }
}

// --- Store ---
class EnhancedInnerCircleStore {
  private members = new Map<string, InnerCircleMember>();
  private keys = new Map<string, InnerCircleKey>();
  private emailToMember = new Map<string, string>();
  private storage = new FileStorage();
  private mutex = new Mutex();

  async initialize() {
    return this.mutex.runExclusive(async () => {
      const data = await this.storage.load();
      this.members = data.members as Map<string, InnerCircleMember>;
      this.keys = data.keys as Map<string, InnerCircleKey>;
      this.emailToMember = data.emailMap as Map<string, string>;
    });
  }

  private async persist() {
    await this.storage.save(this.members, this.keys, this.emailToMember);
  }

  async getMemberByEmail(email: string): Promise<InnerCircleMember | null> {
    const emailHash = sha256Hex(normaliseEmail(email));
    const memberId = this.emailToMember.get(emailHash);
    return memberId ? this.members.get(memberId) || null : null;
  }

  async getActiveKeysForMember(memberId: string): Promise<InnerCircleKey[]> {
    const member = this.members.get(memberId);
    if (!member) return [];
    const now = new Date();
    return member.keys
      .map(hash => this.keys.get(hash))
      .filter((k): k is InnerCircleKey => !!k && k.status === "active" && new Date(k.expiresAt) > now);
  }

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

      const raw = crypto.randomBytes(32).toString("base64url");
      const key = `icl_${raw.slice(0, 28)}`;
      const keyHash = sha256Hex(key);
      const expiresAt = addDays(new Date(), CONFIG.KEY_EXPIRY_DAYS).toISOString();
      
      const keyRecord: InnerCircleKey = { 
        keyHash, keySuffix: key.slice(-6), createdAt: nowIso(), 
        expiresAt, status: "active", totalUnlocks: 0, memberId 
      };

      this.keys.set(keyHash, keyRecord);
      this.members.get(memberId)!.keys.push(keyHash);
      await this.persist();
      return { key, keySuffix: keyRecord.keySuffix, createdAt: keyRecord.createdAt, expiresAt, status: "active", memberId };
    });
  }
}

let instance: EnhancedInnerCircleStore | null = null;
async function getStore() {
  if (!instance) { instance = new EnhancedInnerCircleStore(); await instance.initialize(); }
  return instance;
}

export const getMemberByEmail = async (email: string) => (await getStore()).getMemberByEmail(email);
export const getActiveKeysForMember = async (memberId: string) => (await getStore()).getActiveKeysForMember(memberId);
export const createOrUpdateMemberAndIssueKey = async (args: CreateOrUpdateMemberArgs) => (await getStore()).createOrUpdateMemberAndIssueKey(args);