/* lib/server/guards.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { validateAdminAccess, isInvalidAdmin } from "@/lib/server/validation";
import { isRateLimitedWithWindow } from "@/lib/server/rateLimit"; // Use the version with windowMs
import { logAuditEvent } from "@/lib/server/audit";
import { jsonErr } from "@/lib/server/http";

/**
 * ADMIN AUTHORIZATION GUARD
 */
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const admin = await validateAdminAccess(req);
  
  if (isInvalidAdmin(admin)) {
    await logAuditEvent({
      actorType: "api",
      action: "UNAUTHORIZED_ADMIN_ACCESS",
      resourceType: "admin_endpoint",
      status: "failed",
      severity: "high",
      details: { reason: admin.reason },
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress
    });

    jsonErr(res, 401, "UNAUTHORIZED", "Institutional admin access required.");
    return { ok: false as const };
  }

  return { ok: true as const, admin };
}

/**
 * RATE LIMIT GUARD
 */
export async function requireRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  key: string,
  bucket: string,
  limit: number,
  windowMs: number = 5 * 60 * 1000 // Default 5 minute window
) {
  // Use isRateLimitedWithWindow which accepts 4 arguments
  const rl = await isRateLimitedWithWindow(key, bucket, limit, windowMs);

  if (rl.limited) {
    res.setHeader("Retry-After", rl.retryAfter.toString());
    
    jsonErr(res, 429, "RATE_LIMITED", "Institutional request threshold exceeded.", {
      retryAfter: rl.retryAfter,
      limit: rl.limit,
      remaining: rl.remaining
    });
    
    return { ok: false as const, rl };
  }

  // Inject oversight headers
  res.setHeader("X-Rate-Limit-Remaining", rl.remaining.toString());
  res.setHeader("X-Rate-Limit-Limit", rl.limit.toString());
  res.setHeader("X-Rate-Limit-Reset", (Math.ceil(Date.now() / 1000) + rl.retryAfter).toString());
  
  return { ok: true as const, rl };
}