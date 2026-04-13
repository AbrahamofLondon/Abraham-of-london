/* pages/api/system/maintenance.ts — AUTOMATED LOG RETENTION & OPTIMIZATION */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/server/prisma";
import { logAuditEvent } from "@/lib/server/audit";

type MaintenanceResponse =
  | {
      success: true;
      message: string;
      prunedRows: number;
      retentionDays: number;
    }
  | {
      success: false;
      error: string;
    };

const DEFAULT_RETENTION_DAYS = 90;

function parseRetentionDays(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return DEFAULT_RETENTION_DAYS;
  return Math.max(30, Math.min(3650, Math.floor(n)));
}

function getBearerToken(req: NextApiRequest): string {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string") return "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MaintenanceResponse>,
) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({
      success: false,
      error: "METHOD_NOT_ALLOWED",
    });
  }

  const bearer = getBearerToken(req);
  const secret = String(process.env.CRON_SECRET_KEY || "").trim();

  if (!secret || bearer !== secret) {
    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED_MAINTENANCE_REQUEST",
    });
  }

  const retentionDays = parseRetentionDays(
    req.method === "POST" ? req.body?.retentionDays : req.query.retentionDays,
  );

  try {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Prune only low-value audit/security/api logs.
    // Keep high/critical records and anything recent.
    const [systemAuditDelete, securityLogDelete, apiLogDelete, rateLimitLogDelete] =
      await prisma.$transaction([
        prisma.systemAuditLog.deleteMany({
          where: {
            createdAt: { lt: cutoff },
            severity: { in: ["info", "warn"] },
          },
        }),
        prisma.securityLog.deleteMany({
          where: {
            createdAt: { lt: cutoff },
            severity: { in: ["info", "warn"] },
          },
        }),
        prisma.apiLog.deleteMany({
          where: {
            createdAt: { lt: cutoff },
          },
        }),
        prisma.rateLimitLog.deleteMany({
          where: {
            createdAt: { lt: cutoff },
          },
        }),
      ]);

    const prunedRows =
      systemAuditDelete.count +
      securityLogDelete.count +
      apiLogDelete.count +
      rateLimitLogDelete.count;

    await logAuditEvent({
      actorType: "cron",
      action: "SYSTEM_MAINTENANCE_CLEANUP",
      resourceType: "system",
      resourceId: "audit-retention",
      status: "success",
      severity: "low",
      details: {
        prunedRows,
        retentionDays,
        cutoffIso: cutoff.toISOString(),
        deleted: {
          systemAuditLogs: systemAuditDelete.count,
          securityLogs: securityLogDelete.count,
          apiLogs: apiLogDelete.count,
          rateLimitLogs: rateLimitLogDelete.count,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `System optimized. ${prunedRows} stale logs removed.`,
      prunedRows,
      retentionDays,
    });
  } catch (error) {
    console.error("[SYSTEM_MAINTENANCE_FAILURE]", error);

    try {
      await logAuditEvent({
        actorType: "cron",
        action: "SYSTEM_MAINTENANCE_CLEANUP",
        resourceType: "system",
        resourceId: "audit-retention",
        status: "failed",
        severity: "high",
        details: {
          retentionDays,
          error:
            error instanceof Error ? error.message : "Unknown maintenance failure",
        },
      });
    } catch {
      // Never let audit failure hide the real failure.
    }

    return res.status(500).json({
      success: false,
      error: "MAINTENANCE_CYCLE_FAILED",
    });
  }
}