// lib/server/guards.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { validateAdminAccess, isInvalidAdmin } from "@/lib/server/validation";
import { isRateLimited } from "@/lib/server/rate-limit";
import { logAuditEvent } from "@/lib/server/audit";
import { jsonErr } from "@/lib/server/http";

export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const admin = await validateAdminAccess(req);
  
  // Use the type guard for clear type narrowing
  if (isInvalidAdmin(admin)) {
    // TypeScript now knows admin has 'reason' property
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

  // TypeScript knows admin is valid here
  return { ok: true as const, admin };
}

export async function requireRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  key: string,
  bucket: string,
  limit: number
) {
  const rl = await isRateLimited(key, bucket, limit);

  if (rl.limited) {
    res.setHeader("Retry-After", rl.retryAfter.toString());
    jsonErr(res, 429, "RATE_LIMITED", "Too many requests", rl);
    return { ok: false as const, rl };
  }

  res.setHeader("X-Rate-Limit-Remaining", rl.remaining.toString());
  return { ok: true as const, rl };
}