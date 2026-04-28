/* lib/alignment/hcd-engine-calculations.ts
 * HCD (Human Capital Delta) calculation functions.
 * Pure computation — no React, no UI.
 */

// ===== TYPES =====

export interface HCDMetrics {
  label: string;
  potential: number;
  extraction: number;
  wellbeing: number;
  headcount?: number;
  tenure?: number;
  openRoles?: number;
}

export interface HCDResult extends HCDMetrics {
  delta: number;
  utilizationEfficiency: number;
  burnoutIndex: number;
  fragilityIndex: number;
  attritionRisk: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  healthStatus: "COLLAPSING" | "FRAGILE" | "STRAINED" | "OPTIMAL";
  replacementCost: number;
  recommendations: string[];
}

export interface HCDAggregate {
  overallBurnoutIndex: number;
  overallFragilityIndex: number;
  criticalDomains: string[];
  elevatedDomains: string[];
  stableDomains: string[];
  totalReplacementCost: number;
  averageUtilization: number;
  overloadedDomains: string[];
  underutilizedDomains: string[];
  riskScore: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface HCDContagionLink {
  source: string;
  target: string;
  impact: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface HCDBriefing {
  summary: string;
  keyRisks: string[];
  recommendations: string[];
  financialImpact: string;
}

// ===== SAMPLE DATA =====

export const SAMPLE_HCD_METRICS: HCDMetrics[] = [
  { label: "ENGINEERING_VELOCITY", potential: 90, extraction: 85, wellbeing: 60, headcount: 12, tenure: 18, openRoles: 1 },
  { label: "LEADERSHIP_EXHAUSTION", potential: 80, extraction: 120, wellbeing: 25, headcount: 4, tenure: 24, openRoles: 1 },
  { label: "TALENT_ATTRITION", potential: 85, extraction: 70, wellbeing: 72, headcount: 8, tenure: 30, openRoles: 0 },
  { label: "ROLE_VACANCY", potential: 95, extraction: 60, wellbeing: 80, headcount: 15, tenure: 24, openRoles: 0 },
];

// ===== HELPERS =====

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeNumber(val: unknown, fallback: number = 0): number {
  if (val === undefined || val === null) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

// ===== CORE CALCULATION =====

export function calculateHCDelta(metrics: HCDMetrics[]): HCDResult[] {
  return metrics.map((raw) => {
    // Sanitize inputs
    const label = typeof raw.label === "string" && raw.label ? raw.label : "UNSPECIFIED_DOMAIN";
    const potential = sanitizeNumber(raw.potential);
    const extraction = sanitizeNumber(raw.extraction);
    const wellbeing = sanitizeNumber(raw.wellbeing);
    const headcount = Math.max(1, sanitizeNumber(raw.headcount, 1));
    const tenure = Math.max(0, sanitizeNumber(raw.tenure, 0));
    const openRoles = Math.max(0, sanitizeNumber(raw.openRoles, 0));

    // Delta: extraction - potential (positive = overload, negative = underutilisation)
    const delta = extraction - potential;

    // Utilization efficiency: (extraction / potential) * 100, guard against division by zero
    const utilizationEfficiency = potential > 0 ? (extraction / potential) * 100 : 0;

    // Burnout index: driven by over-extraction and low wellbeing, clamped 0..100
    const overloadFactor = Math.max(0, delta) / 100;
    const wellbeingPenalty = (100 - wellbeing) / 100;
    const burnoutIndex = clamp(Math.round((overloadFactor * 60 + wellbeingPenalty * 40) * 100) / 100, 0, 100);

    // Fragility index: driven by burnout, vacancies, low tenure, clamped 0..100
    const vacancyRatio = headcount > 0 ? openRoles / headcount : 0;
    const tenureFactor = tenure < 12 ? 0.3 : tenure < 24 ? 0.15 : 0;
    const fragilityIndex = clamp(
      Math.round((burnoutIndex * 0.5 + vacancyRatio * 30 + tenureFactor * 20) * 100) / 100,
      0,
      100
    );

    // Classification
    let attritionRisk: HCDResult["attritionRisk"];
    let healthStatus: HCDResult["healthStatus"];

    if (burnoutIndex >= 50 && wellbeing <= 30) {
      attritionRisk = "CRITICAL";
      healthStatus = "COLLAPSING";
    } else if (burnoutIndex >= 35 || wellbeing <= 45) {
      attritionRisk = "HIGH";
      healthStatus = "FRAGILE";
    } else if (burnoutIndex >= 20 || wellbeing <= 60) {
      attritionRisk = "MODERATE";
      healthStatus = "STRAINED";
    } else {
      attritionRisk = "LOW";
      healthStatus = "OPTIMAL";
    }

    // Replacement cost estimate (per head, scaled by tenure)
    const costPerHead = 50_000 + tenure * 500;
    const replacementCost = Math.round(headcount * costPerHead * (burnoutIndex / 100));

    // Recommendations
    const recommendations: string[] = [];
    if (delta > 10) {
      recommendations.push(
        `Over-extraction in ${label}: reduce workload by ${Math.round(delta)}% to restore sustainable capacity.`
      );
    }
    if (delta < -15) {
      recommendations.push(
        `Latent capacity in ${label}: ${Math.abs(Math.round(delta))}% potential remains untapped — consider redeployment.`
      );
    }
    if (wellbeing < 40) {
      recommendations.push(
        `Wellbeing alarm in ${label}: score ${wellbeing}% — launch support intervention immediately.`
      );
    }
    if (openRoles > 0 && headcount > 0) {
      recommendations.push(
        `${openRoles} open role(s) in ${label}: expedite recruitment to relieve pressure.`
      );
    }

    return {
      label,
      potential,
      extraction,
      wellbeing,
      headcount,
      tenure,
      openRoles,
      delta,
      utilizationEfficiency,
      burnoutIndex,
      fragilityIndex,
      attritionRisk,
      healthStatus,
      replacementCost,
      recommendations,
    };
  });
}

// ===== AGGREGATE =====

export function aggregateHCDMetrics(results: HCDResult[]): HCDAggregate {
  if (results.length === 0) {
    return {
      overallBurnoutIndex: 0,
      overallFragilityIndex: 0,
      criticalDomains: [],
      elevatedDomains: [],
      stableDomains: [],
      totalReplacementCost: 0,
      averageUtilization: 0,
      overloadedDomains: [],
      underutilizedDomains: [],
      riskScore: "LOW",
    };
  }

  const overallBurnoutIndex =
    results.reduce((s, r) => s + r.burnoutIndex, 0) / results.length;
  const overallFragilityIndex =
    results.reduce((s, r) => s + r.fragilityIndex, 0) / results.length;
  const averageUtilization =
    results.reduce((s, r) => s + r.utilizationEfficiency, 0) / results.length;
  const totalReplacementCost = results.reduce((s, r) => s + r.replacementCost, 0);

  const criticalDomains = results
    .filter((r) => r.attritionRisk === "CRITICAL")
    .map((r) => r.label);
  const elevatedDomains = results
    .filter((r) => r.attritionRisk === "HIGH")
    .map((r) => r.label);
  const stableDomains = results
    .filter((r) => r.attritionRisk === "LOW" || r.attritionRisk === "MODERATE")
    .map((r) => r.label);

  const overloadedDomains = results
    .filter((r) => r.delta > 0)
    .map((r) => r.label);
  const underutilizedDomains = results
    .filter((r) => r.delta < 0)
    .map((r) => r.label);

  let riskScore: HCDAggregate["riskScore"] = "LOW";
  if (criticalDomains.length > 0) riskScore = "CRITICAL";
  else if (elevatedDomains.length > 0) riskScore = "HIGH";
  else if (overallBurnoutIndex > 25) riskScore = "MEDIUM";

  return {
    overallBurnoutIndex,
    overallFragilityIndex,
    criticalDomains,
    elevatedDomains,
    stableDomains,
    totalReplacementCost,
    averageUtilization,
    overloadedDomains,
    underutilizedDomains,
    riskScore,
  };
}

// ===== CONTAGION =====

export function calculateHCDContagion(
  results: HCDResult[],
  targets: string[]
): HCDContagionLink[] {
  const links: HCDContagionLink[] = [];

  for (const result of results) {
    for (const target of targets) {
      const impact = clamp(
        Math.round(result.burnoutIndex * 0.6 + result.fragilityIndex * 0.4),
        0,
        100
      );
      const severity: HCDContagionLink["severity"] =
        impact >= 40 ? "HIGH" : impact >= 20 ? "MEDIUM" : "LOW";

      links.push({ source: result.label, target, impact, severity });
    }
  }

  // Sort descending by impact
  links.sort((a, b) => b.impact - a.impact);
  return links;
}

// ===== BRIEFING =====

export function generateHCDBriefingSection(
  results: HCDResult[],
  aggregate: HCDAggregate
): HCDBriefing {
  const keyRisks: string[] = [];
  const recommendations: string[] = [];

  // Summary
  const summary =
    aggregate.riskScore === "CRITICAL"
      ? `Critical human-capital distress across ${aggregate.criticalDomains.length} domain(s). Immediate board-level intervention required.`
      : aggregate.riskScore === "HIGH"
        ? `Elevated human-capital friction in ${aggregate.elevatedDomains.length} domain(s). Targeted action within 14 days recommended.`
        : `Human-capital metrics within acceptable bounds. Continue monitoring.`;

  // Key risks from critical + elevated
  for (const d of aggregate.criticalDomains) {
    keyRisks.push(`${d}: attrition risk CRITICAL`);
  }
  for (const d of aggregate.elevatedDomains) {
    keyRisks.push(`${d}: attrition risk HIGH`);
  }

  // Recommendations — reference highest-fragility domain
  const sorted = [...results].sort((a, b) => b.fragilityIndex - a.fragilityIndex);
  if (sorted.length > 0) {
    recommendations.push(
      `Prioritise intervention in ${sorted[0]!.label} (fragility ${sorted[0]!.fragilityIndex.toFixed(1)}%).`
    );
  }
  recommendations.push("Establish 30-day review cadence for all elevated domains.");

  // Financial impact
  const financialImpact =
    aggregate.totalReplacementCost > 0
      ? `Estimated replacement liability: $${(aggregate.totalReplacementCost / 1000).toFixed(0)}K`
      : "$0 — no immediate replacement liability detected.";

  return { summary, keyRisks, recommendations, financialImpact };
}

// ===== UI HELPERS =====

export function getHCDStatusColor(status: string): string {
  const map: Record<string, string> = {
    OPTIMAL: "text-green-600 bg-green-50",
    STRAINED: "text-amber-600 bg-amber-50",
    FRAGILE: "text-orange-600 bg-orange-50",
    COLLAPSING: "text-red-600 bg-red-50",
  };
  return map[status] || "text-gray-500";
}

export function getHCDRiskColor(risk: string): string {
  const map: Record<string, string> = {
    LOW: "text-green-600 bg-green-50",
    MEDIUM: "text-amber-600 bg-amber-50",
    HIGH: "text-orange-600 bg-orange-50",
    CRITICAL: "text-red-600 bg-red-50",
  };
  return map[risk] || "text-gray-500";
}
