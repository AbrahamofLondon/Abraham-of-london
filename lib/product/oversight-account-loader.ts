import "server-only";

import { prisma } from "@/lib/prisma.server";
import { qualifiesForBoardroom } from "@/lib/constitution/boardroom-mode";
import { detectPatternRecurrenceV0, type PatternRecurrenceResult } from "@/lib/product/pattern-recurrence";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";
import type { RetainerOversightAccount, RetainerStatus, RetainerTier } from "@/lib/product/retainer-oversight-contract";
import { calculateCostOfInactionClock, type CostOfInactionClockResult } from "@/lib/product/cost-of-inaction-clock";
import { buildCommitmentVerificationStates, type CommitmentVerificationState } from "@/lib/product/commitment-verification";
import { findLatestStrategyExecutionRecord, type StrategyExecutionRecord } from "@/lib/strategy-room/execution-record";
import {
  extractAssessmentEvidenceCapture,
  mergeAssessmentEvidenceCapture,
  type AssessmentEvidenceCapture,
} from "@/lib/product/evidence-capture-contract";

export type OversightAccountCase = {
  caseId: string;
  title: string;
  state?: string;
  evidenceTier?: string;
  boardroomQualified?: boolean;
  counselTriggered?: boolean;
  costBasisAvailable?: boolean;
  unresolvedCommitments?: number;
  patternRecurrenceStatus?: string;
  outcomeClassification?: string;
  updatedAt?: string;
  latestDecisionText?: string | null;
  primaryContradiction?: string | null;
  organisationKey?: string | null;
  email?: string | null;
  recurrence?: PatternRecurrenceResult;
  latestExecutionRecord?: StrategyExecutionRecord | null;
  verification?: CommitmentVerificationState[];
  costOfInaction?: CostOfInactionClockResult | null;
  evidenceCapture?: AssessmentEvidenceCapture;
};

export type OversightAccountLoadResult = {
  account?: RetainerOversightAccount;
  cases: OversightAccountCase[];
  retainedEnforcement?: {
    cyclesReviewed: number;
    activeRetainedDecisions: number;
    enforcementBreaches: number;
    improvementSignals: number;
    deteriorationSignals: number;
  };
  warnings: string[];
};

function normalizeEmail(email: string | null | undefined): string | null {
  return email ? email.trim().toLowerCase() : null;
}

function parseMoney(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/£\s?([\d,]+(?:\.\d+)?)/i) || value.match(/\b([\d,]+(?:\.\d+)?)\b/);
  if (!match?.[1]) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseCostBasis(text: string | null | undefined): {
  monthlyCostEstimate?: number;
  dailyCostEstimate?: number;
} | null {
  const amount = parseMoney(text);
  if (!amount) return null;

  const normalized = text?.toLowerCase() || "";
  if (normalized.includes("day")) {
    return { dailyCostEstimate: amount };
  }
  if (normalized.includes("month")) {
    return { monthlyCostEstimate: amount };
  }
  return null;
}

function deriveEvidenceTier(stageCount: number): string {
  if (stageCount >= 4) return "multi_source";
  if (stageCount >= 2) return "multi_source";
  if (stageCount >= 1) return "single_source";
  return "insufficient";
}

function truncate(value: string | null | undefined, max = 96): string {
  const text = (value || "").trim();
  if (!text) return "Active case";
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function mapRetainerTier(value: string | null | undefined): RetainerTier {
  switch ((value || "").toUpperCase()) {
    case "INSTITUTIONAL":
      return "INSTITUTIONAL_COMMAND";
    case "OPERATIONAL":
      return "EXECUTIVE_OVERSIGHT";
    default:
      return "GOVERNED_CONTINUITY";
  }
}

function mapRetainerStatus(value: string | null | undefined): RetainerStatus {
  switch ((value || "").toUpperCase()) {
    case "ACTIVE":
      return "ACTIVE";
    case "PAUSED":
      return "PAUSED";
    case "TERMINATED":
      return "ENDED";
    default:
      return "PROSPECT";
  }
}

function deriveQualifiedStatus(cases: OversightAccountCase[]): RetainerStatus | null {
  const materiallyQualified = cases.some((item) =>
    item.boardroomQualified
    || item.counselTriggered
    || (item.unresolvedCommitments ?? 0) > 0
    || item.recurrence?.status === "VERIFIED_RECURRENCE"
    || item.outcomeClassification === "deteriorated"
  );

  return materiallyQualified ? "QUALIFIED" : null;
}

export async function loadOversightAccount(input: {
  userId?: string;
  email?: string;
  organisationId?: string;
}): Promise<OversightAccountLoadResult> {
  const warnings: string[] = [];
  const email = normalizeEmail(input.email);

  let organisation:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | null = null;

  if (input.organisationId) {
    const access = await evaluateOrganisationAccess({
      userId: input.userId,
      email,
      organisationId: input.organisationId,
      requestedScope: "CONTROL_ROOM_VIEW",
    });

    if (!access.allowed) {
      return {
        cases: [],
        warnings: [`Organisation access denied: ${access.reason}`],
      };
    }

    organisation = await prisma.organisation.findUnique({
      where: { id: input.organisationId },
      select: { id: true, name: true, slug: true },
    });

    if (!organisation) {
      return {
        cases: [],
        warnings: ["Organisation could not be resolved for oversight loading."],
      };
    }
  }

  const journeys = await prisma.diagnosticJourney.findMany({
    where: input.organisationId
      ? {
          OR: [
            { organisationKey: organisation?.slug ?? undefined },
            { organisation: organisation?.name ?? undefined },
          ],
        }
      : {
          OR: [
            ...(email ? [{ email }] : []),
            ...(input.userId ? [{ userId: input.userId }] : []),
          ],
        },
    include: {
      stages: {
        select: { stage: true, createdAt: true, payload: true },
        orderBy: { createdAt: "asc" },
      },
      evidenceNodes: {
        where: {
          kind: {
            in: ["contradiction", "pattern_recurrence", "persistent_root_cause", "counsel_review"],
          },
        },
        select: {
          kind: true,
          summary: true,
          label: true,
          severity: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      decisionObjects: {
        select: {
          id: true,
          sessionId: true,
          decisionText: true,
          costOfDelayText: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  if (journeys.length === 0) {
    return {
      cases: [],
      warnings: [
        input.organisationId
          ? "No diagnostic journeys were found for this organisation scope."
          : "No diagnostic journeys were found for this actor.",
      ],
    };
  }

  const activeRetainer = input.organisationId
    ? await prisma.retainerContract.findFirst({
        where: { organisationId: input.organisationId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          organisationId: true,
          tier: true,
          status: true,
          retainedDecisions: {
            where: { status: { in: ["ACTIVE", "MONITORED"] } },
            select: { id: true },
          },
        },
      })
    : null;

  const cases: OversightAccountCase[] = [];

  for (const journey of journeys) {
    const latestDecision = journey.decisionObjects[0] ?? null;
    const contradictionNode = journey.evidenceNodes.find((node) => node.kind === "contradiction") ?? null;
    const patternNode = journey.evidenceNodes.find((node) => node.kind === "pattern_recurrence") ?? null;
    const evidenceTier = deriveEvidenceTier(journey.stages.length);
    const evidenceCapture = mergeAssessmentEvidenceCapture(
      ...journey.stages.map((stage) => extractAssessmentEvidenceCapture(stage.payload)),
    );

    const executionRecord = latestDecision?.sessionId || journey.email
      ? await findLatestStrategyExecutionRecord({
          sessionId: latestDecision?.sessionId ?? null,
          email: normalizeEmail(journey.email),
        })
      : null;

    let latestDecisionLog:
      | {
          status: string;
          updatedAt: Date;
        }
      | null = null;

    if (latestDecision?.sessionId) {
      latestDecisionLog = await prisma.strategyDecisionLog.findFirst({
        where: { sessionId: latestDecision.sessionId },
        orderBy: { updatedAt: "desc" },
        select: { status: true, updatedAt: true },
      });
    }

    const verification = executionRecord
      ? buildCommitmentVerificationStates({
          executionRecord,
          latestDecisionStatus: latestDecisionLog?.status ?? null,
          latestDecisionUpdatedAt: latestDecisionLog?.updatedAt ?? null,
        })
      : [];

    const unresolvedCommitments = verification.filter((item) =>
      item.status === "DUE" || item.status === "OVERDUE" || item.status === "UNVERIFIED"
    ).length;

    const recurrence = await detectPatternRecurrenceV0({
      email: normalizeEmail(journey.email),
      organisationKey: journey.organisationKey,
      currentCaseId: journey.journeyKey,
      contradiction: contradictionNode?.summary || contradictionNode?.label || null,
      decisionText: latestDecision?.decisionText || null,
    });

    const costBasis = parseCostBasis(executionRecord?.timeline)
      || parseCostBasis(latestDecision?.costOfDelayText)
      || parseCostBasis(latestDecision?.decisionText)
      || null;

    const costOfInaction = costBasis
      ? calculateCostOfInactionClock({
          ...costBasis,
          startedAt: executionRecord?.createdAt || latestDecision?.createdAt || journey.createdAt,
        })
      : null;

    const boardroomQualified = (() => {
      const monthlyCost = parseMoney(executionRecord?.timeline)
        || parseMoney(latestDecision?.costOfDelayText)
        || 0;
      if (!monthlyCost) return false;
      return qualifiesForBoardroom({
        economics: { estimatedMonthlyCost: monthlyCost },
        accuracyFeedback: {
          response: evidenceTier === "multi_source" ? "yes" : "partial",
        },
      } as never).qualified;
    })();

    const latestOutcome = await prisma.outcomeVerificationRecord.findFirst({
      where: {
        OR: [
          { baselineJourneyId: journey.id },
          { followUpJourneyId: journey.id },
          ...(latestDecision ? [{ decisionObjectId: latestDecision.id }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { outcomeClassification: true },
    });

    const counselTriggered = journey.evidenceNodes.some((node) => node.kind === "counsel_review")
      || unresolvedCommitments >= 2
      || ((latestDecisionLog?.status || "").toLowerCase() === "blocked" && evidenceTier !== "multi_source");

    if (!latestDecision) {
      warnings.push(`Journey ${journey.journeyKey} has no canonical decision object. Title and cost signals are partial.`);
    }
    if (!executionRecord && journey.stages.some((stage) => stage.stage === "strategy_room")) {
      warnings.push(`Journey ${journey.journeyKey} has Strategy Room stage history but no durable execution record.`);
    }

    cases.push({
      caseId: journey.journeyKey,
      title: truncate(latestDecision?.decisionText || contradictionNode?.summary || patternNode?.summary || journey.organisation || journey.diagnosticType),
      state: journey.status || undefined,
      evidenceTier,
      boardroomQualified,
      counselTriggered,
      costBasisAvailable: Boolean(costBasis),
      unresolvedCommitments,
      patternRecurrenceStatus: recurrence.status,
      outcomeClassification: latestOutcome?.outcomeClassification || undefined,
      updatedAt: journey.updatedAt.toISOString(),
      latestDecisionText: latestDecision?.decisionText || null,
      primaryContradiction: contradictionNode?.summary || contradictionNode?.label || null,
      organisationKey: journey.organisationKey,
      email: normalizeEmail(journey.email),
      recurrence,
      latestExecutionRecord: executionRecord,
      verification,
      costOfInaction,
      evidenceCapture,
    });
  }

  const qualifiedStatus = deriveQualifiedStatus(cases);
  const accountStatus = activeRetainer
    ? mapRetainerStatus(activeRetainer.status)
    : qualifiedStatus;

  if (!activeRetainer && !qualifiedStatus) {
    warnings.push("No active or qualified retainer account could be derived from current case evidence.");
  }

  const account = accountStatus
    ? {
        accountId: activeRetainer?.id || `oversight:${input.organisationId || email || input.userId || "unknown"}`,
        organisationId: input.organisationId,
        ownerUserId: input.userId,
        tier: activeRetainer ? mapRetainerTier(activeRetainer.tier) : "GOVERNED_CONTINUITY",
        status: accountStatus,
        activeCaseCount: cases.length,
        oversightSignals: [],
        nextRequiredAction: cases.find((item) => (item.unresolvedCommitments ?? 0) > 0)?.title
          ? `Verify unresolved commitments in ${cases.find((item) => (item.unresolvedCommitments ?? 0) > 0)?.title}.`
          : undefined,
      } satisfies RetainerOversightAccount
    : undefined;

  const retainedSurface = input.organisationId
    ? await prisma.retainerContract.findFirst({
        where: {
          organisationId: input.organisationId,
          status: "ACTIVE",
        },
        select: {
          retainedDecisions: {
            where: {
              status: { in: ["ACTIVE", "MONITORED"] },
            },
            select: {
              id: true,
              enforcementCycles: {
                orderBy: { cycleDate: "desc" },
                take: 12,
                select: {
                  id: true,
                  outcomeDelta: true,
                  aiStatusSignal: true,
                },
              },
            },
          },
        },
      })
    : null;

  const retainedCycles = retainedSurface?.retainedDecisions.flatMap((decision) => decision.enforcementCycles) ?? [];
  const retainedEnforcement = retainedSurface
    ? {
        cyclesReviewed: retainedCycles.length,
        activeRetainedDecisions: retainedSurface.retainedDecisions.length,
        enforcementBreaches: retainedCycles.filter((cycle) =>
          (cycle.outcomeDelta ?? 0) < 0 || String(cycle.aiStatusSignal || "").toUpperCase().includes("LOSS")
        ).length,
        improvementSignals: retainedCycles.filter((cycle) => (cycle.outcomeDelta ?? 0) > 0).length,
        deteriorationSignals: retainedCycles.filter((cycle) => (cycle.outcomeDelta ?? 0) < 0).length,
      }
    : undefined;

  if (input.organisationId && !retainedEnforcement && activeRetainer) {
    warnings.push("Active retainer contract exists but no enforcement cycles are recorded for this oversight period.");
  }

  return {
    account,
    cases,
    retainedEnforcement,
    warnings,
  };
}
