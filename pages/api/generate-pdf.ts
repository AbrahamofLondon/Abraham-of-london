/* pages/api/pdfs/generate.ts - INSTITUTIONAL PDF ENTRYPOINT */

import type { NextApiRequest, NextApiResponse } from "next";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";

// STRATEGIC FIX: Import the generator using the verified naming convention 
// established in your scripts reconciliation.
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

  // BLOCK 1: Method Enforcement
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // BLOCK 2: Administrative Gating
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
    // Return 404 to avoid revealing the existence of the endpoint to non-admins
    return res.status(404).end();
  }

  try {
    // BLOCK 3: Payload Validation
    const { id } = (req.body || {}) as { id?: string };
    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "Missing institutional asset ID" });
    }

    // BLOCK 4: Execution via Intelligent Generator
    // This calls the logic responsible for markdown-to-pdf conversion
    const result = await generateOnePdfById(id);

    // BLOCK 5: Audit & Compliance Logging
    await logAuditEvent({
      actorType: "admin",
      actorId: auth.userId || "unknown_admin",
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

    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error || "Institutional PDF generation failed" 
      });
    }

    // BLOCK 6: Transmission Response
    return res.status(200).json({
      success: true,
      filename: result.filename,
      generatedPath: result.outputPath,
      timeMs: result.timeMs,
    });

  } catch (err: any) {
    // BLOCK 7: Exception Containment
    await logAuditEvent({
      actorType: "system",
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "failed",
      ipAddress: ip,
      details: { 
        path: "/api/pdfs/generate", 
        error: err?.message || String(err),
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined
      },
    });

    return res.status(500).json({ success: false, error: "Critical generation failure" });
  }
}