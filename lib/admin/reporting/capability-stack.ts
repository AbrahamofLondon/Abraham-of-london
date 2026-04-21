import { computeBenchmarkPosition, resolveBenchmarkCohort, type BenchmarkFact } from "@/lib/benchmarks/benchmark-engine";
import { resolveClaimSet } from "@/lib/claims/claim-governor";
import { buildEnterpriseSignalBlock, parseManualKpiImport } from "@/lib/integrations/enterprise-ingestion";
import { analyseLongitudinalChange, type DiagnosticSnapshot } from "@/lib/monitoring/longitudinal-engine";
import { buildTrajectoryScenarios, resolveTrajectory } from "@/lib/predictive/trajectory-engine";
import { aggregateTeamSentiment, compareLeaderToTeam, type SentimentResponse } from "@/lib/team/sentiment-aggregation";
import type { TeamAssessmentAggregate } from "@/lib/team/sentiment-aggregation";

function n(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export type CapabilityStackInput = {
  subjectId?: string | null;
  campaignId?: string | null;
  intake: Record<string, unknown>;
  report: Record<string, any>;
  constitution: Record<string, any>;
  ladderContext?: any;
  journeySnapshots?: DiagnosticSnapshot[];
  benchmarkFacts?: BenchmarkFact[];
};

function subjectMetrics(input: CapabilityStackInput) {
  const telemetry = obj(obj(input.report.resonance).telemetry);
  const exposure = obj(input.report.financialExposure);
  return [
    { metric: "averageDissonance", value: n(telemetry.averageDissonance) },
    { metric: "severityScore", value: n(input.constitution.severityScore) },
    { metric: "governanceScore", value: n(input.constitution.governanceScore) },
    { metric: "totalExposure", value: n(exposure.totalExposure) },
  ];
}

function sentimentResponses(input: CapabilityStackInput): SentimentResponse[] {
  const raw = input.intake.teamResponses;
  if (Array.isArray(raw)) return raw as SentimentResponse[];
  const leader = {
    respondentId: "leader_estimate",
    leaderEstimate: true,
    scores: {
      trust: n(input.constitution.authorityScore, 50),
      clarity: n(input.constitution.clarityScore, 50),
      authority: n(input.constitution.authorityScore, 50),
      execution: Math.max(0, 100 - n(input.constitution.severityScore, 50)),
      communication: n(input.constitution.governanceScore, 50),
      strain: Math.max(0, 100 - n(input.constitution.severityScore, 50)),
    },
  } satisfies SentimentResponse;
  return [leader];
}

function teamAssessmentAggregate(input: CapabilityStackInput): TeamAssessmentAggregate | null {
  const raw = input.intake.teamAssessmentAggregate || input.ladderContext?.team?.aggregate;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const aggregate = raw as TeamAssessmentAggregate;
  if (!aggregate.mode || !aggregate.domains) return null;
  return aggregate;
}

function buildTeamRealityFromAggregate(aggregate: TeamAssessmentAggregate) {
  return {
    mode: aggregate.mode,
    respondentCount: aggregate.respondentCount,
    invitedCount: aggregate.invitedCount,
    completionRate: aggregate.completionRate,
    confidence: aggregate.confidence,
    claimLevel: aggregate.claimLevel,
    domains: Object.fromEntries(
      Object.entries(aggregate.domains).map(([domain, value]) => [
        domain,
        {
          leaderScore: value.leaderScore ?? null,
          teamScore: value.teamMean,
          delta: value.deltaFromLeader ?? null,
          variance: value.variance,
        },
      ]),
    ),
  };
}

export function buildExecutiveCapabilityStack(input: CapabilityStackInput) {
  const dimensions = {
    sector: s(input.intake.sector, "unknown"),
    revenueBand: s(input.constitution.revenueBand, s(obj(input.intake.economics).revenueBand)),
    headcountBand: n(obj(input.intake.economics).headcountAffected) >= 250 ? "250_plus" : "under_250",
    geography: s(input.intake.geography, "unknown"),
    maturity: s(input.constitution.readinessTier, "unknown"),
    assessmentType: "executive_reporting",
  };

  const cohort = resolveBenchmarkCohort(dimensions, input.benchmarkFacts || []);
  const benchmark = computeBenchmarkPosition(
    {
      id: input.subjectId || input.campaignId || "current-subject",
      dimensions,
      metrics: subjectMetrics(input),
    },
    cohort,
  );

  const responses = sentimentResponses(input);
  const sentiment = aggregateTeamSentiment(responses);
  const campaignAggregate = teamAssessmentAggregate(input);
  const teamReality = campaignAggregate ? buildTeamRealityFromAggregate(campaignAggregate) : null;
  const leader = responses.find((response) => response.leaderEstimate) || responses[0]!;
  const teamSentimentReality = {
    mode: sentiment.mode,
    respondentDerived: sentiment.mode === "multi_respondent",
    confidence: sentiment.confidence,
    participationCoverage: Math.min(100, sentiment.respondentCount * 20),
    domains: compareLeaderToTeam({ leader, team: sentiment }),
  };

  const journeySnapshots = input.journeySnapshots || [];
  const trajectory = resolveTrajectory({
    snapshots: journeySnapshots.map((snapshot) => ({
      timestamp: snapshot.timestamp,
      escalationLevel: snapshot.escalationLevel,
      severity: snapshot.coreMetrics.severityScore,
      unresolvedTensionCount: snapshot.tensions.length,
    })),
    currentDiagnosticState: s(input.constitution.orgState),
    tensionSeverity: n(input.constitution.severityScore),
    escalationTrend: 0,
    failureDensity: Array.isArray(input.constitution.failureModes)
      ? input.constitution.failureModes.length
      : 0,
    economicsExposure: n(obj(input.report.financialExposure).totalExposure),
  });

  const longitudinal = analyseLongitudinalChange(journeySnapshots);
  const importedSignals = parseManualKpiImport(
    Array.isArray(input.intake.enterpriseSignals)
      ? (input.intake.enterpriseSignals as any[])
      : [],
  );
  const enterpriseSignals = buildEnterpriseSignalBlock(importedSignals);

  const claims = resolveClaimSet({
    benchmarkSampleSize: benchmark.cohort.sampleSize,
    longitudinalDepth: journeySnapshots.length,
    boundedScenarioMode: true,
    teamAssessmentMode: campaignAggregate?.mode,
    respondentCount: campaignAggregate?.respondentCount ?? (sentiment.mode === "multi_respondent" ? sentiment.respondentCount : 0),
    completionRate: campaignAggregate?.completionRate,
    confidence: campaignAggregate?.confidence,
    campaignStatus: campaignAggregate?.status,
    recurringSnapshotCount: journeySnapshots.length,
    importedSignalCount: importedSignals.length,
  });

  return {
    claims,
    blocks: {
      benchmarkPosition: claims.benchmarked.allowed ? benchmark : { ...benchmark, available: false },
      teamReality:
        teamReality ||
        {
          mode: "leader_estimate" as const,
          confidence: teamSentimentReality.confidence / 100,
          domains: Object.fromEntries(
            teamSentimentReality.domains.map((domain) => [
              domain.domain,
              {
                leaderScore: domain.leaderScore,
                teamScore: domain.teamAggregateScore,
                delta: domain.variance,
                variance: null,
              },
            ]),
          ),
          claimLevel: "leader_view" as const,
        },
      teamSentimentReality:
        claims["team-wide sentiment"].allowed || sentiment.mode === "leader_estimate"
          ? teamSentimentReality
          : undefined,
      trajectoryOutlook: claims.predictive.allowed
        ? { ...trajectory, scenarios: buildTrajectoryScenarios(trajectory) }
        : undefined,
      longitudinalMonitoring: claims.monitoring.allowed
        ? {
            available: true,
            snapshotCount: journeySnapshots.length,
            classification: longitudinal.classification,
            metricChanges: longitudinal.metricChanges,
            persistentTensions: longitudinal.tensionPersistence,
            escalationMovement: longitudinal.escalationMovement,
            monitoringCadence: "monthly" as const,
          }
        : {
            available: false,
            snapshotCount: journeySnapshots.length,
            classification: "insufficient" as const,
            metricChanges: longitudinal.metricChanges,
            persistentTensions: longitudinal.tensionPersistence,
            escalationMovement: longitudinal.escalationMovement,
          },
      enterpriseSignals: enterpriseSignals.integrated ? enterpriseSignals : undefined,
      monitoringRecommendation: {
        recommended: true,
        cadence: n(input.constitution.severityScore) >= 65 ? "monthly" as const : "quarterly" as const,
        rationale: [
          "Monitoring cadence is derived from severity, unresolved tension, and available longitudinal depth.",
        ],
      },
    },
  };
}
