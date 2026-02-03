/* lib/server/db/audit.ts — SYSTEMATIC DATABASE INTERFACE */
import { prisma } from "@/lib/server/prisma";

export interface AuditLogInput {
  action: string;
  userId: string;
  userEmail: string;
  briefId: string;
  ip: string;
  userAgent?: string;
  severity?: "info" | "warning" | "critical";
}

export const auditLogger = {
  /**
   * Commits an immutable record of an intelligence event to Postgres.
   */
  async log(input: AuditLogInput) {
    try {
      return await prisma.auditLog.create({
        data: {
          action: input.action,
          userId: input.userId,
          userEmail: input.userEmail,
          briefId: input.briefId,
          ip: input.ip,
          userAgent: input.userAgent,
          severity: input.severity || "info",
        },
      });
    } catch (error) {
      // Production Safety: Fallback to console if DB is unreachable to ensure record exists in logs
      console.error("[AUDIT_CRITICAL_FAILURE]", error);
    }
  },

  /**
   * Retrieves latest logs for the Audit Dashboard.
   */
  async getLatestLogs(limit = 50) {
    return await prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
  }
};