/**
 * lib/research/engines/cost-of-delay-engine.ts
 *
 * Cost of Delay Engine — deterministic WSJF-based delay cost quantification.
 *
 * Implements Weighted Shortest Job First (WSJF) scoring as the framework for
 * quantifying the cost of delaying a decision, initiative, or change programme.
 *
 * Formula (CD3 — Cost of Delay Divided by Duration):
 *   WSJF = (User/Business Value + Time Criticality + Risk Reduction / Opportunity Enablement) / Job Duration
 *   Cost of Delay = (Weekly Revenue at Risk × Weeks Delayed) + Governance Penalty + Opportunity Cost
 *
 * Inputs are expressed as relative estimates (1–21 Fibonacci scale) for WSJF,
 * and monetary values (optional) for financial exposure calculation.
 *
 * No AI. No external calls. Purely deterministic arithmetic.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type WSJFInputs = {
  /** Business/user value (Fibonacci: 1,2,3,5,8,13,21) */
  userBusinessValue: number;
  /** Time criticality — how much value is lost per unit of delay */
  timeCriticality: number;
  /** Risk reduction / opportunity enablement */
  riskReduction: number;
  /** Job size / duration (Fibonacci: 1,2,3,5,8,13,21) */
  jobDuration: number;
};

export type FinancialInputs = {
  /** Weekly revenue at risk (£) while decision is delayed */
  weeklyRevenueAtRisk: number;
  /** Number of weeks already delayed or projected to be delayed */
  weeksDelayed: number;
  /** Governance penalty for operating without a decision (£) */
  governancePenaltyPerWeek?: number;
  /** Weekly opportunity cost of not acting (£) */
  weeklyOpportunityCost?: number;
};

export type CostOfDelayResult = {
  /** WSJF priority score — higher means more urgent */
  wsjfScore: number;
  /** WSJF interpretation */
  wsjfTier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  /** Financial exposure if financial inputs provided */
  financialExposure: FinancialExposure | null;
  /** Delay escalation risk */
  delayEscalation: DelayEscalation;
  /** Recommended action based on score */
  recommendation: string;
};

export type FinancialExposure = {
  revenueAtRisk: number;
  governancePenalty: number;
  opportunityCost: number;
  totalCostOfDelay: number;
  weeklyBurnRate: number;
  currencyCode: "GBP";
};

export type DelayEscalation = {
  level: "NONE" | "WATCH" | "ESCALATE" | "CRITICAL";
  signal: string;
  weeksToEscalation: number | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21] as const;
type FibValue = 1 | 2 | 3 | 5 | 8 | 13 | 21;

const WSJF_TIERS = {
  CRITICAL: 10,  // WSJF ≥ 10: act immediately
  HIGH: 5,       // WSJF 5–10: high priority
  MEDIUM: 2,     // WSJF 2–5: medium priority
  LOW: 0,        // WSJF <2: low priority (or large job)
} as const;

// ─── Validation ───────────────────────────────────────────────────────────────

function clampToFibonacci(value: number): number {
  if (!isFinite(value) || isNaN(value) || value <= 0) return 1;
  // Find nearest Fibonacci value
  return FIBONACCI.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

function validateWSJFInputs(inputs: WSJFInputs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (inputs.jobDuration <= 0 || !isFinite(inputs.jobDuration)) {
    errors.push("jobDuration must be a positive finite number");
  }
  if (inputs.userBusinessValue <= 0 || !isFinite(inputs.userBusinessValue)) {
    errors.push("userBusinessValue must be a positive finite number");
  }
  if (inputs.timeCriticality < 0 || !isFinite(inputs.timeCriticality)) {
    errors.push("timeCriticality must be a non-negative finite number");
  }
  if (inputs.riskReduction < 0 || !isFinite(inputs.riskReduction)) {
    errors.push("riskReduction must be a non-negative finite number");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export const COST_OF_DELAY_ENGINE_ID = "cost-of-delay";
export const COST_OF_DELAY_VERSION = "1.0.0";

/**
 * Compute WSJF score.
 *
 * WSJF = (User/Business Value + Time Criticality + Risk Reduction) / Job Duration
 *
 * All inputs are snapped to the nearest Fibonacci value before calculation.
 * Returns a score to 2 decimal places.
 */
export function computeWsjf(inputs: WSJFInputs): number {
  const ubv = clampToFibonacci(inputs.userBusinessValue);
  const tc = clampToFibonacci(inputs.timeCriticality);
  const rr = clampToFibonacci(inputs.riskReduction);
  const dur = clampToFibonacci(inputs.jobDuration);

  const numerator = ubv + tc + rr;
  const score = numerator / dur;

  return Math.round(score * 100) / 100;
}

/**
 * Classify a WSJF score into a priority tier.
 */
export function classifyWsjf(score: number): CostOfDelayResult["wsjfTier"] {
  if (score >= WSJF_TIERS.CRITICAL) return "CRITICAL";
  if (score >= WSJF_TIERS.HIGH) return "HIGH";
  if (score >= WSJF_TIERS.MEDIUM) return "MEDIUM";
  return "LOW";
}

/**
 * Compute financial exposure from delay inputs.
 * All monetary values are in GBP.
 */
export function computeFinancialExposure(inputs: FinancialInputs): FinancialExposure {
  const weeks = Math.max(0, inputs.weeksDelayed);
  const weeklyRevenue = Math.max(0, inputs.weeklyRevenueAtRisk);
  const governancePenaltyWeekly = Math.max(0, inputs.governancePenaltyPerWeek ?? 0);
  const opportunityCostWeekly = Math.max(0, inputs.weeklyOpportunityCost ?? 0);

  const revenueAtRisk = weeklyRevenue * weeks;
  const governancePenalty = governancePenaltyWeekly * weeks;
  const opportunityCost = opportunityCostWeekly * weeks;
  const weeklyBurnRate = weeklyRevenue + governancePenaltyWeekly + opportunityCostWeekly;
  const totalCostOfDelay = revenueAtRisk + governancePenalty + opportunityCost;

  return {
    revenueAtRisk,
    governancePenalty,
    opportunityCost,
    totalCostOfDelay,
    weeklyBurnRate,
    currencyCode: "GBP",
  };
}

/**
 * Determine delay escalation level based on WSJF tier and weeks delayed.
 */
export function determineDelayEscalation(
  wsjfTier: CostOfDelayResult["wsjfTier"],
  weeksDelayed: number,
): DelayEscalation {
  if (wsjfTier === "CRITICAL" && weeksDelayed >= 2) {
    return {
      level: "CRITICAL",
      signal: "Decision is CRITICAL priority and has been delayed ≥2 weeks. Immediate executive resolution required.",
      weeksToEscalation: 0,
    };
  }
  if (wsjfTier === "CRITICAL" && weeksDelayed >= 1) {
    return {
      level: "ESCALATE",
      signal: "Decision is CRITICAL priority. 1 week delayed — escalation recommended now.",
      weeksToEscalation: 1,
    };
  }
  if (wsjfTier === "HIGH" && weeksDelayed >= 3) {
    return {
      level: "ESCALATE",
      signal: "Decision is HIGH priority and has been delayed 3+ weeks. Escalation recommended.",
      weeksToEscalation: 0,
    };
  }
  if (wsjfTier === "CRITICAL" || (wsjfTier === "HIGH" && weeksDelayed >= 1)) {
    return {
      level: "WATCH",
      signal: "Delay accumulating on a high-priority decision. Monitor weekly.",
      weeksToEscalation: wsjfTier === "CRITICAL" ? 1 : 3 - weeksDelayed,
    };
  }
  return {
    level: "NONE",
    signal: "No escalation required at current priority and delay level.",
    weeksToEscalation: null,
  };
}

/**
 * Generate a recommendation string from WSJF tier and escalation level.
 */
export function buildRecommendation(
  tier: CostOfDelayResult["wsjfTier"],
  escalation: DelayEscalation,
  wsjfScore: number,
): string {
  if (escalation.level === "CRITICAL") {
    return `WSJF ${wsjfScore} — CRITICAL priority. Escalate immediately. Every week of delay compounds governance exposure.`;
  }
  if (escalation.level === "ESCALATE") {
    return `WSJF ${wsjfScore} — ${tier} priority. Escalation recommended. Schedule decision within this week.`;
  }
  if (tier === "CRITICAL" || tier === "HIGH") {
    return `WSJF ${wsjfScore} — ${tier} priority. Schedule a formal decision session within 2 weeks.`;
  }
  if (tier === "MEDIUM") {
    return `WSJF ${wsjfScore} — MEDIUM priority. Add to the decision queue. Review at next governance cycle.`;
  }
  return `WSJF ${wsjfScore} — LOW priority. No urgent action required. Monitor and revisit in 4–6 weeks.`;
}

/**
 * Full cost-of-delay calculation.
 */
export function computeCostOfDelay(
  wsjfInputs: WSJFInputs,
  financialInputs?: FinancialInputs,
): CostOfDelayResult & { validationErrors: string[] } {
  const validation = validateWSJFInputs(wsjfInputs);

  if (!validation.valid) {
    return {
      wsjfScore: 0,
      wsjfTier: "LOW",
      financialExposure: null,
      delayEscalation: { level: "NONE", signal: "Invalid inputs — cannot compute.", weeksToEscalation: null },
      recommendation: `Input validation failed: ${validation.errors.join("; ")}`,
      validationErrors: validation.errors,
    };
  }

  const wsjfScore = computeWsjf(wsjfInputs);
  const wsjfTier = classifyWsjf(wsjfScore);
  const financialExposure = financialInputs ? computeFinancialExposure(financialInputs) : null;
  const weeksDelayed = financialInputs?.weeksDelayed ?? 0;
  const delayEscalation = determineDelayEscalation(wsjfTier, weeksDelayed);
  const recommendation = buildRecommendation(wsjfTier, delayEscalation, wsjfScore);

  return {
    wsjfScore,
    wsjfTier,
    financialExposure,
    delayEscalation,
    recommendation,
    validationErrors: [],
  };
}
