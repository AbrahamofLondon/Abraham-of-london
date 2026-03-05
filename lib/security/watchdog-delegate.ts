import "server-only";

import { prisma } from "@/lib/prisma";
import { notifyPrincipalOfSecurityAction } from "@/lib/intelligence/notification-delegate";
import { logSystemAudit } from "@/lib/audit/audit-logger";

type SweepResult = {
  scanned: number;
  paused: number;
  revokedKeys: number;
  notified: number;
  notifyFailed: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function executeSecuritySweep(): Promise<SweepResult> {
  const dormancyDays = clampInt(process.env.WATCHDOG_DORMANCY_DAYS, 30, 1, 3650);
  const cutoff = new Date(Date.now() - dormancyDays * DAY_MS);

  const candidates = await prisma.innerCircleMember.findMany({
    where: {
      status: "active",
      lastSeenAt: { lt: cutoff },
      role: { not: "ADMIN" },
    },
    select: { id: true },
  });

  const results: SweepResult = {
    scanned: candidates.length,
    paused: 0,
    revokedKeys: 0,
    notified: 0,
    notifyFailed: 0,
  };

  for (const c of candidates) {
    const outcome = await prisma.$transaction(async (tx) => {
      const member = await tx.innerCircleMember.findFirst({
        where: {
          id: c.id,
          status: "active",
          lastSeenAt: { lt: cutoff },
          role: { not: "ADMIN" },
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          lastSeenAt: true,
        },
      });

      if (!member) {
        return { changed: false as const, notify: false as const, member: null as any, revoked: 0 };
      }

      const updated = await tx.innerCircleMember.update({
        where: { id: member.id },
        data: { status: "paused" },
      });

      const revoke = await tx.innerCircleKey.updateMany({
        where: { memberId: member.id, status: "active" },
        data: {
          status: "revoked",
          revokedAt: new Date(),
          revokedReason: "DORMANCY_SECURITY_POLICY",
        },
      });

      await logSystemAudit(tx, {
        action: "WATCHDOG_DORMANCY_PAUSE",
        severity: "high",

        actorType: "system",
        actorId: null,
        actorEmail: "system",

        resourceType: "InnerCircleMember",
        resourceId: member.id,
        resourceName: member.email ?? null,

        status: "success",
        category: "security",
        subCategory: "watchdog",
        tags: ["dormancy", "auto_pause", "keys_revoked"],

        metadata: {
          rule: `Dormancy > ${dormancyDays} days`,
          cutoffIso: cutoff.toISOString(),
          lastSeenAtIso: member.lastSeenAt ? new Date(member.lastSeenAt).toISOString() : null,
          revokedKeys: revoke.count,
        },
      });

      return { changed: true as const, notify: true as const, member: updated, revoked: revoke.count };
    });

    if (!outcome.changed || !outcome.member) continue;

    results.paused += 1;
    results.revokedKeys += outcome.revoked;

    try {
      await notifyPrincipalOfSecurityAction(outcome.member, "PAUSE_DORMANCY");
      results.notified += 1;
    } catch (e) {
      results.notifyFailed += 1;
      console.error("[WATCHDOG_NOTIFY_FAILED]", {
        memberId: outcome.member.id,
        error: e,
      });
    }
  }

  return results;
}

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  const x = Number.isFinite(n) ? Math.floor(n) : fallback;
  return Math.max(min, Math.min(max, x));
}

export default executeSecuritySweep;