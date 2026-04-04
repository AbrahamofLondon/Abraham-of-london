/* lib/alignment/governance-logic.ts — Sovereign Governance Engine v1.0 */
import { prisma } from "@/lib/prisma";

// ============================================================================
// TYPES
// ============================================================================

export type GovernanceMetrics = {
  rawDissonance: number;
  adjustedDissonance: number;
  totalRecovery: number;
  integrityIndex: number;
  isDisordered: boolean;
};

export type ImpactSimulation = {
  predictedAdjustedDissonance: number;
  predictedIntegrityIndex: number;
  predictedStatus: "STABLE" | "IMPROVING" | "CRITICAL";
  riskFactors: {
    domain: string;
    impact: number;
    direction: "positive" | "negative";
    confidence: number;
  }[];
  timeframe: {
    daysToStable: number;
    daysToTotalRecovery: number;
  };
};

export type ExpiryStatus = {
  isExpired: boolean;
  daysRemaining: number;
  escalatedAt: Date | null;
  severity: "WARNING" | "CRITICAL" | "NEGLIGENCE";
};

// ============================================================================
// CONSTANTS
// ============================================================================

const PROTOCOL_EXPIRY_DAYS = 30;
const ESCALATION_THRESHOLD_WARNING = 7;
const ESCALATION_THRESHOLD_CRITICAL = 3;

// Cross-domain correlation matrix
const DOMAIN_CORRELATION: Record<string, Record<string, number>> = {
  STRATEGIC_INTENT: {
    OPERATIONAL_CLARITY: 0.65,
    LEADERSHIP_TRUST: 0.45,
    CULTURAL_COHESION: 0.35,
  },
  OPERATIONAL_CLARITY: {
    STRATEGIC_INTENT: 0.55,
    LEADERSHIP_TRUST: 0.48,
    CULTURAL_COHESION: 0.42,
  },
  LEADERSHIP_TRUST: {
    STRATEGIC_INTENT: 0.62,
    OPERATIONAL_CLARITY: 0.58,
    CULTURAL_COHESION: 0.71,
  },
  CULTURAL_COHESION: {
    STRATEGIC_INTENT: 0.38,
    OPERATIONAL_CLARITY: 0.44,
    LEADERSHIP_TRUST: 0.68,
  },
};

// ============================================================================
// A. DEADMAN'S SWITCH — Protocol Expiry & Escalation
// ============================================================================

/**
 * Checks if a mandated protocol has expired and escalates if necessary
 */
export async function checkProtocolExpiry(campaignId: string): Promise<ExpiryStatus> {
  const activeNodes = await prisma.correctionNode.findMany({
    where: {
      campaignId,
      status: "MANDATED",
    },
    orderBy: { createdAt: "asc" },
  });

  if (activeNodes.length === 0) {
    return { isExpired: false, daysRemaining: Infinity, escalatedAt: null, severity: "WARNING" };
  }

  const oldestNode = activeNodes[0];
  const daysSinceMandate = (Date.now() - oldestNode.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, PROTOCOL_EXPIRY_DAYS - daysSinceMandate);
  const isExpired = daysRemaining === 0;

  let severity: "WARNING" | "CRITICAL" | "NEGLIGENCE" = "WARNING";
  if (isExpired) {
    severity = "NEGLIGENCE";
  } else if (daysRemaining <= ESCALATION_THRESHOLD_CRITICAL) {
    severity = "CRITICAL";
  } else if (daysRemaining <= ESCALATION_THRESHOLD_WARNING) {
    severity = "WARNING";
  }

  // If expired and not already escalated, escalate the campaign status
  if (isExpired && campaignId) {
    await prisma.alignmentCampaign.update({
      where: { id: campaignId },
      data: { status: "negligence" },
    });
  }

  return {
    isExpired,
    daysRemaining,
    escalatedAt: isExpired ? new Date() : null,
    severity,
  };
}

// ============================================================================
// B. IMPACT SIMULATION — "What-If" Engine
// ============================================================================

/**
 * Simulates the impact of a proposed intervention before deployment
 */
export function simulateInterventionImpact(
  rawMetrics: Array<{ label: string; intent: number; reality: number }>,
  proposedAction: {
    domain: string;
    estimatedRecovery: number;
    estimatedTimeframe: number;
  }
): ImpactSimulation {
  const targetDomain = rawMetrics.find(m => m.label === proposedAction.domain);
  if (!targetDomain) {
    throw new Error(`Domain ${proposedAction.domain} not found in metrics`);
  }

  // Calculate predicted improvement
  const currentGap = targetDomain.intent - targetDomain.reality;
  const predictedImprovement = Math.min(currentGap, proposedAction.estimatedRecovery);
  const predictedReality = targetDomain.reality + predictedImprovement;

  // Calculate new dissonance
  const predictedMetrics = rawMetrics.map(m => ({
    ...m,
    reality: m.label === proposedAction.domain ? predictedReality : m.reality,
  }));

  const rawDissonance = rawMetrics.reduce((acc, m) => acc + (m.intent - m.reality), 0) / rawMetrics.length;
  const predictedDissonance = predictedMetrics.reduce((acc, m) => acc + (m.intent - m.reality), 0) / predictedMetrics.length;
  const predictedIntegrityIndex = 100 - predictedDissonance;

  // Calculate cross-domain risk factors
  const riskFactors: ImpactSimulation["riskFactors"] = [];
  const correlations = DOMAIN_CORRELATION[proposedAction.domain] || {};

  for (const [otherDomain, correlation] of Object.entries(correlations)) {
    const otherMetric = rawMetrics.find(m => m.label === otherDomain);
    if (!otherMetric) continue;

    const otherGap = otherMetric.intent - otherMetric.reality;
    const predictedImpact = -predictedImprovement * correlation * 0.15; // Negative correlation impact

    if (Math.abs(predictedImpact) > 1) {
      riskFactors.push({
        domain: otherDomain,
        impact: predictedImpact,
        direction: predictedImpact < 0 ? "negative" : "positive",
        confidence: Math.min(0.95, 0.6 + correlation * 0.35),
      });
    }
  }

  // Determine predicted status
  let predictedStatus: "STABLE" | "IMPROVING" | "CRITICAL";
  if (predictedIntegrityIndex >= 70) predictedStatus = "STABLE";
  else if (predictedIntegrityIndex >= 50) predictedStatus = "IMPROVING";
  else predictedStatus = "CRITICAL";

  return {
    predictedAdjustedDissonance: predictedDissonance,
    predictedIntegrityIndex,
    predictedStatus,
    riskFactors,
    timeframe: {
      daysToStable: Math.max(1, Math.floor(proposedAction.estimatedTimeframe * 0.7)),
      daysToTotalRecovery: proposedAction.estimatedTimeframe,
    },
  };
}

// ============================================================================
// C. CROSS-DOMAIN CORRELATION — Contagion Map
// ============================================================================

/**
 * Analyzes the contagion risk across domains based on current dissonance patterns
 */
export function analyzeContagionRisk(
  rawMetrics: Array<{ label: string; intent: number; reality: number }>
): Array<{
  sourceDomain: string;
  targetDomain: string;
  correlationStrength: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  contagionProbability: number;
}> {
  const results: ReturnType<typeof analyzeContagionRisk>[0][] = [];

  for (const source of rawMetrics) {
    const sourceGap = source.intent - source.reality;
    if (sourceGap <= 5) continue; // No significant risk if gap is small

    const correlations = DOMAIN_CORRELATION[source.label] || {};
    for (const [targetDomain, correlation] of Object.entries(correlations)) {
      const targetMetric = rawMetrics.find(m => m.label === targetDomain);
      if (!targetMetric) continue;

      const targetGap = targetMetric.intent - targetMetric.reality;
      const contagionProbability = Math.min(0.95, (sourceGap / 100) * correlation * 1.2);

      let riskLevel: "LOW" | "MEDIUM" | "HIGH";
      if (contagionProbability > 0.6) riskLevel = "HIGH";
      else if (contagionProbability > 0.3) riskLevel = "MEDIUM";
      else riskLevel = "LOW";

      results.push({
        sourceDomain: source.label,
        targetDomain,
        correlationStrength: correlation,
        riskLevel,
        contagionProbability,
      });
    }
  }

  return results.sort((a, b) => b.contagionProbability - a.contagionProbability).slice(0, 5);
}

// ============================================================================
// D. AUTOMATED BRIEFING GENERATION
// ============================================================================

/**
 * Generates a board-ready intelligence brief based on correction history
 */
export async function generateIntelligenceBrief(
  campaignId: string,
  rawMetrics: Array<{ label: string; intent: number; reality: number }>
): Promise<{
  summary: string;
  keyFindings: string[];
  recoveryProgress: string;
  recommendations: string[];
}> {
  const nodes = await prisma.correctionNode.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });

  const liquidated = nodes.filter(n => n.status === "LIQUIDATED");
  const mandated = nodes.filter(n => n.status === "MANDATED");

  const totalRecovery = liquidated.reduce((acc, n) => {
    const match = n.recoveryProjection.match(/\d+/);
    return acc + (match ? parseFloat(match[0]) : 0);
  }, 0);

  const rawDissonance = rawMetrics.reduce((acc, m) => acc + (m.intent - m.reality), 0) / rawMetrics.length;
  const integrityIndex = 100 - Math.max(0, rawDissonance - totalRecovery);

  const highestFriction = [...rawMetrics].sort((a, b) => (b.intent - b.reality) - (a.intent - a.reality))[0];

  return {
    summary: `Following the Sovereign Alignment Protocol, the organisation has achieved ${integrityIndex}% institutional integrity, recovering ${totalRecovery}% of lost resonance capacity.`,
    keyFindings: [
      `Primary friction identified in ${highestFriction.label}: ${Math.round(highestFriction.intent - highestFriction.reality)}% gap between strategic intent and operational reality.`,
      `${liquidated.length} correction nodes successfully liquidated, restoring ${totalRecovery}% of projected recovery value.`,
      `${mandated.length} active interventions remain in progress, with projected completion within the current governance cycle.`,
    ],
    recoveryProgress: `${Math.round((liquidated.length / nodes.length) * 100)}% of correction nodes completed • ${Math.round(integrityIndex)}% resonance achieved • ${Math.round(100 - integrityIndex)}% remaining friction delta`,
    recommendations: mandated.length > 0
      ? [
          `Prioritize liquidation of ${mandated[0].domain} correction node to unlock ${mandated[0].recoveryProjection} recovery projection.`,
          `Schedule executive review of remaining ${mandated.length} active protocols within 14 days.`,
          `Consider expanding intervention scope to address cross-domain contagion risks.`,
        ]
      : [
          `Sustained resonance confirmed. Maintain current cadence with quarterly recalibration.`,
          `Monitor ${highestFriction.label} for early signs of friction re-emergence.`,
        ],
  };
}