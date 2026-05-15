// Pure computation module — no side effects, no I/O.
// All text is scenario framing; none of it constitutes financial advice.

export type ExposureType =
  | "revenue"
  | "operating_cost"
  | "compliance"
  | "opportunity"
  | "reputation"
  | "execution";

export type EstimateConfidence = "rough" | "known" | "board_estimate";

export type DecisionState =
  | "not_yet_decided"
  | "decided_not_executed"
  | "repeatedly_revisited"
  | "blocked_by_authority"
  | "blocked_by_evidence"
  | "blocked_by_stakeholder_alignment";

export type GovernancePressureBand = "LOW" | "WATCH" | "PRESSURE" | "CRITICAL";

export type DecisionDelayExposureInput = {
  weeklyCost: number;
  delayWeeks: number;
  exposureType: ExposureType;
  estimateConfidence: EstimateConfidence;
  decisionState: DecisionState;
};

export type DecisionDelayExposureResult = {
  sevenDayExposure: number;
  thirtyDayExposure: number;
  ninetyDayExposure: number;
  sevenDayFormatted: string;
  thirtyDayFormatted: string;
  ninetyDayFormatted: string;
  decisionState: DecisionState;
  decisionStateLabel: string;
  governancePressureBand: GovernancePressureBand;
  governancePressureExplanation: string;
  financialExposure: string;
  structuralExposure: string;
  governanceExposure: string;
  exposureStatement: string;
  structuralConsequence: string;
  requiredNextMove: string;
  recommendedNextMove: string;
  whatSystemSees: {
    signal: string;
    likelyPressurePoint: string;
    governanceMove: string;
  };
  recordStatus: string;
  recordBoundary: string;
  disclaimer: string;
  ctaHref: string;
};

export type DecisionDelaySendToSelfPayload = {
  title: string;
  summary: string;
  exposureSummary: string;
  nextMove: string;
};

// ─── CTA ─────────────────────────────────────────────────────────────────────

export const CTA_HREF = "/diagnostics/fast";

// ─── Text maps ────────────────────────────────────────────────────────────────

const STRUCTURAL_CONSEQUENCE: Record<ExposureType, string> = {
  revenue:
    "Revenue recovery becomes harder as the addressable window narrows. Delay does not preserve options — it closes them.",
  operating_cost:
    "Operating inefficiency becomes structural and expensive to unwind. Costs incurred during delay are rarely recovered.",
  compliance:
    "Regulatory exposure compounds with each deferred week. Correction costs at a later stage typically exceed early resolution costs.",
  opportunity:
    "Opportunity windows close progressively. Alternatives that exist today become constrained or unavailable.",
  reputation:
    "Stakeholder confidence erodes with each deferred commitment. The longer the delay, the larger the trust deficit to rebuild.",
  execution:
    "Delivery timelines drift and team alignment deteriorates. The longer a decision remains open, the harder the recovery.",
};

const EXPOSURE_LABEL: Record<ExposureType, string> = {
  revenue: "Revenue at risk",
  operating_cost: "Operating cost accumulating",
  compliance: "Compliance exposure building",
  opportunity: "Opportunity cost accruing",
  reputation: "Reputational exposure building",
  execution: "Execution drag compounding",
};

const CONFIDENCE_QUALIFIER: Record<EstimateConfidence, string> = {
  rough: "rough estimate",
  known: "stated weekly cost",
  board_estimate: "board estimate",
};

const DECISION_STATE_LABEL: Record<DecisionState, string> = {
  not_yet_decided: "Undecided",
  decided_not_executed: "Execution-stalled",
  repeatedly_revisited: "Repeatedly revisited",
  blocked_by_authority: "Authority-blocked",
  blocked_by_evidence: "Evidence-blocked",
  blocked_by_stakeholder_alignment: "Alignment-blocked",
};

const DECISION_STATE_WEIGHT: Record<DecisionState, number> = {
  not_yet_decided: 0,
  blocked_by_evidence: 1,
  decided_not_executed: 2,
  blocked_by_stakeholder_alignment: 2,
  repeatedly_revisited: 3,
  blocked_by_authority: 3,
};

const STRUCTURAL_EXPOSURE: Record<DecisionState, string> = {
  not_yet_decided:
    "The longer the deferral persists, the harder it becomes to distinguish deliberate caution from avoidable drift.",
  decided_not_executed:
    "A decision that exists but does not move into execution begins to convert intent into delivery drag.",
  repeatedly_revisited:
    "Repeated reopening weakens closure discipline and makes caution harder to distinguish from avoidance.",
  blocked_by_authority:
    "When authority remains unresolved, the organisation can continue analysing without becoming able to act.",
  blocked_by_evidence:
    "When evidence remains unresolved, additional delay can widen the gap between analysis and an admissible decision.",
  blocked_by_stakeholder_alignment:
    "When alignment remains unresolved, delay can turn a decision problem into a coordination problem.",
};

const LIKELY_PRESSURE_POINT: Record<DecisionState, string> = {
  not_yet_decided: "Ownership or evidence may not yet be sufficiently named.",
  decided_not_executed: "Execution ownership or authority may be unresolved.",
  repeatedly_revisited: "Closure discipline, evidence sufficiency, or authority may be unresolved.",
  blocked_by_authority: "Authority is the likely pressure point; analysis alone may no longer move the decision.",
  blocked_by_evidence: "Evidence sufficiency is the likely pressure point.",
  blocked_by_stakeholder_alignment: "Stakeholder alignment is the likely pressure point.",
};

const GOVERNANCE_PRESSURE_EXPLANATION: Record<GovernancePressureBand, string> = {
  LOW:
    "The scenario estimate currently shows limited governance pressure, but the decision still needs a named route to closure.",
  WATCH:
    "The issue is beginning to accumulate delay pressure. Ownership and resolution timing should be made explicit before drift hardens.",
  PRESSURE:
    "The issue is no longer just delay. The decision is beginning to accumulate accountability and execution drag.",
  CRITICAL:
    "The scenario estimate now combines material exposure with unresolved decision pressure. Accountability and resolution timing require immediate governance attention.",
};

// ─── Formatting ───────────────────────────────────────────────────────────────

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatGbp(amount: number): string {
  return GBP.format(Math.max(0, Math.round(amount)));
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export function classifyDecisionState(decisionState: DecisionState): string {
  return DECISION_STATE_LABEL[decisionState];
}

export function classifyGovernancePressure(input: {
  thirtyDayExposure: number;
  delayWeeks: number;
  decisionState: DecisionState;
}): GovernancePressureBand {
  const exposureScore =
    input.thirtyDayExposure >= 100_000
      ? 3
      : input.thirtyDayExposure >= 25_000
        ? 2
        : input.thirtyDayExposure >= 5_000
          ? 1
          : 0;

  const delayScore =
    input.delayWeeks >= 9
      ? 3
      : input.delayWeeks >= 5
        ? 2
        : input.delayWeeks >= 2
          ? 1
          : 0;

  const totalScore =
    exposureScore + delayScore + DECISION_STATE_WEIGHT[input.decisionState];

  if (totalScore >= 6) return "CRITICAL";
  if (totalScore >= 4) return "PRESSURE";
  if (totalScore >= 2) return "WATCH";
  return "LOW";
}

export function buildDecisionDelaySendToSelfPayload(input: {
  weeklyCost: number;
  delayWeeks: number;
  exposureType: ExposureType;
  result: DecisionDelayExposureResult;
}): DecisionDelaySendToSelfPayload {
  return {
    title: `Decision delay exposure — ${input.exposureType.replace(/_/g, " ")}`,
    summary: `Estimated weekly cost: ${formatGbp(input.weeklyCost)} · Delay: ${input.delayWeeks} week${input.delayWeeks !== 1 ? "s" : ""}`,
    exposureSummary:
      `Decision state: ${input.result.decisionStateLabel} · ` +
      `Governance pressure: ${input.result.governancePressureBand} · ` +
      `7-day exposure: ${input.result.sevenDayFormatted} · ` +
      `30-day: ${input.result.thirtyDayFormatted} · ` +
      `90-day: ${input.result.ninetyDayFormatted}`,
    nextMove: input.result.requiredNextMove,
  };
}

// ─── Core computation ─────────────────────────────────────────────────────────

export function computeDecisionDelayExposure(
  input: DecisionDelayExposureInput,
): DecisionDelayExposureResult {
  const safeCost = Math.max(0, input.weeklyCost);
  const safeWeeks = Math.max(0, input.delayWeeks);
  const dailyRate = safeCost / 7;

  const sevenDayExposure = Math.round(dailyRate * 7);
  const thirtyDayExposure = Math.round(dailyRate * 30);
  const ninetyDayExposure = Math.round(dailyRate * 90);

  const qualifier = CONFIDENCE_QUALIFIER[input.estimateConfidence];
  const label = EXPOSURE_LABEL[input.exposureType];
  const delayPhrase =
    safeWeeks === 0
      ? "from the point of deferral"
      : safeWeeks === 1
        ? "after 1 week of delay"
        : `after ${safeWeeks} weeks of delay`;

  const decisionStateLabel = classifyDecisionState(input.decisionState);
  const governancePressureBand = classifyGovernancePressure({
    thirtyDayExposure,
    delayWeeks: safeWeeks,
    decisionState: input.decisionState,
  });

  const exposureStatement =
    `Based on a ${qualifier} of ${formatGbp(safeCost)} per week, ` +
    `${label.toLowerCase()} reaches ${formatGbp(thirtyDayExposure)} at 30 days ${delayPhrase}. ` +
    `Figures are scenario estimates derived from your stated inputs.`;

  const requiredNextMove =
    "Name the decision, assign a single owner, and set a resolution date before further analysis.";

  const governanceExposure =
    governancePressureBand === "LOW"
      ? "A named owner and route to resolution should be set before the estimate is treated as a case."
      : "A named owner and resolution date are now required before the decision can progress responsibly.";

  const recordBoundary =
    "This estimate does not create a governed case or retained decision record. To preserve the decision and test what is actually blocking it, run the Fast Diagnostic or save it into Decision Centre.";

  const disclaimer =
    "This instrument produces scenario estimates only. Figures are based entirely on user-supplied inputs " +
    "and should not be treated as financial advice, forecasts, or audited projections. " +
    "They are intended to frame the cost of delay in approximate terms, not to close a case.";

  return {
    sevenDayExposure,
    thirtyDayExposure,
    ninetyDayExposure,
    sevenDayFormatted: formatGbp(sevenDayExposure),
    thirtyDayFormatted: formatGbp(thirtyDayExposure),
    ninetyDayFormatted: formatGbp(ninetyDayExposure),
    decisionState: input.decisionState,
    decisionStateLabel,
    governancePressureBand,
    governancePressureExplanation:
      GOVERNANCE_PRESSURE_EXPLANATION[governancePressureBand],
    financialExposure: `Estimated ${formatGbp(thirtyDayExposure)} at 30 days.`,
    structuralExposure: STRUCTURAL_EXPOSURE[input.decisionState],
    governanceExposure,
    exposureStatement,
    structuralConsequence: STRUCTURAL_CONSEQUENCE[input.exposureType],
    requiredNextMove,
    recommendedNextMove:
      `${requiredNextMove} Use the Fast Diagnostic to identify what is blocking the decision and what evidence is required to close it.`,
    whatSystemSees: {
      signal: "Delay is accumulating against a decision with stated financial exposure.",
      likelyPressurePoint: LIKELY_PRESSURE_POINT[input.decisionState],
      governanceMove: requiredNextMove,
    },
    recordStatus: "Not yet governed",
    recordBoundary,
    disclaimer,
    ctaHref: CTA_HREF,
  };
}
