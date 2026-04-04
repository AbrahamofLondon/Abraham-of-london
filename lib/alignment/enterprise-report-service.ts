// lib/alignment/enterprise-report-service.ts
import {
  getCampaignById,
  getLeadershipGapSnapshot,
  getOrganisationSnapshot,
} from "./enterprise-repository";
import type {
  EnterpriseAlignmentBand,
  EnterpriseOrganisationSnapshotView,
  LeadershipGapView,
} from "./enterprise-types";

type ExecutiveReportData = {
  metadata: {
    generatedAt: string;
    organisationName: string;
    campaignTitle: string;
    auditID: string;
    campaignId: string;
    organisationId: string;
  };
  scores: {
    overall: number;
    band: EnterpriseAlignmentBand;
    dissonanceArea: number;
    fragility: EnterpriseOrganisationSnapshotView["fragilitySignal"];
    confidenceScore: number | null;
    completionRate: number;
  };
  domainPerformance: EnterpriseOrganisationSnapshotView["domainScores"];
  findings: string[];
  strategicGuidance: string;
};

function buildCriticalFindings(params: {
  organisationSnapshot: EnterpriseOrganisationSnapshotView;
  leadershipGap: LeadershipGapView | null;
}): string[] {
  const findings: string[] = [];

  if (params.organisationSnapshot.percentScore < 60) {
    findings.push(
      "STRUCTURAL_DRIFT: Overall alignment is below institutional safety thresholds.",
    );
  }

  if (
    params.leadershipGap &&
    params.leadershipGap.overallGapPercent > 15
  ) {
    findings.push(
      "PERCEPTUAL_DISSONANCE: Significant delta between executive vision and staff execution.",
    );
  }

  if (params.organisationSnapshot.fragilitySignal === "HIGH") {
    findings.push(
      "VOLATILITY_ALERT: High variance across domains suggests localised silos or uneven execution discipline.",
    );
  }

  if (
    (params.organisationSnapshot.confidenceScore ?? 0) > 0 &&
    (params.organisationSnapshot.confidenceScore ?? 0) < 55
  ) {
    findings.push(
      "CONFIDENCE_LIMITATION: Response confidence is modest, so directional judgment should be paired with qualitative review.",
    );
  }

  if (params.organisationSnapshot.completionRate < 50) {
    findings.push(
      "COVERAGE_WARNING: Participation coverage is thin enough to weaken organisation-wide certainty.",
    );
  }

  return findings;
}

function getStrategicGuidance(band: EnterpriseAlignmentBand): string {
  switch (band) {
    case "ALIGNED":
      return "Maintain strategic coherence. Focus on variance reduction, execution discipline, and institutional compounding.";
    case "DRIFTING":
      return "Immediate recalibration is advised. Tighten mandate translation, restore operating discipline, and reduce silent drift between leadership intent and field execution.";
    case "MISALIGNED":
      return "Critical intervention is recommended. Structural incoherence is now affecting performance and decision quality across the estate.";
    case "DISORDERED":
    default:
      return "Foundational repair is required. Restore order, clarify authority, and stabilise the environment before escalation or transformation.";
  }
}

export async function generateExecutiveReportData(
  campaignId: string,
): Promise<ExecutiveReportData> {
  const campaign = await getCampaignById(campaignId);

  if (!campaign) {
    throw new Error("REPORT_FAILURE: Campaign context not found.");
  }

  const organisationSnapshot = await getOrganisationSnapshot(
    campaign.organisationId,
  );

  if (!organisationSnapshot) {
    throw new Error("REPORT_FAILURE: Insufficient data for aggregation.");
  }

  const leadershipGap = await getLeadershipGapSnapshot(campaignId);
  const findings = buildCriticalFindings({
    organisationSnapshot,
    leadershipGap,
  });

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      organisationName: campaign.organisation.name,
      campaignTitle: campaign.title,
      auditID: `OGR-${campaignId.slice(0, 8).toUpperCase()}`,
      campaignId: campaign.id,
      organisationId: campaign.organisationId,
    },
    scores: {
      overall: organisationSnapshot.percentScore,
      band: organisationSnapshot.band,
      dissonanceArea: organisationSnapshot.dissonanceArea,
      fragility: organisationSnapshot.fragilitySignal,
      confidenceScore: organisationSnapshot.confidenceScore ?? null,
      completionRate: organisationSnapshot.completionRate,
    },
    domainPerformance: organisationSnapshot.domainScores,
    findings,
    strategicGuidance: getStrategicGuidance(organisationSnapshot.band),
  };
}