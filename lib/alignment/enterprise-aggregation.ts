// lib/alignment/enterprise-aggregation.ts
import {
  ENTERPRISE_ALIGNMENT_DOMAIN_ORDER,
  type EnterpriseAlignmentBand,
  type EnterpriseAlignmentDomain,
  type EnterpriseDomainScore,
  type EnterpriseVarianceScore,
  type FragilitySignal,
} from "./enterprise-types";
import {
  getCampaignById,
  loadCampaignAssessments,
  replaceLeadershipGapSnapshot,
  replaceOrganisationSnapshot,
  replaceTeamSnapshots,
} from "./enterprise-repository";
import { determineEnterpriseBand } from "./enterprise-score";
import { isCohortSafe } from "./anonymity-service";

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

/**
 * Response confidence using response rate and margin of error.
 */
function computeConfidenceScore(respondents: number, invited: number): number {
  if (invited <= 0 || respondents <= 0) return 0;

  const responseRate = respondents / invited;
  const finitePopulationFactor =
    invited > 1
      ? Math.sqrt(Math.max(0, (invited - respondents) / (invited - 1)))
      : 1;

  const standardError = Math.sqrt(0.25 / respondents) * finitePopulationFactor;
  const marginOfError = 1.96 * standardError;

  const baseConfidence = Math.max(0, 100 - marginOfError * 100);
  return clamp(baseConfidence * 0.7 + responseRate * 30, 0, 100);
}

function computeVariance(values: number[]): number {
  if (!values || values.length <= 1) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((value) => (value - avg) ** 2);
  return round(Math.sqrt(mean(squaredDiffs)));
}

function computePolygonArea(scores: number[]): number {
  const numPoints = scores.length;
  if (numPoints < 3) return 0;

  const angleStep = (2 * Math.PI) / numPoints;
  let area = 0;

  for (let i = 0; i < numPoints; i++) {
    const r1 = scores[i] ?? 0;
    const r2 = scores[(i + 1) % numPoints] ?? 0;
    area += 0.5 * r1 * r2 * Math.sin(angleStep);
  }

  return round(area);
}

/* -----------------------------------------------------------------------------
   INTERPRETATION LAYER
----------------------------------------------------------------------------- */

function bandFromPercent(percent: number): EnterpriseAlignmentBand {
  return determineEnterpriseBand(percent);
}

function getTopDomains(
  domainScores: EnterpriseDomainScore[],
  count: number,
  ascending: boolean,
): EnterpriseAlignmentDomain[] {
  return [...domainScores]
    .sort((a, b) => {
      if (a.percent !== b.percent) {
        return ascending ? a.percent - b.percent : b.percent - a.percent;
      }
      return String(a.domain).localeCompare(String(b.domain));
    })
    .slice(0, count)
    .map((item) => item.domain);
}

function computeDomainAggregates(
  assessments: Array<{
    domainScoresJson: unknown;
    percentScore: number;
  }>,
): {
  domainScores: EnterpriseDomainScore[];
  varianceScores: EnterpriseVarianceScore[];
} {
  const domainScores = ENTERPRISE_ALIGNMENT_DOMAIN_ORDER.map((domain) => {
    const domainValues = assessments.map((assessment) => {
      const scores = (assessment.domainScoresJson as EnterpriseDomainScore[]) || [];
      return scores.find((score) => score.domain === domain)?.percent ?? 0;
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
    const domainValues = assessments.map((assessment) => {
      const scores = (assessment.domainScoresJson as EnterpriseDomainScore[]) || [];
      return scores.find((score) => score.domain === domain)?.percent ?? 0;
    });

    return {
      domain,
      variance: computeVariance(domainValues),
    } satisfies EnterpriseVarianceScore;
  });

  return { domainScores, varianceScores };
}

function computeFragilitySignal(params: {
  percentScore: number;
  overallGapPercent: number;
  varianceScores: EnterpriseVarianceScore[];
}): FragilitySignal {
  const highVarianceCount = params.varianceScores.filter(
    (value) => value.variance >= 20,
  ).length;

  if (params.percentScore < 55 && params.overallGapPercent > 15) return "HIGH";
  if (params.percentScore < 65 || highVarianceCount >= 2) return "MEDIUM";
  return "LOW";
}

/* -----------------------------------------------------------------------------
   MAIN AGGREGATION ORCHESTRATOR
----------------------------------------------------------------------------- */

export async function aggregateEnterpriseCampaign(campaignId: string) {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) throw new Error("Campaign context missing from registry.");

  const assessments = await loadCampaignAssessments(campaignId);
  const invitedCount = campaign.participants.length;
  const respondentCount = assessments.length;

  if (!respondentCount) {
    await replaceTeamSnapshots(campaignId, []);
    return {
      ok: true,
      respondentCount: 0,
      invitedCount,
      confidenceScore: 0,
      fragilitySignal: "LOW" as FragilitySignal,
      dissonanceArea: 0,
    };
  }

  const { domainScores, varianceScores } = computeDomainAggregates(assessments);
  const orgTotalPercent = round(mean(assessments.map((a: any) => a.percentScore)));

  const confidenceScore = computeConfidenceScore(respondentCount, invitedCount);
  const dissonanceArea = computePolygonArea(
    varianceScores.map((value) => value.variance),
  );

  const execs = assessments.filter((assessment: any) => assessment.isExecutive);
  const staff = assessments.filter((assessment: any) => !assessment.isExecutive);

  const gapValues = ENTERPRISE_ALIGNMENT_DOMAIN_ORDER.map((domain) => {
    const getDomainAvg = (
      list: Array<{ domainScoresJson: unknown; percentScore: number }>,
    ) => {
      if (list.length === 0) return orgTotalPercent;

      const values = list.map((assessment) => {
        const scores = (assessment.domainScoresJson as EnterpriseDomainScore[]) || [];
        return scores.find((score) => score.domain === domain)?.percent ?? 0;
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

  const overallGapPercent = round(
    mean(gapValues.map((value) => Math.abs(value.delta))),
  );

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
    completionRate:
      invitedCount > 0 ? round((respondentCount / invitedCount) * 100) : 0,
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
    confidenceScore,
  });

  await replaceLeadershipGapSnapshot({
    campaignId,
    organisationId: campaign.organisationId,
    overallGapPercent,
    domainGaps: gapValues,
    interpretationFlags:
      overallGapPercent >= 15 ? ["CRITICAL: Perceptual Drift Detected"] : [],
  });

  type AssessmentEntry = { domainScoresJson: unknown; percentScore: number };
  const teamMap = (assessments as AssessmentEntry[]).reduce((acc: Record<string, AssessmentEntry[]>, current: AssessmentEntry) => {
    const team = (current as any).teamName || "General Operations";
    if (!acc[team]) acc[team] = [];
    acc[team].push(current);
    return acc;
  }, {} as Record<string, AssessmentEntry[]>);

  const teamSnapshots = Object.entries(teamMap)
    .filter(([, teamAssessments]) => isCohortSafe(teamAssessments.length))
    .map(([teamName, teamAssessments]) => {
      const {
        domainScores: teamDomainScores,
        varianceScores: teamVarianceScores,
      } = computeDomainAggregates(teamAssessments);

      const teamPercent = round(mean(teamAssessments.map((a: AssessmentEntry) => a.percentScore)));

      return {
        organisationId: campaign.organisationId,
        teamName,
        respondentCount: teamAssessments.length,
        totalScore: teamPercent,
        possibleScore: 100,
        percentScore: teamPercent,
        band: bandFromPercent(teamPercent),
        weakestDomains: getTopDomains(teamDomainScores, 2, true),
        strongestDomains: getTopDomains(teamDomainScores, 2, false),
        domainScores: teamDomainScores,
        varianceScores: teamVarianceScores,
      };
    });

  await replaceTeamSnapshots(campaignId, teamSnapshots);

  return {
    ok: true,
    respondentCount,
    invitedCount,
    confidenceScore,
    fragilitySignal,
    dissonanceArea,
  };
}