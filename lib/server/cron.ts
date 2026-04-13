/* lib/server/cron.ts — Institutional Hygiene (Schema-Aligned) */
import "server-only";

import { prisma } from "@/lib/prisma.server";
import { auditLogger } from "@/lib/server/db/audit";

type AuditGroup = {
  ipAddress: string | null;
  _count: {
    _all?: number;
    ipAddress?: number;
  };
};

function safeThreatCount(group: AuditGroup): number {
  return group._count?._all ?? group._count?.ipAddress ?? 0;
}

export async function executeInstitutionalHygiene() {
  const now = new Date();

  try {
    // 1) REVOKE EXPIRED KEYS
    const expiredKeys = await prisma.innerCircleKey.updateMany({
      where: {
        status: "active",
        expiresAt: { lt: now },
      },
      data: {
        status: "revoked",
      },
    });

    if (expiredKeys.count > 0) {
      await auditLogger.log({
        action: "AUTO_REVOCATION_EXPIRY",
        severity: "info",
        actorId: "SYSTEM_CRON", // Identifying the actor as the system service
        actorType: "system",
        status: "success",
        metadata: {
          count: expiredKeys.count,
          reason: "TEMPORAL_EXPIRY",
        },
      });
    }

    // 2) IDENTIFY SECURITY BREACH PATTERNS (last 24h)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const rawGrouped = await prisma.systemAuditLog.groupBy({
      by: ["ipAddress"],
      where: {
        action: "RATE_LIMIT_EXCEEDED",
        createdAt: { gte: yesterday },
        ipAddress: { not: null },
      },
      _count: { _all: true },
      orderBy: {
        _count: { ipAddress: "desc" },
      },
      take: 200,
    });

    const grouped = rawGrouped as unknown as AuditGroup[];
    const threats = grouped.filter((group) => safeThreatCount(group) > 5);

    // 3) LOG THREATS
    for (const threat of threats) {
      const ip = threat.ipAddress ?? "unknown";
      const breachCount = safeThreatCount(threat);

      await auditLogger.log({
        action: "SECURITY_THREAT_DETECTED",
        severity: "warn",
        actorId: "SECURITY_MONITOR",
        actorType: "system",
        ipAddress: ip,
        metadata: {
          breachCount,
          threshold: 5,
        },
      });
    }

    return {
      success: true,
      expiredRevoked: expiredKeys.count,
      threatsDetected: threats.length,
    };
  } catch (error) {
    console.error("[CRON_FAILURE] Institutional hygiene failed:", error);

    try {
      await auditLogger.log({
        action: "CRON_HYGIENE_FAILURE",
        severity: "critical",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : String(error),
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      /* swallow */
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
