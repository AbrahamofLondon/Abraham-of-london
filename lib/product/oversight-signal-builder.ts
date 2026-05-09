import type { CreditProfile } from "@/lib/decision-ledger/ledger-service";
import type { OversightAccountCase } from "@/lib/product/oversight-account-loader";
import type { ControlRoomState } from "@/lib/product/control-room-contract";
import type { OversightSignal } from "@/lib/product/retainer-oversight-contract";
import type { BuyerVisibleCadencePosture } from "@/lib/product/retained-cadence-contract";
import { summarizeAssessmentEvidenceText } from "@/lib/product/evidence-capture-contract";

function severityFromCost(amount: number): OversightSignal["severity"] {
  if (amount >= 50000) return "CRITICAL";
  if (amount >= 20000) return "HIGH";
  if (amount >= 5000) return "MEDIUM";
  return "LOW";
}

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export type TeamAggregateSignalInput = {
  largestGapDomain?: string;
  largestGapDelta?: number;
  trustScore?: number;
  respondentCount?: number;
  claimLevel?: string;
};

export type EnterpriseStrainSignalInput = {
  fragilitySignal?: string;
  percentScore?: number;
  weakestDomains?: string[];
};

export function buildOversightSignals(input: {
  cases: OversightAccountCase[];
  creditProfile?: CreditProfile | null;
  controlRoomState?: ControlRoomState | null;
  teamAggregate?: TeamAggregateSignalInput | null;
  enterpriseStrain?: EnterpriseStrainSignalInput | null;
  retainedEnforcement?: {
    cyclesReviewed: number;
    activeRetainedDecisions: number;
    enforcementBreaches: number;
    improvementSignals: number;
    deteriorationSignals: number;
  } | null;
  retainedCadence?: BuyerVisibleCadencePosture | null;
  now?: Date | string;
}): OversightSignal[] {
  const createdAt = new Date(input.now ?? new Date()).toISOString();
  const signals: OversightSignal[] = [];

  for (const item of input.cases) {
    const cost = item.costOfInaction;
    if (cost && cost.basis !== "UNAVAILABLE" && cost.accumulatedCost > 0) {
      signals.push({
        id: `${item.caseId}:cost`,
        type: "COST_OF_INACTION_ACCUMULATING",
        caseId: item.caseId,
        severity: severityFromCost(cost.accumulatedCost),
        title: "Cost of inaction is accumulating",
        explanation: `${item.title} has an estimated accumulated cost of ${cost.accumulatedCost} over ${cost.daysElapsed} day${cost.daysElapsed === 1 ? "" : "s"}.`,
        recommendedAction: "Review the blocked decision path and verify whether the stated action has moved.",
        createdAt,
      });
    }

    const overdueCommitments = item.verification?.filter((checkpoint) =>
      checkpoint.status === "OVERDUE" || checkpoint.status === "UNVERIFIED"
    ).length ?? 0;
    if (overdueCommitments > 0) {
      signals.push({
        id: `${item.caseId}:commitment`,
        type: "COMMITMENT_UNVERIFIED",
        caseId: item.caseId,
        severity: overdueCommitments >= 3 ? "HIGH" : overdueCommitments >= 2 ? "MEDIUM" : "LOW",
        title: "Commitments remain unverified",
        explanation: `${item.title} has ${overdueCommitments} overdue or unverified checkpoint${overdueCommitments === 1 ? "" : "s"}.`,
        recommendedAction: "Confirm whether the committed action executed, stalled, or failed.",
        createdAt,
      });
    }

    if (item.recurrence?.status === "VERIFIED_RECURRENCE" || item.recurrence?.status === "POSSIBLE_RECURRENCE") {
      signals.push({
        id: `${item.caseId}:recurrence`,
        type: "PATTERN_RECURRED",
        caseId: item.caseId,
        severity: item.recurrence.status === "VERIFIED_RECURRENCE" ? "HIGH" : "MEDIUM",
        title: "Pattern recurrence detected",
        explanation: item.recurrence.explanation,
        recommendedAction: "Review prior case history and confirm whether the same structural contradiction has returned.",
        createdAt,
      });
    }

    if (item.evidenceCapture?.priorAttempts && item.evidenceCapture?.recurrenceSignal) {
      signals.push({
        id: `${item.caseId}:pattern-history`,
        type: "PATTERN_RECURRED",
        caseId: item.caseId,
        severity: "MEDIUM",
        title: "Pattern has prior failed history",
        explanation: `Pattern recurrence is being tracked because earlier governance evidence reported prior failed attempts and the same failure pattern returning.`,
        recommendedAction: "Do not repeat the last intervention without naming what has changed structurally.",
        createdAt,
      });
    }

    if (item.evidenceCapture?.failureCause && ((item.latestExecutionRecord && (item.unresolvedCommitments ?? 0) > 0) || item.outcomeClassification === "deteriorated")) {
      signals.push({
        id: `${item.caseId}:failure-cause`,
        type: "INTERVENTION_FAILURE_RISK",
        caseId: item.caseId,
        severity: item.outcomeClassification === "deteriorated" ? "HIGH" : "MEDIUM",
        title: "Earlier failure logic may still be unresolved",
        explanation: `${item.title} still carries a reported prior failure cause: ${summarizeAssessmentEvidenceText(item.evidenceCapture.failureCause, 180)}.`,
        recommendedAction: "Confirm the current intervention is materially different from the earlier failure path.",
        createdAt,
      });
    }

    if (item.evidenceCapture?.decisionDependency && (item.unresolvedCommitments ?? 0) > 0) {
      signals.push({
        id: `${item.caseId}:dependency`,
        type: "DEPENDENCY_RISK",
        caseId: item.caseId,
        severity: "MEDIUM",
        title: "Decision dependency remains unresolved",
        explanation: `${item.title} still depends on a reported unresolved dependency: ${summarizeAssessmentEvidenceText(item.evidenceCapture.decisionDependency, 180)}.`,
        recommendedAction: "Resolve the blocked dependency before treating the case as execution-ready.",
        createdAt,
      });
    }

    if (item.evidenceCapture?.stopSignal && ((item.unresolvedCommitments ?? 0) > 0 || item.outcomeClassification === "deteriorated")) {
      signals.push({
        id: `${item.caseId}:stop`,
        type: "EXECUTION_DRIFT",
        caseId: item.caseId,
        severity: "MEDIUM",
        title: "Execution drift against stop condition",
        explanation: `${item.title} named something that had to stop, but current case evidence does not show that condition has cleared.`,
        recommendedAction: "Verify whether the stop condition has actually ceased before advancing the case narrative.",
        createdAt,
      });
    }

    if (item.evidenceCapture?.escalationTrigger && (item.counselTriggered || item.boardroomQualified)) {
      signals.push({
        id: `${item.caseId}:escalation`,
        type: "COUNSEL_OR_BOARDROOM_REVIEW",
        caseId: item.caseId,
        severity: item.boardroomQualified ? "HIGH" : "MEDIUM",
        title: "Captured escalation threshold may now be engaged",
        explanation: `${item.title} defined a reported escalation trigger and the current case state now meets review territory.`,
        recommendedAction: "Review whether counsel or boardroom handling is now required before routine execution continues.",
        createdAt,
      });
    }

    if (item.counselTriggered) {
      signals.push({
        id: `${item.caseId}:counsel`,
        type: "COUNSEL_REVIEW_TRIGGERED",
        caseId: item.caseId,
        severity: (item.unresolvedCommitments ?? 0) >= 2 ? "HIGH" : "MEDIUM",
        title: "Counsel review threshold has been crossed",
        explanation: `${item.title} shows execution blockage or escalation conditions that exceed routine automated oversight.`,
        recommendedAction: "Review the case for counsel escalation and confirm whether authority or evidence boundaries have been exceeded.",
        createdAt,
      });
    }

    if (item.boardroomQualified) {
      signals.push({
        id: `${item.caseId}:boardroom`,
        type: "BOARDROOM_THRESHOLD_MET",
        caseId: item.caseId,
        severity: "HIGH",
        title: "Boardroom threshold appears met",
        explanation: `${item.title} has sufficient cost or consequence weight to justify board-grade oversight preparation.`,
        recommendedAction: "Prepare a boardroom-grade summary only after evidence and authority remain stable.",
        createdAt,
      });
    }

    if (item.outcomeClassification === "improved" || item.outcomeClassification === "resolved") {
      signals.push({
        id: `${item.caseId}:outcome-improved`,
        type: "OUTCOME_IMPROVED",
        caseId: item.caseId,
        severity: "LOW",
        title: "Outcome movement is positive",
        explanation: `${item.title} has a verified outcome classification of ${item.outcomeClassification}.`,
        recommendedAction: "Verify whether the improvement is stable enough to preserve as institutional learning.",
        createdAt,
      });
    }

    if (item.outcomeClassification === "deteriorated" || item.outcomeClassification === "invalid") {
      signals.push({
        id: `${item.caseId}:outcome-deteriorated`,
        type: "OUTCOME_DETERIORATED",
        caseId: item.caseId,
        severity: item.outcomeClassification === "deteriorated" ? "HIGH" : "MEDIUM",
        title: "Outcome movement has deteriorated",
        explanation: `${item.title} has a verified outcome classification of ${item.outcomeClassification}.`,
        recommendedAction: "Re-open the governing contradiction and confirm whether intervention has failed or evidence was insufficient.",
        createdAt,
      });
    }
  }

  const credit = input.creditProfile;
  if (credit && (credit.trend === "declining" || credit.score < 60 || credit.breached >= 2)) {
    signals.push({
      id: "decision-credit:declining",
      type: "DECISION_CREDIT_DECLINED",
      severity: credit.score < 40 || credit.breached >= 3 ? "HIGH" : "MEDIUM",
      title: "Decision credit is weakening",
      explanation: `Credit score ${credit.score} with ${credit.breached} breach${credit.breached === 1 ? "" : "es"} and ${credit.trend} trend indicates increasing governance scrutiny is warranted.`,
      recommendedAction: "Increase review intensity, but do not bypass evidence or privacy rules.",
      createdAt,
    });
  }

  const divergence = input.controlRoomState?.divergence ?? [];
  if (divergence.length > 0) {
    const highest = divergence[0];
    signals.push({
      id: "organisation:divergence",
      type: "DIVERGENCE_DETECTED",
      severity: highest?.severity || "MEDIUM",
      title: "Organisation divergence has been detected",
      explanation: highest?.sponsorSafeSummary || `There are ${divergence.length} active divergence summaries in the current organisation scope.`,
      recommendedAction: "Review sponsor-safe divergence summaries before exposing any wider organisational interpretation.",
      createdAt,
    });
  }

  const retainedEnforcement = input.retainedEnforcement;
  if (retainedEnforcement && retainedEnforcement.improvementSignals > 0) {
    signals.push({
      id: "retained-enforcement:improved",
      type: "OUTCOME_IMPROVED",
      severity: retainedEnforcement.improvementSignals >= 3 ? "MEDIUM" : "LOW",
      title: "Retained enforcement shows improvement signals",
      explanation: `${retainedEnforcement.improvementSignals} retained enforcement cycle${retainedEnforcement.improvementSignals === 1 ? "" : "s"} recorded positive outcome movement this period.`,
      recommendedAction: "Preserve the intervention pattern that produced the verified improvement.",
      createdAt,
    });
  }

  if (retainedEnforcement && retainedEnforcement.deteriorationSignals > 0) {
    signals.push({
      id: "retained-enforcement:deteriorated",
      type: "OUTCOME_DETERIORATED",
      severity: retainedEnforcement.deteriorationSignals >= 2 ? "HIGH" : "MEDIUM",
      title: "Retained enforcement shows deterioration signals",
      explanation: `${retainedEnforcement.deteriorationSignals} retained enforcement cycle${retainedEnforcement.deteriorationSignals === 1 ? "" : "s"} recorded negative outcome movement this period.`,
      recommendedAction: "Reassess retained decisions where enforcement cycles show deterioration rather than stabilisation.",
      createdAt,
    });
  }

  if (input.retainedCadence?.state === "OVERDUE") {
    signals.push({
      id: "retained-cadence:overdue",
      type: "RETAINED_REVIEW_OVERDUE",
      severity: "HIGH",
      title: "Retained review cycle is overdue",
      explanation: "A retained review cycle is overdue. Operator attention is required.",
      recommendedAction: "Review the retained cadence queue and complete, skip with reason, or escalate the overdue cycle.",
      createdAt,
      sourceLabel: "Retained Oversight Cadence",
      evidencePosture: input.retainedCadence.evidencePosture,
    });
  }

  const team = input.teamAggregate;
  if (team && team.largestGapDelta && team.largestGapDelta >= 15 && (team.respondentCount ?? 0) >= 3) {
    signals.push({
      id: "team:divergence",
      type: "TEAM_DIVERGENCE_REPORTED",
      severity: team.largestGapDelta >= 30 ? "HIGH" : team.largestGapDelta >= 20 ? "MEDIUM" : "LOW",
      title: "Team perception gap previously reported",
      explanation: `Earlier team assessment reported a ${team.largestGapDelta}-point leader/team gap in ${team.largestGapDomain ?? "an unspecified domain"}. Source: Team Assessment (${team.respondentCount} respondent${(team.respondentCount ?? 0) === 1 ? "" : "s"}).`,
      recommendedAction: "Verify whether the reported team divergence has changed since the original assessment.",
      createdAt,
    });
  }
  if (team && team.trustScore !== undefined && team.trustScore < 45 && (team.respondentCount ?? 0) >= 3) {
    signals.push({
      id: "team:trust-low",
      type: "TEAM_DIVERGENCE_REPORTED",
      severity: team.trustScore < 30 ? "HIGH" : "MEDIUM",
      title: "Low team trust previously reported",
      explanation: `Team trust score was ${team.trustScore}/100 at last measurement. Source: Team Assessment.`,
      recommendedAction: "Low team trust may reduce execution honesty and escalation quality. Verify current condition.",
      createdAt,
    });
  }

  const enterprise = input.enterpriseStrain;
  if (enterprise && enterprise.percentScore !== undefined && enterprise.percentScore < 55) {
    signals.push({
      id: "enterprise:strain",
      type: "ENTERPRISE_STRAIN_REPORTED",
      severity: enterprise.percentScore < 35 ? "HIGH" : enterprise.percentScore < 45 ? "MEDIUM" : "LOW",
      title: "Institutional strain previously reported",
      explanation: enterprise.fragilitySignal
        ? `Earlier enterprise reading reported: ${summarizeAssessmentEvidenceText(enterprise.fragilitySignal, 180)}. Score: ${enterprise.percentScore}%. Source: Enterprise Assessment.`
        : `Enterprise assessment score was ${enterprise.percentScore}%. Source: Enterprise Assessment.`,
      recommendedAction: "Verify whether institutional strain has changed since the original assessment. This may affect oversight cadence.",
      createdAt,
    });
  }

  // ── CHECKPOINT OUTCOME SIGNALS ──
  // Load efficacy checkpoint outcomes for oversight signal generation
  for (const item of input.cases) {
    if (item.evidenceCapture?.verificationCriteria && (item.unresolvedCommitments ?? 0) > 0) {
      signals.push({
        id: `${item.caseId}:checkpoint-overdue`,
        type: "CHECKPOINT_OVERDUE",
        caseId: item.caseId,
        severity: (item.unresolvedCommitments ?? 0) >= 2 ? "HIGH" : "MEDIUM",
        title: "Efficacy checkpoint is overdue",
        explanation: `${item.title} has ${item.unresolvedCommitments} unresolved commitment${(item.unresolvedCommitments ?? 0) === 1 ? "" : "s"} with verification criteria that have not been confirmed.`,
        recommendedAction: "Confirm whether committed actions were completed, blocked, or abandoned.",
        createdAt,
      });
    }
  }

  return dedupe(signals.map((signal) => JSON.stringify(signal))).map((signal) => JSON.parse(signal) as OversightSignal);
}
