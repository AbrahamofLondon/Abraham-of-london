/* lib/security/audit-log.ts */

import { prisma } from "@/lib/prisma";

export async function writeSecurityAudit(event: {
  action: string;
  severity?: "info" | "warning" | "critical";
  status?: string;
  subjectEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.systemAuditLog.create({
      data: {
        action: event.action,
        severity: event.severity || "info",
        status: event.status || "SUCCESS",
        subjectEmail: event.subjectEmail || null,
        ip: event.ip || null,
        userAgent: event.userAgent || null,
        metadata: event.metadata || {},
      },
    });
  } catch (error) {
    console.error("[writeSecurityAudit]", error);
  }
}