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
    severity?: "debug" | "info" | "warn" | "error" | "critical";
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
      metadata: JSON.stringify({
        actorType: "system",
        ...((input.metadata ?? {}) as Record<string, unknown>),
      }),
    },
  });
}

/**
 * Compatibility wrapper for legacy callers importing `logAuditEvent`.
 * This version doesn't require a transaction client for simpler use cases.
 */
export async function logAuditEvent(event: {
  eventType: string;
  userId?: string | null;
  sessionId?: string | null;
  ip?: string | null;
  userAgent?: string | string[] | null;
  resource?: string;
  metadata?: Record<string, unknown>;
  note?: string;
}) {
  // Import prisma directly for non-transactional use
  const { prisma } = await import("@/lib/prisma");
  
  return prisma.systemAuditLog.create({
    data: {
      action: event.eventType,
      severity: "info",
      actorId: event.userId ?? null,
      actorEmail: "system",
      resourceId: event.resource ?? null,
      ipAddress: event.ip ?? null,
      userAgent: Array.isArray(event.userAgent) 
        ? event.userAgent[0]?.substring(0, 500) 
        : (event.userAgent?.substring(0, 500) ?? null),
      metadata: JSON.stringify({
        ...(event.metadata ?? {}),
        sessionId: event.sessionId,
        note: event.note,
      }),
    },
  });
}