/* lib/server/db/audit.ts — SYSTEMATIC DATABASE INTERFACE */
import "server-only";

import { prisma } from "@/lib/prisma.server";

export interface AuditLogInput {
  action: string;
  userId?: string | null;
  userEmail?: string | null;
  briefId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  severity?: "info" | "warning" | "critical";
  // Optional metadata payload (doesn't break callers if unused)
  details?: Record<string, any> | null;
}

type Severity = "low" | "medium" | "high";

/**
 * Map old severity words to the system log's severity scale.
 * (Keeps callers stable, keeps DB consistent.)
 */
function toDbSeverity(s?: AuditLogInput["severity"]): Severity {
  if (s === "critical") return "high";
  if (s === "warning") return "medium";
  return "low";
}

export const auditLogger = {
  /**
   * Commits an immutable record of a security/intelligence event to Postgres.
   * Fail-soft: never throws to avoid cascading failures.
   */
  async log(input: AuditLogInput) {
    try {
      return await prisma.systemAuditLog.create({
        data: {
          actorType: "user",
          action: input.action,

          // Align with existing schema you've used elsewhere
          userId: input.userId ?? null,
          userEmail: input.userEmail ?? null,

          // If your schema doesn't have these fields, delete them here
          resourceType: "intelligence",
          resourceId: input.briefId ?? null,

          ipAddress: input.ip ?? null,
          userAgent: input.userAgent ?? null,

          status: "success",
          severity: toDbSeverity(input.severity),

          details: input.details ?? undefined,
        },
      });
    } catch (error) {
      console.error("[AUDIT_CRITICAL_FAILURE]", error);
      return null;
    }
  },

  /**
   * Retrieves latest logs for the Audit Dashboard.
   */
  async getLatestLogs(limit = 50) {
    return await prisma.systemAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  },
};