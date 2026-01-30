// pages/api/pdfs/list.ts - SAFE VERSION
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPDFItems } from "@/lib/pdf/registry";
import prisma from "@/lib/prisma";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";

const REQUIRE_ADMIN = false; // Set to true for admin-only access

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.trim() || "unknown";
  }
  
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  
  if (typeof realIp === "string") {
    return realIp.trim();
  }
  
  return req.socket?.remoteAddress || "unknown";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  const ip = getClientIp(req);

  if (req.method !== "GET") {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // SECURITY BARRIER - Only if REQUIRE_ADMIN is true
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
    } catch (error) {
      console.error("Admin validation error:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  try {
    const items = getAllPDFItems();

    // OPTIONAL DB ENRICHMENT - Safely wrapped
    let downloadCounts: Record<string, number> = {};
    try {
      const rows = await prisma.downloadAuditEvent.groupBy({
        by: ["assetId"],
        _count: { id: true },
        where: { success: true },
      });
      
      downloadCounts = rows.reduce((acc: Record<string, number>, r: any) => {
        if (r.assetId) {
          acc[String(r.assetId)] = r._count.id;
        }
        return acc;
      }, {});
    } catch (dbError) {
      console.warn("Failed to fetch download counts:", dbError);
      // Continue without download counts
    }

    const enriched = items.map((p) => ({
      ...p,
      downloadCount: downloadCounts[p.id] ?? p.downloadCount ?? 0,
    }));

    // SAFE: Log audit event without blocking response
    try {
      let actorId = "system";
      if (REQUIRE_ADMIN) {
        const auth = await validateAdminAccess(req as any);
        actorId = (auth as any).userId || "admin";
      }
      
      await logAuditEvent({
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
      });
    } catch (auditError) {
      console.warn("Audit logging failed:", auditError);
      // Don't fail the request if audit logging fails
    }

    return res.status(200).json({
      success: true,
      pdfs: enriched,
      meta: {
        durationMs: Date.now() - start,
        count: enriched.length,
      },
    });
  } catch (err: any) {
    console.error("PDF list error:", err);
    
    // SAFE: Log error without exposing details
    try {
      await logAuditEvent({
        actorType: "system",
        action: AUDIT_ACTIONS.API_ERROR,
        resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
        status: "failed",
        ipAddress: ip,
        details: { 
          path: "/api/pdfs/list",
          error: err?.message ? "Internal server error" : String(err).slice(0, 100)
        },
      });
    } catch (auditError) {
      // Ignore audit errors in error handling
    }

    return res.status(500).json({ 
      success: false, 
      error: "Failed to list PDFs" 
    });
  }
}