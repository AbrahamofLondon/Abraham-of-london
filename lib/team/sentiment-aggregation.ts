export type SentimentDomain =
  | "trust"
  | "clarity"
  | "authority"
  | "execution"
  | "communication"
  | "strain";

export type TeamAssessmentMode = "leader_estimate" | "multi_respondent";

export type TeamAssessmentDomain =
  | "direction_priority"
  | "execution_integrity"
  | "trust_communication"
  | "authority_escalation";

export type TeamAssessmentCampaignStatus = "draft" | "live" | "closed" | "archived";

export type TeamAssessmentResponseInput = {
  respondentKey: string;
  answers: Record<string, number>;
};

export type TeamAssessmentAggregate = {
  campaignId: string;
  mode: TeamAssessmentMode;
  status?: TeamAssessmentCampaignStatus;
  respondentCount: number;
  invitedCount: number;
  completionRate: number;
  confidence: number;
  minimumResponseThreshold: number;
  claimLevel: "leader_view" | "directional_team_signal" | "team_wide_sentiment";
  domains: Record<
    string,
    {
      leaderScore?: number | null;
      teamMean: number;
      variance: number;
      spread: number;
      disagreementDensity: number;
      deltaFromLeader?: number | null;
      respondentCount: number;
    }
  >;
};

export const TEAM_ASSESSMENT_DOMAINS: TeamAssessmentDomain[] = [
  "direction_priority",
  "execution_integrity",
  "trust_communication",
  "authority_escalation",
];

export type SentimentResponse = {
  respondentId: string;
  teamName?: string | null;
  leaderEstimate?: boolean;
  scores: Partial<Record<SentimentDomain, number>>;
};

export type SentimentDomainAggregate = {
  domain: SentimentDomain;
  aggregateMean: number;
  distribution: Record<string, number>;
  polarity: "positive" | "mixed" | "negative";
  spread: number;
  confidence: number;
  anomalyFlag: boolean;
  disagreementDensity: number;
  respondentCount: number;
};

export type SentimentAggregation = {
  mode: "leader_estimate" | "multi_respondent";
  respondentCount: number;
  confidence: number;
  domains: SentimentDomainAggregate[];
};

const DOMAINS: SentimentDomain[] = [
  "trust",
  "clarity",
  "authority",
  "execution",
  "communication",
  "strain",
];

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return mean(values.map((value) => (value - avg) ** 2));
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function domainValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return clamp(value, 0, 100);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return clamp(parsed, 0, 100);
  }
  return null;
}

function bucket(value: number): string {
  if (value >= 75) return "positive";
  if (value >= 45) return "mixed";
  return "negative";
}

export function aggregateTeamResponses(input: {
  campaignId: string;
  mode: TeamAssessmentMode;
  status?: TeamAssessmentCampaignStatus;
  responses: TeamAssessmentResponseInput[];
  invitedCount: number;
  minimumResponseThreshold?: number;
  leaderEstimate?: Record<string, number | null | undefined> | null;
  domains?: string[];
}): TeamAssessmentAggregate {
  const domains = input.domains?.length ? input.domains : TEAM_ASSESSMENT_DOMAINS;
  const respondentCount = input.responses.length;
  const invitedCount = Math.max(input.invitedCount, respondentCount);
  const minimumResponseThreshold = Math.max(1, input.minimumResponseThreshold ?? 3);
  const completionRate = invitedCount > 0 ? respondentCount / invitedCount : 0;
  const domainResults: TeamAssessmentAggregate["domains"] = {};

  let spreadTotal = 0;

  for (const domain of domains) {
    const values = input.responses
      .map((response) => domainValue(response.answers[domain]))
      .filter((value): value is number => value !== null);
    const teamMean = values.length ? Math.round(mean(values)) : 0;
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    const spread = Math.round(max - min);
    const domainVariance = Math.round(variance(values));
    const leaderScore = domainValue(input.leaderEstimate?.[domain]) ?? null;
    spreadTotal += spread;

    domainResults[domain] = {
      leaderScore,
      teamMean,
      variance: domainVariance,
      spread,
      disagreementDensity: values.length > 1 ? clamp(Math.round(spread * 1.2 + domainVariance / 12), 0, 100) : 0,
      deltaFromLeader: leaderScore === null ? null : Math.round(teamMean - leaderScore),
      respondentCount: values.length,
    };
  }

  const averageSpread = domains.length ? spreadTotal / domains.length : 0;
  const thresholdFactor = Math.min(1, respondentCount / minimumResponseThreshold);
  const countFactor = Math.min(1, respondentCount / Math.max(minimumResponseThreshold, 8));
  const completionFactor = Math.min(1, completionRate);
  const spreadPenalty = Math.min(0.35, averageSpread / 220);
  const confidence = clamp(
    Number((0.18 + thresholdFactor * 0.30 + countFactor * 0.24 + completionFactor * 0.28 - spreadPenalty).toFixed(2)),
    0.05,
    0.95,
  );

  const claimLevel =
    input.mode === "multi_respondent" &&
    respondentCount >= minimumResponseThreshold &&
    completionRate >= 0.5 &&
    confidence >= 0.6 &&
    (input.status === "closed" || input.status === "archived")
      ? "team_wide_sentiment"
      : input.mode === "multi_respondent" && respondentCount > 0
        ? "directional_team_signal"
        : "leader_view";

  return {
    campaignId: input.campaignId,
    mode: input.mode,
    status: input.status,
    respondentCount,
    invitedCount,
    completionRate: Number(completionRate.toFixed(2)),
    confidence,
    minimumResponseThreshold,
    claimLevel,
    domains: domainResults,
  };
}

export function aggregateTeamSentiment(
  responses: SentimentResponse[],
): SentimentAggregation {
  const realResponses = responses.filter((response) => !response.leaderEstimate);
  const respondentSource = realResponses.length ? realResponses : responses;
  const mode = realResponses.length >= 3 ? "multi_respondent" : "leader_estimate";

  const domains = DOMAINS.map((domain) => {
    const values = respondentSource
      .map((response) => response.scores[domain])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const aggregateMean = Math.round(mean(values));
    const spread = Math.round(stddev(values));
    const distribution = values.reduce<Record<string, number>>((acc, value) => {
      const key = bucket(value);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const disagreementDensity = values.length > 1 ? Math.min(100, Math.round(spread * 2)) : 0;

    return {
      domain,
      aggregateMean,
      distribution,
      polarity: bucket(aggregateMean) as "positive" | "mixed" | "negative",
      spread,
      confidence: Math.min(95, Math.round(30 + values.length * 12 - spread * 0.4)),
      anomalyFlag: spread >= 25 || aggregateMean < 35,
      disagreementDensity,
      respondentCount: values.length,
    };
  });

  return {
    mode,
    respondentCount: respondentSource.length,
    confidence: Math.min(95, Math.round(25 + respondentSource.length * 12)),
    domains,
  };
}

export function compareLeaderToTeam(input: {
  leader: SentimentResponse;
  team: SentimentAggregation;
}) {
  return input.team.domains.map((domain) => {
    const leaderScore = input.leader.scores[domain.domain] ?? null;
    return {
      domain: domain.domain,
      leaderScore,
      teamAggregateScore: domain.aggregateMean,
      variance:
        typeof leaderScore === "number"
          ? Math.round(leaderScore - domain.aggregateMean)
          : 0,
      confidence: domain.confidence,
      respondentCount: domain.respondentCount,
      distribution: domain.distribution,
      polarity: domain.polarity,
      anomalyFlag: domain.anomalyFlag,
      disagreementDensity: domain.disagreementDensity,
    };
  });
}
