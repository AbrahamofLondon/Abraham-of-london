// lib/auth/session-helpers.ts — HYBRID IDENTITY + ENTITLEMENT RESOLVER
//
// Under the Option 3 Hybrid model:
//   - NextAuth owns IDENTITY (email, role, tier in DB)
//   - AL token owns ENTITLEMENT (Inner Circle vault access)
//
// `getUnifiedSession()` reads both signals in one pass and returns a
// single object that getServerSideProps handlers can consume without
// knowing which cookie, header, or callback produced the data.

import type { GetServerSidePropsContext } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/config";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { TIER_ORDER, type AccessTier } from "@/lib/access/tier-policy";

/**
 * A NextAuth session augmented with the resolved Inner Circle entitlement
 * signal. `innerCircle` is always present on a `UnifiedSession` — the
 * entitlement state may be "no valid token" (defaults below), but the field
 * itself is non-optional so callers never have to null-check it.
 */
export type UnifiedSession = Session & {
  innerCircle: {
    hasValidToken: boolean;
    tier: AccessTier;
    expiresAt: string | null;
  };
};

function coercePolicyTier(value: string | null | undefined): AccessTier {
  const normalized = String(value ?? "public").replace(/-/g, "_");
  return (TIER_ORDER as readonly string[]).includes(normalized)
    ? (normalized as AccessTier)
    : "public";
}

/**
 * Resolve the unified session for a getServerSideProps handler.
 *
 * Returns:
 *   - `null` when no NextAuth session exists (member is not signed in at all).
 *     Callers should redirect to the NextAuth sign-in flow in this case.
 *   - `UnifiedSession` when NextAuth is valid. The `innerCircle` field tells
 *     the caller whether the AL token cookie is also valid; callers that
 *     gate on entitlement must check `innerCircle.hasValidToken`.
 *
 * Never throws. Token validation failures collapse to
 * `{ hasValidToken: false, tier: "public", expiresAt: null }`.
 */
export async function getUnifiedSession(
  context: GetServerSidePropsContext,
): Promise<UnifiedSession | null> {
  const nextAuthSession = await getServerSession(
    context.req,
    context.res,
    authOptions,
  );

  if (!nextAuthSession) return null;

  const defaultInnerCircle: UnifiedSession["innerCircle"] = {
    hasValidToken: false,
    tier: "public",
    expiresAt: null,
  };

  const sessionId = readAccessCookie(context.req);
  if (!sessionId) {
    return { ...nextAuthSession, innerCircle: defaultInnerCircle };
  }

  try {
    const ctx = await getSessionContext(sessionId);
    if (ctx.ok && ctx.valid) {
      return {
        ...nextAuthSession,
        innerCircle: {
          hasValidToken: true,
          tier: coercePolicyTier(ctx.tier),
          expiresAt: ctx.expiresAt ?? null,
        },
      };
    }
  } catch {
    // Fall through to default innerCircle — never throw from the helper.
  }

  return { ...nextAuthSession, innerCircle: defaultInnerCircle };
}
