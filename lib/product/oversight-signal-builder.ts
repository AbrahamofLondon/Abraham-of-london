import type { CreditProfile } from "@/lib/decision-ledger/ledger-service";
import type { OversightAccountCase } from "@/lib/product/oversight-account-loader";
import type { ControlRoomState } from "@/lib/product/control-room-contract";
import type { OversightSignal } from "@/lib/product/retainer-oversight-contract";

function severityFromCost(amount: number): OversightSignal["severity"] {
  if (amount >= 50000) return "CRITICAL";
  if (amount >= 20000) return "HIGH";
  if (amount >= 5000) return "MEDIUM";
  return "LOW";
}

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function buildOversightSignals(input: {
  cases: OversightAccountCase[];
  creditProfile?: CreditProfile | null;
  controlRoomState?: ControlRoomState | null;
  retainedEnforcement?: {
    cyclesReviewed: number;
    activeRetainedDecisions: number;
    enforcementBreaches: number;
    improvementSignals: number;
    deteriorationSignals: number;
  } | null;
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

  return dedupe(signals.map((signal) => JSON.stringify(signal))).map((signal) => JSON.parse(signal) as OversightSignal);
}
