/**
 * lib/constitution/economic.ts — Economic impact modelling.
 *
 * Computes financial exposure from user-supplied data.
 * Never fabricates financial precision. Labels all assumptions.
 * Returns null for any metric the user has not supplied data for.
 *
 * Consumes: user-declared revenue, headcount, decision value, delay window.
 * Produces: exposure estimate, confidence band, assumption disclosure.
 */

export type EconomicWeight = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EconomicInput = {
  /** User-supplied narrative text (for keyword inference fallback) */
  narrative?: string;
  /** Monthly revenue exposure declared by user (£) */
  revenueExposure?: number | null;
  /** Decision value declared by user (£) */
  decisionValue?: number | null;
  /** People directly affected */
  headcountAffected?: number | null;
  /** Revenue band (from constitutional assessment) */
  revenueBand?: string | null;
  /** Decision delay window in days */
  delayWindowDays?: number | null;
  /** Exposure score from cost-of-delay engine (0-100) */
  delayExposureScore?: number | null;
  /** Contradiction severity from decision kernel (0-1) */
  contradictionSeverity?: number | null;
};

export type EconomicExposure = {
  weight: EconomicWeight;
  /** Estimated total exposure over the delay window. Null if user supplied no financial data */
  estimatedExposure: number | null;
  /** Monthly run-rate exposure. Null if no financial data */
  monthlyExposure: number | null;
  /** Confidence in the estimate */
  confidence: "low" | "medium" | "high";
  /** What data was used */
  assumptions: string[];
  /** What data is missing */
  missingInputs: string[];
  /** Headcount impact description */
  headcountImpact: string | null;
  /** Revenue band context */
  revenueBandContext: string | null;
  /** Disclosure for user-facing display */
  disclosure: string;
};

/**
 * Infer economic weight from narrative text (keyword-based fallback).
 * Used when no structured financial data is available.
 */
export function inferEconomicWeight(text: string): EconomicWeight {
  const lower = (text || "").toLowerCase();
  if (/million|funding|investment|valuation|acquisition|exit|ipo|series [a-e]/i.test(lower)) return "CRITICAL";
  if (/revenue|budget|cost|profit|margin|burn|cash ?flow|runway/i.test(lower)) return "HIGH";
  if (/salary|headcount|team|resource|contract|license/i.test(lower)) return "MEDIUM";
  return "LOW";
}

/**
 * Compute economic exposure from structured user data.
 *
 * Rules:
 * - Financial estimate ONLY when user supplies financial input
 * - Confidence reflects data completeness, not certainty
 * - All assumptions are listed for disclosure
 * - Missing inputs are flagged for the user
 */
export function computeEconomicExposure(input: EconomicInput): EconomicExposure {
  const assumptions: string[] = [];
  const missingInputs: string[] = [];

  // Determine the financial anchor
  const anchor = input.revenueExposure ?? input.decisionValue ?? null;
  const delayDays = input.delayWindowDays ?? 90;
  const delayMonths = delayDays / 30;

  // Track what we have and what's missing
  if (input.revenueExposure != null && input.revenueExposure > 0) {
    assumptions.push(`User-declared monthly revenue exposure: £${input.revenueExposure.toLocaleString()}`);
  } else {
    missingInputs.push("Monthly revenue exposure");
  }

  if (input.decisionValue != null && input.decisionValue > 0) {
    assumptions.push(`User-declared decision value: £${input.decisionValue.toLocaleString()}`);
  } else if (!input.revenueExposure) {
    missingInputs.push("Decision value");
  }

  if (input.headcountAffected != null && input.headcountAffected > 0) {
    assumptions.push(`${input.headcountAffected} people directly affected`);
  } else {
    missingInputs.push("Headcount affected");
  }

  if (input.delayWindowDays != null) {
    assumptions.push(`Decision window: ${input.delayWindowDays} days`);
  } else {
    assumptions.push("Default decision window: 90 days");
  }

  // Compute exposure multiplier from delay and contradiction severity
  const exposureRate = input.delayExposureScore != null
    ? input.delayExposureScore / 100
    : 0.5; // moderate default if no exposure score

  const contradictionMultiplier = input.contradictionSeverity != null
    ? 1 + (input.contradictionSeverity * 0.3) // up to 30% increase for severe contradictions
    : 1;

  if (input.delayExposureScore != null) {
    assumptions.push(`Delay exposure score: ${input.delayExposureScore}/100`);
  }
  if (input.contradictionSeverity != null) {
    assumptions.push(`Contradiction severity factor: ${(contradictionMultiplier * 100 - 100).toFixed(0)}% increase`);
  }

  // Compute financial estimate
  let estimatedExposure: number | null = null;
  let monthlyExposure: number | null = null;

  if (anchor != null && anchor > 0) {
    if (input.revenueExposure != null && input.revenueExposure > 0) {
      monthlyExposure = Math.round(input.revenueExposure * exposureRate * contradictionMultiplier);
      estimatedExposure = Math.round(monthlyExposure * delayMonths);
    } else if (input.decisionValue != null && input.decisionValue > 0) {
      // Decision value is total, not monthly — apply exposure rate directly
      estimatedExposure = Math.round(input.decisionValue * exposureRate * contradictionMultiplier);
      monthlyExposure = Math.round(estimatedExposure / Math.max(1, delayMonths));
    }
  }

  // Determine weight
  let weight: EconomicWeight = "LOW";
  if (estimatedExposure != null) {
    if (estimatedExposure >= 500_000) weight = "CRITICAL";
    else if (estimatedExposure >= 100_000) weight = "HIGH";
    else if (estimatedExposure >= 20_000) weight = "MEDIUM";
  } else {
    // Fall back to narrative inference
    weight = input.narrative ? inferEconomicWeight(input.narrative) : "LOW";
  }

  // Confidence based on data completeness
  const dataPoints = [
    input.revenueExposure != null || input.decisionValue != null,
    input.headcountAffected != null,
    input.delayWindowDays != null,
    input.delayExposureScore != null,
    input.contradictionSeverity != null,
  ].filter(Boolean).length;

  const confidence: EconomicExposure["confidence"] =
    dataPoints >= 4 ? "high" : dataPoints >= 2 ? "medium" : "low";

  // Headcount impact
  const headcountImpact = input.headcountAffected != null && input.headcountAffected > 0
    ? `${input.headcountAffected} people directly affected by this decision`
    : null;

  // Revenue band context
  const revenueBandContext = input.revenueBand
    ? `Organisation operates in the ${input.revenueBand} revenue band`
    : null;

  // Disclosure
  const disclosure = estimatedExposure != null
    ? `Scenario projection based on your declared inputs. Confidence: ${confidence}. Not a financial forecast or guarantee. ${missingInputs.length > 0 ? `Strengthen estimate by providing: ${missingInputs.join(", ")}.` : ""}`
    : `No financial exposure computed. The system does not fabricate financial figures without user-supplied data.${missingInputs.length > 0 ? ` Provide: ${missingInputs.join(", ")}.` : ""}`;

  return {
    weight,
    estimatedExposure,
    monthlyExposure,
    confidence,
    assumptions,
    missingInputs,
    headcountImpact,
    revenueBandContext,
    disclosure,
  };
}
