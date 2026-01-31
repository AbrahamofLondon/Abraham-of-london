/* pages/api/pdfs/list.ts — INSTITUTIONAL DATA ACCESS (SAFE MODE) */
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPDFItems } from "@/lib/pdf/registry";
import prisma from "@/lib/prisma";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";

const REQUIRE_ADMIN = false;

/**
 * Institutional IP Resolution
 * Prioritizes high-integrity headers for proxied environments.
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0].trim();
  if (typeof realIp === "string") return realIp.trim();
  
  return req.socket?.remoteAddress || "127.0.0.1";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  const ip = getClientIp(req);

  if (req.method !== "GET") {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // 1. AUTHENTICATION BARRIER
  let actorId = "system";
  if (REQUIRE_ADMIN) {
    try {
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
        return res.status(404).json({ success: false, error: "Not found" });
      }
      actorId = (auth as any).userId || "admin";
    } catch (error) {
      console.error("[SECURITY] Admin validation failure:", error);
      return res.status(500).json({ success: false, error: "Security validation error" });
    }
  }

  try {
    // 2. PRIMARY CONTENT RETRIEVAL (Local Registry)
    const items = getAllPDFItems();

    // 3. SECONDARY DATA ENRICHMENT (Prisma)
    // We treat DB as non-critical here to ensure the PDF list remains available.
    let downloadCounts: Record<string, number> = {};
    try {
      // Check if prisma is initialized properly before query
      const rows = await prisma.downloadAuditEvent.groupBy({
        by: ["assetId"],
        _count: { id: true },
        where: { success: true },
      });
      
      downloadCounts = rows.reduce((acc: Record<string, number>, r: any) => {
        if (r.assetId) acc[String(r.assetId)] = r._count.id;
        return acc;
      }, {});
    } catch (dbError: any) {
      // Specifically catch the DATABASE_URL error to prevent log bloat
      const isConnError = dbError.message?.includes("postgresql://");
      console.warn(`[PRISMA_NON_FATAL] ${isConnError ? "DB Connection Missing" : "Aggregation failed"}`);
    }

    const enriched = items.map((p) => ({
      ...p,
      downloadCount: downloadCounts[p.id] ?? p.downloadCount ?? 0,
    }));

    // 4. AUDIT LOGGING (Post-process)
    // Fire-and-forget approach ensures low latency for the reader.
    logAuditEvent({
      actorType: REQUIRE_ADMIN ? "admin" : "member",
      actorId,
      action: AUDIT_ACTIONS.READ,
      resourceType: AUDIT_CATEGORIES.DATA_ACCESS,
      status: "success",
      ipAddress: ip,
      details: { 
        durationMs: Date.now() - start, 
        count: enriched.length,
        adminOnly: REQUIRE_ADMIN 
      },
    }).catch(e => console.error("[AUDIT] Background logging failed:", e.message));

    // 5. FINAL RESPONSE
    return res.status(200).json({
      success: true,
      pdfs: enriched,
      meta: {
        durationMs: Date.now() - start,
        count: enriched.length,
      },
    });

  } catch (err: any) {
    console.error("[API_FATAL] PDF List Handler Exception:", err);
    
    return res.status(500).json({ 
      success: false, 
      error: "An institutional error occurred while retrieving resources." 
    });
  }
}