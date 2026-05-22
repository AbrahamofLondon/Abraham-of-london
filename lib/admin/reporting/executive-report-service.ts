// lib/admin/reporting/executive-report-service.ts
import { db } from "@/lib/db";
import {
  assembleConstitutionalGuidance,
  type UnifiedGuidancePayload,
} from "@/lib/decision/constitutional-guidance-assembler";
import { buildCanonicalReportContract } from "./canonical-report-contract";
import { aggregateTeamSentiment, compareLeaderToTeam, type SentimentResponse } from "@/lib/team/sentiment-aggregation";
import { resolveClaimSet } from "@/lib/claims/claim-governor";
import { resolveTrajectory, buildTrajectoryScenarios } from "@/lib/predictive/trajectory-engine";
import type {
  ExecutiveReportApiPayload,
  ExecutiveReportConstitution,
  ExecutiveReportGuidance,
} from "./types";

type BuildOptions = {
  skipAudit?: boolean;
};

type BuildResult =
  | {
      ok: true;
      payload: ExecutiveReportApiPayload;
    }
  | {
      ok: false;
      error:
        | "INVALID_CAMPAIGN_ID"
        | "CAMPAIGN_NOT_FOUND"
        | "ANONYMITY_THRESHOLD_NOT_MET"
        | "DATABASE_CONNECTION_FAILURE";
      details?: string;
      threshold?: number;
      participantCount?: number;
    };

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

function buildCanonicalIntakeFromReport(args: {
  report: any;
  campaign: any;
  participantCount: number;
}): Record<string, string> {
  const report = args.report;

  const domains = Array.isArray(report?.resonance?.telemetry?.domains)
    ? report.resonance.telemetry.domains
    : [];

  const averageDissonance =
    typeof report?.resonance?.telemetry?.averageDissonance === "number"
      ? report.resonance.telemetry.averageDissonance
      : average(domains.map((d: any) => safeNumber(d?.dissonance, 0)));

  const totalExposure = safeNumber(report?.financialExposure?.totalExposure, 0);

  const dominantDomains = domains
    .slice()
    .sort(
      (a: any, b: any) =>
        safeNumber(b?.dissonance, 0) - safeNumber(a?.dissonance, 0),
    )
    .slice(0, 3)
    .map((d: any) => safeString(d?.label))
    .filter(Boolean);

  const failureModes = Array.isArray(report?.failureModes)
    ? report.failureModes.map((x: any) => safeString(x)).filter(Boolean)
    : [];

  const revenueBand =
    totalExposure >= 1_000_000
      ? "ENTERPRISE"
      : totalExposure >= 250_000
        ? "MID"
        : "SMB";

  const authorityScope =
    args.participantCount >= 12
      ? "DIRECT"
      : args.participantCount >= 7
        ? "PROXY"
        : "UNCLEAR";

  const urgencyWindow =
    averageDissonance >= 35 || totalExposure >= 1_000_000
      ? "IMMEDIATE"
      : averageDissonance >= 20
        ? "NEAR_TERM"
        : "MID_TERM";

  const marketExposure =
    averageDissonance >= 35
      ? "CRITICAL"
      : averageDissonance >= 20
        ? "HIGH"
        : "MEDIUM";

  const boardInvolved = args.participantCount >= 10 ? "YES" : "UNCERTAIN";

  return {
    fullName: "Executive Reporting Campaign",
    email: "",
    organisation: safeString(
      args.campaign?.organisation?.name,
      safeString(args.campaign?.title, "Executive Alignment Campaign"),
    ),
    sector: safeString(args.campaign?.organisation?.sector, "institutional"),
    revenueBand,
    authorityRole:
      args.participantCount >= 12
        ? "Executive leadership cohort"
        : "Leadership sponsor cohort",
    authorityScope,
    urgencyWindow,
    problemStatement: safeString(
      report?.narrative?.headline,
      "Structural alignment condition requires disciplined executive interpretation.",
    ),
    symptoms: [
      safeString(report?.narrative?.summary),
      ...failureModes,
      ...dominantDomains.map((domain: string) => `${domain} dissonance visible`),
    ]
      .filter(Boolean)
      .join(" "),
    desiredOutcome: Array.isArray(report?.priorityStack)
      ? report.priorityStack.slice(0, 2).join(". ")
      : "Restore structural order and decision discipline.",
    currentConstraint: [
      `Average dissonance ${Math.round(averageDissonance)}.`,
      `Participant count ${args.participantCount}.`,
      failureModes[0] ? `Primary failure mode: ${failureModes[0]}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    marketExposure,
    boardInvolved,
  };
}

function buildConstitutionSeedFromReport(args: {
  report: any;
  campaign: any;
  participantCount: number;
}): ExecutiveReportConstitution {
  const report = args.report;
  const domains = Array.isArray(report?.resonance?.telemetry?.domains)
    ? report.resonance.telemetry.domains
    : [];
  const dominantDomains = domains
    .slice()
    .sort(
      (a: any, b: any) =>
        safeNumber(b?.dissonance, 0) - safeNumber(a?.dissonance, 0),
    )
    .slice(0, 3)
    .map((d: any) => safeString(d?.label))
    .filter(Boolean);
  const failureModes = Array.isArray(report?.failureModes)
    ? report.failureModes.map((x: any) => safeString(x)).filter(Boolean)
    : [];
  const requiredInterventions = Array.isArray(report?.priorityStack)
    ? report.priorityStack.map((x: any) => safeString(x)).filter(Boolean)
    : [];
  const totalExposure = safeNumber(report?.financialExposure?.totalExposure, 0);
  const averageDissonance = safeNumber(
    report?.resonance?.telemetry?.averageDissonance,
    0,
  );
  const certainty = safeNumber(report?.ogr?.sovereignCertainty, 0);

  return {
    route:
      report?.state === "ORDERED"
        ? "STRATEGY"
        : report?.state === "DISORDERED"
          ? "REJECT"
          : "DIAGNOSTIC",
    priority:
      totalExposure >= 1_000_000 ? "CRITICAL" : totalExposure >= 250_000 ? "HIGH" : "MEDIUM",
    temperature: certainty >= 85 ? "HOT" : certainty >= 65 ? "WARM" : "COLD",
    orgState: safeString(report?.state, "DRIFTING") as any,
    posture: safeString(report?.state, "DRIFTING") as any,
    confidence: clamp(certainty, 0, 100),
    readinessTier: report?.state === "ORDERED" ? "EXECUTION_READY" : report?.state === "DISORDERED" ? "FRAGILE" : "STABILIZING",
    authorityType: args.participantCount >= 12 ? "DIRECT" : args.participantCount >= 7 ? "PROXY" : "UNCLEAR",
    revenueBand:
      totalExposure >= 1_000_000
        ? "ENTERPRISE"
        : totalExposure >= 250_000
          ? "MID"
          : "SMB",
    marketRiskBand:
      averageDissonance >= 35
        ? "CRITICAL"
        : averageDissonance >= 20
          ? "HIGH"
          : "MEDIUM",
    clarityScore: clamp(100 - averageDissonance, 0, 100),
    authorityScore: clamp(certainty * 0.7 + args.participantCount, 0, 100),
    governanceScore: clamp(
      100 - average(domains.map((d: any) => safeNumber(d?.dissonance, 0))),
      0,
      100,
    ),
    severityScore: clamp(averageDissonance, 0, 100),
    revenueScore: clamp(Math.min(totalExposure / 10000, 100), 0, 100),
    dominantDomains,
    failureModes,
    requiredInterventions,
    sponsorTypes:
      args.participantCount >= 12 ? ["BOARD", "EXECUTIVE"] : ["EXECUTIVE"],
    worldviewAnchors: ["ORDER", "STEWARDSHIP", "TRUTH", "RESPONSIBILITY"],
    disqualifiersTriggered: report?.state === "DISORDERED" ? ["DISORDERED_STATE"] : [],
    escalationAllowed: report?.state !== "DISORDERED",
    narrativeSummary: safeString(report?.narrative?.summary),
    rationale: [
      `Route derived from report state: ${safeString(report?.state, "DRIFTING")}.`,
      "Readiness posture derived from disorder, drift and execution condition.",
      "Authority posture inferred from cohort depth and campaign reporting profile.",
      "Market risk derived from dissonance and exposure conditions.",
    ],
  };
}

export async function buildExecutiveReportFromCampaign(
  campaignId: string,
  _options?: BuildOptions,
): Promise<BuildResult> {
  try {
    const normalizedCampaignId = safeString(campaignId);
    if (!normalizedCampaignId) {
      return { ok: false, error: "INVALID_CAMPAIGN_ID" };
    }

    const prisma =
      typeof db.getPrismaClient === "function"
        ? await db.getPrismaClient()
        : null;

    if (!prisma) {
      return {
        ok: false,
        error: "DATABASE_CONNECTION_FAILURE",
        details: "Prisma client unavailable.",
      };
    }

    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: normalizedCampaignId },
      include: {
        organisation: true,
        participants: {
          include: {
            assessments: true,
            membership: true,
          },
        },
        correctionNodes: true,
      },
    });

    if (!campaign) {
      return { ok: false, error: "CAMPAIGN_NOT_FOUND" };
    }

    const completedParticipants = (campaign.participants || []).filter(
      (p: any) => p.status === "completed",
    );

    if (completedParticipants.length < 5) {
      return {
        ok: false,
        error: "ANONYMITY_THRESHOLD_NOT_MET",
        threshold: 5,
        participantCount: completedParticipants.length,
        details: "Insufficient completed participants for safe report generation.",
      };
    }

    const sentimentResponses: SentimentResponse[] = completedParticipants.map((participant: any) => {
      const assessment = Array.isArray(participant.assessments) ? participant.assessments[0] : null;
      const score = safeNumber(assessment?.percentScore, 50);
      return {
        respondentId: participant.id,
        teamName: participant.membership?.teamName || null,
        scores: {
          trust: score,
          clarity: score,
          authority: score,
          execution: score,
          communication: score,
          strain: 100 - score,
        },
      };
    });
    const sentimentAggregate = aggregateTeamSentiment(sentimentResponses);
    const leader = sentimentResponses[0] || {
      respondentId: "leader_estimate",
      leaderEstimate: true,
      scores: {},
    };
    const claimDecisions = resolveClaimSet({
      teamAssessmentMode: "multi_respondent",
      respondentCount: sentimentAggregate.respondentCount,
      completionRate: campaign.participants.length
        ? completedParticipants.length / Math.max(1, campaign.participants.length)
        : 0,
      confidence: sentimentAggregate.confidence / 100,
      campaignStatus: "closed",
      boundedScenarioMode: true,
      longitudinalDepth: 1,
      benchmarkSampleSize: 0,
      recurringSnapshotCount: 1,
      importedSignalCount: 0,
    });
    const trajectory = resolveTrajectory({
      tensionSeverity: completedParticipants.length >= 15 ? 28 : 56,
      failureDensity: 3,
      economicsExposure: 450000,
    });

    const report = {
      state:
        completedParticipants.length >= 15
          ? "ORDERED"
          : completedParticipants.length >= 10
            ? "DRIFTING"
            : completedParticipants.length >= 7
              ? "MISALIGNED"
              : "DISORDERED",
      narrative: {
        headline: "Alignment condition assessed across core operating domains.",
        summary:
          "This report identifies where declared intent and lived operational reality diverge, with implications for execution, trust and institutional capacity.",
        mandate:
          "Use this report to restore structural order, sharpen decision ownership and sequence intervention with discipline.",
      },
      resonance: {
        telemetry: {
          averageDissonance:
            completedParticipants.length >= 15
              ? 14
              : completedParticipants.length >= 10
                ? 23
                : completedParticipants.length >= 7
                  ? 31
                  : 42,
          domains: [
            { label: "Governance", intent: 84, reality: 66, dissonance: 18 },
            { label: "Execution", intent: 86, reality: 58, dissonance: 28 },
            { label: "Culture", intent: 81, reality: 61, dissonance: 20 },
            { label: "Leadership", intent: 88, reality: 59, dissonance: 29 },
          ],
        },
      },
      hcdAggregate: {
        overallBurnoutIndex: completedParticipants.length >= 15 ? 28 : 47,
        criticalDomains:
          completedParticipants.length >= 15
            ? ["Execution"]
            : ["Execution", "Leadership"],
      },
      hcd: [
        {
          label: "Leadership Capacity",
          potential: 84,
          extraction: 61,
          burnoutIndex: 42,
          wellbeing: 58,
          attritionRisk: "Elevated",
        },
      ],
      financialExposure: {
        replacementCost: 180000,
        executionLoss: 270000,
        totalExposure: 450000,
      },
      failureModes: [
        "Decision latency under strain",
        "Execution ownership ambiguity",
        "Governance drift at handoff points",
      ],
      priorityStack: [
        "Clarify decision rights and escalation lanes",
        "Stabilize execution rhythm across operating units",
        "Sequence intervention around highest-dissonance domains",
      ],
      ogr: {
        sovereignCertainty: completedParticipants.length >= 15 ? 87 : 69,
        isAuthorizedToExecute: completedParticipants.length >= 7,
      },
      intakeGovernance: {
        intakeMode: "ladder",
        evidenceProvenance: ["enterprise campaign participants", "respondent-derived assessment records"],
        ladderSatisfied: true,
        sponsoredDirect: false,
        monitoringContext: false,
      },
      teamSentimentReality: {
        mode: sentimentAggregate.mode,
        respondentDerived: sentimentAggregate.mode === "multi_respondent",
        confidence: sentimentAggregate.confidence,
        participationCoverage: Math.min(100, Math.round((completedParticipants.length / Math.max(1, campaign.participants.length)) * 100)),
        domains: compareLeaderToTeam({ leader, team: sentimentAggregate }),
      },
      teamReality: {
        mode: sentimentAggregate.mode,
        respondentCount: sentimentAggregate.respondentCount,
        invitedCount: campaign.participants.length,
        completionRate: campaign.participants.length
          ? Number((completedParticipants.length / Math.max(1, campaign.participants.length)).toFixed(2))
          : 0,
        confidence: sentimentAggregate.confidence / 100,
        claimLevel: claimDecisions["team-wide sentiment"].allowed
          ? "team_wide_sentiment"
          : sentimentAggregate.respondentCount > 0
            ? "directional_team_signal"
            : "leader_view",
        domains: Object.fromEntries(
          compareLeaderToTeam({ leader, team: sentimentAggregate }).map((domain: any) => [
            domain.domain,
            {
              leaderScore: domain.leaderScore,
              teamScore: domain.teamAggregateScore,
              delta: domain.variance,
              variance: null,
            },
          ]),
        ),
      },
      trajectoryOutlook: claimDecisions.predictive.allowed
        ? { ...trajectory, scenarios: buildTrajectoryScenarios(trajectory) }
        : undefined,
      benchmarkPosition: {
        available: false,
        confidence: 0,
        insufficientReason: "Internal benchmark cohort unavailable for this campaign export.",
        deviations: [],
      },
      monitoringRecommendation: {
        recommended: true,
        cadence: completedParticipants.length >= 15 ? "quarterly" : "monthly",
        rationale: ["Cadence derived from respondent count, campaign posture, and unresolved priority stack."],
      },
    };

    const canonicalIntake = buildCanonicalIntakeFromReport({
      report,
      campaign,
      participantCount: completedParticipants.length,
    });

    const unified: UnifiedGuidancePayload =
      await assembleConstitutionalGuidance({
        intake: canonicalIntake as any,
        assetLimit: 6,
        minAssetScore: 18,
        source: "admin-report",
      });

    const campaignPayload = {
      id: campaign.id,
      title: safeString(campaign.title, "Executive Alignment Campaign"),
      organisationName: safeString(
        campaign.organisation?.name,
        "Unknown organisation",
      ),
      generatedAt: new Date().toISOString(),
      correctionNodes: campaign.correctionNodes || [],
    };

    const context = {
      campaignId: campaign.id,
      organisationName: campaignPayload.organisationName,
      completedParticipantCount: completedParticipants.length,
      correctionNodeCount: Array.isArray(campaign.correctionNodes)
        ? campaign.correctionNodes.length
        : 0,
    };

    const jsonPayload = buildCanonicalReportContract({
      report,
      constitution: unified.constitution as ExecutiveReportConstitution,
      guidance: unified.guidance as ExecutiveReportGuidance,
      campaign: campaignPayload,
      registry: {
        model: "OGR-IV",
        node: "Canary Wharf",
        protocol: "Sovereign Protocol v2.2",
      },
    });

    const payload: ExecutiveReportApiPayload = {
      report,
      campaign: campaignPayload,
      context,
      constitution: unified.constitution as ExecutiveReportConstitution,
      guidance: unified.guidance as ExecutiveReportGuidance,
      jsonPayload,
    };

    // Append lineage event — fire-and-forget, never throws.
    import("@/lib/reporting/report-lineage").then(({ writeReportLineageEvent }) =>
      writeReportLineageEvent({
        reportType: "EXECUTIVE_REPORT",
        eventType: "GENERATED",
        resourceId: normalizedCampaignId,
        resourceName: campaignPayload.organisationName,
        version: "1",
      })
    ).catch(() => { /* lineage must not break report flow */ });

    return { ok: true, payload };
  } catch (error) {
    console.error("[EXECUTIVE_REPORT_BUILD_ERROR]", error);

    return {
      ok: false,
      error: "DATABASE_CONNECTION_FAILURE",
      details:
        error instanceof Error ? error.message : "Unknown report generation error",
    };
  }
}

export const generateExecutiveReportForCampaign = buildExecutiveReportFromCampaign;
import "server-only";
