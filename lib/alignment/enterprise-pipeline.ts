// lib/alignment/enterprise-pipeline.ts
// Unified enterprise decision authority pipeline.
// Flow: cohort gate → anonymisation → snapshot enrichment →
//       constitution adapter → decision kernel → cost of delay →
//       enforcement assessment → typed EnrichedEnterpriseReport.

import {
  getCampaignById,
  getLeadershipGapSnapshot,
  getTeamSnapshots,
} from "./enterprise-repository";
import { isCohortSafe, scrubParticipantIdentity } from "./anonymity-service";
import { adaptEnterpriseAssessmentToConstitution } from "./enterprise-constitution-adapter";
import { evaluateDecision, type KernelInput, type DecisionKernelOutput } from "@/lib/decision/kernel";
import { computeCostOfDelay, type CostOfDelay } from "@/lib/engine/cost-of-delay";
import { runEnforcementAssessment, type EnforcementAssessment } from "@/lib/constitution/enforcement/engine";
import type {
  EnterpriseAssessmentResult,
  EnterpriseAlignmentBand,
  EnterpriseDomainScore,
  EnterpriseVarianceScore,
  LeadershipGapView,
  TeamSnapshotView,
  FragilitySignal,
} from "./enterprise-types";
import type { EnterpriseConstitutionalAdapterResult } from "./enterprise-constitution-adapter";

// ─── types ────────────────────────────────────────────────────────────────────

export type EnrichedEnterpriseReport = {
  metadata: {
    generatedAt: string;
    organisationName: string;
    campaignTitle: string;
    auditID: string;
    campaignId: string;
    organisationId: string;
    participantCount: number;
  };
  scores: {
    overall: number;
    band: EnterpriseAlignmentBand;
    dissonanceArea: number;
    fragility: FragilitySignal | null;
    confidenceScore: number | null;
    completionRate: number;
  };
  domainPerformance: EnterpriseDomainScore[];
  varianceScores: EnterpriseVarianceScore[];
  findings: string[];
  strategicGuidance: string;
  constitution: EnterpriseConstitutionalAdapterResult;
  kernel: DecisionKernelOutput;
  costOfDelay: CostOfDelay;
  enforcement: EnforcementAssessment;
  leadershipGap: LeadershipGapView | null;
  teamSnapshots: TeamSnapshotView[];
};

export type PipelineError =
  | "CAMPAIGN_NOT_FOUND"
  | "COHORT_TOO_SMALL"
  | "NO_SNAPSHOT"
  | "PIPELINE_ERROR";

export type PipelineResult =
  | { ok: true; report: EnrichedEnterpriseReport }
  | { ok: false; reason: PipelineError; participantCount?: number; detail?: string };

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseAggregatedData(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function isValidBand(v: unknown): v is EnterpriseAlignmentBand {
  return v === "ALIGNED" || v === "DRIFTING" || v === "MISALIGNED" || v === "DISORDERED";
}

function isValidFragility(v: unknown): v is FragilitySignal {
  return v === "HIGH" || v === "MEDIUM" || v === "LOW";
}

function parseDomainScores(value: unknown): EnterpriseDomainScore[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      domain: String(item.domain ?? "") as EnterpriseDomainScore["domain"],
      earned: normalizeNumber(item.earned),
      possible: normalizeNumber(item.possible, 100),
      percent: normalizeNumber(item.percent),
    }))
    .filter((item) => item.domain);
}

function parseVarianceScores(value: unknown): EnterpriseVarianceScore[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      domain: String(item.domain ?? "") as EnterpriseVarianceScore["domain"],
      variance: normalizeNumber(item.variance),
    }))
    .filter((item) => item.domain);
}

function parseDomainArray(value: unknown): EnterpriseDomainScore["domain"][] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)) as EnterpriseDomainScore["domain"][];
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

function buildFindings(params: {
  percentScore: number;
  fragilitySignal: FragilitySignal | null;
  confidenceScore: number | null;
  completionRate: number;
  leadershipGap: LeadershipGapView | null;
}): string[] {
  const findings: string[] = [];

  if (params.percentScore < 60) {
    findings.push(
      "STRUCTURAL_DRIFT: Overall alignment is below institutional safety thresholds.",
    );
  }
  if (params.leadershipGap && params.leadershipGap.overallGapPercent > 15) {
    findings.push(
      "PERCEPTUAL_DISSONANCE: Significant delta between executive vision and staff execution.",
    );
  }
  if (params.fragilitySignal === "HIGH") {
    findings.push(
      "VOLATILITY_ALERT: High variance across domains suggests localised silos or uneven execution discipline.",
    );
  }
  if (params.confidenceScore !== null && params.confidenceScore > 0 && params.confidenceScore < 55) {
    findings.push(
      "CONFIDENCE_LIMITATION: Response confidence is modest — directional judgment should be paired with qualitative review.",
    );
  }
  if (params.completionRate < 50) {
    findings.push(
      "COVERAGE_WARNING: Participation coverage is thin enough to weaken organisation-wide certainty.",
    );
  }
  return findings;
}

// ─── pipeline ─────────────────────────────────────────────────────────────────

export async function runEnterprisePipeline(campaignId: string): Promise<PipelineResult> {
  try {
    // 1. Load campaign
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return { ok: false, reason: "CAMPAIGN_NOT_FOUND" };
    }

    // 2. Cohort safety gate
    const completedParticipants = (campaign.participants ?? []).filter(
      (p: { status?: string }) => p.status === "completed",
    );
    const participantCount = completedParticipants.length;

    if (!isCohortSafe(participantCount)) {
      return { ok: false, reason: "COHORT_TOO_SMALL", participantCount };
    }

    // 3. Anonymise participant IDs (irreversible scrub)
    completedParticipants.forEach((p: { id: string }) => {
      scrubParticipantIdentity(p.id, campaignId);
    });

    // 4. Parse alignment snapshot from aggregatedData
    const snapshotRows = (campaign as any).organisation?.snapshots ?? [];
    // Attempt to get the snapshot via the org ID
    const { prisma } = await import("@/lib/prisma.server");
    const snapshotRow = await (prisma as any).alignmentSnapshot.findFirst({
      where: { organisationId: campaign.organisationId },
      orderBy: { finalizedAt: "desc" },
    });

    if (!snapshotRow) {
      return { ok: false, reason: "NO_SNAPSHOT" };
    }

    const aggregated = parseAggregatedData(String(snapshotRow.aggregatedData ?? "{}"));

    const percentScore = normalizeNumber(aggregated.percentScore, 0);
    const totalScore = normalizeNumber(aggregated.totalScore, 0);
    const possibleScore = normalizeNumber(aggregated.possibleScore, 100);
    const rawBand = aggregated.band;
    const band: EnterpriseAlignmentBand = isValidBand(rawBand) ? rawBand : "DISORDERED";
    const rawFragility = aggregated.fragilitySignal;
    const fragilitySignal: FragilitySignal | null = isValidFragility(rawFragility) ? rawFragility : null;
    const dissonanceArea = normalizeNumber(aggregated.dissonanceArea, 0);
    const confidenceScore = aggregated.confidenceScore != null ? normalizeNumber(aggregated.confidenceScore, 0) : null;
    const completionRate = normalizeNumber(aggregated.completionRate, 0);
    const domainScores = parseDomainScores(aggregated.domainScores);
    const varianceScores = parseVarianceScores(aggregated.varianceScores);
    const weakestDomains = parseDomainArray(aggregated.weakestDomains);
    const strongestDomains = parseDomainArray(aggregated.strongestDomains);

    // 5. Build typed assessment result for constitution adapter
    const assessmentResult: EnterpriseAssessmentResult = {
      totalScore,
      possibleScore,
      percentScore,
      band,
      weakestDomains,
      strongestDomains,
      domainScores,
      varianceScores,
      fragilitySignal: fragilitySignal ?? undefined,
      dissonanceArea,
    };

    // 6. Constitution adapter
    const constitution = adaptEnterpriseAssessmentToConstitution(assessmentResult);

    // 7. Decision kernel
    const kernelInput: KernelInput = {
      id: campaignId,
      source: "enterprise",
      condition: `Enterprise alignment band: ${band} at ${percentScore}%`,
      decisionRequired:
        constitution.constitutionalDecision.route === "STRATEGY"
          ? "Strategic escalation approved — advance to executive programme"
          : constitution.constitutionalDecision.route === "DIAGNOSTIC"
          ? "Run corrective diagnostic before escalation"
          : "Foundational repair required before any escalation",
      evidenceChain: domainScores.map((ds) => ({
        inputSource: `enterprise_assessment_${ds.domain}`,
        observedPattern: `${ds.domain}: ${ds.percent}% alignment`,
        weight: ds.percent / 100,
        explanation: `Domain ${ds.domain} scored ${ds.percent}% (${ds.earned}/${ds.possible})`,
      })),
      internalContradictions: constitution.constitutionalDecision.disqualifiersTriggered,
      scores: Object.fromEntries(domainScores.map((ds) => [ds.domain, ds.percent])),
      signalStrength:
        percentScore >= 75 ? "STRONG" : percentScore >= 50 ? "MODERATE" : "WEAK",
      sources: [{ type: "multi_respondent", count: participantCount }],
      authorityType: constitution.constitutionalInput.authorityType,
      existingGraph: null,
    };

    const kernel = evaluateDecision(kernelInput);

    // 8. Cost of delay — computed against the weakest domain
    const lowestDomain =
      domainScores.length > 0
        ? domainScores.reduce((min, ds) => (ds.percent < min.percent ? ds : min))
        : null;

    const costOfDelay = computeCostOfDelay({
      currentScore: lowestDomain ? lowestDomain.percent : percentScore,
      degradationRate: 2,
      criticalThreshold: 40,
      domain: lowestDomain ? lowestDomain.domain : "overall",
      hasActiveContradictions: kernel.graphMetrics.activeContradictions > 0,
      daysSinceIdentification: 0,
    });

    // 9. Enforcement assessment
    const enforcement = runEnforcementAssessment({
      domainScores: domainScores.map((ds) => ds.percent),
      authorityClarity: constitution.constitutionalInput.clarityScore,
      coherence: constitution.constitutionalInput.narrativeCoherence,
      constitutionalRoute: constitution.constitutionalDecision.route,
    });

    // 10. Leadership gap + team snapshots
    const [leadershipGap, teamSnapshots] = await Promise.all([
      getLeadershipGapSnapshot(campaignId),
      getTeamSnapshots(campaignId),
    ]);

    // 11. Findings
    const findings = buildFindings({
      percentScore,
      fragilitySignal,
      confidenceScore,
      completionRate,
      leadershipGap,
    });

    const generatedAt = new Date().toISOString();

    // Append lineage event — fire-and-forget, never throws.
    import("@/lib/reporting/report-lineage").then(({ writeReportLineageEvent }) =>
      writeReportLineageEvent({
        reportType: "ENTERPRISE_REPORT",
        eventType: "GENERATED",
        resourceId: campaignId,
        resourceName: campaign.organisation?.name ?? undefined,
        version: "1",
      })
    ).catch(() => { /* lineage must not break report flow */ });

    return {
      ok: true,
      report: {
        metadata: {
          generatedAt,
          organisationName: campaign.organisation?.name ?? "Unknown Organisation",
          campaignTitle: campaign.title ?? "Untitled Campaign",
          auditID: `OGR-${campaignId.slice(0, 8).toUpperCase()}`,
          campaignId: campaign.id,
          organisationId: campaign.organisationId,
          participantCount,
        },
        scores: {
          overall: percentScore,
          band,
          dissonanceArea,
          fragility: fragilitySignal,
          confidenceScore,
          completionRate,
        },
        domainPerformance: domainScores,
        varianceScores,
        findings,
        strategicGuidance: getStrategicGuidance(band),
        constitution,
        kernel,
        costOfDelay,
        enforcement,
        leadershipGap,
        teamSnapshots,
      },
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: "PIPELINE_ERROR", detail };
  }
}
