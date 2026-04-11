/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/auth/server.ts — SERVER-ONLY AUTH UTILITIES (SSOT)
 * Safe for API routes, getServerSideProps, and server modules.
 * ⚠️ DO NOT IMPORT IN CLIENT COMPONENTS
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";
import { sha256Hex } from "@/lib/auth-utils";

// ------------------------------
// 🔐 BUILD-TIME SAFETY GUARD
// ------------------------------
const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

/**
 * Get server-side session (safe for API routes and getServerSideProps)
 */
export async function getAuthSession() {
  if (IS_BUILD) return null;
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("[AUTH_SERVER] Failed to get session:", error);
    return null;
  }
}

/**
 * Resolve user tier from session (preferred) or DB (fallback).
 * - Primary: session.aol.tier (SSOT)
 * - Secondary: innerCircleMember by email/emailHash
 */
export async function getUserTierFromDb(params: { userId?: string; email?: string | null }): Promise<AccessTier> {
  if (IS_BUILD) return "public";

  const email = (params.email || "").trim().toLowerCase();
  if (!email) return "public";

  const emailHash = sha256Hex(email);

  try {
    const member = await prisma.innerCircleMember.findFirst({
      where: {
        OR: [{ email }, { emailHash }],
      },
      select: { tier: true, status: true },
    });

    if (!member || member.status !== "active") return "public";
    return normalizeUserTier(member.tier);
  } catch (error) {
    console.error("[AUTH_SERVER] Failed to resolve tier from DB:", error);
    return "public";
  }
}

/**
 * Validate current session (SSOT)
 */
export async function validateUserSession(): Promise<{
  valid: boolean;
  userId?: string;
  tier?: AccessTier;
}> {
  if (IS_BUILD) return { valid: false };

  const session = await getAuthSession();
  if (!session?.user) return { valid: false };

  // Prefer aol tier if present
  const tierFromSession = (session as any)?.aol?.tier ?? (session.user as any)?.tier ?? (session.user as any)?.role;
  const tier = tierFromSession ? normalizeUserTier(tierFromSession) : await getUserTierFromDb({ email: session.user.email });

  return {
    valid: true,
    userId: String((session.user as any).id || ""),
    tier,
  };
}

/**
 * Check if user has required tier access (SSOT)
 */
export async function checkUserAccess(requiredTier: AccessTier): Promise<boolean> {
  if (IS_BUILD) return requiredTier === "public";

  const sess = await validateUserSession();
  if (!sess.valid || !sess.tier) return requiredTier === "public";

  return hasAccess(sess.tier, requiredTier);
}

/**
 * Get user permissions from session if present (optional)
 * This does NOT assume prisma.user exists.
 */
export async function getUserPermissions(): Promise<string[]> {
  if (IS_BUILD) return [];
  const session = await getAuthSession();
  const perms = (session as any)?.user?.permissions;
  return Array.isArray(perms) ? perms.map(String) : [];
}

/**
 * Optional API key verification (feature-flagged).
 * Only works if you actually have prisma.apiKey model.
 */
export async function verifyApiKey(_apiKey: string): Promise<{
  valid: boolean;
  tier?: AccessTier;
  userId?: string;
}> {
  if (IS_BUILD) return { valid: false };

  // If you don't have ApiKey model in Prisma, this must be disabled.
  if (!process.env.ENABLE_API_KEYS) return { valid: false };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiKeyModel: any = (prisma as any).apiKey;
    if (!apiKeyModel) return { valid: false };

    const apiKey = String(_apiKey || "").trim();
    if (!apiKey) return { valid: false };

    const key = await apiKeyModel.findUnique({
      where: { key: apiKey },
      include: { member: { select: { id: true, tier: true, status: true } } },
    });

    if (!key) return { valid: false };
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return { valid: false };
    if (!key.member || key.member.status !== "active") return { valid: false };

    return {
      valid: true,
      userId: String(key.member.id),
      tier: normalizeUserTier(key.member.tier),
    };
  } catch (error) {
    console.error("[AUTH_SERVER] API key verification failed:", error);
    return { valid: false };
  }
}

// ─── CANONICAL GUARD PRIMITIVES ──────────────────────────────────────────────
// Every protected route handler MUST use one of these.

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  tier: AccessTier;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string; status: number };

/** Require authenticated user. Returns typed user or error. */
export async function requireUser(): Promise<AuthResult> {
  if (IS_BUILD) return { ok: false, error: "Build phase", status: 503 };
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return { ok: false, error: "Authentication required", status: 401 };
  }
  const user = session.user as any;
  const tierRaw = (session as any).aol?.tier ?? user.tier ?? user.role ?? "public";
  return {
    ok: true,
    user: {
      id: String(user.id || ""),
      email: user.email!,
      name: user.name ?? null,
      role: user.role ?? "USER",
      tier: normalizeUserTier(tierRaw),
    },
  };
}

/** Require admin access. */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const isAdmin =
    auth.user.role === "ADMIN" ||
    auth.user.role === "SUPER_ADMIN" ||
    hasAccess(auth.user.tier, "architect" as AccessTier);
  if (!isAdmin) return { ok: false, error: "Admin access required", status: 403 };
  return auth;
}

/** Require specific role. */
export async function requireRole(role: string): Promise<AuthResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (auth.user.role !== role) return { ok: false, error: `Role '${role}' required`, status: 403 };
  return auth;
}

/** Get user if authenticated, null otherwise. Never throws. */
export async function getOptionalUser(): Promise<AuthUser | null> {
  const auth = await requireUser();
  return auth.ok ? auth.user : null;
}

/** Documents that a route is intentionally public. */
export function assertPublicRoute(): void {}

// ─── AUTHORIZATION MATRIX ────────────────────────────────────────────────────
// PATH                              ACCESS     GUARD
// /diagnostics/**                   PUBLIC     assertPublicRoute()
// /consulting/strategy-room         PUBLIC     assertPublicRoute()
// /vault/**                         PREMIUM    requireUser() + checkUserAccess("member")
// /admin/**                         ADMIN      requireAdmin()
// /api/admin/**                     ADMIN      requireAdmin()
// /api/executive-reporting/run      AUTH       requireUser()
// /api/alignment/enterprise/**      AUTH       requireUser()
// /api/download/[token]             TOKEN      token verification
// /api/cron/**                      INTERNAL   CRON_SECRET header
// /api/purpose-alignment/**         PUBLIC     assertPublicRoute()
// /api/strategy-room/**             PUBLIC     assertPublicRoute()
// /api/decision/**                  PUBLIC     assertPublicRoute()

export type { AccessTier };