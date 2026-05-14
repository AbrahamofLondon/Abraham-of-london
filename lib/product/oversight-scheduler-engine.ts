import { prisma } from "@/lib/prisma.server";
import { composeOversightReviewCycle } from "@/lib/product/oversight-review-cycle-composer";
import type { OversightSchedulerEvent, OversightSchedulerRunResult } from "@/lib/product/oversight-scheduler-contract";
import { deriveOversightCadenceState } from "@/lib/product/oversight-cadence-engine";
import { loadPreviousArchivedOversightCycle } from "@/lib/product/oversight-cycle-archive";

function pushEvent(events: OversightSchedulerEvent[], contractId: string, organisationId: string, eventType: OversightSchedulerEvent["eventType"], summary: string) {
  events.push({ contractId, organisationId, eventType, summary, createdAt: new Date().toISOString() });
}

export async function runOversightScheduler(input: {
  actorId?: string | null;
  generateCycles?: boolean;
}): Promise<OversightSchedulerRunResult> {
  const contracts = await prisma.retainerContract.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, organisationId: true, tier: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const events: OversightSchedulerEvent[] = [];
  const generatedCycles: string[] = [];
  const warnings: string[] = [];

  for (const contract of contracts) {
    const previous = await loadPreviousArchivedOversightCycle({
      accountId: contract.id,
      beforePeriodStart: new Date().toISOString(),
    }).catch(() => null);

    const cadence = deriveOversightCadenceState({
      tier: contract.tier === "INSTITUTIONAL" ? "INSTITUTIONAL_COMMAND" : contract.tier === "OPERATIONAL" ? "EXECUTIVE_OVERSIGHT" : "GOVERNED_CONTINUITY",
      latestArchivedCycle: previous?.record
        ? {
            periodEnd: previous.record.periodEnd,
            createdAt: previous.record.createdAt,
            approvedAt: previous.record.approvedAt,
            deliveredAt: previous.record.deliveredAt,
            deliveryStatus: previous.record.deliveryStatus,
          }
        : null,
    });

    if (cadence.status === "FIRST_CYCLE_PENDING" || (cadence.daysUntilDue ?? 1) <= 0) {
      pushEvent(events, contract.id, contract.organisationId, "CYCLE_DUE", cadence.explanation);
      if (input.generateCycles) {
        try {
          const composed = await composeOversightReviewCycle({
            accountId: contract.id,
            organisationId: contract.organisationId,
            persist: true,
          });
          generatedCycles.push(composed.cycle.cycleId);
          pushEvent(events, contract.id, contract.organisationId, "CYCLE_GENERATED", `Oversight review cycle ${composed.cycle.cycleId} generated manually.`);
        } catch (error) {
          warnings.push(`Failed to generate cycle for contract ${contract.id}: ${error instanceof Error ? error.message : "unknown error"}`);
        }
      }
    }

    if (cadence.status === "WAITING_FOR_OPERATOR_REVIEW") {
      pushEvent(events, contract.id, contract.organisationId, "CYCLE_REVIEW_REQUIRED", cadence.explanation);
    }
    if (cadence.reviewOverdue) {
      pushEvent(events, contract.id, contract.organisationId, "OPERATOR_REVIEW_OVERDUE", cadence.explanation);
    }
    if (cadence.clientActionRequired) {
      pushEvent(events, contract.id, contract.organisationId, "CLIENT_EVIDENCE_REQUIRED", cadence.explanation);
    }
    if (cadence.deliveryOverdue) {
      pushEvent(events, contract.id, contract.organisationId, "DELIVERY_PENDING", cadence.explanation);
    }
    if (cadence.status === "OVERDUE") {
      pushEvent(events, contract.id, contract.organisationId, "CYCLE_OVERDUE", cadence.explanation);
    }
  }

  for (const event of events) {
    await prisma.auditEvent.create({
      data: {
        actorType: input.actorId ? "ADMIN" : "SYSTEM",
        actorId: input.actorId ?? null,
        objectType: "OVERSIGHT_SCHEDULER",
        objectId: event.contractId,
        actionType: "CREATED",
        summary: event.summary,
        metadata: event as never,
      },
    }).catch(() => null);
  }

  return {
    generatedAt: new Date().toISOString(),
    events,
    generatedCycles,
    warnings,
  };
}
