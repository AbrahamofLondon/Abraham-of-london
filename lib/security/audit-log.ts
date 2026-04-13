/* lib/security/audit-log.ts */

import { prisma } from "@/lib/prisma";

export async function writeSecurityAudit(event: {
  action: string;
  severity?: "debug" | "info" | "warn" | "error" | "critical" | "warning";
  status?: string;
  subjectEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
  actorEmail?: string | null;
  resourceId?: string | null;
  requestId?: string | null;
  category?: string | null;
  subCategory?: string | null;
  errorMessage?: string | null;
}) {
  try {
    const severity =
      event.severity === "warning"
        ? "warn"
        : event.severity || "info";

    await prisma.systemAuditLog.create({
      data: {
        action: event.action,
        severity,
        status: event.status || "SUCCESS",
        actorId: event.actorId || null,
        actorEmail: event.actorEmail || event.subjectEmail || null,
        resourceId: event.resourceId || null,
        ipAddress: event.ip || null,
        userAgent: event.userAgent || null,
        requestId: event.requestId || null,
        category: event.category || "security",
        subCategory: event.subCategory || null,
        errorMessage: event.errorMessage || null,
        metadata: JSON.stringify(event.metadata || {}),
      },
    });
  } catch (error) {
    console.error("[writeSecurityAudit]", error);
  }
}