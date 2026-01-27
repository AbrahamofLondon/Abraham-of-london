// ============================================================================
// pages/api/generate-all-pdfs.ts  (SERVER) — BULK GENERATION ENTRYPOINT
//    - Generates missing assets only (no risky deletes)
//    - Audited, admin-only
//    - Patched with rate limiting and internal auth
// ============================================================================

import type { NextApiRequest, NextApiResponse } from "next";
import { getClientIp, rateLimit } from "@/lib/server/rateLimit";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";
import { generateMissingPdfs } from "@/scripts/pdf/intelligent-generator";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  
  // PER-IP RATE LIMITING (Patched - using hard fail pattern with higher limit for admin)
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `generate_pdfs:${ip}`, limit: 5, windowMs: 60_000 });

  res.setHeader("X-RateLimit-Limit", "5");
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(rl.resetAt));

  if (!rl.ok) {
    await logAuditEvent({
      actorType: "member",
      actorId: "anonymous",
      action: AUDIT_ACTIONS.ACCESS_DENIED,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      status: "failed",
      ipAddress: ip,
      details: { 
        path: "/api/generate-all-pdfs", 
        reason: "rate_limited",
        rateLimitKey: `generate_pdfs:${ip}`
      },
    });
    return res.status(429).json({ 
      success: false, 
      error: "Too many requests. Please wait before retrying." 
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // INTERNAL AUTH VALIDATION
  const auth = await validateAdminAccess(req as any);
  if (!auth.valid) {
    await logAuditEvent({
      actorType: "member",
      actorId: "anonymous",
      action: AUDIT_ACTIONS.ACCESS_DENIED,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      status: "failed",
      ipAddress: ip,
      details: { 
        path: "/api/generate-all-pdfs", 
        reason: auth.reason || "unauthorized" 
      },
    });
    return res.status(404).end();
  }

  try {
    const results = await generateMissingPdfs();
    const okCount = results.filter((r) => r.success).length;

    await logAuditEvent({
      actorType: "admin",
      actorId: auth.userId,
      action: AUDIT_ACTIONS.WRITE,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "success",
      ipAddress: ip,
      details: {
        path: "/api/generate-all-pdfs",
        durationMs: Date.now() - start,
        okCount,
        total: results.length,
        rateLimitRemaining: rl.remaining,
      },
    });

    return res.status(200).json({
      success: true,
      count: okCount,
      results,
      meta: { 
        durationMs: Date.now() - start, 
        total: results.length,
        rateLimit: {
          limit: 5,
          remaining: rl.remaining,
          resetAt: rl.resetAt
        }
      },
    });
  } catch (err: any) {
    await logAuditEvent({
      actorType: "system",
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "failed",
      ipAddress: ip,
      details: { 
        path: "/api/generate-all-pdfs", 
        error: err?.message || String(err),
        rateLimitRemaining: rl.remaining,
      },
    });

    return res.status(500).json({ 
      success: false, 
      error: "Bulk generation failed" 
    });
  }
}