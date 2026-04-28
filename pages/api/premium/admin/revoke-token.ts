// pages/api/premium/admin/revoke-token.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/options";
import {
  normalizeUserTier,
  hasAccess,
  type AccessTier,
} from "@/lib/access/tier-policy";
import { revokeDownloadTokenByTokenId } from "@/lib/premium/download-token";
import { logAuditEvent } from "@/lib/security/audit";
import { limitIp, setRateLimitHeaders } from "@/lib/security/rate-limit";
import { validateTokenId } from "@/lib/premium/token-validation";
import { getCurrentAccessBinding } from "@/lib/server/current-access-binding";
import { withCsrfProtection } from "@/lib/security/csrf";
import { logger } from "@/lib/logging";
import type { AoLClaims } from "@/types/auth";

const REQUIRED_ADMIN_TIER: AccessTier = "architect";
const AUDIT_RESOURCE = "premium/admin/revoke-token";

const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,
  max: 10,
};

type SessionWithTier = Session & {
  aol?: AoLClaims;
  user?: Session["user"] & {
    id?: string;
    role?: string;
    tier?: AccessTier;
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const rateLimit = await limitIp(req, "revoke-token", RATE_LIMIT_CONFIG);
  setRateLimitHeaders(res, rateLimit);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Too many requests",
      code: "RATE_LIMITED",
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
  }

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as SessionWithTier | null;

  if (!session?.user) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  }

  const binding = await getCurrentAccessBinding(req, res);

  const sessionUser = session.user;
  const sessionAol = session.aol;

  const userTier = normalizeUserTier(
    sessionUser?.tier ??
      sessionAol?.tier ??
      "public",
  );

  if (!hasAccess(userTier, REQUIRED_ADMIN_TIER)) {
    await logAuditEvent({
      eventType: "ADMIN_ACCESS_DENIED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        attemptedTier: userTier,
        requiredTier: REQUIRED_ADMIN_TIER,
      },
    });

    return res.status(403).json({
      error: "Insufficient clearance",
      code: "INSUFFICIENT_TIER",
    });
  }

  const tokenId =
    typeof req.body?.tokenId === "string"
      ? req.body.tokenId.trim()
      : "";

  if (!tokenId) {
    return res.status(400).json({
      error: "tokenId is required",
      code: "MISSING_TOKEN_ID",
    });
  }

  const validation = validateTokenId(tokenId);
  if (!validation.valid) {
    return res.status(400).json({
      error: validation.error || "Invalid token ID format",
      code: "INVALID_TOKEN_ID",
    });
  }

  try {
    const revoked = await revokeDownloadTokenByTokenId(tokenId);

    await logAuditEvent({
      eventType: "TOKEN_REVOKED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        tokenId,
        revokedBy: binding.userId,
        userTier,
        success: revoked,
      },
    });

    if (!revoked) {
      return res.status(404).json({
        error: "Token not found",
        code: "TOKEN_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token revoked successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error("[PREMIUM_REVOKE_TOKEN_ERROR]", {
      error: message,
      userId: binding.userId,
      tokenIdPreview: `${tokenId.substring(0, 8)}...`,
    });

    await logAuditEvent({
      eventType: "TOKEN_REVOCATION_FAILED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        tokenId,
        error: message,
      },
    });

    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}

export default withCsrfProtection(handler);

export const config = {
  api: {
    bodyParser: true,
    externalResolver: false,
  },
};
