/* lib/alignment/human-capital-delta.ts — HCD Engine Exports */

// Re-export everything from simulation-engine
export * from "@/lib/ogr/simulation-engine";

// ===== SAMPLE DATA FOR DEVELOPMENT =====
export const SAMPLE_HCD_METRICS = [
  { 
    label: "ENGINEERING_VELOCITY", 
    potential: 100, 
    extraction: 94, 
    wellbeing: 42, 
    headcount: 12, 
    tenure: 18,
    burnoutIndex: 58,
    attritionRisk: "MODERATE"
  },
  { 
    label: "LEADERSHIP_EXHAUSTION", 
    potential: 90, 
    extraction: 95, 
    wellbeing: 35, 
    headcount: 5, 
    tenure: 42,
    burnoutIndex: 82,
    attritionRisk: "HIGH"
  },
  { 
    label: "TALENT_ATTRITION", 
    potential: 85, 
    extraction: 78, 
    wellbeing: 65, 
    headcount: 8, 
    tenure: 24,
    burnoutIndex: 45,
    attritionRisk: "MODERATE"
  },
  { 
    label: "ROLE_VACANCY", 
    potential: 95, 
    extraction: 82, 
    wellbeing: 71, 
    headcount: 15, 
    tenure: 12,
    burnoutIndex: 32,
    attritionRisk: "LOW"
  },
];

// ===== TYPES =====
export interface HCDMetrics {
  label?: string;
  domain?: string;
  intent: number;
  reality: number;
  wellbeing?: number;
  burnoutIndex?: number;
  utilization?: number;
  potential?: number;
  extraction?: number;
  headcount?: number;
  tenure?: number;
  attritionRisk?: string;
}

export interface HCDResult {
  label?: string;
  domain: string;
  delta: number;
  burnoutIndex?: number;
  wellbeing?: number;
  riskScore: "CRITICAL" | "ELEVATED" | "MODERATE" | "LOW" | "OPTIMAL";
  status: "CRITICAL" | "ELEVATED" | "MODERATE" | "LOW" | "OPTIMAL";
  potential?: number;
  extraction?: number;
  attritionRisk?: string;
}

// ===== COLOR HELPERS =====
export function getHCDRiskColor(risk: string): string {
  const colors: Record<string, string> = {
    CRITICAL: "text-red-600 bg-red-50 border-red-200",
    ELEVATED: "text-orange-500 bg-orange-50 border-orange-200",
    MODERATE: "text-yellow-600 bg-yellow-50 border-yellow-200",
    LOW: "text-emerald-600 bg-emerald-50 border-emerald-200",
    OPTIMAL: "text-green-600 bg-green-50 border-green-200",
  };
  return colors[risk] || "text-gray-600 bg-gray-50";
}

export function getHCDStatusColor(status: string): string {
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-600",
    ELEVATED: "bg-orange-500",
    MODERATE: "bg-yellow-500",
    LOW: "bg-emerald-500",
    OPTIMAL: "bg-green-500",
  };
  return colors[status] || "bg-gray-500";
}

// ===== CALCULATION FUNCTIONS =====
export function calculateHCDelta(metrics: HCDMetrics[]): HCDResult[] {
  return metrics.map(metric => {
    const delta = metric.burnoutIndex 
      ? metric.burnoutIndex 
      : Math.abs((metric.intent || metric.potential || 100) - (metric.reality || metric.extraction || 50));
    
    let riskScore: HCDResult["riskScore"] = "LOW";
    if (delta >= 75) riskScore = "CRITICAL";
    else if (delta >= 60) riskScore = "ELEVATED";
    else if (delta >= 40) riskScore = "MODERATE";
    else if (delta >= 20) riskScore = "LOW";
    else riskScore = "OPTIMAL";

    return {
      label: metric.label || metric.domain,
      domain: metric.domain || metric.label || "UNKNOWN",
      delta,
      burnoutIndex: metric.burnoutIndex,
      wellbeing: metric.wellbeing,
      riskScore,
      status: riskScore,
      potential: metric.potential,
      extraction: metric.extraction,
      attritionRisk: metric.attritionRisk,
    };
  });
}

export function aggregateHCDMetrics(results: HCDResult[]) {
  const avgDelta = results.reduce((sum, r) => sum + r.delta, 0) / results.length;
  const criticalCount = results.filter(r => r.riskScore === "CRITICAL").length;
  const elevatedCount = results.filter(r => r.riskScore === "ELEVATED").length;
  const criticalDomains = results.filter(r => r.riskScore === "CRITICAL").map(r => r.label || r.domain);
  const elevatedDomains = results.filter(r => r.riskScore === "ELEVATED").map(r => r.label || r.domain);
  
  const overallRiskScore = 
    criticalCount > 0 ? "CRITICAL" :
    elevatedCount > 2 ? "ELEVATED" :
    avgDelta > 40 ? "MODERATE" :
    avgDelta > 20 ? "LOW" : "OPTIMAL";
  
  const totalReplacementCost = (criticalCount * 12500) + (elevatedCount * 5000);
  
  return {
    averageDelta: avgDelta,
    overallBurnoutIndex: avgDelta,
    averageUtilization: 100 - avgDelta,
    overallFragilityIndex: avgDelta * 0.8,
    criticalCount,
    elevatedCount,
    criticalDomains,
    elevatedDomains,
    totalReplacementCost,
    riskScore: overallRiskScore,
    status: overallRiskScore,
  };
}

export function calculateHCDContagion(
  results: HCDResult[],
  domains: string[]
): Array<{ source: string; target: string; contagionRisk: number }> {
  const contagion: Array<{ source: string; target: string; contagionRisk: number }> = [];
  
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const avgRisk = (results[i].delta + results[j].delta) / 2;
      const contagionRisk = Math.min(100, avgRisk * 0.7);
      
      contagion.push({
        source: results[i].label || results[i].domain,
        target: results[j].label || results[j].domain,
        contagionRisk,
      });
    }
  }
  
  return contagion;
}

// ===== MANDATE GENERATION =====
export type HCDInterventionDomain = 
  | "ENGINEERING_VELOCITY"
  | "LEADERSHIP_EXHAUSTION"
  | "TALENT_ATTRITION"
  | "ROLE_VACANCY"
  | "WORKLOAD_DISTRIBUTION"
  | "WELLBEING_SUPPORT"
  | "SKILLS_DEVELOPMENT";

interface HCDMandate {
  title: string;
  description: string;
  investment_tier: "STANDARD" | "ENTERPRISE" | "CRITICAL";
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedRecovery: number;
  interventions: string[];
}

export function generateHCDMandate(
  domain: HCDInterventionDomain,
  delta: number,
  wellbeing?: number,
  burnoutIndex?: number
): HCDMandate | null {
  let urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";
  let investment_tier: "STANDARD" | "ENTERPRISE" | "CRITICAL" = "STANDARD";

  if (delta > 25 || (burnoutIndex && burnoutIndex > 75) || (wellbeing && wellbeing < 35)) {
    urgency = "CRITICAL";
    investment_tier = "CRITICAL";
  } else if (delta > 15 || (burnoutIndex && burnoutIndex > 60) || (wellbeing && wellbeing < 50)) {
    urgency = "HIGH";
    investment_tier = "ENTERPRISE";
  } else if (delta > 8 || (burnoutIndex && burnoutIndex > 45)) {
    urgency = "MEDIUM";
    investment_tier = "STANDARD";
  } else {
    urgency = "LOW";
    investment_tier = "STANDARD";
  }

  const mandates: Record<HCDInterventionDomain, HCDMandate> = {
    ENGINEERING_VELOCITY: {
      title: "Velocity Restoration Protocol",
      description: `Engineering velocity is ${delta > 0 ? `overextended by ${delta}%` : `underutilized by ${Math.abs(delta)}%`}. Requires capacity recalibration.`,
      investment_tier,
      urgency,
      estimatedRecovery: Math.min(85, Math.round(delta * 0.9)),
      interventions: [
        "Reduce concurrent work-in-progress by 30%",
        "Implement focused development sprints",
        "Add buffer capacity for technical debt",
      ],
    },
    LEADERSHIP_EXHAUSTION: {
      title: "Leadership Sustainability Initiative",
      description: `Leadership extraction exceeds sustainable capacity by ${delta}%. Burnout risk requires immediate structural intervention.`,
      investment_tier,
      urgency,
      estimatedRecovery: Math.min(75, Math.round(delta * 0.85)),
      interventions: [
        "Delegate operational decisions to senior team",
        "Implement executive coaching protocol",
        "Establish decision rights framework",
      ],
    },
    TALENT_ATTRITION: {
      title: "Retention & Engagement Protocol",
      description: `Attrition risk detected at ${delta}% delta. Talent retention requires targeted intervention.`,
      investment_tier,
      urgency,
      estimatedRecovery: Math.min(80, Math.round(delta * 0.75)),
      interventions: [
        "Conduct stay interviews with key talent",
        "Review compensation parity",
        "Implement career development pathways",
      ],
    },
    ROLE_VACANCY: {
      title: "Capacity Fulfillment Strategy",
      description: `${delta > 0 ? `${delta}% role vacancy gap` : `${Math.abs(delta)}% surplus capacity`}. Requires staffing realignment.`,
      investment_tier,
      urgency,
      estimatedRecovery: Math.min(90, Math.round(Math.abs(delta) * 0.95)),
      interventions: [
        "Accelerate recruitment for open roles",
        "Implement cross-functional coverage",
        "Review role definitions for efficiency",
      ],
    },
    WORKLOAD_DISTRIBUTION: {
      title: "Workload Balance Protocol",
      description: `Workload distribution delta of ${delta}% requires rebalancing across teams.`,
      investment_tier,
      urgency,
      estimatedRecovery: Math.min(70, Math.round(delta * 0.8)),
      interventions: [
        "Audit task allocation across teams",
        "Implement workload monitoring system",
        "Establish fair distribution metrics",
      ],
    },
    WELLBEING_SUPPORT: {
      title: "Wellbeing Infrastructure Program",
      description: `Wellbeing score at ${wellbeing || 50}% requires structural support enhancements.`,
      investment_tier,
      urgency,
      estimatedRecovery: Math.min(65, Math.round((100 - (wellbeing || 50)) * 0.7)),
      interventions: [
        "Launch wellness support resources",
        "Implement flexible work arrangements",
        "Establish mental health first aid network",
      ],
    },
    SKILLS_DEVELOPMENT: {
      title: "Capability Uplift Initiative",
      description: `Skills gap identified. ${Math.abs(delta)}% capability delta requires development investment.`,
      investment_tier,
      urgency,
      estimatedRecovery: Math.min(85, Math.round(Math.abs(delta) * 0.85)),
      interventions: [
        "Implement skills assessment program",
        "Launch targeted training cohorts",
        "Establish mentorship framework",
      ],
    },
  };

  return mandates[domain] || null;
}

// ===== BRIEFING SECTION =====
export function generateHCDBriefingSection(
  results: HCDResult[],
  aggregate: ReturnType<typeof aggregateHCDMetrics>
): {
  summary: string;
  criticalDomains: string[];
  recommendations: string[];
  riskAssessment: string;
} {
  const criticalDomains = aggregate.criticalDomains;
  const elevatedDomains = aggregate.elevatedDomains;
  
  let summary = "";
  let riskAssessment = "";
  const recommendations: string[] = [];
  
  if (aggregate.riskScore === "CRITICAL") {
    summary = `Critical human capital distress detected. ${criticalDomains.length} domains require immediate intervention. Burnout index at ${Math.round(aggregate.overallBurnoutIndex)}% threatens operational continuity.`;
    riskAssessment = "HIGH";
    recommendations.push("Immediate executive review of critical domains");
    recommendations.push("Deploy stabilization protocols within 72 hours");
    recommendations.push("Engage external HCD specialists if internal capacity constrained");
  } else if (aggregate.riskScore === "ELEVATED") {
    summary = `Elevated human capital friction in ${criticalDomains.length + elevatedDomains.length} domains. Burnout index at ${Math.round(aggregate.overallBurnoutIndex)}% requires targeted intervention.`;
    riskAssessment = "ELEVATED";
    recommendations.push("Conduct domain-specific deep dives within 14 days");
    recommendations.push("Implement workload redistribution in elevated domains");
    recommendations.push("Schedule leadership review for risk mitigation");
  } else if (aggregate.riskScore === "MODERATE") {
    summary = `Moderate human capital friction detected. ${elevatedDomains.length} domains show early warning signs. Proactive monitoring recommended.`;
    riskAssessment = "MODERATE";
    recommendations.push("Establish monitoring cadence for elevated domains");
    recommendations.push("Review wellbeing metrics quarterly");
    recommendations.push("Maintain current intervention trajectory");
  } else {
    summary = `Human capital metrics within optimal range. Burnout index at ${Math.round(aggregate.overallBurnoutIndex)}% with stable utilization.`;
    riskAssessment = "LOW";
    recommendations.push("Continue current human capital programs");
    recommendations.push("Document best practices for scaling");
    recommendations.push("Monitor for emerging friction signals");
  }
  
  if (criticalDomains.length > 0) {
    const domainList = criticalDomains.slice(0, 3).join(", ");
    if (criticalDomains.length > 3) {
      summary += ` Critical: ${domainList} and ${criticalDomains.length - 3} others.`;
    } else {
      summary += ` Critical: ${domainList}.`;
    }
  }
  
  if (aggregate.totalReplacementCost > 0) {
    summary += ` Estimated replacement liability: $${Math.round(aggregate.totalReplacementCost / 1000)}K.`;
  }
  
  return {
    summary,
    criticalDomains,
    recommendations,
    riskAssessment,
  };
}

// ===== FORMATTING HELPER =====
export function formatHCDMetricsForReport(results: HCDResult[]): Array<{
  label: string;
  score: number;
  status: string;
  trend: "improving" | "stable" | "declining";
}> {
  return results.map(result => ({
    label: result.label || result.domain,
    score: result.delta,
    status: result.riskScore,
    trend: result.delta > 60 ? "declining" : result.delta > 30 ? "stable" : "improving",
  }));
}