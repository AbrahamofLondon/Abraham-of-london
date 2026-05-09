import { createHash, randomUUID } from "crypto";

import { prisma } from "@/lib/prisma.server";
import {
  appendCadenceHistoryEvent,
  createRetainedReviewCycle,
  listRetainedReviewCycles,
  setRetainedReviewCycleState,
} from "@/lib/product/retained-cadence-service";
import type { RetainedReviewCycle } from "@/lib/product/retained-cadence-contract";

type RetainedScope = {
  contractId: string;
  organisationId: string;
  sponsorUserId: string | null;
  sponsorEmail: string | null;
  cadenceDays: number;
};

export type RetainedCadenceTickResult = {
  startedAt: string;
  finishedAt: string;
  createdCycleIds: string[];
  markedDue: string[];
  markedOverdue: string[];
  escalated: string[];
  overdueSignals: string[];
  warnings: string[];
  scopesEvaluated: number;
};

const OVERDUE_ESCALATION_DAYS = 7;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function normalizeEmail(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

function scopeIdFor(scope: RetainedScope) {
  return scope.contractId || scope.organisationId;
}

function cadenceFingerprint(scope: RetainedScope, dueAt: Date) {
  const bucket = dueAt.toISOString().slice(0, 10);
  return createHash("sha1")
    .update(`${scope.contractId}:${scope.organisationId}:${bucket}:${scope.cadenceDays}`)
    .digest("hex");
}

function sameScope(scope: RetainedScope, cycle: RetainedReviewCycle) {
  return cycle.accountId === scope.contractId || cycle.organisationId === scope.organisationId;
}

function sameDueBucket(left: string | null | undefined, right: Date) {
  if (!left) return false;
  return startOfDay(new Date(left)).getTime() === startOfDay(right).getTime();
}

function isClosedCycle(cycle: RetainedReviewCycle) {
  return [
    "COMPLETED",
    "REVIEW_COMPLETED",
    "SKIPPED_WITH_REASON",
    "REVIEW_SKIPPED",
    "ESCALATED",
  ].includes(cycle.cadenceState);
}

function deriveCadenceDays(tier: string, billingCycle: string | null | undefined) {
  if ((billingCycle || "").toUpperCase() === "QUARTERLY") return 90;
  if (tier === "INSTITUTIONAL") return 30;
  if (tier === "OPERATIONAL") return 30;
  return 30;
}

async function loadRetainedScopes(): Promise<RetainedScope[]> {
  const contracts = await prisma.retainerContract.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      organisationId: true,
      tier: true,
      billingCycle: true,
      organisation: {
        select: {
          memberships: {
            where: {
              roleTitle: { in: ["OWNER", "ADMIN", "SPONSOR"] },
              status: "active",
            },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: {
              userId: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return contracts.map((contract) => ({
    contractId: contract.id,
    organisationId: contract.organisationId,
    sponsorUserId: contract.organisation.memberships[0]?.userId ?? null,
    sponsorEmail: normalizeEmail(contract.organisation.memberships[0]?.email),
    cadenceDays: deriveCadenceDays(contract.tier, contract.billingCycle),
  }));
}

async function writeCadenceAuditEvent(input: {
  actorId?: string | null;
  scopeId: string;
  contractId: string;
  actionType: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditEvent.create({
    data: {
      actorType: input.actorId ? "ADMIN" : "SYSTEM",
      actorId: input.actorId ?? null,
      objectType: "RETAINED_CADENCE",
      objectId: input.contractId,
      actionType: input.actionType,
      summary: input.summary,
      metadata: {
        scopeId: input.scopeId,
        contractId: input.contractId,
        ...(input.metadata ?? {}),
      },
    },
  }).catch(() => null);
}

async function emitOverdueSignal(input: {
  actorId?: string | null;
  scope: RetainedScope;
  cycle: RetainedReviewCycle;
  reason: string;
}) {
  const signalId = `retained-overdue:${input.cycle.cycleId}`;
  await prisma.auditEvent.create({
    data: {
      actorType: input.actorId ? "ADMIN" : "SYSTEM",
      actorId: input.actorId ?? null,
      objectType: "RETAINED_REVIEW_SIGNAL",
      objectId: signalId,
      actionType: "CREATED",
      summary: input.reason,
      metadata: {
        cycleId: input.cycle.cycleId,
        contractId: input.scope.contractId,
        organisationId: input.scope.organisationId,
        scopeId: scopeIdFor(input.scope),
        scheduledFor: input.cycle.scheduledFor,
      },
    },
  }).catch(() => null);
  return signalId;
}

function latestCycleForScope(scope: RetainedScope, cycles: RetainedReviewCycle[]) {
  return cycles
    .filter((cycle) => sameScope(scope, cycle))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] ?? null;
}

async function createScheduledCycle(scope: RetainedScope, dueAt: Date, actorId?: string | null) {
  const fingerprint = cadenceFingerprint(scope, dueAt);
  const cycle = await createRetainedReviewCycle({
    accountId: scope.contractId,
    organisationId: scope.organisationId,
    sponsorUserId: scope.sponsorUserId,
    sponsorEmail: scope.sponsorEmail,
    cadenceState: "REVIEW_DUE",
    cadenceSource: "system_triggered",
    cadenceType: scope.cadenceDays === 90 ? "quarterly" : "monthly",
    scheduledFor: dueAt.toISOString(),
    operatorId: actorId ?? null,
    evidencePosture: "SYSTEM_INFERRED",
  });

  if (!cycle) return null;

  const scopeId = scopeIdFor(scope);
  await appendCadenceHistoryEvent(scopeId, {
    eventId: `evt_${randomUUID()}`,
    cycleId: cycle.cycleId,
    scopeId,
    action: "SCHEDULER_CREATED_CYCLE",
    operatorId: actorId ?? null,
    timestamp: new Date().toISOString(),
    metadata: {
      fingerprint,
      dueBucket: dueAt.toISOString().slice(0, 10),
    },
  });
  await writeCadenceAuditEvent({
    actorId,
    scopeId,
    contractId: scope.contractId,
    actionType: "CREATED",
    summary: `Retained cadence cycle ${cycle.cycleId} created for due bucket ${dueAt.toISOString().slice(0, 10)}.`,
    metadata: {
      cycleId: cycle.cycleId,
      fingerprint,
    },
  });

  return cycle;
}

export async function runRetainedCadenceTick(input?: {
  actorId?: string | null;
  now?: Date | string;
}) : Promise<RetainedCadenceTickResult> {
  const startedAt = new Date().toISOString();
  const now = input?.now instanceof Date ? input.now : input?.now ? new Date(input.now) : new Date();
  const scopes = await loadRetainedScopes();
  const allCycles = await listRetainedReviewCycles();
  const createdCycleIds: string[] = [];
  const markedDue: string[] = [];
  const markedOverdue: string[] = [];
  const escalated: string[] = [];
  const overdueSignals: string[] = [];
  const warnings: string[] = [];

  for (const scope of scopes) {
    const scopedCycles = allCycles.filter((cycle) => sameScope(scope, cycle));
    const latest = latestCycleForScope(scope, scopedCycles);
    const scopeId = scopeIdFor(scope);

    const lastAnchor = latest?.scheduledFor
      ? new Date(latest.scheduledFor)
      : latest?.completedAt
        ? new Date(latest.completedAt)
        : null;
    const nextDueAt = lastAnchor ? addDays(startOfDay(lastAnchor), scope.cadenceDays) : startOfDay(now);

    const existingForBucket = scopedCycles.find((cycle) => sameDueBucket(cycle.scheduledFor, nextDueAt));
    const hasOpenCycle = scopedCycles.some((cycle) => !isClosedCycle(cycle));

    if (!existingForBucket && (!hasOpenCycle || (latest && isClosedCycle(latest))) && nextDueAt.getTime() <= now.getTime()) {
      const created = await createScheduledCycle(scope, nextDueAt, input?.actorId ?? null);
      if (created) {
        createdCycleIds.push(created.cycleId);
        allCycles.unshift(created);
      }
    }

    const refreshedLatest = latestCycleForScope(scope, allCycles);
    if (!refreshedLatest || !refreshedLatest.scheduledFor) continue;

    const scheduledFor = new Date(refreshedLatest.scheduledFor);
    if (!Number.isFinite(scheduledFor.getTime())) {
      warnings.push(`Invalid scheduled date on cycle ${refreshedLatest.cycleId}.`);
      continue;
    }

    if (scheduledFor.getTime() <= now.getTime() && ["SCHEDULED", "DUE_SOON", "CONFIGURED"].includes(refreshedLatest.cadenceState)) {
      const updated = await setRetainedReviewCycleState({
        cycleId: refreshedLatest.cycleId,
        cadenceState: "REVIEW_DUE",
        operatorId: input?.actorId ?? null,
      });
      if (updated) {
        markedDue.push(updated.cycleId);
        await appendCadenceHistoryEvent(scopeId, {
          eventId: `evt_${randomUUID()}`,
          cycleId: updated.cycleId,
          scopeId,
          action: "SCHEDULER_MARKED_DUE",
          operatorId: input?.actorId ?? null,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const ageDays = Math.floor((startOfDay(now).getTime() - startOfDay(scheduledFor).getTime()) / 86_400_000);
    if (ageDays > 0 && ["REVIEW_DUE", "SCHEDULED", "DUE_SOON"].includes(refreshedLatest.cadenceState)) {
      const updated = await setRetainedReviewCycleState({
        cycleId: refreshedLatest.cycleId,
        cadenceState: "OVERDUE",
        operatorId: input?.actorId ?? null,
      });
      if (updated) {
        markedOverdue.push(updated.cycleId);
        await appendCadenceHistoryEvent(scopeId, {
          eventId: `evt_${randomUUID()}`,
          cycleId: updated.cycleId,
          scopeId,
          action: "SCHEDULER_MARKED_OVERDUE",
          operatorId: input?.actorId ?? null,
          timestamp: new Date().toISOString(),
        });
        overdueSignals.push(await emitOverdueSignal({
          actorId: input?.actorId ?? null,
          scope,
          cycle: updated,
          reason: `Retained review cycle ${updated.cycleId} is overdue.`,
        }));
      }
    }

    if (ageDays >= OVERDUE_ESCALATION_DAYS && refreshedLatest.cadenceState !== "ESCALATED") {
      const updated = await setRetainedReviewCycleState({
        cycleId: refreshedLatest.cycleId,
        cadenceState: "ESCALATED",
        operatorId: input?.actorId ?? null,
        escalationReason: "Retained review cycle remained overdue past the escalation threshold.",
      });
      if (updated) {
        escalated.push(updated.cycleId);
        await appendCadenceHistoryEvent(scopeId, {
          eventId: `evt_${randomUUID()}`,
          cycleId: updated.cycleId,
          scopeId,
          action: "SCHEDULER_ESCALATED_CYCLE",
          operatorId: input?.actorId ?? null,
          timestamp: new Date().toISOString(),
        });
        await writeCadenceAuditEvent({
          actorId: input?.actorId ?? null,
          scopeId,
          contractId: scope.contractId,
          actionType: "UPDATED",
          summary: `Retained cadence cycle ${updated.cycleId} escalated after overdue threshold.`,
          metadata: {
            cycleId: updated.cycleId,
            scheduledFor: updated.scheduledFor,
          },
        });
      }
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    createdCycleIds,
    markedDue,
    markedOverdue,
    escalated,
    overdueSignals,
    warnings,
    scopesEvaluated: scopes.length,
  };
}
