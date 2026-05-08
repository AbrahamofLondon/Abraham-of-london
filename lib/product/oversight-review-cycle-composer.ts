import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma.server";
import {
  buildClientSafeOversightBrief,
  type ClientSafeOversightBrief,
  type OversightSuppression,
} from "@/lib/product/client-safe-oversight-brief";
import { scoreOversightBriefEfficacy } from "@/lib/product/oversight-brief-efficacy-scorer";
import type { OversightBriefEfficacyScore } from "@/lib/product/oversight-brief-efficacy-contract";
import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import type { OversightDeliveryIntent } from "@/lib/product/oversight-delivery-contract";
import { deriveNextOversightCycleIntent } from "@/lib/product/oversight-next-cycle";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";
import type { OrganisationAccessDecision } from "@/lib/product/organisation-access-contract";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import {
  compareOversightCycles,
  type OversightCycleComparison,
} from "@/lib/product/oversight-cycle-comparison";
import type { OversightCycleLedgerEvent, OversightCycleLedgerEventType } from "@/lib/product/oversight-cycle-ledger-contract";
import {
  persistOversightReviewDecision,
} from "@/lib/product/oversight-review-decision-ledger";
import {
  recommendOversightReviewDecision,
} from "@/lib/product/oversight-review-decision-engine";
import type {
  OversightReviewDecision,
  OversightReviewDecisionReason,
  OversightReviewDecisionRecord,
} from "@/lib/product/oversight-review-decision-contract";
import type { OversightReviewCycle } from "@/lib/product/oversight-review-cycle-contract";

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
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

async function persistCycleLedgerEvent(input: {
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

function deriveBaseStatus(input: {
  internalBrief?: OversightBrief;
  clientSafe?: ClientSafeOversightBrief | null;
  access?: OrganisationAccessDecision;
  warnings: string[];
  suppressions: OversightSuppression[];
}): OversightReviewCycle["status"] {
  if (!input.internalBrief) return "WITHHELD";
  if (input.access && !input.access.allowed) return "WITHHELD";
  if (!input.clientSafe?.brief) return "WITHHELD";
  if (input.warnings.length > 0 || input.suppressions.length > 0) return "OPERATOR_REVIEW_REQUIRED";
  return "CLIENT_SAFE_REVIEW_READY";
}

function unresolvedSensitiveSuppression(suppressions: OversightSuppression[]): boolean {
  return suppressions.some((item) =>
    item.reason === "CLIENT_VISIBILITY_RESTRICTED"
    || item.reason === "RAW_RESPONSE_PROTECTED"
    || item.reason === "LEGAL_OR_REPUTATION_RISK"
  );
}

function countLiveSignals(brief: OversightBrief): number {
  return [
    brief.costOfInaction && brief.costOfInaction.totalEstimated > 0,
    brief.verification.commitmentsDue > 0 || brief.verification.unresolvedBreaches > 0,
    brief.counsel.reviewsTriggered > 0,
    brief.boardroom.dossiersAvailable > 0,
    brief.decisionCredit?.score != null,
    (brief.retainedEnforcement?.deteriorationSignals ?? 0) > 0 || (brief.retainedEnforcement?.improvementSignals ?? 0) > 0,
    brief.activeCases.length > 0,
    brief.patternRecurrence && brief.patternRecurrence.status !== "NO_PRIOR_PATTERN",
    (brief.decisionLosses?.entries.length ?? 0) > 0,
    brief.strategicOptions?.options.some((item) => item.status === "CLOSING" || item.status === "EXPIRED"),
    (brief.irreversibility?.score ?? 0) >= 45,
    (brief.decisionDependencies?.conflicts.length ?? 0) > 0,
    Boolean(brief.cycleConsequenceProjection),
  ].filter(Boolean).length;
}

function validateFirstCycleException(input: {
  brief: OversightBrief;
  baseEfficacy: OversightBriefEfficacyScore;
  suppressions: OversightSuppression[];
  operatorNote?: string;
}): { allowed: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!input.operatorNote?.trim()) {
    warnings.push("First-cycle exception requires an operator note.");
  }
  if (!(input.baseEfficacy.grade === "STRONG" || input.baseEfficacy.grade === "FORMIDABLE")) {
    warnings.push("First-cycle exception requires a base efficacy grade of at least STRONG.");
  }
  if (unresolvedSensitiveSuppression(input.suppressions)) {
    warnings.push("First-cycle exception is denied because unresolved sensitive suppressions remain.");
  }
  if (countLiveSignals(input.brief) < 4) {
    warnings.push("First-cycle exception requires at least 4 live signals.");
  }
  if (input.brief.requiredActions.length < 2) {
    warnings.push("First-cycle exception requires at least 2 required actions.");
  }

  return {
    allowed: warnings.length === 0,
    warnings,
  };
}

function requiresOperatorNote(input: {
  decision: OversightReviewDecision;
  recommendedDecision: OversightReviewDecision;
  efficacy?: OversightBriefEfficacyScore;
  firstCycleException?: boolean;
}): boolean {
  if (input.firstCycleException) return true;
  if (input.decision !== input.recommendedDecision) return true;
  if (input.decision === "ESCALATE_TO_COUNSEL" || input.decision === "ESCALATE_TO_BOARDROOM") return true;
  if (input.decision === "WITHHOLD_FROM_CLIENT") return true;
  if (input.decision === "APPROVE_FOR_CLIENT" && input.efficacy && input.efficacy.grade !== "STRONG" && input.efficacy.grade !== "FORMIDABLE") {
    return true;
  }
  return false;
}

function buildDeliveryIntent(input: {
  decision?: OversightReviewDecision;
  recommendedDecision: OversightReviewDecision;
  efficacy?: OversightBriefEfficacyScore;
  deliveryAllowed: boolean;
}): OversightDeliveryIntent {
  const decision = input.decision ?? input.recommendedDecision;

  if (decision === "ESCALATE_TO_COUNSEL" || decision === "ESCALATE_TO_BOARDROOM") {
    return {
      state: "ESCALATED",
      deliveryAllowed: false,
      deliveryMethod: "INTERNAL_PREVIEW",
      reason: "Escalation is required before any client delivery state can be prepared.",
      nextStep: decision === "ESCALATE_TO_BOARDROOM" ? "Prepare boardroom escalation path." : "Prepare counsel review handoff.",
      scheduledFor: null,
    };
  }

  if (decision === "WITHHOLD_FROM_CLIENT") {
    return {
      state: "WITHHELD",
      deliveryAllowed: false,
      deliveryMethod: "INTERNAL_PREVIEW",
      reason: "The current brief is withheld from client delivery.",
      nextStep: "Revise or gather more evidence before another review cycle.",
      scheduledFor: null,
    };
  }

  if (decision === "APPROVE_FOR_CLIENT" && input.deliveryAllowed) {
    return {
      state: "READY_FOR_DELIVERY",
      deliveryAllowed: true,
      deliveryMethod: "INTERNAL_PREVIEW",
      reason: "The brief is approved as client-safe, but actual client delivery is still a manual process.",
      nextStep: "Operator may prepare manual sponsor-safe delivery from the approved internal preview.",
      scheduledFor: null,
    };
  }

  return {
    state: "NOT_READY",
    deliveryAllowed: false,
    deliveryMethod: "INTERNAL_PREVIEW",
    reason: input.efficacy?.grade === "WITHHOLD"
      ? "The brief is not strong enough for delivery."
      : "The brief still requires revision or more evidence before delivery.",
    nextStep: decision === "WAIT_FOR_MORE_EVIDENCE"
      ? "Gather more verified evidence and regenerate the cycle."
      : "Revise the brief and repeat operator review.",
    scheduledFor: null,
  };
}

function decisionReasonsToText(reasons: OversightReviewDecisionReason[]): string {
  return reasons.join(", ").toLowerCase().replace(/_/g, " ");
}

async function resolveOrganisationAccess(input: {
  userId?: string;
  email?: string;
  organisationId?: string;
  warnings: string[];
}): Promise<OrganisationAccessDecision> {
  if (!input.organisationId) return syntheticAggregateAccess();

  const access = await evaluateOrganisationAccess({
    userId: input.userId ?? null,
    email: input.email ?? null,
    organisationId: input.organisationId,
    requestedScope: "CONTROL_ROOM_VIEW",
  });

  if (!access.allowed) {
    input.warnings.push(`Organisation access denied: ${access.reason}`);
  }

  return access;
}

export async function composeOversightReviewCycle(input: {
  userId?: string;
  email?: string;
  organisationId?: string;
  accountId?: string;
  periodStart?: string;
  periodEnd?: string;
  persist?: boolean;
  operatorDecision?: OversightReviewDecision;
  operatorNote?: string;
  firstCycleException?: boolean;
}): Promise<{
  internalBrief?: OversightBrief;
  clientSafeBrief?: OversightBrief;
  cycle: OversightReviewCycle;
  warnings: string[];
  efficacy?: OversightBriefEfficacyScore;
  ledgerEvents: OversightCycleLedgerEvent[];
  cycleComparison: OversightCycleComparison;
  recommendedDecision: ReturnType<typeof recommendOversightReviewDecision>;
  nextRequiredOperatorDecision: OversightReviewDecision;
  operatorDecisionRecord?: OversightReviewDecisionRecord;
  previousBrief?: OversightBrief;
  deliveryIntent: OversightDeliveryIntent;
  nextCycleIntent?: ReturnType<typeof deriveNextOversightCycleIntent>;
}> {
  const generatedAt = new Date().toISOString();
  const warnings: string[] = [];

  const composed = await composeOversightBrief(input);
  warnings.push(...composed.warnings);

  const access = await resolveOrganisationAccess({
    userId: input.userId,
    email: input.email,
    organisationId: input.organisationId,
    warnings,
  });

  let clientSafe: ClientSafeOversightBrief | null = null;
  if (composed.brief && access.allowed) {
    clientSafe = buildClientSafeOversightBrief({
      brief: composed.brief,
      access,
    });
    warnings.push(...clientSafe.warnings);
  }

  const cycleId = `review-cycle:${composed.account?.accountId || input.accountId || input.organisationId || input.email || input.userId || "unknown"}:${(composed.brief?.periodStart || input.periodStart || generatedAt).slice(0, 10)}`;
  const previousBrief = await loadPreviousOversightBrief({
    accountId: composed.account?.accountId || input.accountId,
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

  const baseEfficacy = composed.brief
    ? scoreOversightBriefEfficacy({
        brief: composed.brief,
        previousBrief,
        warnings,
        suppressions: clientSafe?.suppressions ?? [],
      })
    : undefined;

  let firstCycleExceptionAllowed = false;
  if (input.firstCycleException && composed.brief && baseEfficacy) {
    const validation = validateFirstCycleException({
      brief: composed.brief,
      baseEfficacy,
      suppressions: clientSafe?.suppressions ?? [],
      operatorNote: input.operatorNote,
    });
    warnings.push(...validation.warnings);
    firstCycleExceptionAllowed = validation.allowed;
  }

  const efficacy = composed.brief
    ? scoreOversightBriefEfficacy({
        brief: composed.brief,
        previousBrief,
        warnings,
        suppressions: clientSafe?.suppressions ?? [],
        firstCycleException: firstCycleExceptionAllowed,
      })
    : undefined;

  const recommendedDecision = efficacy
    ? recommendOversightReviewDecision({
        efficacy,
        suppressions: clientSafe?.suppressions ?? [],
        warnings,
        cycleComparison,
        clientSafeBrief: clientSafe,
        hasCounselTrigger: (composed.brief?.counsel.requiredNow ?? 0) > 0,
        hasBoardroomTrigger: (composed.brief?.boardroom.dossiersAvailable ?? 0) > 0,
      })
    : {
        recommendedDecision: "WAIT_FOR_MORE_EVIDENCE" as OversightReviewDecision,
        reasons: ["INSUFFICIENT_EVIDENCE", "DELIVERY_NOT_READY"] as OversightReviewDecisionReason[],
        deliveryAllowed: false,
        operatorNoteRequired: false,
        explanation: "No internal brief could be composed from current evidence.",
      };

  let status = deriveBaseStatus({
    internalBrief: composed.brief,
    clientSafe,
    access,
    warnings,
    suppressions: clientSafe?.suppressions ?? [],
  });

  const decisions: OversightReviewCycle["decisions"] = [];
  let operatorDecisionRecord: OversightReviewDecisionRecord | undefined;
  const chosenDecision = input.operatorDecision;

  if (chosenDecision && efficacy && composed.brief) {
    const noteRequired = requiresOperatorNote({
      decision: chosenDecision,
      recommendedDecision: recommendedDecision.recommendedDecision,
      efficacy,
      firstCycleException: firstCycleExceptionAllowed,
    });
    if (noteRequired && !input.operatorNote?.trim()) {
      warnings.push("Operator note is required for this review decision.");
    } else {
      decisions.push({
        decision: chosenDecision,
        reason: input.operatorNote?.trim() || recommendedDecision.explanation,
        timestamp: generatedAt,
      });

      operatorDecisionRecord = {
        id: randomUUID(),
        accountId: composed.brief.accountId,
        organisationId: input.organisationId ?? null,
        cycleId,
        briefId: composed.brief.briefId,
        decision: chosenDecision,
        reasons: chosenDecision === recommendedDecision.recommendedDecision
          ? recommendedDecision.reasons
          : [...recommendedDecision.reasons, chosenDecision === "APPROVE_FOR_CLIENT" ? "OPERATOR_APPROVED" : "OPERATOR_WITHHELD"],
        operatorId: input.userId ?? null,
        operatorNote: input.operatorNote?.trim() || null,
        efficacyGrade: efficacy.grade,
        efficacyScore: efficacy.totalScore,
        clientSafe: Boolean(clientSafe?.brief),
        deliveryAllowed: chosenDecision === "APPROVE_FOR_CLIENT" && recommendedDecision.deliveryAllowed,
        createdAt: generatedAt,
      };

      if (chosenDecision === "APPROVE_FOR_CLIENT") status = "APPROVED_FOR_DELIVERY";
      if (chosenDecision === "WITHHOLD_FROM_CLIENT") status = "WITHHELD";
      if (chosenDecision === "REVISE_BEFORE_DELIVERY" || chosenDecision === "WAIT_FOR_MORE_EVIDENCE") status = "REVISION_REQUIRED";
      if (chosenDecision === "ESCALATE_TO_COUNSEL" || chosenDecision === "ESCALATE_TO_BOARDROOM") status = "REVISION_REQUIRED";
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
    reviewedAt: operatorDecisionRecord ? generatedAt : undefined,
    approvedAt: operatorDecisionRecord?.decision === "APPROVE_FOR_CLIENT" ? generatedAt : undefined,
    deliveredAt: undefined,
    reviewer: input.email
      ? {
          userId: input.userId,
          email: input.email,
          role: access.role,
        }
      : undefined,
    decisions,
    suppressions: clientSafe?.suppressions ?? [],
    warnings: [...warnings],
  };

  const nextRequiredOperatorDecision = recommendedDecision.recommendedDecision;
  const deliveryIntent = buildDeliveryIntent({
    decision: operatorDecisionRecord?.decision,
    recommendedDecision: recommendedDecision.recommendedDecision,
    efficacy,
    deliveryAllowed: operatorDecisionRecord?.deliveryAllowed ?? recommendedDecision.deliveryAllowed,
  });

  const nextCycleIntent = efficacy
    ? deriveNextOversightCycleIntent({
        tier: composed.account?.tier ?? "GOVERNED_CONTINUITY",
        currentCycleDate: cycle.periodEnd,
        unresolvedActions: composed.brief?.requiredActions.length ?? 0,
        counselRequired: (composed.brief?.counsel.requiredNow ?? 0) > 0,
        boardroomRequired: (composed.brief?.boardroom.dossiersAvailable ?? 0) > 0,
        efficacyGrade: efficacy.grade,
      })
    : undefined;

  if (input.persist && composed.brief?.accountId) {
    const actor = input.email
      ? { userId: input.userId, email: input.email, role: access.role }
      : undefined;

    await persistCycleLedgerEvent({
      accountId: composed.brief.accountId,
      cycleId,
      eventType: "BRIEF_GENERATED",
      actor,
      warnings,
      briefSnapshot: composed.brief,
    });

    if (efficacy) {
      await persistCycleLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: "EFFICACY_SCORED",
        actor,
        warnings: efficacy.operatorNotes,
        reason: `Grade ${efficacy.grade} at ${efficacy.totalScore}.`,
        efficacy,
      });
    }

    if (clientSafe?.brief) {
      await persistCycleLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: "CLIENT_SAFE_VERSION_CREATED",
        actor,
        warnings,
        briefSnapshot: clientSafe.brief,
      });
    }

    if (operatorDecisionRecord) {
      const eventTypeMap: Record<OversightReviewDecision, OversightCycleLedgerEventType> = {
        APPROVE_FOR_CLIENT: "APPROVED_FOR_DELIVERY",
        REVISE_BEFORE_DELIVERY: "REVISION_REQUESTED",
        WITHHOLD_FROM_CLIENT: "WITHHELD",
        ESCALATE_TO_COUNSEL: "COUNSEL_ESCALATED",
        ESCALATE_TO_BOARDROOM: "BOARDROOM_ESCALATED",
        WAIT_FOR_MORE_EVIDENCE: "REVISION_REQUESTED",
      };

      await persistCycleLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: eventTypeMap[operatorDecisionRecord.decision],
        actor,
        reason: operatorDecisionRecord.operatorNote || decisionReasonsToText(operatorDecisionRecord.reasons),
        warnings,
      });

      await persistOversightReviewDecision({
        decisionRecord: operatorDecisionRecord,
        internalBrief: composed.brief,
        clientSafeBrief: clientSafe,
        suppressions: clientSafe?.suppressions ?? [],
        cycleComparison,
      });
    }

    if (nextCycleIntent) {
      await persistCycleLedgerEvent({
        accountId: composed.brief.accountId,
        cycleId,
        eventType: "NEXT_CYCLE_SCHEDULED",
        actor,
        reason: `Next-cycle intent recorded: ${nextCycleIntent.cadence.toLowerCase()} cadence recommended.`,
        warnings,
      });
    }
  }

  const ledgerEvents = await listOversightCycleLedgerEvents({
    accountId: composed.brief?.accountId,
    cycleId,
  });

  return {
    internalBrief: composed.brief,
    clientSafeBrief: clientSafe?.brief,
    cycle,
    warnings,
    efficacy,
    ledgerEvents,
    cycleComparison,
    recommendedDecision,
    nextRequiredOperatorDecision,
    operatorDecisionRecord,
    previousBrief,
    deliveryIntent,
    nextCycleIntent,
  };
}
