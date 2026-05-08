import "server-only";

import { prisma } from "@/lib/prisma.server";
import { buildClientSafeOversightBrief } from "@/lib/product/client-safe-oversight-brief";
import { compareOversightCycles } from "@/lib/product/oversight-cycle-comparison";
import type { OversightCycleLedgerEvent, OversightCycleLedgerEventType } from "@/lib/product/oversight-cycle-ledger-contract";
import { scoreOversightBriefEfficacy } from "@/lib/product/oversight-brief-efficacy-scorer";
import type { OversightBriefEfficacyScore } from "@/lib/product/oversight-brief-efficacy-contract";
import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";
import type { OrganisationAccessDecision } from "@/lib/product/organisation-access-contract";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type {
  OversightReviewCycle,
  OversightReviewDecision,
} from "@/lib/product/oversight-review-cycle-contract";

function syntheticAggregateAccess(): OrganisationAccessDecision {
  return {
    allowed: true,
    role: "OPERATOR",
    scopes: ["CONTROL_ROOM_VIEW"],
    reason: "Internal aggregate review access.",
    privacyBoundary: {
      canViewRawResponses: false,
      canViewNamedRespondents: false,
      canViewAggregates: true,
      smallSampleSuppressionApplies: true,
    },
  };
}

function deriveBaseStatus(input: {
  internalBrief?: OversightBrief;
  clientSafeBrief?: OversightBrief;
  access?: OrganisationAccessDecision;
  warnings: string[];
  suppressions: OversightReviewCycle["suppressions"];
}): OversightReviewCycle["status"] {
  if (!input.internalBrief) return "WITHHELD";
  if (input.access && !input.access.allowed) return "WITHHELD";
  if (!input.clientSafeBrief) return "WITHHELD";
  if (input.warnings.length > 0 || input.suppressions.length > 0) return "OPERATOR_REVIEW_REQUIRED";
  return "CLIENT_SAFE_REVIEW_READY";
}

function mapLedgerActionType(eventType: OversightCycleLedgerEventType): "CREATED" | "UPDATED" | "RESOLVED" | "BLOCKED" {
  switch (eventType) {
    case "BRIEF_GENERATED":
    case "CLIENT_SAFE_VERSION_CREATED":
    case "NEXT_CYCLE_SCHEDULED":
      return "CREATED";
    case "APPROVED_FOR_DELIVERY":
    case "DELIVERED":
      return "RESOLVED";
    case "WITHHELD":
      return "BLOCKED";
    default:
      return "UPDATED";
  }
}

function eventSummary(eventType: OversightCycleLedgerEventType, cycleId: string): string {
  return `Oversight cycle ${cycleId}: ${eventType.toLowerCase().replace(/_/g, " ")}.`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toLedgerEvent(row: {
  id: string;
  actorId: string | null;
  createdAt: Date;
  metadata: unknown;
}): OversightCycleLedgerEvent | null {
  const metadata = asRecord(row.metadata);
  const eventType = typeof metadata.eventType === "string" ? metadata.eventType as OversightCycleLedgerEventType : null;
  const cycleId = typeof metadata.cycleId === "string" ? metadata.cycleId : null;
  if (!eventType || !cycleId) return null;

  const actor = asRecord(metadata.actor);
  const evidence = Array.isArray(metadata.evidence)
    ? metadata.evidence.filter((item): item is string => typeof item === "string")
    : undefined;
  const warnings = Array.isArray(metadata.warnings)
    ? metadata.warnings.filter((item): item is string => typeof item === "string")
    : undefined;

  return {
    id: row.id,
    cycleId,
    eventType,
    timestamp: row.createdAt.toISOString(),
    actor: actor.userId || actor.email || actor.role
      ? {
          userId: typeof actor.userId === "string" ? actor.userId : undefined,
          email: typeof actor.email === "string" ? actor.email : undefined,
          role: typeof actor.role === "string" ? actor.role : undefined,
        }
      : undefined,
    reason: typeof metadata.reason === "string" ? metadata.reason : undefined,
    evidence,
    warnings,
  };
}

async function listOversightCycleLedgerEvents(input: {
  accountId?: string;
  cycleId: string;
}): Promise<OversightCycleLedgerEvent[]> {
  if (!input.accountId) return [];

  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_CYCLE",
      objectId: input.accountId,
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      actorId: true,
      createdAt: true,
      metadata: true,
    },
  });

  return rows
    .map(toLedgerEvent)
    .filter((item): item is OversightCycleLedgerEvent => Boolean(item))
    .filter((item) => item.cycleId === input.cycleId);
}

async function loadPreviousOversightBrief(input: {
  accountId?: string;
  currentCycleId: string;
  currentPeriodStart: string;
}): Promise<OversightBrief | undefined> {
  if (!input.accountId) return undefined;

  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_CYCLE",
      objectId: input.accountId,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      createdAt: true,
      metadata: true,
    },
  });

  const candidates = rows
    .map((row) => {
      const metadata = asRecord(row.metadata);
      const eventType = typeof metadata.eventType === "string" ? metadata.eventType : null;
      const cycleId = typeof metadata.cycleId === "string" ? metadata.cycleId : null;
      const briefSnapshot = asRecord(metadata.briefSnapshot);
      const periodStart = typeof briefSnapshot.periodStart === "string" ? briefSnapshot.periodStart : null;
      if (eventType !== "BRIEF_GENERATED" || !cycleId || cycleId === input.currentCycleId || !periodStart) return null;
      if (periodStart >= input.currentPeriodStart) return null;
      return {
        createdAt: row.createdAt,
        brief: briefSnapshot as unknown as OversightBrief,
      };
    })
    .filter((item): item is { createdAt: Date; brief: OversightBrief } => Boolean(item))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return candidates[0]?.brief;
}

async function persistLedgerEvent(input: {
  accountId?: string;
  cycleId: string;
  eventType: OversightCycleLedgerEventType;
  actor?: {
    userId?: string;
    email?: string;
    role?: string;
  };
  reason?: string;
  evidence?: string[];
  warnings?: string[];
  briefSnapshot?: OversightBrief;
  efficacy?: OversightBriefEfficacyScore;
}): Promise<void> {
  if (!input.accountId) return;

  const existing = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_CYCLE",
      objectId: input.accountId,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { metadata: true },
  });

  const duplicate = existing.some((row) => {
    const metadata = asRecord(row.metadata);
    return metadata.cycleId === input.cycleId && metadata.eventType === input.eventType;
  });
  if (duplicate) return;

  await prisma.auditEvent.create({
    data: {
      actorType: input.actor?.userId || input.actor?.email ? "ADMIN" : "SYSTEM",
      actorId: input.actor?.userId ?? null,
      objectType: "OVERSIGHT_CYCLE",
      objectId: input.accountId,
      actionType: mapLedgerActionType(input.eventType),
      summary: eventSummary(input.eventType, input.cycleId),
      metadata: {
        cycleId: input.cycleId,
        eventType: input.eventType,
        actor: input.actor ?? null,
        reason: input.reason ?? null,
        evidence: input.evidence ?? [],
        warnings: input.warnings ?? [],
        briefSnapshot: input.briefSnapshot ?? null,
        efficacy: input.efficacy ?? null,
      } as never,
    },
  });
}

function deriveNextRequiredOperatorDecision(input: {
  efficacy?: OversightBriefEfficacyScore | null;
  cycle: OversightReviewCycle;
  internalBrief?: OversightBrief;
}): OversightReviewDecision {
  if (!input.internalBrief || input.cycle.status === "WITHHELD" || input.efficacy?.grade === "WITHHOLD") {
    return "WITHHOLD";
  }
  if (input.efficacy?.grade === "WEAK" || input.efficacy?.grade === "ADEQUATE" || input.cycle.suppressions.length > 0 || input.cycle.warnings.length > 0) {
    return "REVISE";
  }
  if (input.internalBrief.counsel.requiredNow > 0) {
    return "ESCALATE_TO_COUNSEL";
  }
  if (input.internalBrief.boardroom.dossiersAvailable > 0) {
    return "ESCALATE_TO_BOARDROOM";
  }
  return "APPROVE";
}

export async function composeOversightReviewCycle(input: {
  userId?: string;
  email?: string;
  organisationId?: string;
  periodStart?: string;
  periodEnd?: string;
  persist?: boolean;
  operatorDecision?: OversightReviewDecision;
  operatorReason?: string;
  deliver?: boolean;
  scheduleNextCycle?: boolean;
}): Promise<{
  internalBrief?: OversightBrief;
  clientSafeBrief?: OversightBrief;
  cycle: OversightReviewCycle;
  warnings: string[];
  efficacy?: OversightBriefEfficacyScore;
  ledgerEvents: OversightCycleLedgerEvent[];
  cycleComparison: ReturnType<typeof compareOversightCycles>;
  nextRequiredOperatorDecision: OversightReviewDecision;
  previousBrief?: OversightBrief;
}> {
  const generatedAt = new Date().toISOString();
  const warnings: string[] = [];

  const composed = await composeOversightBrief(input);
  warnings.push(...composed.warnings);

  let access: OrganisationAccessDecision | undefined;
  if (input.organisationId) {
    access = await evaluateOrganisationAccess({
      userId: input.userId ?? null,
      email: input.email ?? null,
      organisationId: input.organisationId,
      requestedScope: "CONTROL_ROOM_VIEW",
    });
    if (!access.allowed) {
      warnings.push(`Organisation access denied: ${access.reason}`);
    }
  } else {
    access = syntheticAggregateAccess();
  }

  let clientSafeBrief: OversightBrief | undefined;
  let suppressions: OversightReviewCycle["suppressions"] = [];
  if (composed.brief && access?.allowed) {
    const safe = buildClientSafeOversightBrief({
      brief: composed.brief,
      access,
    });
    clientSafeBrief = safe.brief;
    suppressions = safe.suppressions;
    warnings.push(...safe.warnings);
  }

  const cycleId = `review-cycle:${composed.brief?.accountId || input.organisationId || input.email || input.userId || "unknown"}:${(composed.brief?.periodStart || input.periodStart || generatedAt).slice(0, 10)}`;
  const previousBrief = await loadPreviousOversightBrief({
    accountId: composed.brief?.accountId,
    currentCycleId: cycleId,
    currentPeriodStart: composed.brief?.periodStart || input.periodStart || generatedAt,
  });
  const cycleComparison = composed.brief
    ? compareOversightCycles({
        current: composed.brief,
        previous: previousBrief,
      })
    : { available: false, deltas: [], warnings: ["No internal brief available for comparison."] };
  warnings.push(...cycleComparison.warnings);

  const efficacy = composed.brief
    ? scoreOversightBriefEfficacy({
        brief: composed.brief,
        previousBrief,
        warnings,
        suppressions,
      })
    : undefined;

  let status = deriveBaseStatus({
    internalBrief: composed.brief,
    clientSafeBrief,
    access,
    warnings,
    suppressions,
  });

  const decisions: OversightReviewCycle["decisions"] = [];
  const decisionTimestamp = new Date().toISOString();

  if (input.operatorDecision) {
    if (input.operatorDecision === "APPROVE" && (!efficacy || (efficacy.grade !== "STRONG" && efficacy.grade !== "FORMIDABLE"))) {
      warnings.push("Approval denied because the brief is below STRONG efficacy.");
      decisions.push({
        decision: "REVISE",
        reason: "Approval denied because the brief is below STRONG efficacy.",
        timestamp: decisionTimestamp,
      });
      status = "REVISION_REQUIRED";
    } else {
      decisions.push({
        decision: input.operatorDecision,
        reason: input.operatorReason || "Operator decision recorded.",
        timestamp: decisionTimestamp,
      });
      if (input.operatorDecision === "APPROVE") status = "APPROVED_FOR_DELIVERY";
      if (input.operatorDecision === "WITHHOLD") status = "WITHHELD";
      if (input.operatorDecision === "REVISE") status = "REVISION_REQUIRED";
      if (input.operatorDecision === "ESCALATE_TO_COUNSEL" || input.operatorDecision === "ESCALATE_TO_BOARDROOM") status = "REVISION_REQUIRED";
    }
  }

  let reviewedAt: string | undefined;
  let approvedAt: string | undefined;
  let deliveredAt: string | undefined;
  if (decisions.length > 0) {
    reviewedAt = decisionTimestamp;
  }
  if (status === "APPROVED_FOR_DELIVERY") {
    approvedAt = decisionTimestamp;
  }
  if (input.deliver) {
    if (status === "APPROVED_FOR_DELIVERY") {
      status = "DELIVERED";
      deliveredAt = new Date().toISOString();
    } else {
      warnings.push("Delivery not recorded because the brief is not approved for delivery.");
    }
  }

  const cycle: OversightReviewCycle = {
    cycleId,
    accountId: composed.brief?.accountId,
    organisationId: input.organisationId,
    periodStart: composed.brief?.periodStart || input.periodStart || generatedAt,
    periodEnd: composed.brief?.periodEnd || input.periodEnd || generatedAt,
    status,
    generatedAt,
    reviewedAt,
    approvedAt,
    deliveredAt,
    reviewer: input.email
      ? {
          userId: input.userId,
          email: input.email,
          role: access?.role,
        }
      : undefined,
    decisions,
    suppressions,
    warnings: [...warnings],
  };

  const nextRequiredOperatorDecision = deriveNextRequiredOperatorDecision({
    efficacy,
    cycle,
    internalBrief: composed.brief,
  });

  if (input.persist && composed.brief?.accountId) {
    const actor = input.email
      ? { userId: input.userId, email: input.email, role: access?.role }
      : undefined;

    await persistLedgerEvent({
      accountId: composed.brief.accountId,
      cycleId,
      eventType: "BRIEF_GENERATED",
      actor,
      warnings,
      briefSnapshot: composed.brief,
    });

    if (efficacy) {
      await persistLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: "EFFICACY_SCORED",
        actor,
        warnings: efficacy.operatorNotes,
        reason: `Grade ${efficacy.grade} at ${efficacy.totalScore}.`,
        efficacy,
      });
    }

    if (clientSafeBrief) {
      await persistLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: "CLIENT_SAFE_VERSION_CREATED",
        actor,
        warnings,
        briefSnapshot: clientSafeBrief,
      });
    }

    const operatorDecision = decisions[0]?.decision;
    if (operatorDecision === "REVISE") {
      await persistLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: "REVISION_REQUESTED",
        actor,
        reason: decisions[0]?.reason,
        warnings,
      });
    } else if (operatorDecision) {
      const eventTypeMap: Record<OversightReviewDecision, OversightCycleLedgerEventType> = {
        APPROVE: "APPROVED_FOR_DELIVERY",
        REVISE: "REVISION_REQUESTED",
        WITHHOLD: "WITHHELD",
        ESCALATE_TO_COUNSEL: "COUNSEL_ESCALATED",
        ESCALATE_TO_BOARDROOM: "BOARDROOM_ESCALATED",
      };
      await persistLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: eventTypeMap[operatorDecision],
        actor,
        reason: decisions[0]?.reason,
        warnings,
      });
    }

    if (input.deliver && deliveredAt) {
      await persistLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: "DELIVERED",
        actor,
        warnings,
      });
    }

    if (input.scheduleNextCycle) {
      await persistLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: "NEXT_CYCLE_SCHEDULED",
        actor,
        warnings,
        reason: "Next cycle scheduling intent recorded.",
      });
    }
  }

  const ledgerEvents = await listOversightCycleLedgerEvents({
    accountId: composed.brief?.accountId,
    cycleId,
  });

  return {
    internalBrief: composed.brief,
    clientSafeBrief,
    cycle,
    warnings,
    efficacy,
    ledgerEvents,
    cycleComparison,
    nextRequiredOperatorDecision,
    previousBrief,
  };
}
