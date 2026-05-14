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

export type DecisionDelayExposureInput = {
  weeklyCost: number;
  delayWeeks: number;
  exposureType: ExposureType;
  estimateConfidence: EstimateConfidence;
};

export type DecisionDelayExposureResult = {
  sevenDayExposure: number;
  thirtyDayExposure: number;
  ninetyDayExposure: number;
  sevenDayFormatted: string;
  thirtyDayFormatted: string;
  ninetyDayFormatted: string;
  exposureStatement: string;
  structuralConsequence: string;
  recommendedNextMove: string;
  disclaimer: string;
  ctaHref: string;
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

// ─── Formatting ───────────────────────────────────────────────────────────────

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatGbp(amount: number): string {
  return GBP.format(Math.max(0, Math.round(amount)));
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

  const exposureStatement =
    `Based on a ${qualifier} of ${formatGbp(safeCost)} per week, ` +
    `${label.toLowerCase()} reaches ${formatGbp(thirtyDayExposure)} at 30 days ${delayPhrase}. ` +
    `Figures are scenario estimates derived from your stated inputs.`;

  const recommendedNextMove =
    "Name the decision, assign a single owner, and set a resolution date. " +
    "Use the Fast Diagnostic to identify what is blocking the decision and what evidence is required to close it.";

  const disclaimer =
    "This calculator produces scenario estimates only. Figures are based entirely on user-supplied inputs " +
    "and should not be treated as financial advice, forecasts, or audited projections. " +
    "They are intended to frame the cost of delay in approximate terms, not to close a case.";

  return {
    sevenDayExposure,
    thirtyDayExposure,
    ninetyDayExposure,
    sevenDayFormatted: formatGbp(sevenDayExposure),
    thirtyDayFormatted: formatGbp(thirtyDayExposure),
    ninetyDayFormatted: formatGbp(ninetyDayExposure),
    exposureStatement,
    structuralConsequence: STRUCTURAL_CONSEQUENCE[input.exposureType],
    recommendedNextMove,
    disclaimer,
    ctaHref: CTA_HREF,
  };
}
