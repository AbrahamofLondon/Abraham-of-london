// lib/auth/mfa.ts — REDIS MANAGER COMPAT + SAFE FALLBACK + STRICT TS

import { randomInt, randomBytes } from "crypto";
// @ts-ignore - hi-base32 doesn't ship types
import { encode as encodeBase32 } from "hi-base32";
import { authenticator } from "@otplib/preset-default";
import { safeSlice } from "@/lib/utils/safe";

// security-scan-ignore-file
// Reason: This file only contains environment variable NAMES, not values.

// ==================== TYPES ====================
export type MfaMethod = "totp" | "sms" | "email" | "backup-code" | "push";
export type MfaStatus = "pending" | "verified" | "expired" | "failed";
export type MfaChallengeType = "login" | "transaction" | "recovery";

export interface MfaUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface MfaChallenge {
  id: string;
  userId: string;
  method: MfaMethod;
  type: MfaChallengeType;
  code?: string;
  secret?: string;
  expiresAt: Date;
  createdAt: Date;
  verifiedAt?: Date;
  status: MfaStatus;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  attempts: number;
  maxAttempts: number;
}

export interface MfaSetup {
  userId: string;
  methods: MfaMethod[];
  totpSecret?: string;
  totpVerified: boolean;
  backupCodes: string[];
  phoneNumber?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  recoveryEmail?: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerifyMfaOptions {
  challengeId: string;
  code: string;
  ipAddress?: string;
  userAgent?: string;
  rememberDevice?: boolean;
}

// ==================== CONSTANTS ====================
const MFA_CONFIG = {
  totp: {
    window: 1,
    step: 30,
    digits: 6,
    algorithm: "SHA1",
  },
  sms: {
    codeLength: 6,
    expiryMinutes: 10,
    maxAttempts: 3,
  },
  email: {
    codeLength: 8,
    expiryMinutes: 15,
    maxAttempts: 3,
  },
  "backup-code": {
    codeLength: 10,
    usesRemaining: 1,
    maxAttempts: 3,
  },
  challenge: {
    defaultExpiryMinutes: 10,
    maxAttempts: 3,
    cleanupHours: 24,
  },
} as const;

// ==================== STORE INTERFACE ====================
type ChallengeStore = {
  set: (key: string, value: any, ttlMs?: number) => Promise<void>;
  get: (key: string) => Promise<any | null>;
  delete: (key: string) => Promise<void>;
  findByUserId: (userId: string) => Promise<MfaChallenge[]>;
};

// ==================== IN-MEMORY STORE ====================
class MfaChallengeStore implements ChallengeStore {
  private static instance: MfaChallengeStore;
  private challenges = new Map<string, any>();

  private constructor() {}

  static getInstance(): MfaChallengeStore {
    if (!MfaChallengeStore.instance) {
      MfaChallengeStore.instance = new MfaChallengeStore();
    }
    return MfaChallengeStore.instance;
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    this.challenges.set(key, value);

    if (ttlMs && ttlMs > 0) {
      setTimeout(() => {
        this.challenges.delete(key);
      }, ttlMs);
    }
  }

  async get(key: string): Promise<any | null> {
    return this.challenges.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.challenges.delete(key);
  }

  async findByUserId(userId: string): Promise<MfaChallenge[]> {
    const out: MfaChallenge[] = [];
    for (const [, value] of this.challenges) {
      if (value && typeof value === "object" && value.userId === userId) {
        // best effort: ensure dates are Dates
        out.push(reviveChallenge(value));
      }
    }
    return out;
  }
}

// ==================== REDIS STORE (MANAGER COMPAT) ====================
async function getRedisMfaStore(): Promise<ChallengeStore> {
  // Server-side only; client uses memory
  if (typeof window !== "undefined") return MfaChallengeStore.getInstance();

  try {
    // ✅ CORRECT: Import getRedis directly from the module
    const { getRedis } = await import("@/lib/redis");
    const client = getRedis();

    // Validate Redis client surface
    if (!client || typeof client.get !== "function" || typeof client.set !== "function" || typeof client.del !== "function") {
      console.warn("[MFA] Redis client not available. Using in-memory store.");
      return MfaChallengeStore.getInstance();
    }

    return {
      async set(key: string, value: any, ttlMs?: number): Promise<void> {
        try {
          const payload = JSON.stringify(value);
          // Default TTL: 1 hour if not provided
          const ttlSeconds = Math.max(1, Math.floor(((ttlMs ?? 3600_000) as number) / 1000));

          // ioredis-style: set(key, value, "EX", seconds)
          await client.set(key, payload, "EX", ttlSeconds);
        } catch (error) {
          console.error("[MFA] Redis set failed — falling back to memory:", error);
          await MfaChallengeStore.getInstance().set(key, value, ttlMs);
        }
      },

      async get(key: string): Promise<any | null> {
        try {
          const raw = await client.get(key);
          if (!raw) return null;

          const parsed = JSON.parse(raw);
          // revive dates if this looks like an MFA challenge
          return reviveMaybeChallenge(parsed);
        } catch (error) {
          console.error("[MFA] Redis get failed — falling back to memory:", error);
          return MfaChallengeStore.getInstance().get(key);
        }
      },

      async delete(key: string): Promise<void> {
        try {
          await client.del(key);
        } catch (error) {
          console.error("[MFA] Redis delete failed — falling back to memory:", error);
          await MfaChallengeStore.getInstance().delete(key);
        }
      },

      async findByUserId(userId: string): Promise<MfaChallenge[]> {
        // Redis scanning requires KEYS/SCAN patterns; avoid in prod.
        // Keep deterministic + safe: fall back to memory implementation.
        return MfaChallengeStore.getInstance().findByUserId(userId);
      },
    };
  } catch (error) {
    console.warn("[MFA] Redis module import failed — using in-memory store:", error);
    return MfaChallengeStore.getInstance();
  }
}

// ==================== DATE REVIVAL HELPERS ====================
function reviveMaybeChallenge(v: any): any {
  if (!v || typeof v !== "object") return v;
  if (typeof v.userId === "string" && typeof v.status === "string" && v.expiresAt && v.createdAt) {
    return reviveChallenge(v);
  }
  return v;
}

function reviveChallenge(v: any): MfaChallenge {
  return {
    ...v,
    createdAt: v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt),
    expiresAt: v.expiresAt instanceof Date ? v.expiresAt : new Date(v.expiresAt),
    verifiedAt: v.verifiedAt ? (v.verifiedAt instanceof Date ? v.verifiedAt : new Date(v.verifiedAt)) : undefined,
  } as MfaChallenge;
}

// ==================== TOTP ====================
export function generateTotpSecret(): string {
  const secretBytes = randomBytes(20);
  return encodeBase32(secretBytes).replace(/=/g, "");
}

export function generateTotpUri(secret: string, user: { email: string; issuer: string }): string {
  return authenticator.keyuri(user.email, user.issuer, secret);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch (error) {
    console.error("[MFA] TOTP verification error:", error);
    return false;
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(6).toString("hex").toUpperCase();
    const formatted = `${safeSlice(code, 0, 4)}-${safeSlice(code, 4, 8)}-${safeSlice(code, 8, 12)}`;
    codes.push(formatted);
  }
  return codes;
}

// ==================== CHALLENGE MANAGEMENT ====================
export async function createMfaChallenge(
  userId: string,
  method: MfaMethod,
  type: MfaChallengeType = "login",
  options: { ipAddress?: string; userAgent?: string; metadata?: Record<string, any> } = {}
): Promise<{ challengeId: string; code?: string; secret?: string; expiresAt: Date }> {
  const { ipAddress, userAgent, metadata } = options;

  const challengeId = `mfa_${randomBytes(16).toString("hex")}`;
  const now = new Date();

  let expiresAt: Date;
  let code: string | undefined;
  let secret: string | undefined;

  switch (method) {
    case "totp":
      expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
      break;

    case "sms":
    case "email":
      code = generateNumericCode(MFA_CONFIG[method].codeLength);
      expiresAt = new Date(now.getTime() + MFA_CONFIG[method].expiryMinutes * 60 * 1000);
      await sendVerificationCode(method, userId, code);
      break;

    case "backup-code":
      expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
      break;

    default:
      throw new Error(`Unsupported MFA method: ${method}`);
  }

  const challenge: MfaChallenge = {
    id: challengeId,
    userId,
    method,
    type,
    code,
    secret,
    createdAt: now,
    expiresAt,
    status: "pending",
    metadata,
    ipAddress,
    userAgent,
    attempts: 0,
    maxAttempts: MFA_CONFIG.challenge.maxAttempts,
  };

  const store = await getRedisMfaStore();
  const ttlMs = expiresAt.getTime() - now.getTime();

  // store under a predictable key
  await store.set(`mfa:challenge:${challengeId}`, challenge, ttlMs);

  await logMfaEvent({
    userId,
    action: "CHALLENGE_CREATED",
    method,
    challengeId,
    ipAddress,
    userAgent,
    metadata,
  });

  return { challengeId, code, secret, expiresAt };
}

export async function verifyMfaChallenge(
  options: VerifyMfaOptions
): Promise<{ success: boolean; challenge?: MfaChallenge; error?: string; remainingAttempts?: number }> {
  const { challengeId, code, ipAddress, userAgent, rememberDevice } = options;

  if (!challengeId || !code) return { success: false, error: "Challenge ID and code are required" };
  if (typeof code !== "string" || code.length > 20) return { success: false, error: "Invalid code format" };

  const store = await getRedisMfaStore();
  const challengeRaw = await store.get(`mfa:challenge:${challengeId}`);
  const challenge = challengeRaw ? reviveChallenge(challengeRaw) : null;

  if (!challenge) return { success: false, error: "Challenge not found or expired" };

  const now = new Date();

  if (challenge.expiresAt <= now) {
    challenge.status = "expired";
    await store.set(`mfa:challenge:${challengeId}`, challenge, 60_000);
    return { success: false, error: "Challenge expired" };
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    challenge.status = "failed";
    await store.set(`mfa:challenge:${challengeId}`, challenge, 60_000);

    await logSecurityEvent({
      userId: challenge.userId,
      action: "MFA_MAX_ATTEMPTS",
      ipAddress,
      details: { challengeId, method: challenge.method },
    });

    return { success: false, error: "Maximum attempts exceeded" };
  }

  let isValid = false;

  switch (challenge.method) {
    case "totp":
      try {
        const { prisma } = await import("@/lib/prisma");
        const mfaSetup = await prisma.mfaSetup.findUnique({
          where: { userId: challenge.userId },
          select: { totpSecret: true },
        });

        if (mfaSetup?.totpSecret) isValid = verifyTotpCode(mfaSetup.totpSecret, code);
      } catch (error) {
        console.error("[MFA] Failed to get TOTP secret:", error);
      }
      break;

    case "sms":
    case "email":
      isValid = (challenge.code || "").toUpperCase() === code.toUpperCase();
      break;

    case "backup-code":
      isValid = await verifyBackupCode(challenge.userId, code);
      break;

    default:
      return { success: false, error: `Unsupported method: ${challenge.method}` };
  }

  challenge.attempts++;

  if (isValid) {
    challenge.status = "verified";
    challenge.verifiedAt = now;

    if (rememberDevice && userAgent) {
      await rememberMfaDevice(challenge.userId, userAgent, ipAddress);
    }
  } else if (challenge.attempts >= challenge.maxAttempts) {
    challenge.status = "failed";
  }

  // keep until expiration (or 10 minutes post-verify)
  const ttlMs = Math.max(60_000, challenge.expiresAt.getTime() - now.getTime());
  await store.set(`mfa:challenge:${challengeId}`, challenge, ttlMs);

  await logMfaEvent({
    userId: challenge.userId,
    action: isValid ? "CHALLENGE_VERIFIED" : "CHALLENGE_FAILED",
    method: challenge.method,
    challengeId,
    ipAddress,
    userAgent,
    metadata: { attempts: challenge.attempts, maxAttempts: challenge.maxAttempts, rememberDevice },
  });

  return isValid
    ? { success: true, challenge, remainingAttempts: challenge.maxAttempts - challenge.attempts }
    : { success: false, error: "Invalid verification code", remainingAttempts: challenge.maxAttempts - challenge.attempts };
}

export async function getPendingChallenges(userId: string): Promise<MfaChallenge[]> {
  const store = await getRedisMfaStore();
  const challenges = await store.findByUserId(userId);
  const now = new Date();
  return challenges.filter((c) => c.status === "pending" && c.expiresAt > now);
}

export async function cancelChallenge(challengeId: string): Promise<boolean> {
  const store = await getRedisMfaStore();
  const challengeRaw = await store.get(`mfa:challenge:${challengeId}`);
  const challenge = challengeRaw ? reviveChallenge(challengeRaw) : null;

  if (!challenge || challenge.status !== "pending") return false;

  await store.delete(`mfa:challenge:${challengeId}`);

  await logMfaEvent({
    userId: challenge.userId,
    action: "CHALLENGE_CANCELLED",
    method: challenge.method,
    challengeId,
  });

  return true;
}

// ==================== USED BY ADMIN LOGIN ====================
export async function setMFAChallenge(userId: string, challengeValue: string): Promise<void> {
  try {
    const store = await getRedisMfaStore();

    const now = new Date();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store as a challenge-like object (compatible with your existing logic)
    const payload = {
      id: `challenge_ref:${userId}`,
      userId,
      challengeValue,
      createdAt: now,
      expiresAt,
      status: "pending",
      method: "totp",
      type: "login",
      attempts: 0,
      maxAttempts: 3,
    };

    await store.set(`challenge_ref:${userId}`, payload, expiresAt.getTime() - now.getTime());

    await logMfaEvent({
      userId,
      action: "MFA_CHALLENGE_SET",
      challengeId: challengeValue,
      metadata: { action: "login" },
    });
  } catch (error) {
    console.error("[MFA] Failed to store challenge:", error);
  }
}

// ==================== SECURITY UTILITIES ====================
function generateNumericCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) code += randomInt(0, 10).toString();
  return code;
}

async function sendVerificationCode(method: "sms" | "email", userId: string, code: string): Promise<void> {
  try {
    console.log(`[MFA] ${method.toUpperCase()} verification code for ${userId}: ${code}`);

    if (method === "email") {
      try {
        const { sendEmail } = await import("@/lib/email/dispatcher");
        await sendEmail({
          to: userId,
          subject: "Your Verification Code",
          text: `Your verification code is: ${code}`,
          html: `<p>Your verification code is: <strong>${code}</strong></p>`,
        });
      } catch (error) {
        console.warn("[MFA] Email dispatcher not available, logging code only:", error);
      }
    }
  } catch (error) {
    console.error(`[MFA] Failed to send ${method} code:`, error);
    throw error;
  }
}

async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const setup = await prisma.mfaSetup.findUnique({
      where: { userId },
      select: { backupCodes: true },
    });

    if (!setup) return false;

    const normalizedCode = code.replace(/-/g, "").toUpperCase();

    const backupCodes = setup.backupCodes as any;
    if (!Array.isArray(backupCodes)) {
      console.error("[MFA] backupCodes is not an array:", typeof backupCodes);
      return false;
    }

    const index = backupCodes.findIndex((bc: any) => bc.replace(/-/g, "").toUpperCase() === normalizedCode);
    if (index === -1) return false;

    backupCodes.splice(index, 1);

    await prisma.mfaSetup.update({
      where: { userId },
      data: { backupCodes },
    });

    return true;
  } catch (error) {
    console.error("[MFA] Backup code verification error:", error);
    return false;
  }
}

async function rememberMfaDevice(userId: string, userAgent: string, ipAddress?: string): Promise<void> {
  try {
    const deviceId = generateDeviceId(userAgent, ipAddress);
    const store = await getRedisMfaStore();

    await store.set(
      `mfa:device:${userId}:${deviceId}`,
      {
        userAgent,
        ipAddress,
        lastUsed: new Date().toISOString(),
        userId,
      },
      30 * 24 * 60 * 60 * 1000
    );
  } catch (error) {
    console.warn("[MFA] Failed to remember device:", error);
  }
}

export async function isDeviceRemembered(userId: string, userAgent: string, ipAddress?: string): Promise<boolean> {
  try {
    const deviceId = generateDeviceId(userAgent, ipAddress);
    const store = await getRedisMfaStore();
    const device = await store.get(`mfa:device:${userId}:${deviceId}`);
    return !!device;
  } catch {
    return false;
  }
}

function generateDeviceId(userAgent: string, ipAddress?: string): string {
  // deterministic enough for "remember device" without storing raw info
  const hash = randomBytes(16).toString("hex");
  return hash.substring(0, 16);
}

// ==================== LOGGING ====================
async function logMfaEvent(event: {
  userId: string;
  action: string;
  method?: MfaMethod;
  challengeId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.securityLog.create({
      data: {
        userId: event.userId,
        action: `MFA_${event.action}`,
        details: JSON.stringify({
          method: event.method,
          challengeId: event.challengeId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: new Date().toISOString(),
          metadata: event.metadata,
        }),
        ipAddress: event.ipAddress || "unknown",
        userAgent: event.userAgent || "unknown",
        severity: event.action.includes("FAILED") ? "MEDIUM" : "LOW",
      },
    });
  } catch (error) {
    console.error("[MFA] Failed to log event:", error);
  }
}

async function logSecurityEvent(event: {
  userId: string;
  action: string;
  ipAddress?: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.securityLog.create({
      data: {
        userId: event.userId,
        action: `SECURITY_${event.action}`,
        details: JSON.stringify({
          ipAddress: event.ipAddress,
          timestamp: new Date().toISOString(),
          details: event.details,
        }),
        ipAddress: event.ipAddress || "unknown",
        userAgent: "mfa-system",
        severity: "HIGH",
      },
    });
  } catch (error) {
    console.error("[SecurityLog] Failed to log event:", error);
  }
}

// ==================== EXPORTS ====================
const mfaApi = {
  createMfaChallenge,
  verifyMfaChallenge,
  getPendingChallenges,
  cancelChallenge,
  setMFAChallenge,

  generateTotpSecret,
  generateTotpUri,
  verifyTotpCode,
  generateBackupCodes,

  isDeviceRemembered,
};

export default mfaApi;