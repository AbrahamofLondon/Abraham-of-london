import type { DecisionCentreCase } from "@/lib/product/decision-centre-contract";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";

export type VisibilityRetainedCategory =
  | "COST_ACCUMULATION"
  | "PATTERN_RECURRENCE"
  | "COMMITMENT_VERIFICATION"
  | "DECISION_CREDIT_MOVEMENT"
  | "IRREVERSIBILITY_MOVEMENT"
  | "STRATEGIC_OPTION_CLOSURE"
  | "BOARDROOM_EXPOSURE"
  | "COUNSEL_ESCALATION"
  | "ORGANISATION_DIVERGENCE"
  | "OUTCOME_TREND"
  | "CADENCE_ENFORCEMENT";

export type VisibilityRetainedItem = {
  category: VisibilityRetainedCategory;
  label: string;
  description: string;
  evidence: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
};

export type VisibilityRetainedSummary = {
  headline: string;
  items: VisibilityRetainedItem[];
};

function pushIf(items: VisibilityRetainedItem[], condition: boolean, item: VisibilityRetainedItem) {
  if (condition) items.push(item);
}

export function buildVisibilityRetainedFromOversightBrief(brief: OversightBrief): VisibilityRetainedSummary {
  const items: VisibilityRetainedItem[] = [];

  pushIf(items, Boolean(brief.costOfInaction?.totalEstimated), {
    category: "COST_ACCUMULATION",
    label: "Cost accumulation",
    description: "Visibility would reduce across accumulating cost exposure between review cycles.",
    evidence: `Estimated tracked cost: £${brief.costOfInaction?.totalEstimated?.toLocaleString() ?? 0}.`,
    confidence: "HIGH",
  });
  pushIf(items, Boolean(brief.patternRecurrence && brief.patternRecurrence.status !== "NO_PRIOR_PATTERN"), {
    category: "PATTERN_RECURRENCE",
    label: "Pattern recurrence",
    description: "Visibility would reduce across recurring decision patterns already seen in prior history.",
    evidence: brief.patternRecurrence?.explanation ?? "Recurring pattern history exists.",
    confidence: brief.patternRecurrence?.status === "VERIFIED_RECURRENCE" ? "HIGH" : "MEDIUM",
  });
  pushIf(items, brief.verification.commitmentsDue > 0 || brief.verification.commitmentsVerified > 0 || brief.verification.unresolvedBreaches > 0, {
    category: "COMMITMENT_VERIFICATION",
    label: "Commitment verification",
    description: "Visibility would reduce across verified commitments, overdue commitments, and unresolved breaches.",
    evidence: `${brief.verification.commitmentsVerified} verified, ${brief.verification.unresolvedBreaches} unresolved breach${brief.verification.unresolvedBreaches === 1 ? "" : "es"}.`,
    confidence: "HIGH",
  });
  pushIf(items, Boolean(brief.decisionCredit?.trend && brief.decisionCredit.trend !== "stable"), {
    category: "DECISION_CREDIT_MOVEMENT",
    label: "Decision credit movement",
    description: "Visibility would reduce across whether governance trust is improving or weakening.",
    evidence: `Trend currently recorded as ${brief.decisionCredit?.trend}.`,
    confidence: "HIGH",
  });
  pushIf(items, Boolean((brief.irreversibility?.score ?? 0) > 0), {
    category: "IRREVERSIBILITY_MOVEMENT",
    label: "Irreversibility movement",
    description: "Visibility would reduce across whether delay is narrowing remaining options.",
    evidence: brief.irreversibility?.explanation ?? "Irreversibility pressure is being tracked.",
    confidence: (brief.irreversibility?.score ?? 0) >= 60 ? "HIGH" : "MEDIUM",
  });
  pushIf(items, Boolean(brief.strategicOptions?.options.some((item) => item.status === "CLOSING" || item.status === "EXPIRED")), {
    category: "STRATEGIC_OPTION_CLOSURE",
    label: "Strategic option closure",
    description: "Visibility would reduce across which options are closing or have already expired.",
    evidence: `${brief.strategicOptions?.options.filter((item) => item.status === "CLOSING" || item.status === "EXPIRED").length ?? 0} option signal(s) closing or expired.`,
    confidence: "MEDIUM",
  });
  pushIf(items, (brief.boardroomArchive?.totalDossiers ?? 0) > 0 || brief.boardroom.dossiersAvailable > 0, {
    category: "BOARDROOM_EXPOSURE",
    label: "Boardroom exposure",
    description: "Visibility would reduce across repeated board-level exposure and prior dossier history.",
    evidence: brief.boardroomArchive?.summary ?? `${brief.boardroom.dossiersAvailable} boardroom dossier(s) currently available.`,
    confidence: "HIGH",
  });
  pushIf(items, (brief.counselHistory?.totalEvents ?? 0) > 0 || brief.counsel.requiredNow > 0, {
    category: "COUNSEL_ESCALATION",
    label: "Counsel escalation",
    description: "Visibility would reduce across governed counsel escalation history and unresolved counsel reviews.",
    evidence: brief.counselHistory?.summary ?? `${brief.counsel.requiredNow} counsel review(s) currently required.`,
    confidence: "HIGH",
  });
  pushIf(items, Boolean(brief.organisationDivergence?.count), {
    category: "ORGANISATION_DIVERGENCE",
    label: "Organisation divergence",
    description: "Visibility would reduce across sponsor-safe divergence memory between stated intent and operating evidence.",
    evidence: brief.organisationDivergence?.summary ?? "Organisation divergence is being tracked.",
    confidence: "MEDIUM",
  });
  pushIf(items, Boolean(brief.cycleConsequenceProjection), {
    category: "OUTCOME_TREND",
    label: "Outcome trend",
    description: "Visibility would reduce across likely next-cycle deterioration or improvement.",
    evidence: brief.cycleConsequenceProjection?.summary ?? "Outcome movement is being projected.",
    confidence: "MEDIUM",
  });
  pushIf(items, Boolean(brief.cadence && brief.cadence.status !== "FIRST_CYCLE_PENDING"), {
    category: "CADENCE_ENFORCEMENT",
    label: "Cadence enforcement",
    description: "Visibility would reduce across whether oversight cadence is being maintained, delayed, or broken.",
    evidence: brief.cadence?.explanation ?? "Cadence state exists.",
    confidence: "HIGH",
  });

  return {
    headline: items.length > 0
      ? "Without continued oversight, visibility would reduce across the following areas."
      : "Insufficient evidence to state what additional visibility continued oversight would preserve.",
    items,
  };
}

export function buildVisibilityRetainedFromDecisionCentreCase(input: DecisionCentreCase): VisibilityRetainedSummary {
  const items: VisibilityRetainedItem[] = [];

  pushIf(items, Boolean(input.costOfInaction?.accumulatedCost), {
    category: "COST_ACCUMULATION",
    label: "Cost accumulation",
    description: "Visibility would reduce across the cost already accumulating around this unresolved decision.",
    evidence: `Tracked cost currently stands at £${input.costOfInaction?.accumulatedCost?.toLocaleString() ?? 0}.`,
    confidence: "MEDIUM",
  });
  pushIf(items, Boolean(input.patternRecurrence && input.patternRecurrence.status !== "NO_PRIOR_PATTERN"), {
    category: "PATTERN_RECURRENCE",
    label: "Pattern recurrence",
    description: "Visibility would reduce across whether this decision shape has already recurred.",
    evidence: input.patternRecurrence?.explanation ?? "Pattern recurrence exists.",
    confidence: input.patternRecurrence?.status === "VERIFIED_RECURRENCE" ? "HIGH" : "MEDIUM",
  });
  pushIf(items, Boolean(input.retainerReadiness?.cadenceStatus), {
    category: "CADENCE_ENFORCEMENT",
    label: "Cadence enforcement",
    description: "Visibility would reduce across whether governance cadence is staying intact.",
    evidence: `Current cadence state: ${input.retainerReadiness?.cadenceStatus}.`,
    confidence: "MEDIUM",
  });
  pushIf(items, Boolean(input.boardroom?.qualified || (input.boardroom?.historyCount ?? 0) > 0), {
    category: "BOARDROOM_EXPOSURE",
    label: "Boardroom exposure",
    description: "Visibility would reduce across whether the decision is repeating at board-level consequence.",
    evidence: input.boardroom?.qualified
      ? "Boardroom qualification exists."
      : `${input.boardroom?.historyCount ?? 0} archived boardroom cycle(s) exist.`,
    confidence: "MEDIUM",
  });

  return {
    headline: items.length > 0
      ? "If oversight stopped here, visibility would reduce across the following areas."
      : "Insufficient evidence to claim additional retained visibility yet.",
    items,
  };
}
