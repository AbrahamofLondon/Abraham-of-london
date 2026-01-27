// lib/inner-circle/access.server.ts
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";

// ==================== TYPE DEFINITIONS ====================
export type InnerCircleAccess = {
  hasAccess: boolean;
  reason?:
    | "no_cookie"
    | "invalid_cookie"
    | "rate_limited"
    | "ip_blocked"
    | "expired"
    | "no_request"
    | "build_time"
    | "local_storage"
    | "api_error";
  tier?: "inner-circle" | "inner-circle-plus" | "inner-circle-elite";
  expiresAt?: string;
  rateLimit?: {
    remaining: number;
    resetAt: number;
    limit: number;
  };
  userData?: {
    ip: string;
    userAgent: string;
    timestamp: number;
  };
};

export interface AccessCheckOptions {
  requireAuth?: boolean;
  rateLimitConfig?: RateLimitOptions;
  skipRateLimit?: boolean;
  bypassOnLocalhost?: boolean;
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message?: string;
  identifier?: "ip" | "userId";
}

// ==================== MAIN ACCESS CHECK ====================
export async function getInnerCircleAccess(
  req?: NextApiRequest | NextRequest | Request | null,
  options: AccessCheckOptions = {}
): Promise<InnerCircleAccess> {
  // Simplified server version - can add Redis/rate limiting here
  // For now, return basic access check
  
  if (!req) {
    return {
      hasAccess: false,
      reason: "build_time",
      userData: { ip: "127.0.0.1", userAgent: "static-build", timestamp: Date.now() },
    };
  }

  const ip = getClientIp(req);
  let userAgent = "";
  
  try {
    userAgent = "headers" in req
      ? (req.headers?.get?.("user-agent") || "")
      : (req as NextApiRequest).headers?.["user-agent"] || "";
  } catch {
    userAgent = "";
  }

  const userData = { ip, userAgent, timestamp: Date.now() };

  // Check cookie
  const cookieValue = getCookieValue(req, "innerCircleAccess");
  const tokenValue = getCookieValue(req, "innerCircleToken");

  if (cookieValue || tokenValue) {
    return {
      hasAccess: true,
      tier: "inner-circle",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userData,
    };
  }

  return {
    hasAccess: false,
    reason: "no_cookie",
    userData,
  };
}

// ==================== SERVER UTILITIES ====================
function getClientIp(req: any): string {
  if (!req || !req.headers) return "127.0.0.1";

  try {
    if ("headers" in req && req.headers && typeof req.headers.get === "function") {
      const edgeHeaders = req.headers;
      const forwarded = edgeHeaders.get("x-forwarded-for");
      return forwarded?.split(",")[0]?.trim() || "127.0.0.1";
    }

    const forwarded = req.headers?.["x-forwarded-for"];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(",");
      return ips[0]?.trim() || "127.0.0.1";
    }

    return req.socket?.remoteAddress || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

function getCookieValue(req: any, cookieName: string): string | null {
  try {
    if ("cookies" in req && req.cookies) {
      const cookie = req.cookies.get?.(cookieName);
      return cookie?.value || null;
    }
    return req.cookies?.[cookieName] || null;
  } catch {
    return null;
  }
}

// ==================== API MIDDLEWARE ====================
export function withInnerCircleAccess(
  handler: (req: NextApiRequest, res: any) => Promise<void> | void,
  options: AccessCheckOptions = {}
) {
  return async (req: NextApiRequest, res: any) => {
    try {
      const access = await getInnerCircleAccess(req, options);

      if (!access.hasAccess) {
        res.status(403).json({
          error: "Access Denied",
          reason: access.reason,
          message: "Inner circle access required",
        });
        return;
      }

      await handler(req, res);
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to verify access",
      });
    }
  };
}