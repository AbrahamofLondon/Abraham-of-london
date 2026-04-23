/**
 * Predictive Consequence Engine
 *
 * Projects outcome trajectories BEFORE execution, using:
 * - contradiction severity
 * - recurrence patterns
 * - stakeholder divergence
 * - historical escalation velocity
 *
 * Output: projected degradation over 30/60/90 days if unchanged.
 */

export type ConsequenceProjection = {
  /** Projected condition at 30/60/90 days */
  trajectory: {
    days30: { severity: string; description: string; degradation: number };
    days60: { severity: string; description: string; degradation: number };
    days90: { severity: string; description: string; degradation: number };
  };
  /** Estimated £ exposure if unchanged */
  estimatedExposure: {
    monthly: number;
    quarterly: number;
    narrative: string;
  };
  /** Key risk factors driving the projection */
  riskFactors: string[];
  /** Overall trajectory direction */
  direction: "improving" | "stable" | "degrading" | "accelerating_degradation";
  /** Confidence in projection (0-1) */
  confidence: number;
};

export type ConsequenceInputs = {
  /** Active contradictions with severity */
  contradictions: Array<{ severity: string; confidence: number }>;
  /** Number of times patterns have recurred */
  recurrenceCount: number;
  /** Stakeholder divergence gap (0-100) */
  maxDivergenceGap: number;
  /** Current escalation level (0-5) */
  escalationLevel: number;
  /** Days since condition was first identified */
  daysSinceIdentification: number;
  /** Revenue band for £ estimation */
  revenueBand?: string;
  /** Number of prior interventions attempted */
  priorInterventionCount: number;
};

const REVENUE_MULTIPLIER: Record<string, number> = {
  "under_1m": 8000,
  "1m_5m": 25000,
  "5m_25m": 75000,
  "25m_100m": 200000,
  "100m_plus": 500000,
};

export function projectConsequence(inputs: ConsequenceInputs): ConsequenceProjection {
  const {
    contradictions,
    recurrenceCount,
    maxDivergenceGap,
    escalationLevel,
    daysSinceIdentification,
    revenueBand,
    priorInterventionCount,
  } = inputs;

  // Base degradation rate per month (percentage points)
  const criticalCount = contradictions.filter((c) => c.severity === "critical").length;
  const highCount = contradictions.filter((c) => c.severity === "high").length;
  const contradictionPressure = (criticalCount * 8) + (highCount * 4) + (contradictions.length * 1.5);

  // Recurrence accelerator — each recurrence indicates the root cause is unaddressed
  const recurrenceMultiplier = 1 + (recurrenceCount * 0.35);

  // Divergence pressure — structural disagreement compounds execution cost
  const divergencePressure = maxDivergenceGap > 35 ? (maxDivergenceGap - 35) * 0.3 : 0;

  // Time decay — the longer a condition persists, the harder it is to resolve
  const timeDecay = Math.min(daysSinceIdentification / 90, 2.0);

  // Intervention fatigue — each failed intervention reduces future effectiveness
  const interventionFatigue = priorInterventionCount > 0 ? 1 + (priorInterventionCount * 0.15) : 1;

  // Monthly degradation rate
  const baseDegradation = (contradictionPressure + divergencePressure) * recurrenceMultiplier * interventionFatigue;
  const monthlyDegradation = Math.round(baseDegradation * (1 + timeDecay * 0.2) * 10) / 10;

  // Project forward
  const deg30 = Math.round(monthlyDegradation);
  const deg60 = Math.round(monthlyDegradation * 2.2); // compounds
  const deg90 = Math.round(monthlyDegradation * 3.8); // accelerates

  // Severity classification
  const classifySeverity = (deg: number): string =>
    deg >= 25 ? "critical" : deg >= 15 ? "high" : deg >= 8 ? "medium" : "low";

  // Direction
  const direction: ConsequenceProjection["direction"] =
    monthlyDegradation >= 20 ? "accelerating_degradation"
    : monthlyDegradation >= 8 ? "degrading"
    : monthlyDegradation >= 3 ? "stable"
    : "improving";

  // £ estimation
  const revenueBase = REVENUE_MULTIPLIER[revenueBand ?? ""] ?? 50000;
  const monthlyExposure = Math.round(revenueBase * (monthlyDegradation / 100) * recurrenceMultiplier);
  const quarterlyExposure = Math.round(monthlyExposure * 3.2);

  // Risk factors
  const riskFactors: string[] = [];
  if (criticalCount > 0) riskFactors.push(`${criticalCount} critical contradiction${criticalCount > 1 ? "s" : ""} active`);
  if (recurrenceCount > 0) riskFactors.push(`Pattern has recurred ${recurrenceCount} time${recurrenceCount > 1 ? "s" : ""} — root cause unaddressed`);
  if (maxDivergenceGap > 35) riskFactors.push(`${maxDivergenceGap}-point stakeholder disagreement producing conflicting execution`);
  if (daysSinceIdentification > 60) riskFactors.push(`Condition identified ${daysSinceIdentification} days ago — delay compounds`);
  if (priorInterventionCount > 1) riskFactors.push(`${priorInterventionCount} prior interventions failed — intervention fatigue`);
  if (escalationLevel >= 3) riskFactors.push(`Escalation level ${escalationLevel}/5 — approaching system limit`);

  // Confidence
  const avgContradictionConfidence = contradictions.length > 0
    ? contradictions.reduce((s, c) => s + c.confidence, 0) / contradictions.length
    : 0.3;
  const confidence = Math.round(Math.min(0.95, avgContradictionConfidence * (contradictions.length >= 2 ? 1.1 : 0.8)) * 100) / 100;

  return {
    trajectory: {
      days30: {
        severity: classifySeverity(deg30),
        description: deg30 >= 15
          ? `Projected ${deg30}-point degradation. Active contradictions will compound into execution failures.`
          : deg30 >= 8
          ? `Projected ${deg30}-point degradation. Current condition produces measurable drag.`
          : `Minimal projected movement. Condition may stabilise without intervention.`,
        degradation: deg30,
      },
      days60: {
        severity: classifySeverity(deg60),
        description: deg60 >= 25
          ? `Projected ${deg60}-point degradation. Structural disorder likely. Recovery cost escalates significantly.`
          : deg60 >= 12
          ? `Projected ${deg60}-point degradation. Coordination cost visible. Decision quality declining.`
          : `Moderate projected drift of ${deg60} points.`,
        degradation: deg60,
      },
      days90: {
        severity: classifySeverity(deg90),
        description: deg90 >= 35
          ? `Projected ${deg90}-point degradation. Without intervention, the condition becomes structurally embedded. Recovery requires full reconstitution.`
          : deg90 >= 20
          ? `Projected ${deg90}-point degradation. The cost of inaction exceeds the cost of intervention.`
          : `Projected ${deg90}-point drift over the quarter.`,
        degradation: deg90,
      },
    },
    estimatedExposure: {
      monthly: monthlyExposure,
      quarterly: quarterlyExposure,
      narrative: monthlyExposure > 0
        ? `Estimated £${monthlyExposure.toLocaleString()} monthly exposure from unresolved condition. Quarterly projection: £${quarterlyExposure.toLocaleString()}.`
        : "Insufficient revenue data to estimate financial exposure.",
    },
    riskFactors,
    direction,
    confidence,
  };
}
