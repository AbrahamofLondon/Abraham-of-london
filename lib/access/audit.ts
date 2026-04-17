import { prisma } from "@/lib/prisma.server";

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
        metadata: input.metadata ?? {},
      },
    });
  } catch {
    // intentionally swallow audit failures
  }
}