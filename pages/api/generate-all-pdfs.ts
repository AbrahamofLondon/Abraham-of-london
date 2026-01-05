// ============================================================================
// 4) pages/api/pdfs/generate-all.ts  (SERVER) — BULK GENERATION ENTRYPOINT
//    - Generates missing assets only (no risky deletes)
//    - Audited, admin-only
// ============================================================================

import type { NextApiRequest, NextApiResponse } from "next";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";
import { generateMissingPdfs } from "@/scripts/pdf/intelligent-generator";

function getClientIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  return Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === "string"
      ? forwarded.split(",")[0]
      : typeof realIp === "string"
        ? realIp
        : req.socket?.remoteAddress || "unknown";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  const ip = getClientIp(req);

  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const auth = await validateAdminAccess(req as any);
  if (!auth.valid) {
    await logAuditEvent({
      actorType: "member",
      actorId: "anonymous",
      action: AUDIT_ACTIONS.ACCESS_DENIED,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      status: "failed",
      ipAddress: ip,
      details: { path: "/api/pdfs/generate-all", reason: auth.reason || "unauthorized" },
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
        path: "/api/pdfs/generate-all",
        durationMs: Date.now() - start,
        okCount,
        total: results.length,
      },
    });

    return res.status(200).json({
      success: true,
      count: okCount,
      results,
      meta: { durationMs: Date.now() - start, total: results.length },
    });
  } catch (err: any) {
    await logAuditEvent({
      actorType: "system",
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "failed",
      ipAddress: ip,
      details: { path: "/api/pdfs/generate-all", error: err?.message || String(err) },
    });

    return res.status(500).json({ success: false, error: "Bulk generation failed" });
  }
}