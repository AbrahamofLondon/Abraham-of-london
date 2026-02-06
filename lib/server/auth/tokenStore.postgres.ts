// lib/server/auth/tokenStore.postgres.ts
// PRODUCTION EXCELLENCE — reconciled, strict, deployable

import crypto from "crypto";
import { prisma } from "@/lib/prisma"; // Unified Path
import { AuditLogger } from "@/lib/audit/audit-logger";

export type Tier =
  | "public"
  | "inner-circle"
  | "inner-circle-plus"
  | "inner-circle-elite"
  | "private";

const TIER_ORDER: Tier[] = [
  "public",
  "inner-circle",
  "inner-circle-plus",
  "inner-circle-elite",
  "private",
];

const VALID_TIERS = new Set<Tier>(TIER_ORDER);

const TIER_MAPPING: Record<string, Tier> = {
  standard: "inner-circle",
  basic: "inner-circle",
  "inner-circle": "inner-circle",
  premium: "inner-circle-plus",
  "inner-circle-plus": "inner-circle-plus",
  elite: "inner-circle-elite",
  "inner-circle-elite": "inner-circle-elite",
  private: "private",
};

export function mapMemberTier(raw: string | null | undefined): Tier {
  if (!raw) return "public";
  const normalized = String(raw).toLowerCase().trim();
  const mapped = TIER_MAPPING[normalized];
  return mapped && VALID_TIERS.has(mapped) ? mapped : "public";
}

export function tierAtLeast(actual: Tier, required: Tier): boolean {
  return TIER_ORDER.indexOf(actual) >= TIER_ORDER.indexOf(required);
}

function requirePepper(): string {
  const pepper = process.env.ACCESS_KEY_PEPPER;
  if (!pepper || pepper.length < 24) {
    throw new Error("ACCESS_KEY_PEPPER is missing/weak");
  }
  return pepper;
}

export function hashAccessKey(rawToken: string): string {
  const token = String(rawToken || "").trim();
  if (!token) throw new Error("Cannot hash empty token");
  const pepper = requirePepper();
  return crypto.createHmac("sha256", pepper).update(token).digest("hex");
}

export function generateSessionId(): string {
  const bytes = crypto.randomBytes(32);
  return `sess_${bytes.toString("base64url")}`;
}

function safeJsonParse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function audit() {
  return new AuditLogger({
    prisma,
    service: "auth",
    environment: process.env.NODE_ENV || "production",
  });
}

export type SessionContext = {
  tier: Tier | null;
  session: any | null;
  member: any | null;
};

export async function getSessionContext(sessionId: string): Promise<SessionContext> {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId },
      include: { member: true },
    });

    if (!session) return { tier: null, session: null, member: null };

    const now = new Date();
    if (session.expiresAt < now) {
      await revokeSession(sessionId, "expired");
      return { tier: null, session: null, member: null };
    }

    const parsed = safeJsonParse<{ tier?: Tier }>(session.data);
    const tierCandidate = parsed?.tier || mapMemberTier(session.member?.tier);
    const resolved: Tier = VALID_TIERS.has(tierCandidate) ? tierCandidate : "public";

    const last = new Date(session.lastActivity);
    const hours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
    if (hours > 1) {
      await prisma.session.update({
        where: { sessionId },
        data: { lastActivity: now },
      });
    }

    return { tier: resolved, session, member: session.member };
  } catch (error) {
    console.error("[getSessionContext] Error:", error);
    return { tier: null, session: null, member: null };
  }
}

export const verifySession = getSessionContext;

export async function revokeSession(sessionToken: string, reason = "manual_revoke"): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId: sessionToken },
    });

    const del = await prisma.session.delete({
      where: { sessionId: sessionToken },
    });

    if (del) {
      await audit().logSecurityEvent(session?.memberId || "unknown", "SESSION_REVOKED", {
        severity: "info",
        sourceIp: "system",
        reason,
      });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export type RedeemResult =
  | { ok: true; tier: Tier; sessionId: string }
  | { ok: false; reason: string };

export async function redeemAccessKey(
  rawToken: string,
  context?: { ipAddress?: string; userAgent?: string; source?: string }
): Promise<RedeemResult> {
  const token = String(rawToken || "").trim();
  if (!token) return { ok: false, reason: "Invalid key" };

  const keyHash = hashAccessKey(token);
  const now = new Date();

  try {
    const key = await prisma.innerCircleKey.findUnique({
      where: { keyHash },
      include: { member: true },
    });

    if (!key || key.status !== "active") return { ok: false, reason: "Key invalid or used" };
    if (!key.member) return { ok: false, reason: "Member not found" };

    const tier = mapMemberTier(key.member.tier);
    const sessionId = generateSessionId();

    await prisma.$transaction([
      prisma.innerCircleKey.update({
        where: { id: key.id },
        data: { status: "used", lastUsedAt: now, lastIp: context?.ipAddress },
      }),
      prisma.session.create({
        data: {
          sessionId,
          memberId: key.memberId,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lastActivity: now,
          data: JSON.stringify({ tier, source: context?.source }),
        },
      }),
    ]);

    return { ok: true, tier, sessionId };
  } catch (error) {
    return { ok: false, reason: "Internal server error" };
  }
}

export async function mintSession(params: any) {
  const sessionId = generateSessionId();
  return await prisma.session.create({
    data: {
      sessionId,
      memberId: params.memberId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(),
      data: JSON.stringify({ tier: params.tier }),
    },
  });
}

// ==================== MISSING EXPORTS ====================
// These are required by other files in the project

/**
 * Revoke a key by its hash
 * Required by: pages/api/access/revoke.ts
 */
export async function revokeKeyByHash(keyHash: string): Promise<boolean> {
  try {
    const key = await prisma.innerCircleKey.findUnique({
      where: { keyHash },
    });

    if (!key) {
      console.warn(`Key with hash ${keyHash} not found`);
      return false;
    }

    await prisma.innerCircleKey.update({
      where: { keyHash },
      data: { 
        status: "revoked",
        revokedAt: new Date()
      },
    });

    await audit().logSecurityEvent(key.memberId || "unknown", "KEY_REVOKED", {
      severity: "warning",
      sourceIp: "system",
      reason: "manual_revoke",
      keyHash,
    });

    return true;
  } catch (error) {
    console.error("[revokeKeyByHash] Error:", error);
    return false;
  }
}

/**
 * Get session tier from session token
 * Required by: pages/api/downloads/[slug].ts
 */
export async function getSessionTier(sessionToken: string): Promise<string> {
  try {
    const context = await getSessionContext(sessionToken);
    if (!context.tier) {
      return "public";
    }
    return context.tier;
  } catch (error) {
    console.error("[getSessionTier] Error:", error);
    return "public";
  }
}