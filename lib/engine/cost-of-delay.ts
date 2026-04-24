/**
 * #7 — Cost-of-Delay Quantification
 *
 * Math-based urgency, not narrative urgency.
 * "You're spending 30% on stated priorities. At current degradation rate,
 * you'll be at 20% in 2 quarters. Cost of delay = 6 months of compounding misalignment."
 */

export type CostOfDelay = {
  /** Monthly cost in degradation points */
  monthlyDegradation: number;
  /** Time until condition becomes critical (months) */
  monthsToCritical: number;
  /** Time until condition becomes unrecoverable (months) */
  monthsToUnrecoverable: number;
  /** What specifically degrades */
  degradationTarget: string;
  /** Narrative: "Each month of delay costs X" */
  narrative: string;
  /** Recovery cost multiplier: how much harder it gets */
  recoveryMultiplier: number;
};

export function computeCostOfDelay(params: {
  currentScore: number;        // 0-100 current condition
  degradationRate: number;     // points per month of decline
  criticalThreshold: number;   // score below which = critical
  domain: string;
  hasActiveContradictions: boolean;
  daysSinceIdentification: number;
}): CostOfDelay {
  const { currentScore, degradationRate, criticalThreshold, domain, hasActiveContradictions, daysSinceIdentification } = params;

  // Effective degradation: contradictions accelerate decay
  const effectiveRate = degradationRate * (hasActiveContradictions ? 1.4 : 1.0);

  // Time to critical
  const distanceToCritical = currentScore - criticalThreshold;
  const monthsToCritical = effectiveRate > 0
    ? Math.max(0, Math.round(distanceToCritical / effectiveRate * 10) / 10)
    : Infinity;

  // Time to unrecoverable (critical - 20 more points)
  const monthsToUnrecoverable = effectiveRate > 0
    ? Math.max(0, Math.round((distanceToCritical + 20) / effectiveRate * 10) / 10)
    : Infinity;

  // Recovery multiplier: the longer you wait, the harder recovery becomes
  // Based on months already delayed + future delay
  const monthsDelayed = daysSinceIdentification / 30;
  const recoveryMultiplier = Math.round((1 + monthsDelayed * 0.25) * 10) / 10;

  const narrative = effectiveRate > 0
    ? `${domain} is degrading at ${effectiveRate.toFixed(1)} points per month. At current rate, reaches critical in ${monthsToCritical === Infinity ? "unknown" : monthsToCritical + " months"}. Recovery cost increases ${recoveryMultiplier}x with each month of delay.${hasActiveContradictions ? " Active contradictions are accelerating the decline." : ""}`
    : `${domain} is stable. No degradation detected at current measurement.`;

  return {
    monthlyDegradation: Math.round(effectiveRate * 10) / 10,
    monthsToCritical: monthsToCritical === Infinity ? 999 : monthsToCritical,
    monthsToUnrecoverable: monthsToUnrecoverable === Infinity ? 999 : monthsToUnrecoverable,
    degradationTarget: domain,
    narrative,
    recoveryMultiplier,
  };
}
