// ============================================================================
// 3) pages/api/pdfs/generate.ts  (SERVER) — SINGLE-ASSET GENERATION ENTRYPOINT
//    - Calls your intelligent generator (scripts/pdf/intelligent-generator.ts)
//    - Audited, admin-only
// ============================================================================

import type { NextApiRequest, NextApiResponse } from "next";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";
import { generateOnePdfById } from "@/scripts/pdf/intelligent-generator";

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
      details: { path: "/api/pdfs/generate", reason: auth.reason || "unauthorized" },
    });
    return res.status(404).end();
  }

  try {
    const { id } = (req.body || {}) as { id?: string };
    if (!id || typeof id !== "string") return res.status(400).json({ success: false, error: "Missing id" });

    const result = await generateOnePdfById(id);

    await logAuditEvent({
      actorType: "admin",
      actorId: auth.userId,
      action: AUDIT_ACTIONS.WRITE,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: result.success ? "success" : "failed",
      ipAddress: ip,
      details: {
        path: "/api/pdfs/generate",
        pdfId: id,
        durationMs: Date.now() - start,
        ...result,
      },
    });

    if (!result.success) return res.status(500).json({ success: false, error: result.error || "Generation failed" });

    return res.status(200).json({
      success: true,
      filename: result.filename,
      generatedPath: result.outputPath,
      timeMs: result.timeMs,
    });
  } catch (err: any) {
    await logAuditEvent({
      actorType: "system",
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "failed",
      ipAddress: ip,
      details: { path: "/api/pdfs/generate", error: err?.message || String(err) },
    });

    return res.status(500).json({ success: false, error: "Generation failed" });
  }
}