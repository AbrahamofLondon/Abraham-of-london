// lib/inner-circle/access.server.ts — Session-backed (tokenStore SSOT), Next-agnostic

import tiers, { type AccessTier } from "@/lib/access/tiers";
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";

export type InnerCircleAccessReason =
  | "no_request"
  | "requires_auth"
  | "insufficient_tier"
  | "session_expired"
  | "invalid_token"
  | "internal_error";

export type InnerCircleAccess = {
  hasAccess: boolean;
  reason: InnerCircleAccessReason;
  tier: AccessTier;
  sessionId?: string;
  expiresAt?: string;
};

type RequestLike = {
  headers?:
    | { cookie?: string | undefined; [k: string]: any }
    | { get?: (key: string) => string | null | undefined; [k: string]: any }
    | any;
};

type ParamsMode = { userTier?: unknown; requiresTier?: AccessTier; requiredTier?: AccessTier };

function parseCookieHeader(cookieHeader: string | undefined | null): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = String(cookieHeader || "");
  if (!raw) return out;

  raw.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) return;
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  });

  return out;
}

const ACCESS_COOKIE_KEYS = ["aol_access", "innerCircleAccess", "inner_circle_access"];

function getCookieHeader(req: RequestLike): string {
  const headers: any = req?.headers;
  return (
    (headers && typeof headers.cookie === "string" ? headers.cookie : "") ||
    (headers && typeof headers.get === "function" ? headers.get("cookie") : "") ||
    ""
  );
}

function extractSessionIdFromReq(req: RequestLike): string | null {
  const cookies = parseCookieHeader(getCookieHeader(req));
  for (const k of ACCESS_COOKIE_KEYS) {
    const v = cookies[k];
    if (v && typeof v === "string" && v.length <= 2048) return v;
  }
  return null;
}

function mapVerifyReason(reason?: string): InnerCircleAccessReason {
  const r = String(reason || "").toUpperCase();
  if (r.includes("EXPIRED") || r.includes("REVOKED")) return "session_expired";
  if (r.includes("NOT_FOUND") || r.includes("MISSING")) return "invalid_token";
  return "invalid_token";
}

export async function getInnerCircleAccess(
  reqOrParams: RequestLike | ParamsMode | any,
  requiredTierMaybe?: AccessTier
): Promise<InnerCircleAccess> {
  try {
    // params-mode
    if (
      reqOrParams &&
      typeof reqOrParams === "object" &&
      ("userTier" in reqOrParams || "requiresTier" in reqOrParams || "requiredTier" in reqOrParams)
    ) {
      const userTier = tiers.normalizeUser((reqOrParams as any).userTier);
      const requiredTier = tiers.normalizeRequired(
        (reqOrParams as any).requiresTier ?? (reqOrParams as any).requiredTier ?? "public"
      );

      if (requiredTier === "public") return { hasAccess: true, reason: "no_request", tier: userTier };

      return tiers.hasAccess(userTier, requiredTier)
        ? { hasAccess: true, reason: "no_request", tier: userTier }
        : { hasAccess: false, reason: "insufficient_tier", tier: userTier };
    }

    const requiredTier = tiers.normalizeRequired(requiredTierMaybe ?? "member");
    if (requiredTier === "public") return { hasAccess: true, reason: "no_request", tier: "public" };

    const sessionId = extractSessionIdFromReq(reqOrParams as RequestLike);
    if (!sessionId) return { hasAccess: false, reason: "requires_auth", tier: "public" };

    const v = await verifySession(sessionId);

    if (!v.ok) return { hasAccess: false, reason: "internal_error", tier: "public" };
    if (!v.valid) return { hasAccess: false, reason: mapVerifyReason(v.reason), tier: "public", sessionId };

    const userTier = tiers.normalizeUser(v.tier);
    if (!tiers.hasAccess(userTier, requiredTier)) {
      return { hasAccess: false, reason: "insufficient_tier", tier: userTier, sessionId, expiresAt: v.expiresAt };
    }

    return { hasAccess: true, reason: "no_request", tier: userTier, sessionId, expiresAt: v.expiresAt };
  } catch {
    return { hasAccess: false, reason: "internal_error", tier: "public" };
  }
}

/**
 * Normalize any input to a valid AccessTier
 * Used by admin API routes
 */
export function normalizeTier(input: unknown): AccessTier {
  return tiers.normalizeUser(input);
}

/**
 * Check if a user tier has access to a required tier
 */
export function hasTierAccess(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return tiers.hasAccess(userTier, requiredTier);
}