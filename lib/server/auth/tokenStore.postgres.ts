/* lib/server/auth/tokenStore.postgres.ts — SSOT TOKEN STORE (PROJECT-WIDE ALIGNED) */
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";
import { type TierDirective, getDirectiveByTier } from "@/lib/resources/tier-metadata";

console.log("[MODULE_INIT] lib/server/auth/tokenStore.postgres");

/** Internal Result Types */
type Ok<T> = { ok: true } & T;
type Fail = { ok: false; reason: string };

const DEFAULT_SESSION_TTL_DAYS = Number(
  process.env.INNER_CIRCLE_SESSION_TTL_DAYS || 30
);

export type SessionContext = {
  ok: boolean;
  valid?: boolean;
  sessionId?: string;
  memberId?: string | null;
  tier?: AccessTier;
  displayRole?: string | null;
  directive?: TierDirective;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  flags?: string[];
  expiresAt?: string;
  reason?: string;
};

/** Helpers */
function now(): Date {
  return new Date();
}

function plusDays(d: number): Date {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x;
}

export function sha256Hex(input: string): string {
  return crypto
    .createHash("sha256")
    .update(String(input || ""), "utf8")
    .digest("hex");
}

export function hashAccessKey(rawKey: string): string {
  const secret =
    process.env.INNER_CIRCLE_KEY_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-key-secret";

  return sha256Hex(`${String(rawKey || "").trim()}::${secret}`);
}

function parseFlags(flags: unknown): string[] {
  if (!flags) return [];
  if (Array.isArray(flags)) return flags.map(String);

  if (typeof flags === "string") {
    const s = flags.trim();
    if (!s) return [];

    try {
      const j = JSON.parse(s);
      return Array.isArray(j) ? j.map(String) : [];
    } catch {
      return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  return [];
}

/** Access Logic */
export function tierAtLeast(
  userTier: unknown,
  requiredTier: unknown
): boolean {
  return hasAccess(userTier, requiredTier);
}

/** Session Management */
export async function verifySession(
  sessionId: string
): Promise<
  | Ok<{
      valid: true;
      tier: AccessTier;
      memberId: string | null;
      expiresAt: string;
    }>
  | Ok<{ valid: false; reason: string }>
> {
  const sid = String(sessionId || "").trim();
  if (!sid) return { ok: true, valid: false, reason: "SESSION_MISSING" };

  const s = await prisma.session.findUnique({
    where: { sessionId: sid },
    include: {
      member: { select: { id: true, tier: true, status: true } },
    },
  });

  if (!s) return { ok: true, valid: false, reason: "SESSION_NOT_FOUND" };
  if (String(s.status || "").toLowerCase() !== "active") {
    return { ok: true, valid: false, reason: "SESSION_REVOKED" };
  }

  const exp = s.expiresAt ? new Date(s.expiresAt) : null;
  if (!exp || exp.getTime() <= Date.now()) {
    return { ok: true, valid: false, reason: "SESSION_EXPIRED" };
  }

  const tier = normalizeUserTier((s as any)?.member?.tier ?? "public");

  return {
    ok: true,
    valid: true,
    tier,
    memberId: s.memberId ?? null,
    expiresAt: exp.toISOString(),
  };
}

export async function getSessionTier(sessionId: string): Promise<AccessTier> {
  const v = await verifySession(sessionId);
  return v.ok && v.valid ? v.tier : "public";
}

export async function getSessionContext(
  sessionId: string
): Promise<SessionContext> {
  const sid = String(sessionId || "").trim();
  if (!sid) return { ok: false, reason: "SESSION_MISSING" };

  const s = await prisma.session.findUnique({
    where: { sessionId: sid },
    include: {
      member: {
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          status: true,
          role: true,
          flags: true,
        },
      },
    },
  });

  if (!s) return { ok: false, reason: "SESSION_NOT_FOUND" };
  if (String(s.status || "").toLowerCase() !== "active") {
    return { ok: false, reason: "SESSION_REVOKED" };
  }

  const exp = s.expiresAt ? new Date(s.expiresAt) : null;
  if (!exp || exp.getTime() <= Date.now()) {
    return { ok: false, reason: "SESSION_EXPIRED" };
  }

  const member = (s as any).member || null;
  const systemTier = normalizeUserTier(member?.tier ?? "public");
  const directive = getDirectiveByTier(systemTier, member?.role || undefined);

  return {
    ok: true,
    valid: true,
    sessionId: s.sessionId,
    memberId: s.memberId ?? null,
    tier: systemTier,
    displayRole: member?.role ?? null,
    directive,
    email: member?.email ?? null,
    name: member?.name ?? null,
    role: member?.role ?? null,
    flags: parseFlags(member?.flags),
    expiresAt: exp.toISOString(),
  };
}

export async function mintSession(params: {
  sessionId: string;
  memberId: string | null;
  tier: AccessTier | string;
  emailHash?: string | null;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  ttlDays?: number;
}): Promise<Ok<{ sessionId: string; expiresAt: string; tier: AccessTier }> | Fail> {
  const tierNorm = normalizeUserTier(params.tier);
  const expiresAt = plusDays(params.ttlDays || DEFAULT_SESSION_TTL_DAYS);

  try {
    await prisma.session.create({
      data: {
        sessionId: params.sessionId,
        memberId: params.memberId,
        status: "active",
        expiresAt,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: JSON.stringify({
          ...(params.metadata || {}),
          emailHash: params.emailHash || undefined,
        }),
      },
    });

    return {
      ok: true,
      sessionId: params.sessionId,
      expiresAt: expiresAt.toISOString(),
      tier: tierNorm,
    };
  } catch (e: any) {
    console.error("[MINT_SESSION_DB_ERROR]", e);
    return { ok: false, reason: e?.message || "MINT_FAILED" };
  }
}

/** Global Redemption & Atomic Project Sync */
export async function redeemAccessKey(
  rawKey: string,
  ctx?: { ipAddress?: string; userAgent?: string; source?: string }
): Promise<
  | Ok<{
      sessionId: string;
      tier: AccessTier;
      memberId: string | null;
      emailHash: string | null;
      keyId: string;
    }>
  | Fail
> {
  const key = String(rawKey || "").trim();
  if (!key) return { ok: false, reason: "KEY_MISSING" };

  const keyHash = hashAccessKey(key);

  const record = await prisma.innerCircleKey.findUnique({
    where: { keyHash },
    include: {
      member: {
        select: {
          id: true,
          tier: true,
          status: true,
          email: true,
        },
      },
    },
  });

  if (!record) return { ok: false, reason: "KEY_NOT_FOUND" };
  if (String(record.status || "").toLowerCase() !== "active") {
    return { ok: false, reason: "KEY_REVOKED" };
  }

  const keyExp = record.expiresAt ? new Date(record.expiresAt) : null;
  if (!keyExp || keyExp.getTime() <= Date.now()) {
    return { ok: false, reason: "KEY_EXPIRED" };
  }

  const member = (record as any).member || null;
  if (!member) return { ok: false, reason: "MEMBER_MISSING" };
  if (String(member.status || "").toLowerCase() !== "active") {
    return { ok: false, reason: "MEMBER_INACTIVE" };
  }

  const tierNorm = normalizeUserTier(member.tier ?? "member");
  const emailHash = sha256Hex(member.email || member.id);
  const sessionId = `sess_${crypto.randomBytes(24).toString("hex")}`;

  const minted = await mintSession({
    sessionId,
    memberId: member.id,
    tier: tierNorm,
    emailHash,
    ipAddress: ctx?.ipAddress,
    userAgent: ctx?.userAgent,
    metadata: {
      keyId: record.id,
      source: ctx?.source || "redeemAccessKey",
    },
  });

  if (!minted.ok) return { ok: false, reason: minted.reason };

  try {
    const prevMeta =
      record.metadata && typeof record.metadata === "string"
        ? (() => { try { return JSON.parse(record.metadata) as Record<string, unknown>; } catch { return {}; } })()
        : {};

    await prisma.innerCircleKey.update({
      where: { id: record.id },
      data: {
        lastUsedAt: now(),
        metadata: JSON.stringify({
          ...prevMeta,
          lastRedeem: {
            at: now().toISOString(),
            ip: ctx?.ipAddress,
            ua: ctx?.userAgent,
            sid: minted.sessionId,
          },
        }),
      },
    });

    await prisma.innerCircleMember.update({
      where: { id: member.id },
      data: { lastSeenAt: now() },
    });
  } catch (e) {
    console.warn("[GLOBAL_SYNC_WARNING]", e);
  }

  return {
    ok: true,
    sessionId: minted.sessionId,
    tier: tierNorm,
    memberId: member.id,
    emailHash,
    keyId: record.id,
  };
}

export async function revokeSession(
  sessionId: string
): Promise<Ok<{ revoked: true }> | Fail> {
  const sid = String(sessionId || "").trim();
  if (!sid) return { ok: false, reason: "SESSION_MISSING" };

  try {
    await prisma.session.update({
      where: { sessionId: sid },
      data: { status: "revoked" },
    });
    return { ok: true, revoked: true };
  } catch (e: any) {
    return {
      ok: false,
      reason: e?.message ? String(e.message) : "REVOKE_FAILED",
    };
  }
}

export async function revokeKeyByHash(
  keyHash: string
): Promise<Ok<{ revoked: true }> | Fail> {
  const kh = String(keyHash || "").trim();
  if (!kh) return { ok: false, reason: "KEY_HASH_MISSING" };

  try {
    await prisma.innerCircleKey.update({
      where: { keyHash: kh },
      data: { status: "revoked" },
    });
    return { ok: true, revoked: true };
  } catch (e: any) {
    return {
      ok: false,
      reason: e?.message ? String(e.message) : "REVOKE_KEY_FAILED",
    };
  }
}

export default {
  sha256Hex,
  hashAccessKey,
  tierAtLeast,
  verifySession,
  getSessionTier,
  getSessionContext,
  mintSession,
  revokeSession,
  revokeKeyByHash,
  redeemAccessKey,
};