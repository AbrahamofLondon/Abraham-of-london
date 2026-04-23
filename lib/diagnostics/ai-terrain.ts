/**
 * AI Terrain Exposure Engine
 *
 * Classifies an organisation's AI exposure posture and computes
 * decision velocity against an AI-accelerated market baseline.
 *
 * Classifications:
 * - AI_LAG: Organisation making decisions at pre-AI speed
 * - AI_MISUSE: AI adopted but applied to wrong problems
 * - AI_FRAGMENTED: AI in pockets, no strategic coherence
 * - AI_DEPENDENT: Over-reliance without governance
 * - AI_GOVERNED: AI integrated with decision authority
 *
 * This is not an AI readiness assessment. It is a survival condition classifier.
 */

export type AITerrainClassification =
  | "AI_LAG"
  | "AI_MISUSE"
  | "AI_FRAGMENTED"
  | "AI_DEPENDENT"
  | "AI_GOVERNED";

export type AIExposureLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AITerrainAssessment = {
  classification: AITerrainClassification;
  exposureLevel: AIExposureLevel;
  decisionVelocity: {
    current: number;       // days per decision cycle
    baseline: number;      // AI-accelerated market baseline
    gap: number;           // days behind baseline
    gapPercent: number;    // % slower than baseline
  };
  competitiveGap: {
    days30: { description: string; severity: string };
    days60: { description: string; severity: string };
    days90: { description: string; severity: string };
  };
  accelerationFactor: number;   // multiplier on consequence due to AI acceleration
  compoundingEffect: number;    // % increase in cost per month of delay
  riskFactors: string[];
  directive: string;
};

export type AITerrainInputs = {
  sector: string;
  revenueBand: string;
  /** How many days between decision identification and execution */
  avgDecisionCycleDays: number;
  /** Whether AI is mentioned in problem statement or constraints */
  aiMentionedInProblem: boolean;
  /** Whether competitors are known to use AI in this domain */
  competitorAIAdoption: boolean;
  /** Number of decisions blocked or deferred */
  blockedDecisionCount: number;
  /** Contradiction count — structural dysfunction slows velocity */
  contradictionCount: number;
  /** Whether the organisation has AI governance */
  hasAIGovernance: boolean;
  /** Whether AI is used in operations */
  aiInOperations: boolean;
};

// AI-accelerated market baselines by sector (days per decision cycle)
const SECTOR_BASELINES: Record<string, number> = {
  technology: 5,
  fintech: 7,
  financial_services: 12,
  professional_services: 14,
  healthcare: 18,
  education: 20,
  manufacturing: 15,
  retail: 10,
  media: 8,
  default: 14,
};

export function assessAITerrain(inputs: AITerrainInputs): AITerrainAssessment {
  const {
    sector,
    avgDecisionCycleDays,
    aiMentionedInProblem,
    competitorAIAdoption,
    blockedDecisionCount,
    contradictionCount,
    hasAIGovernance,
    aiInOperations,
  } = inputs;

  // Baseline for sector
  const baseline = SECTOR_BASELINES[sector.toLowerCase().replace(/\s+/g, "_")] ?? SECTOR_BASELINES.default!;

  // Decision velocity
  const effectiveCycle = avgDecisionCycleDays + (blockedDecisionCount * 3) + (contradictionCount * 2);
  const gap = Math.max(0, effectiveCycle - baseline);
  const gapPercent = baseline > 0 ? Math.round((gap / baseline) * 100) : 0;

  // Classification
  let classification: AITerrainClassification;
  if (hasAIGovernance && aiInOperations) {
    classification = "AI_GOVERNED";
  } else if (aiInOperations && !hasAIGovernance) {
    classification = aiMentionedInProblem ? "AI_DEPENDENT" : "AI_FRAGMENTED";
  } else if (aiMentionedInProblem && !aiInOperations) {
    classification = "AI_MISUSE";
  } else {
    classification = "AI_LAG";
  }

  // Exposure level
  const exposureLevel: AIExposureLevel =
    (classification === "AI_LAG" && competitorAIAdoption) ? "CRITICAL"
    : classification === "AI_LAG" ? "HIGH"
    : classification === "AI_MISUSE" ? "HIGH"
    : classification === "AI_FRAGMENTED" ? "MEDIUM"
    : classification === "AI_DEPENDENT" ? "MEDIUM"
    : "LOW";

  // Acceleration factor — how much faster consequences compound due to AI market
  const accelerationFactor = competitorAIAdoption
    ? (gapPercent >= 100 ? 2.5 : gapPercent >= 50 ? 1.8 : 1.3)
    : 1.1;

  // Compounding effect — % increase in cost per month
  const compoundingEffect = Math.round(
    (gapPercent * 0.15 + (competitorAIAdoption ? 8 : 2) + (contradictionCount * 1.5)) * accelerationFactor,
  );

  // Competitive gap projection
  const project = (months: number): { description: string; severity: string } => {
    const projectedGap = gap + (gap * compoundingEffect / 100 * months);
    const severity = projectedGap > baseline * 3 ? "critical"
      : projectedGap > baseline * 1.5 ? "high"
      : projectedGap > baseline * 0.5 ? "medium" : "low";

    if (severity === "critical") {
      return {
        description: `Decision cycle ${Math.round(projectedGap)} days behind AI baseline. Competitors operating ${Math.round(projectedGap / baseline)}x faster. Structural disadvantage becoming irreversible.`,
        severity,
      };
    }
    if (severity === "high") {
      return {
        description: `Decision cycle ${Math.round(projectedGap)} days behind baseline. Gap widening. Cost of each delayed decision increasing.`,
        severity,
      };
    }
    return {
      description: `Decision cycle ${Math.round(projectedGap)} days behind baseline. Gap manageable if addressed within this period.`,
      severity,
    };
  };

  // Risk factors
  const riskFactors: string[] = [];
  if (classification === "AI_LAG") riskFactors.push("Organisation operating at pre-AI decision speed");
  if (competitorAIAdoption) riskFactors.push("Competitors have adopted AI in this domain");
  if (gapPercent > 100) riskFactors.push(`Decision cycle ${gapPercent}% slower than AI-accelerated baseline`);
  if (blockedDecisionCount > 0) riskFactors.push(`${blockedDecisionCount} blocked decisions compounding velocity loss`);
  if (contradictionCount > 0) riskFactors.push(`${contradictionCount} active contradictions reducing decision throughput`);
  if (classification === "AI_DEPENDENT") riskFactors.push("AI adopted without governance — execution risk elevated");

  // Directive
  const directive =
    exposureLevel === "CRITICAL"
      ? "AI acceleration is active in your competitive environment. Every decision made at current speed increases structural disadvantage. This is not optional."
      : exposureLevel === "HIGH"
      ? "AI-accelerated competitors are widening the gap. Decision velocity must increase or consequence will compound."
      : exposureLevel === "MEDIUM"
      ? "AI exposure is present but manageable. Governance and velocity alignment needed within 60 days."
      : "AI terrain exposure is currently contained. Monitor for sector acceleration.";

  return {
    classification,
    exposureLevel,
    decisionVelocity: {
      current: effectiveCycle,
      baseline,
      gap,
      gapPercent,
    },
    competitiveGap: {
      days30: project(1),
      days60: project(2),
      days90: project(3),
    },
    accelerationFactor,
    compoundingEffect,
    riskFactors,
    directive,
  };
}
