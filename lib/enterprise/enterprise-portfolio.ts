/**
 * Enterprise Portfolio — Decision Authority as a Service (DAaaS).
 *
 * Not software. Not consulting. Not training.
 * Externalised decision authority that enforces action across the organisation.
 *
 * "We identify contradictions, price the cost, assign ownership,
 * and verify execution."
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO VIEW
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionStatus = "active" | "breached" | "drifting" | "resolved" | "abandoned";

export type PortfolioDecision = {
  spineId: string;
  decision: string;
  status: DecisionStatus;
  costPerMonth: number;
  owner: string;
  pressureIndex: number;
  conditionClass: string;
  breachCount: number;
  daysSinceCreated: number;
  actionTaken: boolean;
  verifiedImpact: string | null;
};

export type EnterprisePortfolio = {
  organisationKey: string;
  decisions: PortfolioDecision[];
  totalCostExposure: number;
  decisionsInBreach: number;
  actionRate48h: number;
  structuralChangeRate: number;
  orgPressureIndex: number;
  redFlags: string[];
};

/**
 * Build enterprise portfolio from organisation's spines.
 */
export function buildPortfolio(spines: IntelligenceSpine[], organisationKey: string): EnterprisePortfolio {
  const decisions: PortfolioDecision[] = spines.map((spine) => {
    const daysSince = Math.round((Date.now() - new Date(spine.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const cost = spine.economics?.estimatedMonthlyCost ?? 0;

    let status: DecisionStatus = "active";
    if (spine.execution?.verifiedImpact === "structural_change") status = "resolved";
    else if (spine.execution?.breach) status = "breached";
    else if (daysSince > 14 && !spine.execution?.actionTaken) status = "drifting";

    return {
      spineId: spine.id,
      decision: spine.case.decision?.slice(0, 100) ?? "",
      status,
      costPerMonth: cost,
      owner: spine.case.claimedOwner ?? "unassigned",
      pressureIndex: spine.pressureIndex ?? 0,
      conditionClass: spine.deterministic.conditionClass,
      breachCount: spine.execution?.breachCount ?? 0,
      daysSinceCreated: daysSince,
      actionTaken: spine.execution?.actionTaken ?? false,
      verifiedImpact: spine.execution?.verifiedImpact ?? null,
    };
  });

  const totalCost = decisions.reduce((sum, d) => sum + d.costPerMonth, 0);
  const inBreach = decisions.filter((d) => d.status === "breached").length;
  const committed = decisions.filter((d) => d.actionTaken !== undefined);
  const acted = committed.filter((d) => d.actionTaken);
  const structural = decisions.filter((d) => d.verifiedImpact === "structural_change").length;
  const avgPressure = decisions.length > 0 ? decisions.reduce((s, d) => s + d.pressureIndex, 0) / decisions.length : 0;

  // Red flags
  const redFlags: string[] = [];
  const breachPatterns = decisions.filter((d) => d.breachCount >= 2);
  if (breachPatterns.length > 0) redFlags.push(`${breachPatterns.length} decision${breachPatterns.length > 1 ? "s" : ""} with repeated breach patterns`);

  const falseAuthSpines = spines.filter((s) => s.flags?.falseAuthority);
  if (falseAuthSpines.length > 0) redFlags.push(`${falseAuthSpines.length} false authority signal${falseAuthSpines.length > 1 ? "s" : ""} detected`);

  const highCostDrifting = decisions.filter((d) => d.status === "drifting" && d.costPerMonth > 10000);
  if (highCostDrifting.length > 0) redFlags.push(`${highCostDrifting.length} high-cost decision${highCostDrifting.length > 1 ? "s" : ""} drifting (>£10k/month)`);

  return {
    organisationKey,
    decisions,
    totalCostExposure: totalCost,
    decisionsInBreach: inBreach,
    actionRate48h: committed.length > 0 ? acted.length / committed.length : 0,
    structuralChangeRate: decisions.length > 0 ? structural / decisions.length : 0,
    orgPressureIndex: Math.round(avgPressure),
    redFlags,
  };
}

/**
 * Format portfolio summary for executive consumption.
 */
export function portfolioSummary(portfolio: EnterprisePortfolio): string {
  const lines: string[] = [
    `Organisation: ${portfolio.organisationKey}`,
    `Active decisions: ${portfolio.decisions.length}`,
    `Total monthly exposure: £${portfolio.totalCostExposure.toLocaleString()}`,
    `Decisions in breach: ${portfolio.decisionsInBreach}`,
    `48h action rate: ${Math.round(portfolio.actionRate48h * 100)}%`,
    `Structural change rate: ${Math.round(portfolio.structuralChangeRate * 100)}%`,
    `Org pressure index: ${portfolio.orgPressureIndex}/100`,
  ];

  if (portfolio.redFlags.length > 0) {
    lines.push("", "Red flags:");
    portfolio.redFlags.forEach((f) => lines.push(`  - ${f}`));
  }

  return lines.join("\n");
}
