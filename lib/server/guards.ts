/* lib/server/guards.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { validateAdminAccess, isInvalidAdmin } from "@/lib/server/validation";
// FIXED: Path aligned to rateLimit.ts (no hyphen) and named import verified
import { isRateLimited } from "@/lib/server/rateLimit"; 
import { logAuditEvent } from "@/lib/server/audit";
import { jsonErr } from "@/lib/server/http";

/**
 * ADMIN AUTHORIZATION GUARD
 * Outcome: Ensures only verified administrators can access sensitive endpoints.
 */
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const admin = await validateAdminAccess(req);
  
  if (isInvalidAdmin(admin)) {
    await logAuditEvent({
      actorType: "api",
      action: "unauthorized_access",
      resourceType: "admin",
      status: "failed",
      details: { reason: admin.reason },
    });

    jsonErr(res, 401, "UNAUTHORIZED", "Admin access required");
    return { ok: false as const };
  }

  return { ok: true as const, admin };
}

/**
 * RATE LIMIT GUARD
 * Outcome: Deterministic request throttling per bucket.
 * Principled Analysis: Reuses the legacy wrapper from rateLimit.ts for backward compatibility.
 */
export async function requireRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  key: string,
  bucket: string,
  limit: number
) {
  // isRateLimited returns LegacyIsRateLimitedResult { limited, retryAfter, limit, remaining }
  const rl = await isRateLimited(key, bucket, limit);

  if (rl.limited) {
    res.setHeader("Retry-After", rl.retryAfter.toString());
    jsonErr(res, 429, "RATE_LIMITED", "Too many requests", {
      retryAfter: rl.retryAfter,
      limit: rl.limit,
      remaining: rl.remaining
    });
    return { ok: false as const, rl };
  }

  res.setHeader("X-Rate-Limit-Remaining", rl.remaining.toString());
  res.setHeader("X-Rate-Limit-Limit", rl.limit.toString());
  
  return { ok: true as const, rl };
}