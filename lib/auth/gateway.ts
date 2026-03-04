// lib/auth/gateway.ts — TYPE-SAFE + NORMALIZED (Pages Router safe, SSOT session-backed)

import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/server/auth/admin-session";
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

/**
 * Infer the TRUE return types from actual functions.
 */
type AdminSession = Awaited<ReturnType<typeof getAdminSession>>;
type InnerCircleAccess = Awaited<ReturnType<typeof getInnerCircleAccess>>;

type AuthGatewayResult = {
  adminSession: {
    user: AdminSession extends { user: infer U } ? U : any;
    isAuthenticated: boolean;
    isAdmin: boolean;
  };
  innerCircleAccess: {
    hasAccess: boolean;
    memberId: string | null;
    tier: string | null;
    reason?: string;
    sessionId?: string;
    expiresAt?: string;
  };
  combined: {
    hasAnyAccess: boolean;
    isAuthenticated: boolean;
  };
};

/**
 * Convert Request -> minimal NextRequest-like surface for cookie/header access.
 */
function toCompatibleReq(request: NextRequest | Request): any {
  if (request instanceof NextRequest) return request;

  const headers = new Headers();
  request.headers.forEach((value, key) => headers.append(key, value));

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    const value = rest.join("=");
    if (name && value) cookies[name] = value;
  });

  return {
    headers,
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value ? { value } : null;
      },
    },
    url: request.url,
    method: request.method,
  };
}

/**
 * Normalize whatever getInnerCircleAccess() returns into stable contract.
 */
function normalizeInnerCircle(inner: InnerCircleAccess | null): {
  hasAccess: boolean;
  memberId: string | null;
  tier: string | null;
  reason?: string;
  sessionId?: string;
  expiresAt?: string;
} {
  if (!inner) {
    return { hasAccess: false, memberId: null, tier: null, reason: "INNER_CIRCLE_UNAVAILABLE" };
  }

  const anyInner = inner as any;

  // Your access.server.ts returns: { hasAccess, reason, tier, sessionId?, expiresAt? }
  const hasAccess = Boolean(anyInner.hasAccess);

  // memberId may not always be present in your access object; keep null if absent
  const memberId: string | null =
    anyInner.memberId ??
    anyInner.userId ??
    null;

  const tier: string | null =
    anyInner.tier ? String(anyInner.tier) : null;

  const reason: string | undefined =
    anyInner.reason ? String(anyInner.reason) : (hasAccess ? undefined : "INNER_CIRCLE_REQUIRED");

  const sessionId: string | undefined =
    anyInner.sessionId ? String(anyInner.sessionId) : undefined;

  const expiresAt: string | undefined =
    anyInner.expiresAt ? String(anyInner.expiresAt) : undefined;

  return { hasAccess, memberId, tier, reason, sessionId, expiresAt };
}

/**
 * Unified authentication gateway for both admin and inner-circle access.
 */
export async function authGateway(request: NextRequest | Request): Promise<AuthGatewayResult> {
  const compatibleReq = toCompatibleReq(request);

  const [adminAuth, innerCircleAuth] = await Promise.allSettled([
    getAdminSession(compatibleReq),
    // getInnerCircleAccess is async in SSOT session-backed version
    getInnerCircleAccess(compatibleReq as any),
  ]);

  const admin: AdminSession | null = adminAuth.status === "fulfilled" ? adminAuth.value : null;
  const innerRaw: InnerCircleAccess | null = innerCircleAuth.status === "fulfilled" ? innerCircleAuth.value : null;

  const isAdmin = Boolean((admin as any)?.isAdmin === true || (admin as any)?.user?.isAdmin === true);
  const isAuthenticated = Boolean((admin as any)?.user);

  const innerCircle = normalizeInnerCircle(innerRaw);

  const hasAnyAccess = isAdmin || innerCircle.hasAccess;

  return {
    adminSession: {
      user: (admin as any)?.user ?? null,
      isAuthenticated,
      isAdmin,
    },
    innerCircleAccess: innerCircle,
    combined: {
      hasAnyAccess,
      // if they have any access, they are effectively authenticated for gated routes
      isAuthenticated: hasAnyAccess,
    },
  };
}

/**
 * Check if user has access to a specific tier.
 */
export async function checkTierAccess(
  request: NextRequest | Request,
  requiredTier: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  const auth = await authGateway(request);

  // Admins get everything
  if (auth.adminSession.isAdmin) return { hasAccess: true };

  // Must have inner-circle access
  if (!auth.innerCircleAccess.hasAccess) {
    return {
      hasAccess: false,
      reason: auth.innerCircleAccess.reason || "INNER_CIRCLE_REQUIRED",
    };
  }

  const userTier = tiers.normalizeUser((auth.innerCircleAccess.tier || "").toLowerCase() as any);
  const reqTier = tiers.normalizeRequired((requiredTier || "").toLowerCase() as any);

  if (!tiers.hasAccess(userTier, reqTier)) {
    return {
      hasAccess: false,
      reason: `INSUFFICIENT_TIER: You have ${auth.innerCircleAccess.tier} but ${requiredTier} is required`,
    };
  }

  return { hasAccess: true };
}

/**
 * Middleware wrapper for route handlers.
 */
export function withAuth(
  handler: (request: NextRequest | Request, context: any) => Promise<Response> | Response
) {
  return async function (request: NextRequest | Request, ...args: any[]) {
    try {
      const auth = await authGateway(request);

      if (!auth.combined.hasAnyAccess) {
        return new Response(
          JSON.stringify({
            error: "Authentication required",
            code: "AUTH_REQUIRED",
            reason: auth.innerCircleAccess.reason,
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      return handler(request, { auth, request, args });
    } catch (error) {
      console.error("[AuthGateway] Error:", error);

      const msg = error instanceof Error ? error.message : "Internal server error";
      const status = msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired") ? 401 : 500;

      return new Response(
        JSON.stringify({
          error: "Authentication system error",
          details: process.env.NODE_ENV === "development" ? msg : undefined,
          code: "AUTH_SYSTEM_ERROR",
        }),
        { status, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}