// lib/security/audit.ts
import "server-only";

import type { Prisma } from "@/lib/prisma";

/**
 * Centralized, schema-safe audit logging.
 * - no actorType column (store it in metadata)
 * - uses lowercase AuditSeverity enum values
 */
export async function logSystemAudit(
  tx: Prisma.TransactionClient,
  input: {
    action: string;
    severity?: "info" | "warning" | "high" | "critical";
    resourceId?: string | null;
    actorId?: string | null;
    actorEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  return tx.systemAuditLog.create({
    data: {
      action: input.action,
      severity: input.severity ?? "info",
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? "system",
      resourceId: input.resourceId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: {
        actorType: "system",
        ...((input.metadata ?? {}) as Record<string, unknown>),
      },
    },
  });
}