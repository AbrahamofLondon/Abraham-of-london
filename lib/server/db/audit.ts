/* lib/server/db/audit.ts — FULLY SYNCHRONIZED WITH DISC SCHEMA */
// REMOVED: import "server-only"; (Incompatible with Pages Router)

import { prisma } from "@/lib/prisma.server";
import type { AuditSeverity, Prisma } from "@prisma/client";

export interface AuditLogInput {
  action: string;
  severity?: "info" | "warning" | "high" | "critical";
  actorId?: string | null;
  actorEmail?: string | null;
  actorType?: string;
  resourceId?: string | null;
  resourceType?: string | null;
  resourceName?: string | null;
  status?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  durationMs?: number | null;
  category?: string | null;
  subCategory?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, any> | null;
  tags?: any[] | null;
}

function toDbSeverity(s?: string): AuditSeverity {
  switch (s) {
    case "critical": return "critical";
    case "high": return "high";
    case "warning": return "warning";
    default: return "info";
  }
}

export const auditLogger = {
  async log(input: AuditLogInput) {
    // Ensure this code never runs on the client-side
    if (typeof window !== "undefined") {
      console.error("auditLogger.log called on the client. Execution blocked.");
      return null;
    }

    try {
      return await prisma.systemAuditLog.create({
        data: {
          action: input.action,
          severity: toDbSeverity(input.severity),
          actorId: input.actorId ?? null,
          actorEmail: input.actorEmail ?? null,
          actorType: input.actorType ?? "system",
          resourceId: input.resourceId ?? null,
          resourceType: input.resourceType ?? null,
          resourceName: input.resourceName ?? null,
          status: input.status ?? "success",
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          sessionId: input.sessionId ?? null,
          requestId: input.requestId ?? null,
          durationMs: input.durationMs ?? null,
          category: input.category ?? null,
          subCategory: input.subCategory ?? null,
          errorMessage: input.errorMessage ?? null,
          metadata: (input.metadata as Prisma.InputJsonValue) ?? {},
          tags: (input.tags as Prisma.InputJsonValue) ?? [],
        },
      });
    } catch (error) {
      console.error("[AUDIT_LOG_PERSISTENCE_FAILURE]", error);
      return null;
    }
  }
};