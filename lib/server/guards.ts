/* lib/server/guards.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { validateAdminAccess, isInvalidAdmin } from "@/lib/server/validation";
import { isRateLimited } from "@/lib/server/rateLimit"; 
import { logAuditEvent } from "@/lib/server/audit";
import { jsonErr } from "@/lib/server/http";

/**
 * ADMIN AUTHORIZATION GUARD
 * Outcome: Restricts high-gravity endpoints to verified principals.
 * Logic: Validates Bearer tokens and logs unauthorized probes for Board review.
 */
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const admin = await validateAdminAccess(req);
  
  // Use the type guard for clear type narrowing established in validation.ts
  if (isInvalidAdmin(admin)) {
    // Record the unauthorized attempt in the Audit Log
    await logAuditEvent({
      actorType: "api",
      action: "UNAUTHORIZED_ADMIN_ACCESS",
      resourceType: "admin_endpoint",
      status: "failed",
      details: { reason: admin.reason },
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress
    });

    jsonErr(res, 401, "UNAUTHORIZED", "Institutional admin access required.");
    return { ok: false as const };
  }

  // TypeScript now recognizes 'admin' as a valid AdminAuthResult with the method used
  return { ok: true as const, admin };
}

/**
 * RATE LIMIT GUARD
 * Outcome: Protects API resources from automated exhaustion.
 * Logic: Intercepts requests, checks the perimeter bucket, and injects limit headers.
 */
export async function requireRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  key: string,
  bucket: string,
  limit: number,
  windowMs: number = 5 * 60 * 1000 // Default 5 minute window
) {
  // isRateLimited returns LegacyIsRateLimitedResult { limited, retryAfter, limit, remaining }
  const rl = await isRateLimited(key, bucket, limit, windowMs);

  if (rl.limited) {
    // Standard HTTP 429 compliance
    res.setHeader("Retry-After", rl.retryAfter.toString());
    
    jsonErr(res, 429, "RATE_LIMITED", "Institutional request threshold exceeded.", {
      retryAfter: rl.retryAfter,
      limit: rl.limit,
      remaining: rl.remaining
    });
    
    return { ok: false as const, rl };
  }

  // Inject oversight headers for the client as per Enterprise standard
  res.setHeader("X-Rate-Limit-Remaining", rl.remaining.toString());
  res.setHeader("X-Rate-Limit-Limit", rl.limit.toString());
  res.setHeader("X-Rate-Limit-Reset", (Math.ceil(Date.now() / 1000) + rl.retryAfter).toString());
  
  return { ok: true as const, rl };
}
