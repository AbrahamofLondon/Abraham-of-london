// pages/api/premium/admin/cleanup-expired-tokens.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { cleanupExpiredDownloadTokens } from "@/lib/premium/download-token";
import {
  normalizeUserTier,
  hasAccess,
  type AccessTier,
} from "@/lib/access/tier-policy";
import { logAuditEvent } from "@/lib/security/audit";
import { getCurrentAccessBinding } from "@/lib/server/current-access-binding";
import { logger } from "@/lib/logging";
import type { AoLClaims } from "@/types/auth";

const REQUIRED_ADMIN_TIER: AccessTier = "architect";
const AUDIT_RESOURCE = "premium/admin/cleanup-expired-tokens";

type SessionWithTier = Session & {
  aol?: AoLClaims;
  user?: Session["user"] & {
    id?: string;
    role?: string;
    tier?: AccessTier;
  };
};

const CleanupSchema = z.object({
  days: z.coerce
    .number()
    .min(1, "Days must be at least 1")
    .max(90, "Days cannot exceed 90")
    .default(7),
  confirm: z.literal(true),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as SessionWithTier | null;

  if (!session?.user) {
    return res.status(401).json({
      error: "Authentication required",
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
      error: "Admin access required",
      code: "INSUFFICIENT_TIER",
    });
  }

  let validatedInput: z.infer<typeof CleanupSchema>;

  try {
    validatedInput = CleanupSchema.parse({
      days: req.body?.days,
      confirm: req.body?.confirm,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    return res.status(400).json({
      error: "Invalid input",
      code: "VALIDATION_ERROR",
    });
  }

  await logAuditEvent({
    eventType: "ADMIN_ACTION_STARTED",
    userId: binding.userId,
    sessionId: binding.sessionId,
    ip: req.socket.remoteAddress ?? null,
    userAgent: req.headers["user-agent"] ?? null,
    resource: AUDIT_RESOURCE,
    metadata: {
      action: "cleanup_expired_tokens",
      parameters: {
        days: validatedInput.days,
      },
    },
  });

  try {
    const startTime = Date.now();
    const deleted = await cleanupExpiredDownloadTokens(validatedInput.days);
    const duration = Date.now() - startTime;

    await logAuditEvent({
      eventType: "TOKEN_CLEANUP_COMPLETED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        deleted,
        days: validatedInput.days,
        durationMs: duration,
        success: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        deleted,
        days: validatedInput.days,
        executedAt: new Date().toISOString(),
        durationMs: duration,
      },
      message: `Successfully cleaned up ${deleted} expired tokens`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error("[ADMIN_CLEANUP_ERROR]", {
      error: message,
    });

    await logAuditEvent({
      eventType: "TOKEN_CLEANUP_FAILED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        days: validatedInput.days,
        error: message,
      },
    });

    return res.status(500).json({
      error: "Cleanup operation failed",
      code: "INTERNAL_ERROR",
      message: "The server encountered an error while cleaning up tokens",
    });
  }
}