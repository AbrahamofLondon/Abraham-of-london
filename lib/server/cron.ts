/* lib/server/cron.ts — Institutional Hygiene (schema-aligned, stable across Prisma versions) */
import "server-only";

import { prisma } from "@/lib/prisma.server";
import { logAuditEvent } from "@/lib/server/audit";

export async function executeInstitutionalHygiene() {
  const now = new Date();

  try {
    // 1) REVOKE EXPIRED KEYS (schema-aligned: revokedReason exists, revokedAt exists)
    const expiredKeys = await prisma.innerCircleKey.updateMany({
      where: {
        status: "active",
        expiresAt: { lt: now },
      },
      data: {
        status: "revoked",
        revokedAt: now,
        revokedReason: "TEMPORAL_EXPIRY",
      },
    });

    if (expiredKeys.count > 0) {
      await logAuditEvent({
        actorType: "system",
        action: "AUTO_REVOCATION_EXPIRY",
        resourceType: "security",
        resourceId: "inner_circle_keys",
        status: "success",
        severity: "medium",
        details: { count: expiredKeys.count },
      });
    }

    // 2) IDENTIFY SECURITY BREACH PATTERNS (last 24h)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // ✅ Local type: Prisma-agnostic, avoids implicit-any and version-specific payload types
    type AuditGroup = {
      ipAddress: string | null;
      _count: { _all: number };
    };

    // Group by ipAddress, count occurrences of RATE_LIMIT_EXCEEDED
    const grouped = (await prisma.systemAuditLog.groupBy({
      by: ["ipAddress"],
      where: {
        action: "RATE_LIMIT_EXCEEDED",
        createdAt: { gte: yesterday },
        ipAddress: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 200, // cap to keep it cheap
    })) as AuditGroup[];

    // Threshold
    const threats = grouped.filter((g) => g._count._all > 5);

    // 3) LOG THREATS
    for (const t of threats) {
      // ipAddress should be non-null due to query, but keep fallback anyway
      const ip = t.ipAddress ?? "unknown";
      const breachCount = t._count._all;

      await logAuditEvent({
        actorType: "system",
        action: "SECURITY_THREAT_DETECTED",
        resourceType: "security",
        resourceId: "ip_perimeter",
        status: "warning",
        severity: "medium",
        ipAddress: ip,
        details: { ip, breachCount },
      });
    }

    return {
      success: true,
      expiredRevoked: expiredKeys.count,
      threatsDetected: threats.length,
    };
  } catch (error) {
    console.error("[CRON_FAILURE] Institutional hygiene failed:", error);

    // Best-effort audit (must not throw)
    try {
      await logAuditEvent({
        actorType: "system",
        action: "CRON_HYGIENE_FAILURE",
        resourceType: "system",
        resourceId: "executeInstitutionalHygiene",
        status: "failed",
        severity: "high",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } catch {
      // swallow
    }

    return { success: false, error: String(error) };
  }
}