// lib/inner-circle/server-auth.ts — SSR Inner Circle auth gate (TS-safe, tier-based)

import type { GetServerSidePropsContext } from "next";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, hasAccess } from "@/lib/access/tier-policy";
import type { InnerCircleJWT } from "./jwt";
import { verifyInnerCircleToken } from "./jwt";

export type InnerCircleAuthResult =
  | { hasAccess: true; user: InnerCircleJWT; tier: AccessTier }
  | { hasAccess: false; user: null; tier: AccessTier; reason: "missing_token" | "invalid_token" | "insufficient_tier" };

function getTokenFromContext(ctx: GetServerSidePropsContext): string {
  const cookieToken = ctx.req.cookies?.innerCircleToken;
  if (typeof cookieToken === "string" && cookieToken.trim()) return cookieToken.trim();

  const auth = ctx.req.headers?.authorization;
  if (typeof auth === "string" && auth.trim()) {
    return auth.replace(/^Bearer\s+/i, "").trim();
  }

  return "";
}

/**
 * Validate Inner Circle access for SSR.
 * Default requirement: at least "inner-circle".
 */
export async function validateInnerCircleAccess(
  ctx: GetServerSidePropsContext,
  requiresTier: AccessTier | string = "inner-circle"
): Promise<InnerCircleAuthResult> {
  const token = getTokenFromContext(ctx);
  if (!token) return { hasAccess: false, user: null, tier: "public", reason: "missing_token" };

  const decoded = await verifyInnerCircleToken(token);
  if (!decoded) return { hasAccess: false, user: null, tier: "public", reason: "invalid_token" };

  const userTier = decoded.tier; // already normalized in verifyInnerCircleToken()
  const required = normalizeRequiredTier(requiresTier);

  if (!hasAccess(userTier, required)) {
    return { hasAccess: false, user: null, tier: userTier, reason: "insufficient_tier" };
  }

  return { hasAccess: true, user: decoded, tier: userTier };
}