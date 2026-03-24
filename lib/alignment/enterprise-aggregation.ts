import {
  ENTERPRISE_ALIGNMENT_DOMAIN_ORDER,
  type EnterpriseAlignmentBand,
  type EnterpriseAlignmentDomain,
  type EnterpriseDomainScore,
} from "./enterprise-types";
import {
  getCampaignById,
  loadCampaignAssessments,
  replaceLeadershipGapSnapshot,
  replaceOrganisationSnapshot,
  replaceTeamSnapshots,
} from "./enterprise-repository";

/* -----------------------------------------------------------------------------
   MATHEMATICAL & STATISTICAL UTILITIES
----------------------------------------------------------------------------- */

function mean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value);
}

/**
 * Uses a 95% confidence interval + Response Rate weighting.
 */
function computeConfidenceScore(respondents: number, invited: number): number {
  if (invited <= 0 || respondents <= 0) return 0;
  
  const responseRate = respondents / invited;
  // Standard Error for finite populations (N=invited, n=respondents)
  const standardError = Math.sqrt((0.25) / respondents) * Math.sqrt(Math.max(0, (invited - respondents) / (invited - 1 || 1)));
  const marginOfError = 1.96 * standardError;
  
  // Inverse relationship: High MoE = Low Confidence
  const baseConfidence = Math.max(0, 100 - (marginOfError * 100)); 
  return round((baseConfidence * 0.7) + (responseRate * 30));
}

function computeVariance(values: number[]): number {
  if (!values || values.length <= 1) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((value) => (value - avg) ** 2);
  return round(Math.sqrt(mean(squaredDiffs)));
}

/**
 * Geometric Dissonance: Shoelace formula for polygon area.
 * Interprets variance as 'volatility' radii on a radar chart.
 */
function computePolygonArea(scores: number[]): number {
  const numPoints = scores.length;
  if (numPoints < 3) return 0;

  const angleStep = (2 * Math.PI) / numPoints;
  let area = 0;

  for (let i = 0; i < numPoints; i++) {
    const r1 = scores[i];
    const r2 = scores[(i + 1) % numPoints];
    area += 0.5 * r1 * r2 * Math.sin(angleStep);
  }

  return round(area);
}

/* -----------------------------------------------------------------------------
   BRAND LOGIC & INTERPRETATION
----------------------------------------------------------------------------- */

function bandFromPercent(percent: number): EnterpriseAlignmentBand {
  if (percent >= 85) return "SOVEREIGN"; // Updated to match your brand tiers
  if (percent >= 70) return "ALIGNED";
  if (percent >= 50) return "DRIFTING";
  return "MISALIGNED";
}

function getTopDomains(domainScores: EnterpriseDomainScore[], count: number, ascending: boolean): EnterpriseAlignmentDomain[] {
  return [...domainScores]
    .sort((a, b) => ascending ? a.percent - b.percent : b.percent - a.percent)
    .slice(0, count)
    .map((item) => item.domain);
}

function computeDomainAggregates(assessments: any[]) {
  const domainScores = ENTERPRISE_ALIGNMENT_DOMAIN_ORDER.map((domain) => {
    const domainValues = assessments.map((a) => {
      const scores = (a.domainScoresJson as EnterpriseDomainScore[]) || [];
      return scores.find((s) => s.domain === domain)?.percent ?? 0;
    });

    const percent = round(mean(domainValues));

    return {
      domain,
      earned: percent,
      possible: 100,
      percent,
    } satisfies EnterpriseDomainScore;
  });

  const varianceScores = ENTERPRISE_ALIGNMENT_DOMAIN_ORDER.map((domain) => {
    const domainValues = assessments.map((a) => {
      const scores = (a.domainScoresJson as EnterpriseDomainScore[]) || [];
      return scores.find((s) => s.domain === domain)?.percent ?? 0;
    });

    return {
      domain,
      variance: computeVariance(domainValues),
    };
  });

  return { domainScores, varianceScores };
}

function computeFragilitySignal(params: {
  percentScore: number;
  overallGapPercent: number;
  varianceScores: Array<{ variance: number }>;
}): "HIGH" | "MEDIUM" | "LOW" {
  const highVarianceCount = params.varianceScores.filter((v) => v.variance >= 20).length;

  if (params.percentScore < 55 && params.overallGapPercent > 15) return "HIGH";
  if (params.percentScore < 65 || highVarianceCount >= 2) return "MEDIUM";
  return "LOW";
}

/* -----------------------------------------------------------------------------
   MAIN AGGREGATION ORCHESTRATOR
----------------------------------------------------------------------------- */

export async function aggregateEnterpriseCampaign(campaignId: string) {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) throw new Error("Campaign context missing from Registry.");

  const assessments = await loadCampaignAssessments(campaignId);
  const invitedCount = campaign.participants.length;
  const respondentCount = assessments.length;

  // Handle zero-data state to prevent math errors
  if (!respondentCount) {
    await replaceTeamSnapshots(campaignId, []);
    return { ok: true, respondentCount: 0, invitedCount };
  }

  // 1. Core Organisational Aggregates
  const { domainScores, varianceScores } = computeDomainAggregates(assessments);
  const orgTotalPercent = round(mean(assessments.map((a) => a.percentScore)));
  
  // 2. Intelligence Metrics
  const confidenceScore = computeConfidenceScore(respondentCount, invitedCount);
  const dissonanceArea = computePolygonArea(varianceScores.map(v => v.variance));

  // 3. Leadership Gap Architecture (Delta between Executive and Non-Executive)
  const execs = assessments.filter((a) => a.isExecutive);
  const staff = assessments.filter((a) => !a.isExecutive);

  const gapValues = ENTERPRISE_ALIGNMENT_DOMAIN_ORDER.map((domain) => {
    const getDomainAvg = (list: any[]) => {
      if (list.length === 0) return orgTotalPercent;
      const values = list.map(a => {
        const scores = (a.domainScoresJson as EnterpriseDomainScore[]) || [];
        return scores.find(s => s.domain === domain)?.percent ?? 0;
      });
      return round(mean(values));
    };

    const executivePercent = getDomainAvg(execs);
    const nonExecutivePercent = getDomainAvg(staff);

    return {
      domain,
      executivePercent,
      nonExecutivePercent,
      delta: executivePercent - nonExecutivePercent,
    };
  });

  const overallGapPercent = round(mean(gapValues.map((v) => Math.abs(v.delta))));

  // 4. Persistence: Organisation Snapshot
  const fragilitySignal = computeFragilitySignal({
    percentScore: orgTotalPercent,
    overallGapPercent,
    varianceScores,
  });

  await replaceOrganisationSnapshot({
    campaignId,
    organisationId: campaign.organisationId,
    respondentCount,
    invitedCount,
    completionRate: invitedCount > 0 ? round((respondentCount / invitedCount) * 100) : 0,
    totalScore: orgTotalPercent,
    possibleScore: 100,
    percentScore: orgTotalPercent,
    band: bandFromPercent(orgTotalPercent),
    weakestDomains: getTopDomains(domainScores, 2, true),
    strongestDomains: getTopDomains(domainScores, 2, false),
    domainScores,
    varianceScores,
    fragilitySignal,
    dissonanceArea,
  });

  // 5. Persistence: Leadership Gap
  await replaceLeadershipGapSnapshot({
    campaignId,
    organisationId: campaign.organisationId,
    overallGapPercent,
    domainGaps: gapValues,
    interpretationFlags: overallGapPercent >= 15 ? ["CRITICAL: Perceptual Drift Detected"] : [],
  });

  // 6. Persistence: Team Segmentation
  const teamMap = assessments.reduce((acc, curr) => {
    const team = curr.teamName || "General Operations";
    if (!acc[team]) acc[team] = [];
    acc[team].push(curr);
    return acc;
  }, {} as Record<string, typeof assessments>);

  const teamSnapshots = Object.entries(teamMap).map(([teamName, teamAssessments]) => {
    const { domainScores: tDS, varianceScores: tVS } = computeDomainAggregates(teamAssessments);
    const tPercent = round(mean(teamAssessments.map((a) => a.percentScore)));

    return {
      organisationId: campaign.organisationId,
      teamName,
      respondentCount: teamAssessments.length,
      totalScore: tPercent,
      possibleScore: 100,
      percentScore: tPercent,
      band: bandFromPercent(tPercent),
      weakestDomains: getTopDomains(tDS, 2, true),
      strongestDomains: getTopDomains(tDS, 2, false),
      domainScores: tDS,
      varianceScores: tVS,
    };
  });

  await replaceTeamSnapshots(campaignId, teamSnapshots);

  return {
    ok: true,
    respondentCount,
    invitedCount,
    confidenceScore,
    fragilitySignal,
    dissonanceArea
  };
}