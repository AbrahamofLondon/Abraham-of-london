import { getEnterpriseDashboardView } from "./enterprise-repository";
import { ENTERPRISE_ALIGNMENT_DOMAIN_ORDER } from "./enterprise-types";

export async function generateExecutiveReportData(campaignId: string) {
  const dashboard = await getEnterpriseDashboardView(campaignId);
  if (!dashboard || !dashboard.organisationSnapshot) {
    throw new Error("REPORT_FAILURE: Insufficient data for aggregation.");
  }

  const { organisation, campaign, organisationSnapshot, leadershipGap } = dashboard;

  // Analysis Logic for the Board
  const criticalFindings = [];

  if (organisationSnapshot.percentScore < 60) {
    criticalFindings.push("STRUCTURAL_DRIFT: Overall alignment is below institutional safety thresholds.");
  }

  if (leadershipGap && leadershipGap.overallGapPercent > 15) {
    criticalFindings.push("PERCEPTUAL_DISSONANCE: Significant delta between Executive vision and Staff execution.");
  }

  if (organisationSnapshot.fragilitySignal === "HIGH") {
    criticalFindings.push("VOLATILITY_ALERT: High variance in domain scores suggests localized cultural silos.");
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      organisationName: organisation.name,
      campaignTitle: campaign.title,
      auditID: `OGR-${campaignId.slice(0, 8).toUpperCase()}`,
    },
    scores: {
      overall: organisationSnapshot.percentScore,
      band: organisationSnapshot.band,
      dissonanceArea: organisationSnapshot.dissonanceArea,
      fragility: organisationSnapshot.fragilitySignal,
    },
    domainPerformance: organisationSnapshot.domainScores,
    findings: criticalFindings,
    strategicGuidance: getStrategicGuidance(organisationSnapshot.band),
  };
}

function getStrategicGuidance(band: string): string {
  switch (band) {
    case "SOVEREIGN":
      return "Maintain current velocity. Focus on institutional legacy and market expansion.";
    case "ALIGNED":
      return "Optimize sub-domain variances. Ensure middle-management remains tethered to core objectives.";
    case "DRIFTING":
      return "IMMEDIATE ACTION: Re-calibrate internal communications. Address the 'Integration Tax' in core operations.";
    case "MISALIGNED":
      return "CRITICAL INTERVENTION: Full structural audit recommended. Operational silos are actively eroding value.";
    default:
      return "Await further data for strategic determination.";
  }
}