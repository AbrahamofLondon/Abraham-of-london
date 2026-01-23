// lib/server/auth/tokenStore.postgres.ts
// PRODUCTION EXCELLENCE — reconciled, strict, deployable

import crypto from "crypto";
import { prisma } from "@/lib/server/prisma";
import { AuditLogger } from "@/lib/audit/audit-logger";

export type Tier =
  | "public"
  | "inner-circle"
  | "inner-circle-plus"
  | "inner-circle-elite"
  | "private";

type MemberTier = "standard" | "basic" | "premium" | "elite" | "private";

// -------------------- Tier ladder (authoritative) --------------------
const TIER_ORDER: Tier[] = [
  "public",
  "inner-circle",
  "inner-circle-plus",
  "inner-circle-elite",
  "private",
];

const VALID_TIERS = new Set<Tier>(TIER_ORDER);

const TIER_MAPPING: Record<string, Tier> = {
  // legacy / aliases
  standard: "inner-circle",
  basic: "inner-circle",
  "inner-circle": "inner-circle",

  premium: "inner-circle-plus",
  "inner-circle-plus": "inner-circle-plus",

  elite: "inner-circle-elite",
  "inner-circle-elite": "inner-circle-elite",

  private: "private",
};

// Standardize tier mapping with validation and fallbacks
export function mapMemberTier(raw: string | null | undefined): Tier {
  if (!raw) return "public";
  const normalized = String(raw).toLowerCase().trim();
  const mapped = TIER_MAPPING[normalized];
  return mapped && VALID_TIERS.has(mapped) ? mapped : "public";
}

export function tierAtLeast(actual: Tier, required: Tier): boolean {
  return TIER_ORDER.indexOf(actual) >= TIER_ORDER.indexOf(required);
}

// -------------------- Security utilities --------------------
function requirePepper(): string {
  const pepper = process.env.ACCESS_KEY_PEPPER;
  if (!pepper || pepper.length < 24) {
    // fail closed; do NOT silently weaken hashing in prod
    throw new Error("ACCESS_KEY_PEPPER is missing/weak");
  }
  return pepper;
}

// HMAC makes the pepper an actual secret key (better than concatenated sha256).
export function hashAccessKey(rawToken: string): string {
  const token = String(rawToken || "").trim();
  if (!token) throw new Error("Cannot hash empty token");

  const pepper = requirePepper();
  return crypto.createHmac("sha256", pepper).update(token).digest("hex");
}

export function generateSessionId(): string {
  // url-safe; no timestamps; no predictable prefix length issues
  const bytes = crypto.randomBytes(32);
  return `sess_${bytes.toString("base64url")}`;
}

function safeJsonParse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function audit() {
  return new AuditLogger({
    prisma,
    service: "auth",
    environment: process.env.NODE_ENV || "production",
  });
}

// -------------------- Session lookups --------------------
export type SessionContext = {
  tier: Tier | null;
  session: any | null;
  member: any | null;
};

// Lightweight: most of your API calls want just Tier or null.
export async function getSessionTier(sessionId: string): Promise<Tier | null> {
  const ctx = await getSessionContext(sessionId);
  return ctx.tier;
}

// Full context when you need it.
export async function getSessionContext(sessionId: string): Promise<SessionContext> {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId },
      include: { member: true },
    });

    if (!session) return { tier: null, session: null, member: null };

    const now = new Date();

    // Expired -> revoke (delete) and deny
    if (session.expiresAt < now) {
      await revokeSession(sessionId, "expired");
      return { tier: null, session: null, member: null };
    }

    // Member inactive -> revoke and deny
    if (session.member?.status && session.member.status !== "active") {
      await revokeSession(sessionId, "member_inactive");
      return { tier: null, session: null, member: null };
    }

    // Tier from session data preferred; else from member record
    const parsed = safeJsonParse<{ tier?: Tier }>(session.data);
    const tierCandidate = parsed?.tier || mapMemberTier(session.member?.tier);
    const resolved: Tier = VALID_TIERS.has(tierCandidate) ? tierCandidate : "public";

    // Throttled activity update (1hr)
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

// -------------------- Revocation --------------------
export async function revokeSession(sessionToken: string, reason = "manual_revoke"): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId: sessionToken },
      include: { member: true },
    });

    const del = await prisma.session.deleteMany({
      where: { sessionId: sessionToken },
    });

    if (del.count > 0) {
      try {
        await audit().logSecurityEvent(session?.memberId || "unknown", "SESSION_REVOKED", {
          severity: "info",
          sourceIp: "system",
          blocked: true,
          reason,
        });
      } catch (e) {
        console.warn("[revokeSession] audit failed:", e);
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("[revokeSession] Error:", error);
    return false;
  }
}

export async function revokeKeyByHash(keyHash: string, reason = "manual_revoke"): Promise<boolean> {
  try {
    const key = await prisma.innerCircleKey.findUnique({
      where: { keyHash },
      include: { member: true },
    });

    if (!key) return false;

    const upd = await prisma.innerCircleKey.updateMany({
      where: { keyHash, status: { not: "revoked" } },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    if (upd.count > 0) {
      try {
        await audit().logAdminEvent("system", "system@abrahamoflondon.org", "KEY_REVOKED", {
          resourceType: "inner_circle_key",
          resourceId: key.id,
          changes: { status: "revoked", reason },
          ipAddress: "system",
        });
      } catch (e) {
        console.warn("[revokeKeyByHash] audit failed:", e);
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("[revokeKeyByHash] Error:", error);
    return false;
  }
}

// -------------------- Key redemption -> session mint --------------------
export type RedeemResult =
  | { ok: true; tier: Tier; memberId: string; emailHash: string; keyId: string; sessionId: string }
  | { ok: false; reason: string };

export async function redeemAccessKey(
  rawToken: string,
  context?: { ipAddress?: string; userAgent?: string; source?: string }
): Promise<RedeemResult> {
  const token = String(rawToken || "").trim();
  if (!token) return { ok: false, reason: "Invalid key" };

  let keyHash: string;
  try {
    keyHash = hashAccessKey(token);
  } catch {
    return { ok: false, reason: "Server not configured" };
  }

  const now = new Date();

  try {
    const key = await prisma.innerCircleKey.findUnique({
      where: { keyHash },
      include: { member: true },
    });

    if (!key) return { ok: false, reason: "Invalid key" };

    if (key.status !== "active") {
      return { ok: false, reason: key.status === "revoked" ? "Key revoked" : "Key already used" };
    }

    if (key.expiresAt && key.expiresAt <= now) {
      await revokeKeyByHash(keyHash, "expired");
      return { ok: false, reason: "Key expired" };
    }

    if (!key.member || key.member.status !== "active") {
      return { ok: false, reason: "Membership inactive or suspended" };
    }

    const tier = mapMemberTier(key.member.tier);
    const sessionId = generateSessionId();

    // Atomic update + session create
    await prisma.$transaction(async (tx) => {
      await tx.innerCircleKey.update({
        where: { id: key.id },
        data: {
          status: "used",
          totalUnlocks: { increment: 1 },
          lastUsedAt: now,
          lastIp: context?.ipAddress,
        },
      });

      await tx.session.create({
        data: {
          sessionId,
          memberId: key.memberId,
          emailHash: key.member.emailHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lastActivity: now,
          userAgent: context?.userAgent,
          ipAddress: context?.ipAddress,
          data: JSON.stringify({
            tier,
            keyId: key.id,
            redeemedAt: now.toISOString(),
            source: context?.source,
          }),
        },
      });
    });

    try {
      await audit().logAuthEvent(key.memberId, "KEY_REDEEMED", {
        success: true,
        method: "access_key",
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: { keyId: key.id, tier, source: context?.source },
      });
    } catch (e) {
      console.warn("[redeemAccessKey] audit failed:", e);
    }

    return {
      ok: true,
      tier,
      memberId: key.memberId,
      emailHash: key.member.emailHash,
      keyId: key.id,
      sessionId,
    };
  } catch (error) {
    console.error("[redeemAccessKey] Error:", error);
    return { ok: false, reason: "Internal server error" };
  }
}

// Mint a session directly (used by admin tools / future flows)
export type MintSessionParams = {
  tier: Tier;
  memberId: string;
  emailHash: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  ttlDays?: number;
};

export async function mintSession(params: MintSessionParams) {
  const sessionId = generateSessionId();
  const ttl = Math.max(1, Math.min(365, params.ttlDays ?? 30));
  const now = new Date();
  const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000);

  const tier = VALID_TIERS.has(params.tier) ? params.tier : "public";

  const session = await prisma.session.create({
    data: {
      sessionId,
      memberId: params.memberId,
      emailHash: params.emailHash,
      expiresAt,
      lastActivity: now,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      data: JSON.stringify({
        tier,
        mintedAt: now.toISOString(),
        metadata: params.metadata || {},
      }),
    },
  });

  try {
    await audit().logAuthEvent(params.memberId, "SESSION_MINTED", {
      success: true,
      method: "direct",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { sessionId, tier, expiresAt: expiresAt.toISOString() },
    });
  } catch (e) {
    console.warn("[mintSession] audit failed:", e);
  }

  return session;
}

// -------------------- Maintenance / health --------------------
export async function cleanupExpiredTokens(): Promise<{ sessionsCleaned: number; keysCleaned: number }> {
  const now = new Date();

  try {
    const [sessions, keys] = await Promise.all([
      prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
      prisma.innerCircleKey.updateMany({
        where: { expiresAt: { lt: now }, status: "active" },
        data: { status: "expired", revokedAt: now, revokedReason: "auto_expired" },
      }),
    ]);

    return { sessionsCleaned: sessions.count, keysCleaned: keys.count };
  } catch (e) {
    console.error("[cleanupExpiredTokens] Error:", e);
    return { sessionsCleaned: 0, keysCleaned: 0 };
  }
}

export async function tokenStoreHealthCheck() {
  const now = new Date();

  try {
    const [activeSessions, activeKeys, recentSessions] = await Promise.all([
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.innerCircleKey.count({
        where: { status: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      }),
      prisma.session.findMany({
        where: { lastActivity: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        take: 5,
        orderBy: { lastActivity: "desc" },
      }),
    ]);

    return {
      healthy: true,
      timestamp: now.toISOString(),
      stats: {
        activeSessions,
        activeKeys,
        recentActivity: recentSessions.length,
      },
      recentSessions: recentSessions.map((s) => ({
        id: s.sessionId,
        lastActivity: s.lastActivity,
        userAgent: s.userAgent?.substring(0, 80) || null,
      })),
    };
  } catch (e: any) {
    console.error("[tokenStoreHealthCheck] Error:", e);
    return { healthy: false, timestamp: now.toISOString(), error: e?.message || "Unknown error" };
  }
}