import { prisma } from "@/lib/prisma.server";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  actorType: "USER" | "SYSTEM" | "ADMIN";
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetKey?: string | null;
  success?: boolean;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAccessAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.accessAuditLog.create({
      data: {
        actorType: input.actorType,
        actorUserId: input.actorUserId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        targetType: input.targetType,
        targetKey: input.targetKey ?? null,
        success: input.success ?? true,
        reason: input.reason ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonObject,
      },
    });
  } catch {
    // intentionally swallow audit failures
  }
}

type VisibilityAuditInput = {
  userId: string | null;
  email: string | null;
  role: string | null;
  surface: string;
  allowed: boolean;
  reason?: string;
};

/**
 * Log a visibility/role check to the AccessAuditLog.
 * Uses action "VISIBILITY_CHECK" to distinguish from other audit events.
 */
export async function logVisibilityAudit(input: VisibilityAuditInput): Promise<void> {
  await logAccessAudit({
    actorType: input.userId ? "USER" : "SYSTEM",
    actorUserId: input.userId,
    actorEmail: input.email,
    action: "VISIBILITY_CHECK",
    targetType: "SURFACE",
    targetKey: input.surface,
    success: input.allowed,
    reason: input.reason ?? null,
    metadata: {
      role: input.role,
      surface: input.surface,
    },
  });
}
