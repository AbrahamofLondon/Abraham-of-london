import "server-only";

import { getCreditProfile } from "@/lib/decision-ledger/ledger-service";
import { deriveDecisionCreditGovernanceEffect } from "@/lib/product/decision-credit-governance";
import { loadOversightAccount } from "@/lib/product/oversight-account-loader";
import { buildOversightSignals } from "@/lib/product/oversight-signal-builder";
import { loadControlRoomState } from "@/lib/product/control-room-state-loader";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { OversightCycle, RetainerOversightAccount } from "@/lib/product/retainer-oversight-contract";

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function toIso(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function periodDefaultStart(end: Date): string {
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return start.toISOString();
}

function buildExecutiveSummary(input: {
  activeCaseCount: number;
  signalCount: number;
  costOfInactionTotal: number;
  boardroomCount: number;
  counselCount: number;
  deterioratedCount: number;
  retainedCyclesReviewed: number;
}): string {
  if (input.activeCaseCount === 0) {
    return "No active cases could be assembled for this oversight period.";
  }

  const clauses = [
    `${input.activeCaseCount} active case${input.activeCaseCount === 1 ? "" : "s"} reviewed`,
    `${input.signalCount} material oversight signal${input.signalCount === 1 ? "" : "s"} detected`,
  ];

  if (input.costOfInactionTotal > 0) {
    clauses.push(`estimated cost of inaction ${input.costOfInactionTotal}`);
  }
  if (input.counselCount > 0) {
    clauses.push(`${input.counselCount} counsel trigger${input.counselCount === 1 ? "" : "s"}`);
  }
  if (input.boardroomCount > 0) {
    clauses.push(`${input.boardroomCount} boardroom-qualified case${input.boardroomCount === 1 ? "" : "s"}`);
  }
  if (input.deterioratedCount > 0) {
    clauses.push(`${input.deterioratedCount} deteriorated outcome${input.deterioratedCount === 1 ? "" : "s"}`);
  }
  if (input.retainedCyclesReviewed > 0) {
    clauses.push(`${input.retainedCyclesReviewed} retained enforcement cycle${input.retainedCyclesReviewed === 1 ? "" : "s"} reviewed`);
  }

  return clauses.join("; ") + ".";
}

function buildCycle(input: {
  accountId: string;
  periodStart: string;
  periodEnd: string;
  caseCount: number;
  counselReviewsTriggered: number;
  boardroomDossiersGenerated: number;
  verifiedOutcomes: number;
  unresolvedCommitments: number;
  costOfInactionEstimate?: number;
  escalationRequired: boolean;
}): OversightCycle {
  return {
    cycleId: `cycle:${input.accountId}:${input.periodStart.slice(0, 10)}`,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    status: input.caseCount === 0
      ? "NOT_STARTED"
      : input.escalationRequired
        ? "ESCALATION_REQUIRED"
        : "BRIEF_READY",
    casesReviewed: input.caseCount,
    casesEscalated: input.counselReviewsTriggered + input.boardroomDossiersGenerated,
    boardroomDossiersGenerated: input.boardroomDossiersGenerated,
    counselReviewsTriggered: input.counselReviewsTriggered,
    verifiedOutcomes: input.verifiedOutcomes,
    unresolvedCommitments: input.unresolvedCommitments,
    costOfInactionEstimate: input.costOfInactionEstimate,
  };
}

export async function composeOversightBrief(input: {
  userId?: string;
  email?: string;
  organisationId?: string;
  periodStart?: string;
  periodEnd?: string;
}): Promise<{
  brief?: OversightBrief;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const periodEnd = toIso(input.periodEnd, new Date().toISOString());
  const periodStart = toIso(input.periodStart, periodDefaultStart(new Date(periodEnd)));

  const loaded = await loadOversightAccount(input);
  warnings.push(...loaded.warnings);

  if (!loaded.account) {
    warnings.push("No retainer oversight account could be composed from current evidence.");
    return { warnings };
  }

  const creditProfile = input.email ? await getCreditProfile(input.email.toLowerCase()) : null;
  if (!creditProfile && input.email) {
    warnings.push("Decision credit profile was unavailable for this oversight scope.");
  }

  const controlRoom = input.organisationId
    ? await loadControlRoomState({
        userId: input.userId ?? null,
        email: input.email ?? null,
        organisationId: input.organisationId,
      })
    : null;

  if (input.organisationId && !controlRoom?.state) {
    warnings.push("Organisation Control Room state was unavailable. Divergence signals remain partial.");
  }

  const signals = buildOversightSignals({
    cases: loaded.cases,
    creditProfile,
    controlRoomState: controlRoom?.state ?? null,
    retainedEnforcement: loaded.retainedEnforcement ?? null,
  });

  const commitmentsDue = sum(loaded.cases.map((item) =>
    item.verification?.filter((checkpoint) => checkpoint.status === "DUE" || checkpoint.status === "OVERDUE").length ?? 0
  ));
  const commitmentsVerified = sum(loaded.cases.map((item) =>
    item.verification?.filter((checkpoint) =>
      checkpoint.status === "VERIFIED_EXECUTED" || checkpoint.status === "VERIFIED_BLOCKED"
    ).length ?? 0
  ));
  const unresolvedCommitments = sum(loaded.cases.map((item) => item.unresolvedCommitments ?? 0));
  const costSignals = loaded.cases.filter((item) => item.costOfInaction && item.costOfInaction.basis !== "UNAVAILABLE");
  const totalEstimatedCost = sum(costSignals.map((item) => item.costOfInaction?.accumulatedCost ?? 0));
  const boardroomCount = loaded.cases.filter((item) => item.boardroomQualified).length;
  const counselCount = loaded.cases.filter((item) => item.counselTriggered).length;
  const verifiedOutcomeCount = loaded.cases.filter((item) => Boolean(item.outcomeClassification)).length;
  const deterioratedCount = loaded.cases.filter((item) =>
    item.outcomeClassification === "deteriorated" || item.outcomeClassification === "invalid"
  ).length;
  const retainedCyclesReviewed = loaded.retainedEnforcement?.cyclesReviewed ?? 0;
  const escalationRequired = signals.some((signal) => signal.severity === "CRITICAL" || signal.type === "COUNSEL_REVIEW_TRIGGERED");

  const cycle = buildCycle({
    accountId: loaded.account.accountId,
    periodStart,
    periodEnd,
    caseCount: loaded.cases.length,
    counselReviewsTriggered: counselCount,
    boardroomDossiersGenerated: boardroomCount,
    verifiedOutcomes: verifiedOutcomeCount,
    unresolvedCommitments,
    costOfInactionEstimate: totalEstimatedCost > 0 ? totalEstimatedCost : undefined,
    escalationRequired,
  });

  const creditGovernance = creditProfile
    ? deriveDecisionCreditGovernanceEffect({
        score: creditProfile.score,
        trend: creditProfile.trend,
        breached: creditProfile.breached,
      })
    : null;

  const requiredActions = [
    ...signals
      .filter((signal) => signal.severity === "CRITICAL" || signal.severity === "HIGH")
      .map((signal) => signal.recommendedAction),
    ...loaded.cases
      .filter((item) => (item.unresolvedCommitments ?? 0) > 0)
      .map((item) => `Verify unresolved commitments for ${item.title}.`),
  ].filter(Boolean);

  const executiveSummary = buildExecutiveSummary({
    activeCaseCount: loaded.cases.length,
    signalCount: signals.length,
    costOfInactionTotal: totalEstimatedCost,
    boardroomCount,
    counselCount,
    deterioratedCount,
    retainedCyclesReviewed,
  });

  const account: RetainerOversightAccount = {
    ...loaded.account,
    currentCycle: cycle,
    oversightSignals: signals,
    nextRequiredAction: requiredActions[0],
  };

  const brief: OversightBrief = {
    briefId: `brief:${account.accountId}:${periodStart.slice(0, 10)}`,
    accountId: account.accountId,
    periodStart,
    periodEnd,
    executiveSummary,
    activeCases: loaded.cases.map((item) => ({
      caseId: item.caseId,
      title: item.title,
      state: item.state || "active",
      primaryRisk:
        signals.find((signal) => signal.caseId === item.caseId && (signal.severity === "CRITICAL" || signal.severity === "HIGH"))?.title
        || signals.find((signal) => signal.caseId === item.caseId)?.title,
      nextAction:
        item.verification?.find((checkpoint) => checkpoint.status === "OVERDUE" || checkpoint.status === "DUE")?.prompt
        || (item.counselTriggered ? "Review counsel escalation boundary." : undefined),
    })),
    costOfInaction: totalEstimatedCost > 0
      ? {
          totalEstimated: totalEstimatedCost,
          casesIncluded: costSignals.length,
        }
      : undefined,
    counsel: {
      reviewsTriggered: counselCount,
      requiredNow: signals.filter((signal) => signal.type === "COUNSEL_REVIEW_TRIGGERED" && signal.severity !== "LOW").length,
    },
    boardroom: {
      dossiersAvailable: boardroomCount,
      exportsQueued: 0,
    },
    verification: {
      commitmentsDue,
      commitmentsVerified,
      unresolvedBreaches: unresolvedCommitments,
    },
    retainedEnforcement: loaded.retainedEnforcement,
    decisionCredit: creditProfile
      ? {
          score: creditProfile.score,
          trend: creditProfile.trend,
          interpretation: creditGovernance?.explanation,
        }
      : undefined,
    requiredActions: [...new Set(requiredActions)].slice(0, 6),
  };

  if (boardroomCount > 0) {
    warnings.push("Boardroom export queue is not yet modelled. Dossier readiness is signal-only in v0.");
  }
  if (signals.length === 0) {
    warnings.push("No material oversight signals were emitted for the current scope.");
  }
  if (!brief.costOfInaction) {
    warnings.push("No verified cost basis was available across the current oversight scope.");
  }
  if (!brief.retainedEnforcement && input.organisationId) {
    warnings.push("No retained enforcement cycle evidence was available for this organisation scope.");
  }

  return {
    brief,
    warnings,
  };
}
