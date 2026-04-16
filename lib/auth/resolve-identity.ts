// lib/auth/resolve-identity.ts — CANONICAL IDENTITY RESOLVER
// (auth-migration/01-target-architecture.md)
//
// One function. One resolved identity per request. Used by middleware,
// server guards, API wrappers, and page loaders. Client UI consumes
// this result — it never authors its own.

import { getToken } from "next-auth/jwt";
import type { NextApiRequest } from "next";
import { type Tier, normalizeTier, maxTier, hasAccess as tierHasAccess } from "./tiers";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type MemberLifecycle = "invited" | "active" | "expired" | "suspended";

export type ResolvedIdentity = {
  // Who
  authenticated: boolean;
  subjectId: string | null;
  email: string | null;
  name: string | null;

  // What they can do
  tier: Tier;
  lifecycle: MemberLifecycle | null; // null = no member record
  isInternal: boolean;
  flags: string[];

  // Session provenance
  sessionSource: "nextauth" | "access_cookie" | "both" | "none";
  accessSessionId: string | null;
  sessionExpiresAt: string | null;

  // Quick-check booleans
  innerCircleAccess: boolean;
  adminAccess: boolean;
};

/* -------------------------------------------------------------------------- */
/*  PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the canonical identity for any incoming request. Reads both
 * the NextAuth JWT (httpOnly cookie) and the aol_access session cookie.
 * Returns the HIGHER tier from both sources.
 *
 * This function performs Prisma lookups when an access session exists.
 * For edge/middleware use, see `resolveIdentityEdge()` below.
 */
export async function resolveIdentity(
  req: NextApiRequest | Request,
): Promise<ResolvedIdentity> {
  const result = emptyIdentity();

  // 1. NextAuth JWT
  const token = await safeGetToken(req);
  if (token) {
    result.authenticated = true;
    result.sessionSource = "nextauth";
    result.subjectId = String(token.sub || token.id || "");
    result.email = String(token.email || "");
    result.name = String(token.name || "");

    // Extract AoL claims stamped by JWT callback in lib/auth/config.ts
    const aol = (token as any).aol || {};
    const nextAuthTier = normalizeTier(aol.tier || token.tier || token.role);
    result.tier = nextAuthTier;
    result.isInternal = Boolean(aol.isInternal);
    result.flags = Array.isArray(aol.flags) ? aol.flags.map(String) : [];
  }

  // 2. Access session (aol_access cookie)
  const sessionId = readAccessCookieFromReq(req);
  if (sessionId) {
    const session = await verifyAccessSession(sessionId);
    if (session) {
      result.authenticated = true;
      result.accessSessionId = session.sessionId;
      result.sessionExpiresAt = session.expiresAt;

      const accessTier = normalizeTier(session.tier);
      result.tier = maxTier(result.tier, accessTier);

      // Prefer the member record from the access session
      if (session.memberId) {
        result.subjectId = session.memberId;
      }

      result.sessionSource =
        result.sessionSource === "nextauth" ? "both" : "access_cookie";

      // Sliding renewal: extend session if >50% of TTL elapsed
      await maybeRenewSession(session);
    }
  }

  // 3. Resolve lifecycle from member record
  if (result.subjectId || result.email) {
    const member = await lookupMember(result.subjectId, result.email);
    if (member) {
      result.subjectId = member.id;
      result.lifecycle = mapMemberStatus(member.status);
      result.email = result.email || member.email;
      result.name = result.name || member.name || null;

      // Lifecycle gate: non-active members capped at public
      if (result.lifecycle !== "active") {
        result.tier = "public";
      }

      // Merge tier from member record if higher
      const memberTier = normalizeTier(member.tier);
      if (result.lifecycle === "active") {
        result.tier = maxTier(result.tier, memberTier);
      }
    }
  }

  // 4. Compute derived booleans
  result.innerCircleAccess =
    result.authenticated &&
    result.lifecycle === "active" &&
    tierHasAccess(result.tier, "inner_circle");

  result.adminAccess =
    result.authenticated &&
    (result.lifecycle === "active" || result.isInternal) &&
    tierHasAccess(result.tier, "architect");

  return result;
}

/**
 * Edge-safe variant for middleware (no Prisma). Uses only the NextAuth
 * JWT claims and the presence/absence of the aol_access cookie. Does
 * NOT verify the access session against the database.
 */
export function resolveIdentityEdge(
  nextAuthToken: Record<string, unknown> | null,
  hasAccessCookie: boolean,
): ResolvedIdentity {
  const result = emptyIdentity();

  if (nextAuthToken) {
    result.authenticated = true;
    result.sessionSource = hasAccessCookie ? "both" : "nextauth";
    result.subjectId = String(nextAuthToken.sub || nextAuthToken.id || "");
    result.email = String(nextAuthToken.email || "");
    result.name = String(nextAuthToken.name || "");

    const aol = (nextAuthToken as any).aol || {};
    result.tier = normalizeTier(aol.tier || nextAuthToken.tier || nextAuthToken.role);
    result.isInternal = Boolean(aol.isInternal);
    result.flags = Array.isArray(aol.flags) ? aol.flags.map(String) : [];
    result.lifecycle = "active"; // trust JWT claim at edge
  } else if (hasAccessCookie) {
    result.authenticated = true;
    result.sessionSource = "access_cookie";
    // At edge we can't look up the session, so we trust that if the
    // cookie exists the user is at least inner_circle. The server will
    // do the real check.
    result.tier = "inner_circle";
    result.lifecycle = "active";
  }

  result.innerCircleAccess =
    result.authenticated && tierHasAccess(result.tier, "inner_circle");
  result.adminAccess =
    result.authenticated &&
    result.isInternal &&
    tierHasAccess(result.tier, "architect");

  return result;
}

/**
 * Quick access check using ResolvedIdentity.
 */
export function identityHasAccess(
  identity: ResolvedIdentity,
  requiredTier: Tier,
): boolean {
  if (!identity.authenticated) return requiredTier === "public";
  return tierHasAccess(identity.tier, requiredTier);
}

/* -------------------------------------------------------------------------- */
/*  INTERNALS                                                                  */
/* -------------------------------------------------------------------------- */

function emptyIdentity(): ResolvedIdentity {
  return {
    authenticated: false,
    subjectId: null,
    email: null,
    name: null,
    tier: "public",
    lifecycle: null,
    isInternal: false,
    flags: [],
    sessionSource: "none",
    accessSessionId: null,
    sessionExpiresAt: null,
    innerCircleAccess: false,
    adminAccess: false,
  };
}

async function safeGetToken(req: NextApiRequest | Request) {
  try {
    // getToken reads the next-auth.session-token cookie
    return await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch {
    return null;
  }
}

function readAccessCookieFromReq(req: NextApiRequest | Request): string | null {
  // Pages Router
  if ("cookies" in req && typeof (req as any).cookies === "object") {
    const cookies = (req as any).cookies;
    return cookies.aol_access || cookies.aol_session || null;
  }
  // App Router / generic Request
  const cookieHeader =
    (req as any).headers?.cookie ||
    (req as any).headers?.get?.("cookie") ||
    "";
  const match = String(cookieHeader).match(/aol_access=([^;]+)/);
  return match?.[1] || null;
}

async function verifyAccessSession(
  sessionId: string,
): Promise<{
  sessionId: string;
  memberId: string;
  tier: string;
  expiresAt: string;
  createdAt?: string;
} | null> {
  try {
    const { getSessionContext } = await import(
      "@/lib/server/auth/tokenStore.postgres"
    );
    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx.valid) return null;
    return {
      sessionId,
      memberId: ctx.memberId || "",
      tier: ctx.tier || "member",
      expiresAt: ctx.expiresAt || "",
    };
  } catch {
    return null;
  }
}

async function maybeRenewSession(session: {
  sessionId: string;
  expiresAt: string;
}): Promise<void> {
  try {
    const expiry = new Date(session.expiresAt).getTime();
    const now = Date.now();
    const ttlMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const elapsed = ttlMs - (expiry - now);

    // Renew if >50% of TTL has elapsed
    if (elapsed > ttlMs * 0.5) {
      const { prisma } = await import("@/lib/prisma");
      const newExpiry = new Date(now + ttlMs);
      await (prisma as any).session?.update?.({
        where: { sessionId: session.sessionId },
        data: { expiresAt: newExpiry.toISOString() },
      });
    }
  } catch {
    // Non-critical — session continues at current expiry
  }
}

async function lookupMember(
  id: string | null,
  email: string | null,
): Promise<{
  id: string;
  email: string;
  name: string | null;
  tier: string;
  status: string;
} | null> {
  if (!id && !email) return null;
  try {
    const { prisma } = await import("@/lib/prisma");
    const p = prisma as any;
    if (!p?.innerCircleMember?.findFirst) return null;

    const where = id
      ? { id }
      : email
        ? { email: email.toLowerCase() }
        : null;
    if (!where) return null;

    return await p.innerCircleMember.findFirst({ where });
  } catch {
    return null;
  }
}

function mapMemberStatus(status: string | null | undefined): MemberLifecycle {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "active";
  if (s === "invited" || s === "pending") return "invited";
  if (s === "suspended" || s === "paused" || s === "revoked") return "suspended";
  if (s === "expired" || s === "inactive") return "expired";
  return "active"; // default for members without explicit status
}
