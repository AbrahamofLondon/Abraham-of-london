/* pages/api/system/maintenance.ts — AUTOMATED LOG RETENTION & OPTIMIZATION */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { auditLogger } from "@/lib/server/db/audit";

type MaintenanceResponse =
  | { success: true; message: string; prunedRows: number; retentionDays: number; }
  | { success: false; error: string; };

function getBearerToken(req: NextApiRequest): string {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string") return "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MaintenanceResponse>) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });

  const secret = String(process.env.CRON_SECRET_KEY || "").trim();
  const bearer = getBearerToken(req);

  if (!secret || bearer !== secret) {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED_MAINTENANCE_REQUEST" });
  }

  // Define Retention Window
  const retentionDays = 90; 
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    // 1. Prune Old Audit Logs via Prisma
    const { count } = await prisma.systemAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    // 2. Log the Successful Maintenance
    await auditLogger.log({
      action: "SYSTEM_MAINTENANCE_CLEANUP",
      category: "SYSTEM",
      severity: "info",
      actorType: "system", // Fixed from "service" to match your DB schema
      status: "success",
      metadata: {
        prunedRows: count,
        retentionPolicy: `${retentionDays}_DAYS`,
        cutoffDate: cutoffDate.toISOString(),
        status: "OPTIMIZED"
      }
    });

    return res.status(200).json({
      success: true,
      message: `Directorate logs optimized. ${count} records purged.`,
      prunedRows: count,
      retentionDays
    });

  } catch (error) {
    console.error("[SYSTEM_MAINTENANCE_FAILURE]", error);
    
    // Log failure record
    await auditLogger.log({
      action: "SYSTEM_MAINTENANCE_FAILED",
      category: "SYSTEM",
      severity: "critical",
      actorType: "system",
      status: "failure",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown failure",
        retentionPolicy: `${retentionDays}_DAYS`
      }
    });

    return res.status(500).json({ success: false, error: "MAINTENANCE_CYCLE_FAILED" });
  }
}