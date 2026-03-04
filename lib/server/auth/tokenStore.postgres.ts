// lib/server/auth/tokenStore.postgres.ts — SSOT TOKEN STORE (FULL REPLACEMENT)
// Pages Router + API Routes safe. Node runtime only (Postgres + crypto).
// Exports ALL symbols your codebase is trying to import.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

type Ok<T> = { ok: true } & T;
type Fail = { ok: false; reason: string };

const DEFAULT_SESSION_TTL_DAYS = Number(process.env.INNER_CIRCLE_SESSION_TTL_DAYS || 30);
const DEFAULT_KEY_TTL_DAYS = Number(process.env.INNER_CIRCLE_KEY_TTL_DAYS || 30);

export type SessionContext = {
  ok: boolean;
  valid?: boolean;
  sessionId?: string;
  memberId?: string | null;
  tier?: AccessTier;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  flags?: string[];
  expiresAt?: string;
  reason?: string;
};

function now() {
  return new Date();
}

function plusDays(d: number) {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x;
}

/** Stable sha256 hex */
export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(String(input || ""), "utf8").digest("hex");
}

/** Exported: access-key hashing (used by register/resend) */
export function hashAccessKey(rawKey: string): string {
  const secret = process.env.INNER_CIRCLE_KEY_SECRET || process.env.NEXTAUTH_SECRET || "dev-key-secret";
  return sha256Hex(`${String(rawKey || "").trim()}::${secret}`);
}

/** Internal: normalize string flags */
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
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  return [];
}

/** Exported: compare tiers */
export function tierAtLeast(userTier: unknown, requiredTier: unknown): boolean {
  return hasAccess(userTier, requiredTier);
}

/** Exported: session lookup helper used by many routes */
export async function verifySession(
  sessionId: string
): Promise<
  Ok<{ valid: true; tier: AccessTier; memberId: string | null; expiresAt: string }> |
  Ok<{ valid: false; reason: string }>
> {
  const sid = String(sessionId || "").trim();
  if (!sid) return { ok: true, valid: false, reason: "SESSION_MISSING" };

  const s = await prisma.session.findUnique({
    where: { sessionId: sid },
    include: { member: { select: { id: true, tier: true, status: true } } },
  });

  if (!s) return { ok: true, valid: false, reason: "SESSION_NOT_FOUND" };
  if (String(s.status || "").toLowerCase() !== "active") return { ok: true, valid: false, reason: "SESSION_REVOKED" };

  const exp = s.expiresAt ? new Date(s.expiresAt) : null;
  if (!exp || exp.getTime() <= Date.now()) return { ok: true, valid: false, reason: "SESSION_EXPIRED" };

  const tier = normalizeUserTier((s as any)?.member?.tier ?? "public");
  return { ok: true, valid: true, tier, memberId: (s as any)?.memberId ?? null, expiresAt: exp.toISOString() };
}

/** Exported: returns tier only */
export async function getSessionTier(sessionId: string): Promise<AccessTier> {
  const v = await verifySession(sessionId);
  if (!v.ok || !v.valid) return "public";
  return v.tier;
}

/** Exported: richer session context (many files import this) */
export async function getSessionContext(sessionId: string): Promise<SessionContext> {
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
  if (String(s.status || "").toLowerCase() !== "active") return { ok: false, reason: "SESSION_REVOKED" };

  const exp = s.expiresAt ? new Date(s.expiresAt) : null;
  if (!exp || exp.getTime() <= Date.now()) return { ok: false, reason: "SESSION_EXPIRED" };

  const member = (s as any).member || null;
  const tier = normalizeUserTier(member?.tier ?? "public");

  return {
    ok: true,
    valid: true,
    sessionId: s.sessionId,
    memberId: s.memberId ?? null,
    tier,
    email: member?.email ?? null,
    name: member?.name ?? null,
    role: member?.role ?? null,
    flags: parseFlags(member?.flags),
    expiresAt: exp.toISOString(),
  };
}

/** Exported: create session (mint) */
export async function mintSession(params: {
  memberId: string | null;
  tier: AccessTier | string;
  ttlDays?: number;
}): Promise<Ok<{ sessionId: string; expiresAt: string; tier: AccessTier }> | Fail> {
  const memberId = params.memberId ? String(params.memberId) : null;
  const tierNorm = normalizeUserTier(params.tier);
  const ttl = Number.isFinite(params.ttlDays as number) ? Number(params.ttlDays) : DEFAULT_SESSION_TTL_DAYS;
  const expiresAt = plusDays(Math.max(1, ttl));
  const sessionId = `sess_${crypto.randomBytes(24).toString("hex")}`;

  try {
    await prisma.session.create({
      data: {
        sessionId,
        memberId,
        status: "active",
        expiresAt,
      },
    });

    return { ok: true, sessionId, expiresAt: expiresAt.toISOString(), tier: tierNorm };
  } catch (e: any) {
    return { ok: false, reason: e?.message ? String(e.message) : "MINT_FAILED" };
  }
}

/** Exported: revoke session */
export async function revokeSession(sessionId: string): Promise<Ok<{ revoked: true }> | Fail> {
  const sid = String(sessionId || "").trim();
  if (!sid) return { ok: false, reason: "SESSION_MISSING" };

  try {
    await prisma.session.update({
      where: { sessionId: sid },
      data: { status: "revoked" },
    });
    return { ok: true, revoked: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message ? String(e.message) : "REVOKE_FAILED" };
  }
}

/** Exported: revoke key by hash (used by /api/access/revoke) */
export async function revokeKeyByHash(keyHash: string): Promise<Ok<{ revoked: true }> | Fail> {
  const kh = String(keyHash || "").trim();
  if (!kh) return { ok: false, reason: "KEY_HASH_MISSING" };

  try {
    await prisma.innerCircleKey.update({
      where: { keyHash: kh },
      data: { status: "revoked" },
    });
    return { ok: true, revoked: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message ? String(e.message) : "REVOKE_KEY_FAILED" };
  }
}

/** Exported: redeem access key -> creates a sessionId (SCHEMA-ALIGNED) */
export async function redeemAccessKey(
  rawKey: string,
  ctx?: { ipAddress?: string; userAgent?: string; source?: string }
): Promise<
  Ok<{ ok: true; sessionId: string; tier: AccessTier; memberId: string | null }> |
  Ok<{ ok: false; reason: string }>
> {
  const key = String(rawKey || "").trim();
  if (!key) return { ok: false, reason: "KEY_MISSING" };

  // Deterministic hash lookup (must match what generator stores)
  const keyHash = hashAccessKey(key);

  const record = await prisma.innerCircleKey.findUnique({
    where: { keyHash },
    include: { member: { select: { id: true, tier: true, status: true } } },
  });

  if (!record) return { ok: false, reason: "KEY_NOT_FOUND" };
  if (String(record.status || "").toLowerCase() !== "active") return { ok: false, reason: "KEY_REVOKED" };

  // ✅ Enforce key expiry
  const keyExp = record.expiresAt ? new Date(record.expiresAt) : null;
  if (!keyExp || keyExp.getTime() <= Date.now()) return { ok: false, reason: "KEY_EXPIRED" };

  const member = (record as any).member || null;
  if (!member) return { ok: false, reason: "MEMBER_MISSING" };
  if (String(member.status || "").toLowerCase() !== "active") return { ok: false, reason: "MEMBER_INACTIVE" };

  // Mint new session (tier from member)
  const minted = await mintSession({
    memberId: member.id,
    tier: normalizeUserTier(member.tier ?? "member"),
    ttlDays: DEFAULT_SESSION_TTL_DAYS,
  });

  if (!minted.ok) return { ok: false, reason: minted.reason };

  // ✅ Update lastUsedAt + telemetry into metadata (best-effort)
  try {
    const prevMeta =
      record.metadata && typeof record.metadata === "object" ? (record.metadata as Record<string, any>) : {};

    const telemetry = {
      at: new Date().toISOString(),
      ipAddress: ctx?.ipAddress ? String(ctx.ipAddress).slice(0, 64) : undefined,
      userAgent: ctx?.userAgent ? String(ctx.userAgent).slice(0, 256) : undefined,
      source: ctx?.source ? String(ctx.source).slice(0, 64) : undefined,
      keySuffix: record.keySuffix ?? undefined,
      sessionId: minted.sessionId,
    };

    await prisma.innerCircleKey.update({
      where: { id: record.id },
      data: {
        lastUsedAt: new Date(),
        metadata: {
          ...prevMeta,
          lastRedeem: telemetry,
          redeems: Array.isArray((prevMeta as any).redeems)
            ? [...((prevMeta as any).redeems as any[]).slice(-9), telemetry]
            : [telemetry],
        },
      },
    });
  } catch {
    // telemetry must never block access
  }

  // Best-effort member lastSeen
  try {
    await prisma.innerCircleMember.update({
      where: { id: member.id },
      data: { lastSeenAt: now() },
    });
  } catch {
    // ignore
  }

  return { ok: true, sessionId: minted.sessionId, tier: minted.tier, memberId: member.id };
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