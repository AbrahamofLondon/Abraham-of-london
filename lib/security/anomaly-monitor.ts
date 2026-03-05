import "server-only";

import { prisma } from "@/lib/prisma";
import { notifyPrincipalOfSecurityAction } from "@/lib/intelligence/notification-delegate";
import { logSystemAudit } from "@/lib/audit/audit-logger";

const VELOCITY_LIMIT = 10;
const TIME_WINDOW_MINUTES = 60;

type AnomalyResult =
  | { status: "SAFE"; count: number }
  | { status: "LOCKED"; count: number }
  | { status: "SKIPPED"; count: number };

export async function detectAnomalousActivity(memberId: string): Promise<AnomalyResult> {
  const safeMemberId = String(memberId || "").trim();
  if (!safeMemberId) {
    return { status: "SKIPPED", count: 0 };
  }

  const lookback = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000);

  // Count only successful exports
  const recentExports = await prisma.downloadAuditEvent.count({
    where: {
      memberId: safeMemberId,
      eventType: "EXPORT",
      success: true,
      createdAt: { gte: lookback },
    },
  });

  if (recentExports < VELOCITY_LIMIT) {
    return { status: "SAFE", count: recentExports };
  }

  const outcome = await prisma.$transaction(async (tx) => {
    const member = await tx.innerCircleMember.findUnique({
      where: { id: safeMemberId },
      select: {
        id: true,
        status: true,
        role: true,
        email: true,
        lastSeenAt: true,
      },
    });

    if (!member) {
      return { changed: false as const, notify: false as const, member: null as any, revoked: 0 };
    }

    if (member.role === "ADMIN") {
      return { changed: false as const, notify: false as const, member, revoked: 0 };
    }

    // Only act on active accounts; paused/disabled/etc are already constrained
    if (member.status !== "active") {
      return { changed: false as const, notify: false as const, member, revoked: 0 };
    }

    const updated = await tx.innerCircleMember.update({
      where: { id: safeMemberId },
      data: { status: "paused" },
    });

    const revoked = await tx.innerCircleKey.updateMany({
      where: { memberId: safeMemberId, status: "active" },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedReason: "VELOCITY_EXCEEDED_EXPORT",
      },
    });

    await logSystemAudit(tx, {
      action: "SECURITY_AUTO_LOCK",
      severity: "critical",

      actorType: "system",
      actorId: null,
      actorEmail: "system",

      resourceType: "InnerCircleMember",
      resourceId: safeMemberId,
      resourceName: member.email ?? null,

      status: "success",
      category: "security",
      subCategory: "anomaly_velocity",
      tags: ["velocity", "export", "auto_pause", "keys_revoked"],

      metadata: {
        exports: recentExports,
        window: `${TIME_WINDOW_MINUTES}m`,
        rule: `EXPORT(success=true) >= ${VELOCITY_LIMIT}`,
        lookbackIso: lookback.toISOString(),
        revokedKeys: revoked.count,
        memberLastSeenAtIso: member.lastSeenAt ? new Date(member.lastSeenAt).toISOString() : null,
      },
    });

    return {
      changed: true as const,
      notify: true as const,
      member: updated,
      revoked: revoked.count,
    };
  });

  if (outcome.notify && outcome.member) {
    try {
      await notifyPrincipalOfSecurityAction(outcome.member, "PAUSE_VELOCITY");
    } catch (e) {
      console.error("[SECURITY_NOTIFY_FAILED]", { memberId: safeMemberId, error: e });
    }
  }

  return { status: "LOCKED", count: recentExports };
}

export default detectAnomalousActivity;