/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";
import { getClientIp, rateLimit } from "@/lib/server/rateLimit";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";

// Core Logic Imports
import { generateMissingPdfs } from "@/scripts/pdf/intelligent-generator.server";
import { clearRegistryCache } from "@/scripts/pdf-registry";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  const ip = getClientIp(req);

  // 1. SECURITY: METHOD GUARD
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // 2. SECURITY: RATE LIMIT (3 attempts per 5 minutes per admin IP)
  const rl = rateLimit({ key: `bulk_pdf_sync:${ip}`, limit: 3, windowMs: 300_000 });
  res.setHeader("X-RateLimit-Limit", "3");
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));

  if (!rl.ok) {
    return res.status(429).json({ 
      success: false, 
      error: "Cool-down active. Please wait 5 minutes." 
    });
  }

  // 3. SECURITY: ADMIN AUTH (Return 404 if unauthorized for stealth)
  const auth = await validateAdminAccess(req as any);
  if (!auth.valid) {
    await logAuditEvent({
      actorType: "member", actorId: "anonymous",
      action: AUDIT_ACTIONS.ACCESS_DENIED,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      status: "failed", ipAddress: ip,
      details: { reason: auth.reason || "unauthorized_endpoint_hit" },
    });
    return res.status(404).end(); 
  }

  try {
    const { force = false, batchSize = 10 } = req.body;

    // 4. EXECUTION: ATOMIC GENERATION
    // This uses the .server.ts logic to safely swap files without deletion risk
    const results = await generateMissingPdfs({
      forceRefresh: force,
      batchSize: batchSize,
      createPlaceholders: true,
    });

    // 5. CACHE FLUSH: Force the registry to re-read the disk state
    clearRegistryCache();

    const okCount = results.filter((r) => r.success).length;

    // 6. AUDIT
    await logAuditEvent({
      actorType: "admin",
      actorId: auth.userId,
      action: force ? AUDIT_ACTIONS.UPDATE : AUDIT_ACTIONS.WRITE,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "success",
      ipAddress: ip,
      details: { 
        total: results.length, 
        success: okCount, 
        force,
        duration: Date.now() - start 
      },
    });

    return res.status(200).json({
      success: true,
      meta: {
        durationMs: Date.now() - start,
        total: results.length,
        success: okCount,
        mode: force ? "Full Premium Upgrade" : "Incremental Sync"
      },
      results: results.map(r => ({ id: r.id, action: r.action, status: r.success ? "OK" : "ERR" }))
    });

  } catch (err: any) {
    console.error("Critical Asset Sync Failure:", err);
    return res.status(500).json({ success: false, error: "Internal processing error." });
  }
}