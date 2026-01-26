// ============================================================================
// 2) pages/api/pdfs/list.ts  (SERVER) — SAFE, AUDITABLE, REGISTRY-BASED LISTING
// 
//    - Optionally enriches with DB counters if prisma is present
//    - Security: admin-only by default (flip REQUIRE_ADMIN to false if needed)
// ============================================================================

import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPDFItems } from "@/lib/pdf/registry";
import prisma from "@/lib/prisma";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";

const REQUIRE_ADMIN = true;

// Minimal “ip” helper (same pattern you use elsewhere)
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

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // SECURITY BARRIER
  if (REQUIRE_ADMIN) {
    const auth = await validateAdminAccess(req as any);
    if (!auth.valid) {
      await logAuditEvent({
        actorType: "member",
        actorId: "anonymous",
        action: AUDIT_ACTIONS.ACCESS_DENIED,
        resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
        status: "failed",
        ipAddress: ip,
        details: { path: "/api/pdfs/list", reason: auth.reason || "unauthorized" },
      });
      // Obfuscate
      return res.status(404).end();
    }
  }

  try {
    const items = getAllPDFItems();

    // OPTIONAL DB ENRICHMENT (download counts per asset)
    // If your prisma tables differ, this fails gracefully.
    let downloadCounts: Record<string, number> = {};
    try {
      const rows = await prisma.downloadAuditEvent.groupBy({
        by: ["assetId"],
        _count: { id: true },
        where: { success: true },
      });
      downloadCounts = rows.reduce((acc, r) => {
        // @ts-ignore
        acc[String(r.assetId)] = r._count.id;
        return acc;
      }, {} as Record<string, number>);
    } catch {
      // silent: DB enrichment is optional
    }

    const enriched = items.map((p) => ({
      ...p,
      downloadCount: downloadCounts[p.id] ?? p.downloadCount ?? 0,
    }));

    await logAuditEvent({
      actorType: "admin",
      actorId: REQUIRE_ADMIN ? ((await validateAdminAccess(req as any)) as any).userId : "system",
      action: AUDIT_ACTIONS.READ,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "success",
      ipAddress: ip,
      details: { durationMs: Date.now() - start, count: enriched.length },
    });

    return res.status(200).json({
      success: true,
      pdfs: enriched,
      meta: {
        durationMs: Date.now() - start,
        count: enriched.length,
      },
    });
  } catch (err: any) {
    await logAuditEvent({
      actorType: "system",
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "failed",
      ipAddress: ip,
      details: { path: "/api/pdfs/list", error: err?.message || String(err) },
    });

    return res.status(500).json({ success: false, error: "Failed to list PDFs" });
  }
}
