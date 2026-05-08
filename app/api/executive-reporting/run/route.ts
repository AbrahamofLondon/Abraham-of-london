export const dynamic = "force-dynamic";
// app/api/executive-reporting/run/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.server";
import { assembleConstitutionalGuidance } from "@/lib/decision/constitutional-guidance-assembler";
import { buildCanonicalReportContract } from "@/lib/admin/reporting/canonical-report-contract";
import { buildExecutiveReportViewModel } from "@/lib/admin/reporting/executive-report-view-model";
import { buildExecutiveCapabilityStack } from "@/lib/admin/reporting/capability-stack";
import type { BenchmarkFact } from "@/lib/benchmarks/benchmark-engine";
import { enforceExecutiveReportingAccess } from "@/lib/diagnostics/executive-reporting-enforcement";
import {
  getDiagnosticJourney,
  getMonitoringSnapshots,
  persistDiagnosticStage,
} from "@/lib/diagnostics/journey-store";
import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { classifyAIDecisionRisk } from "@/lib/diagnostics/ai-decision-risk";
import { resolveLadderContext } from "@/lib/diagnostics/ladder-context-resolver";
import { getExecutiveReportingEntitlements } from "@/lib/server/billing/executive-reporting-entitlements";
import { buildObservedOutcomeEvidenceFromDB } from "@/lib/outcomes/evidence";
import type { OutcomeSnapshot } from "@/lib/outcomes/outcome-model";
import { evaluateDecision } from "@/lib/decision/kernel";
import { analyzeContagionRisk, simulateInterventionImpact } from "@/lib/alignment/governance-logic";
import { qualifiesForBoardroom, generateBoardroomDossier } from "@/lib/constitution/boardroom-mode";

type AnyRecord = Record<string, unknown>;

type ExecutiveReportingRoute = "STRATEGY" | "DIAGNOSTIC" | "REJECT";
type EvidenceQuality = "HIGH" | "MEDIUM" | "LOW";
type RiskScore = "LOW" | "MEDIUM" | "HIGH";

type ExecutiveReportingRunSuccess = {
  ok: true;
  runKey: string;
  route: ExecutiveReportingRoute;
  canonical: unknown;
  viewModel: unknown;
  entitlements: unknown;
  diagnostics: unknown;
};

type ExecutiveReportingRunFailure = {
  ok: false;
  error: string;
  requiredPath?: string;
  intakeMode?: "ladder" | "direct_sponsored" | "monitoring";
};

type ExecutiveReportingRunResponse =
  | ExecutiveReportingRunSuccess
  | ExecutiveReportingRunFailure;

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function n(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => s(item)).filter(Boolean) : [];
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function makeRunKey(): string {
  return `er_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function getObject(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : {};
}

function toEvidenceQuality(value: unknown): EvidenceQuality {
  const normalized = s(value, "MEDIUM").toUpperCase();
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "LOW") return "LOW";
  return "MEDIUM";
}

function toRoute(value: unknown): ExecutiveReportingRoute {
  const normalized = s(value, "DIAGNOSTIC").toUpperCase();
  if (normalized === "STRATEGY") return "STRATEGY";
  if (normalized === "REJECT") return "REJECT";
  return "DIAGNOSTIC";
}

function inferRiskScore(
  severityScore: number,
  evidenceQuality: EvidenceQuality,
): RiskScore {
  let adjusted = severityScore;

  if (evidenceQuality === "HIGH") adjusted += 6;
  if (evidenceQuality === "LOW") adjusted -= 6;

  if (adjusted >= 70) return "HIGH";
  if (adjusted >= 45) return "MEDIUM";
  return "LOW";
}

function buildNarrativeHeadline(input: {
  organisation: string;
  route: ExecutiveReportingRoute;
  orgState: string;
  stakeholderBreadth: string;
  marketExposure: string;
}): string {
  const organisation = input.organisation || "This organisation";
  const state = input.orgState || "DRIFTING";

  if (input.route === "STRATEGY") {
    return `${organisation} shows a ${state.toLowerCase()} condition with enough ordered signal for strategic escalation.`;
  }

  if (input.route === "REJECT") {
    return `${organisation} does not yet present a sufficiently ordered case for executive escalation.`;
  }

  if (
    input.stakeholderBreadth === "BOARD" ||
    input.stakeholderBreadth === "INSTITUTIONAL"
  ) {
    return `${organisation} presents a ${state.toLowerCase()} condition with broad consequence and requires disciplined executive interpretation.`;
  }

  if (
    input.marketExposure === "CRITICAL" ||
    input.marketExposure === "HIGH"
  ) {
    return `${organisation} is operating under visible structural strain with real market-facing consequence.`;
  }

  return `${organisation} presents a ${state.toLowerCase()} condition requiring disciplined interpretation before escalation opens.`;
}

function buildNarrativeSummary(input: {
  constitution: AnyRecord;
  guidance: AnyRecord;
  problemStatement: string;
  symptoms: string;
  decisionQuestion: string;
  whatHappensIfNothingChanges: string;
  priorAttemptOutcome: string;
  evidenceQuality: EvidenceQuality;
  ladderContext?: {
    constitutional?: { route: string | null } | null;
    team?: { band: string | null } | null;
    enterprise?: { reading: string | null } | null;
  };
  evidenceGraph?: {
    decisionText?: string;
    contradictionLabels: string[];
    consequenceLabels: string[];
  };
}): string {
  const ladderNotes: string[] = [];
  if (input.ladderContext?.constitutional?.route) {
    ladderNotes.push(
      `Constitutional route: ${input.ladderContext.constitutional.route}.`,
    );
  }
  if (input.ladderContext?.team?.band) {
    ladderNotes.push(`Team alignment: ${input.ladderContext.team.band}.`);
  }
  if (input.ladderContext?.enterprise?.reading) {
    ladderNotes.push(
      `Institutional reading: ${input.ladderContext.enterprise.reading}.`,
    );
  }
  if (input.evidenceGraph?.decisionText) {
    ladderNotes.push(`Canonical decision object: ${input.evidenceGraph.decisionText}.`);
  }
  if (input.evidenceGraph?.contradictionLabels.length) {
    ladderNotes.push(`Evidence graph contradictions: ${input.evidenceGraph.contradictionLabels.slice(0, 3).join("; ")}.`);
  }

  const constitutionalNarrative = s(input.constitution.narrativeSummary);
  if (constitutionalNarrative) {
    const additions: string[] = [];

    if (input.priorAttemptOutcome && input.priorAttemptOutcome !== "NONE") {
      additions.push(
        `Prior correction history is non-trivial (${input.priorAttemptOutcome.toLowerCase()}).`,
      );
    }

    additions.push(
      `Evidence quality is assessed as ${input.evidenceQuality.toLowerCase()}.`,
    );

    if (input.decisionQuestion) {
      additions.push(`The immediate decision need is: ${input.decisionQuestion}`);
    }

    return [...ladderNotes, constitutionalNarrative, ...additions].join(" ").trim();
  }

  const parts = [
    s(input.problemStatement),
    s(input.symptoms),
    s(input.whatHappensIfNothingChanges),
  ].filter(Boolean);

  return [...ladderNotes, ...parts].join(" ").trim().slice(0, 900);
}

function buildNarrativeMandate(input: {
  guidance: AnyRecord;
  authorityType: string;
  boardInvolved: string;
  decisionWindow: string;
  decisionQuestion: string;
}): string {
  const nextAction = s(input.guidance.nextAction);
  const decisionQuestion = s(input.decisionQuestion);

  const mandateBits: string[] = [];
  if (nextAction) mandateBits.push(nextAction);
  if (decisionQuestion) mandateBits.push(`Decision focus: ${decisionQuestion}`);
  if (input.authorityType === "UNCLEAR") {
    mandateBits.push("Clarify decision ownership before premium escalation.");
  }
  if (input.boardInvolved === "YES") {
    mandateBits.push("Prepare output for leadership or board-level review.");
  }
  if (input.decisionWindow) {
    mandateBits.push(
      `Decision window: ${input.decisionWindow.replace(/_/g, " ").toLowerCase()}.`,
    );
  }

  return mandateBits.join(" ").trim() || "Proceed according to the governed recommendation sequence.";
}

function toTelemetryDomains(input: {
  constitution: AnyRecord;
  intake: AnyRecord;
}): Array<{ label: string; intent: number; reality: number; dissonance: number }> {
  const constitution = input.constitution;
  const intake = input.intake;

  const dominantDomains = arr(constitution.dominantDomains);
  const severityScore = clamp(n(constitution.severityScore, 50), 0, 100);
  const clarityScore = clamp(n(constitution.clarityScore, 50), 0, 100);
  const governanceScore = clamp(n(constitution.governanceScore, 50), 0, 100);
  const authorityScore = clamp(n(constitution.authorityScore, 50), 0, 100);

  const economics = getObject(intake.economics);
  const history = getObject(intake.history);
  const governance = getObject(intake.governance);

  const evidenceQuality = toEvidenceQuality(history.evidenceQuality);
  const marketExposure = s(economics.marketExposure, "MEDIUM");
  const authorityScope = s(
    governance.authorityScope,
    s(constitution.authorityType, "UNCLEAR"),
  );

  const exposurePenalty =
    marketExposure === "CRITICAL"
      ? 18
      : marketExposure === "HIGH"
        ? 12
        : marketExposure === "MEDIUM"
          ? 6
          : 0;

  const evidenceAdjustment =
    evidenceQuality === "HIGH" ? 4 : evidenceQuality === "LOW" ? -4 : 0;

  const authorityReality =
    authorityScope === "DIRECT"
      ? authorityScore
      : authorityScope === "PROXY"
        ? Math.max(30, authorityScore - 12)
        : Math.max(20, authorityScore - 24);

  const base = [
    {
      label: dominantDomains[0] || "AUTHORITY",
      intent: 86,
      reality: clamp(authorityReality + evidenceAdjustment, 18, 92),
    },
    {
      label: dominantDomains[1] || "COHERENCE",
      intent: 84,
      reality: clamp(clarityScore - Math.floor(exposurePenalty / 2), 18, 92),
    },
    {
      label: dominantDomains[2] || "GOVERNANCE",
      intent: 85,
      reality: clamp(governanceScore - exposurePenalty, 18, 92),
    },
    {
      label: dominantDomains[3] || "EXECUTION",
      intent: 88,
      reality: clamp(100 - severityScore + 18 - exposurePenalty, 16, 90),
    },
  ];

  return base.map((domain) => ({
    label: domain.label,
    intent: domain.intent,
    reality: domain.reality,
    dissonance: Math.max(0, domain.intent - domain.reality),
  }));
}

function computeFinancialExposure(input: {
  constitution: AnyRecord;
  intake: AnyRecord;
}): {
  replacementCost: number;
  executionLoss: number;
  totalExposure: number;
} {
  const constitution = input.constitution;
  const intake = input.intake;
  const economics = getObject(intake.economics);

  const severityScore = clamp(n(constitution.severityScore, 50), 0, 100);
  const estimatedExposureGBP = Math.max(0, n(economics.estimatedExposureGBP, 0));
  const headcountAffected = Math.max(0, n(economics.headcountAffected, 0));
  const stakeholderBreadth = s(getObject(intake.governance).stakeholderBreadth, "LOCAL");
  const revenueBand = s(constitution.revenueBand, s(economics.revenueBand, "SMB"));

  const multiplier =
    revenueBand === "WHALE"
      ? 1.8
      : revenueBand === "ENTERPRISE"
        ? 1.45
        : revenueBand === "MID"
          ? 1.2
          : revenueBand === "SMB"
            ? 1.0
            : 0.8;

  const breadthLoad =
    stakeholderBreadth === "INSTITUTIONAL"
      ? 1.4
      : stakeholderBreadth === "BOARD"
        ? 1.25
        : stakeholderBreadth === "EXECUTIVE"
          ? 1.15
          : stakeholderBreadth === "MULTI_TEAM"
            ? 1.08
            : 1;

  const derivedReplacement =
    estimatedExposureGBP > 0
      ? Math.round(estimatedExposureGBP * 0.35 * breadthLoad)
      : Math.round((headcountAffected * 4500 + severityScore * 1200) * multiplier);

  const derivedExecutionLoss =
    estimatedExposureGBP > 0
      ? Math.round(estimatedExposureGBP * 0.65 * breadthLoad)
      : Math.round((severityScore * 3200 + headcountAffected * 2200) * multiplier);

  const replacementCost = Math.max(0, derivedReplacement);
  const executionLoss = Math.max(replacementCost, derivedExecutionLoss);
  const totalExposure = replacementCost + executionLoss;

  return {
    replacementCost,
    executionLoss,
    totalExposure,
  };
}

function buildPriorityStack(input: {
  constitution: AnyRecord;
  intake: AnyRecord;
  guidance: AnyRecord;
  evidenceGraph?: {
    decisionText?: string;
    contradictionLabels: string[];
    consequenceLabels: string[];
  };
}): string[] {
  const constitutionItems = arr(input.constitution.requiredInterventions);
  const failureModes = arr(input.constitution.failureModes);
  const decisionQuestion = s(getObject(input.intake.decisionNeed).decisionQuestion);
  const authorityScope = s(getObject(input.intake.governance).authorityScope);

  const stack = [...constitutionItems];

  if (authorityScope === "UNCLEAR") {
    stack.unshift("Clarify decision authority and sponsor mandate");
  }

  if (failureModes.some((mode) => /trust/i.test(mode))) {
    stack.push("Stabilise trust before introducing further operating change");
  }

  if (decisionQuestion) {
    stack.push(`Resolve decision question: ${decisionQuestion}`);
  }
  if (input.evidenceGraph?.decisionText) {
    stack.unshift(`Force decision: ${input.evidenceGraph.decisionText}`);
  }
  for (const contradiction of input.evidenceGraph?.contradictionLabels.slice(0, 2) ?? []) {
    stack.push(`Price contradiction: ${contradiction}`);
  }

  return [...new Set(stack)].filter(Boolean).slice(0, 8);
}

function validateIntake(intake: AnyRecord): string | null {
  const email = s(intake.email).toLowerCase();
  const organisation = s(intake.organisation);
  const role = s(intake.role);
  const problemStatement = s(intake.problemStatement);
  const symptoms = s(intake.symptoms);
  const desiredOutcome = s(intake.desiredOutcome);
  const currentConstraint = s(intake.currentConstraint);

  const governance = getObject(intake.governance);
  const economics = getObject(intake.economics);
  const history = getObject(intake.history);
  const decisionNeed = getObject(intake.decisionNeed);
  const meta = getObject(intake.diagnosticsMeta);

  if (!email) return "Email is required.";
  if (!organisation) return "Organisation is required.";
  if (!role) return "Role is required.";
  if (problemStatement.length < 120) return "Problem statement is too thin.";
  if (symptoms.length < 80) return "Observed symptoms are too thin.";
  if (desiredOutcome.length < 40) return "Desired outcome is too thin.";
  if (currentConstraint.length < 30) return "Current constraint is too thin.";

  if (!s(governance.authorityScope)) return "Authority scope is required.";
  if (!s(governance.sponsorNameOrSeat)) return "Decision sponsor or seat is required.";
  if (!s(economics.revenueBand)) return "Revenue band is required.";
  if (!s(economics.marketExposure)) return "Market exposure is required.";
  if (n(economics.estimatedExposureGBP, 0) <= 0) {
    return "Estimated financial exposure is required.";
  }

  if (!s(history.evidenceQuality)) return "Evidence quality is required.";
  if (s(history.evidenceNotes).length < 20) return "Evidence notes are too thin.";
  if (s(decisionNeed.decisionQuestion).length < 20) return "Decision question is too thin.";
  if (s(decisionNeed.whatHappensIfNothingChanges).length < 20) {
    return "Cost of inaction is too thin.";
  }

  if (n(meta.signalReadinessScore, 0) > 0 && n(meta.signalReadinessScore, 0) < 45) {
    return "Signal readiness is too weak for executive reporting.";
  }

  return null;
}

function benchmarkFactsFromRuns(runs: Array<{ runKey: string; canonicalSnapshot: unknown; createdAt: Date }>): BenchmarkFact[] {
  return runs.map((run) => {
    const canonical = getObject(run.canonicalSnapshot);
    const sections = getObject(canonical.sections);
    const strategic = getObject(sections.strategicDomainAnalysis);
    const constitution = getObject(sections.constitutionalPosture);
    const exposure = getObject(sections.financialExposure);
    return {
      id: run.runKey,
      anonymized: true,
      recordedAt: run.createdAt.toISOString(),
      dimensions: {
        sector: s(getObject(canonical.campaign).sector, "unknown"),
        revenueBand: s(constitution.revenueBand, "unknown"),
        maturity: s(constitution.readinessTier, "unknown"),
        assessmentType: "executive_reporting",
      },
      metrics: [
        { metric: "averageDissonance", value: n(strategic.averageDissonance) },
        { metric: "severityScore", value: n(constitution.severityScore) },
        { metric: "governanceScore", value: n(constitution.governanceScore) },
        { metric: "totalExposure", value: n(exposure.totalExposure) },
      ],
    };
  });
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function loadTeamAssessmentAggregate(campaignId: string | null) {
  if (!campaignId) return null;
  try {
    const p = prisma as any;
    if (!p?.teamAssessmentCampaign?.findUnique) return null;
    const campaign = await p.teamAssessmentCampaign.findUnique({
      where: { id: campaignId },
      include: { aggregate: true },
    });
    if (!campaign?.aggregate) return null;
    return {
      campaignId,
      mode: campaign.mode,
      status: campaign.status,
      respondentCount: campaign.aggregate.respondentCount,
      invitedCount: campaign.aggregate.invitedCount,
      completionRate: campaign.aggregate.completionRate,
      confidence: campaign.aggregate.confidence,
      minimumResponseThreshold: campaign.minimumResponseThreshold,
      claimLevel: campaign.aggregate.claimLevel,
      domains: parseJson(campaign.aggregate.domainsJson, {}),
    };
  } catch {
    return null;
  }
}

async function persistBenchmarkFact(input: {
  subjectHash: string;
  assessmentType: string;
  dimensions: Record<string, unknown>;
  metrics: Array<{ metric: string; value: number }>;
}) {
  try {
    const p = prisma as any;
    if (!p?.benchmarkFact?.create) return;
    await p.benchmarkFact.create({
      data: {
        subjectHash: input.subjectHash,
        assessmentType: input.assessmentType,
        dimensions: input.dimensions,
        metrics: input.metrics,
      },
    });
  } catch (error) {
    console.warn("[EXECUTIVE_REPORTING_BENCHMARK_FACT_SKIPPED]", error);
  }
}

function outcomeSnapshotsFromFollowups(
  followups: Array<{ metadata: string | null; createdAt?: Date }>,
): OutcomeSnapshot[] {
  const snapshots: OutcomeSnapshot[] = [];

  for (const followup of followups) {
    const metadata = parseJson<Record<string, unknown>>(followup.metadata, {});
    const raw = getObject(metadata.outcomeSnapshot);
    if (!Object.keys(raw).length) continue;

    const baseline = getObject(raw.baseline);
    const followUp = getObject(raw.followUp);
    const delta = getObject(raw.delta);
    const organisation = s(raw.organisation);

    snapshots.push({
      id: s(raw.id),
      sessionId: s(raw.sessionId),
      ...(organisation ? { organisation } : {}),
      baseline: {
        dissonance: n(baseline.dissonance, Number.NaN),
        burnoutIndex: n(baseline.burnoutIndex, Number.NaN),
        sovereignCertainty: n(baseline.sovereignCertainty, Number.NaN),
        escalationLevel: s(baseline.escalationLevel),
      },
      followUp: {
        dissonance: n(followUp.dissonance, Number.NaN),
        burnoutIndex: n(followUp.burnoutIndex, Number.NaN),
        sovereignCertainty: n(followUp.sovereignCertainty, Number.NaN),
        escalationLevel: s(followUp.escalationLevel),
      },
      delta: {
        dissonanceChange: n(delta.dissonanceChange, 0),
        burnoutChange: n(delta.burnoutChange, 0),
        certaintyChange: n(delta.certaintyChange, 0),
      },
      outcomeClassification:
        s(raw.outcomeClassification, "invalid") as OutcomeSnapshot["outcomeClassification"],
      timeToOutcomeDays: n(raw.timeToOutcomeDays, Number.NaN),
      createdAt: raw.createdAt
        ? new Date(String(raw.createdAt))
        : followup.createdAt ?? new Date(),
    });
  }

  return snapshots;
}

function jsonFailure(
  error: string,
  status: number,
): NextResponse<ExecutiveReportingRunResponse> {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(
  request: Request,
): Promise<NextResponse<ExecutiveReportingRunResponse>> {
  try {
    const body = await request.json();
    const intake = getObject(body?.intake);

    if (Object.keys(intake).length === 0) {
      return jsonFailure("Invalid intake payload.", 400);
    }

    const validationError = validateIntake(intake);
    if (validationError) {
      return jsonFailure(validationError, 400);
    }

    const email = s(intake.email).toLowerCase();
    const subjectId = s(intake.subjectId) || null;
    const campaignId = s(intake.campaignId) || null;
    const accessDecision = await enforceExecutiveReportingAccess({
      email,
      subjectId,
      campaignId,
      intakeMode: s(intake.intakeMode, "ladder"),
      sponsoredDirect: Boolean(intake.sponsoredDirect),
      sponsorNameOrSeat: s(getObject(intake.governance).sponsorNameOrSeat),
      monitoringAccountId: s(intake.monitoringAccountId),
      monitoringContext: Boolean(intake.monitoringContext),
    });

    if (!accessDecision.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: accessDecision.reason || "Executive Reporting access blocked.",
          requiredPath: accessDecision.requiredPath,
          intakeMode: accessDecision.intakeMode,
        },
        { status: 403 },
      );
    }

    const ladderContext = await resolveLadderContext(subjectId, email, campaignId);
    const evidenceJourney = await getDiagnosticJourney({
      email,
      subjectId,
      campaignId,
      organisation: s(intake.organisation),
    });
    const latestDecisionObject = [...evidenceJourney.decisionObjects].reverse()[0] ?? null;
    const evidenceGraphSummary = {
      decisionText: latestDecisionObject?.decisionText,
      contradictionLabels: evidenceJourney.evidenceNodes
        .filter((node) => node.kind === "contradiction")
        .slice(-6)
        .map((node) => node.label),
      consequenceLabels: evidenceJourney.evidenceNodes
        .filter((node) => node.kind === "consequence" || node.kind === "exposure_estimate")
        .slice(-6)
        .map((node) => node.summary),
    };
    const runKey = makeRunKey();

    const assembled = await assembleConstitutionalGuidance({
      intake,
      options: {
        assetLimit: 8,
        minAssetScore: 18,
        maxPerKind: 2,
        minDiversityKinds: 2,
      },
    });

    const constitution = getObject(assembled.constitution);
    const guidance = getObject(assembled.guidance);

    const governance = getObject(intake.governance);
    const economics = getObject(intake.economics);
    const history = getObject(intake.history);
    const decisionNeed = getObject(intake.decisionNeed);

    const telemetryDomains = toTelemetryDomains({
      constitution,
      intake,
    });

    const averageDissonance =
      telemetryDomains.length > 0
        ? Math.round(
            telemetryDomains.reduce((sum, item) => sum + item.dissonance, 0) /
              telemetryDomains.length,
          )
        : clamp(n(constitution.severityScore, 0), 0, 100);

    const exposure = computeFinancialExposure({
      constitution,
      intake,
    });

    const evidenceQuality = toEvidenceQuality(history.evidenceQuality);
    const route = toRoute(constitution.route);

    const riskScore = inferRiskScore(
      n(constitution.severityScore, 0),
      evidenceQuality,
    );

    const priorRuns = await prisma.executiveReportingRun.findMany({
      where: { status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { runKey: true, canonicalSnapshot: true, createdAt: true },
    });
    const journeySnapshots = await getMonitoringSnapshots({ email, subjectId, campaignId });

    const teamAssessmentCampaignId = s(intake.teamAssessmentCampaignId) || campaignId;
    const persistedTeamAggregate = await loadTeamAssessmentAggregate(teamAssessmentCampaignId);
    const suppliedTeamAggregate = getObject(intake.teamAssessmentAggregate);

    const capabilityStack = buildExecutiveCapabilityStack({
      subjectId,
      campaignId,
      intake: {
        ...intake,
        teamAssessmentAggregate: Object.keys(suppliedTeamAggregate).length
          ? suppliedTeamAggregate
          : persistedTeamAggregate,
      },
      report: {
        state: s(constitution.orgState, "DRIFTING"),
        resonance: { telemetry: { averageDissonance, domains: telemetryDomains } },
        financialExposure: exposure,
      },
      constitution,
      ladderContext,
      journeySnapshots,
      benchmarkFacts: benchmarkFactsFromRuns(priorRuns),
    });
    const outcomeFollowups = await prisma.strategyRoomFollowup.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { metadata: true, createdAt: true },
    });
    const fallbackOutcomeEvidence = outcomeSnapshotsFromFollowups(outcomeFollowups);
    const observedOutcomeEvidence = await buildObservedOutcomeEvidenceFromDB({
      organisationKey: s(intake.organisation),
    });
    const telemetryMetrics = telemetryDomains.map((domain) => ({
      label: domain.label,
      intent: domain.intent,
      reality: domain.reality,
    }));
    const contagionMap = analyzeContagionRisk(telemetryMetrics);
    const governanceImpact = telemetryMetrics.length > 0
      ? simulateInterventionImpact(telemetryMetrics, {
          domain: telemetryMetrics[0]?.label || "AUTHORITY",
          estimatedRecovery: Math.max(6, Math.round(averageDissonance / 6)),
          estimatedTimeframe: route === "STRATEGY" ? 14 : 30,
        })
      : null;
    const executiveKernel = evaluateDecision({
      id: runKey,
      source: "executive_reporting",
      condition: s(constitution.orgState, "DRIFTING"),
      decisionRequired: s(decisionNeed.decisionQuestion) || latestDecisionObject?.decisionText || "Formalise the governed next move.",
      evidenceChain: [
        {
          inputSource: "executive_reporting",
          observedPattern: buildNarrativeHeadline({
            organisation: s(intake.organisation, "Prospective Organisation"),
            route,
            orgState: s(constitution.orgState, "DRIFTING"),
            stakeholderBreadth: s(governance.stakeholderBreadth, "LOCAL"),
            marketExposure: s(economics.marketExposure, "MEDIUM"),
          }),
          weight: evidenceQuality === "HIGH" ? 0.88 : evidenceQuality === "LOW" ? 0.56 : 0.72,
          explanation: "Executive Reporting synthesises constitutional, economic, and contradiction evidence into one decision state.",
        },
      ],
      internalContradictions: evidenceGraphSummary.contradictionLabels,
      scores: {
        averageDissonance,
        severityScore: n(constitution.severityScore),
        governanceScore: n(constitution.governanceScore),
        exposureScore: exposure.totalExposure > 0 ? Math.min(100, Math.round(exposure.totalExposure / 10000)) : 0,
      },
      signalStrength: route === "STRATEGY" ? "STRONG" : evidenceQuality === "LOW" ? "WEAK" : "MODERATE",
      sources: [
        { type: "self_report", count: 1 },
        ...(ladderContext.team ? [{ type: "multi_respondent" as const, count: 1 }] : []),
        ...(observedOutcomeEvidence.processedDecisionCases > 0 || fallbackOutcomeEvidence.length > 0
          ? [{ type: "outcome_verified" as const, count: Math.max(observedOutcomeEvidence.processedDecisionCases, fallbackOutcomeEvidence.length, 1) }]
          : []),
      ],
      authorityType: s(constitution.authorityType) || undefined,
      aiExposureLevel: latestDecisionObject?.aiExposureLevel,
      aiLeverageAction: null,
      expectedOutcome: s(guidance.nextAction) || undefined,
      daysSinceIdentification: 0,
    });

    const intakeGovernance = {
      intakeMode: accessDecision.intakeMode,
      evidenceProvenance: [
        accessDecision.reason || "access decision recorded",
        ladderContext.constitutional ? "constitutional ladder context" : "",
        ladderContext.team ? "team ladder context" : "",
        ladderContext.enterprise ? "enterprise ladder context" : "",
      ].filter(Boolean),
      ladderSatisfied: accessDecision.intakeMode === "ladder",
      sponsoredDirect: accessDecision.intakeMode === "direct_sponsored",
      monitoringContext: accessDecision.intakeMode === "monitoring",
    };

    const canonical = buildCanonicalReportContract({
      report: {
        state: s(constitution.orgState, "DRIFTING"),
        narrative: {
          headline: buildNarrativeHeadline({
            organisation: s(intake.organisation, "Prospective Organisation"),
            route,
            orgState: s(constitution.orgState, "DRIFTING"),
            stakeholderBreadth: s(governance.stakeholderBreadth, "LOCAL"),
            marketExposure: s(economics.marketExposure, "MEDIUM"),
          }),
          summary: buildNarrativeSummary({
            constitution,
            guidance,
            problemStatement: s(intake.problemStatement),
            symptoms: s(intake.symptoms),
            decisionQuestion: s(decisionNeed.decisionQuestion),
            whatHappensIfNothingChanges: s(decisionNeed.whatHappensIfNothingChanges),
            priorAttemptOutcome: s(history.priorAttemptOutcome),
            evidenceQuality,
            ladderContext,
            evidenceGraph: evidenceGraphSummary,
          }),
          mandate: buildNarrativeMandate({
            guidance,
            authorityType: s(constitution.authorityType),
            boardInvolved: s(governance.boardInvolved),
            decisionWindow: s(economics.decisionWindow),
            decisionQuestion: s(decisionNeed.decisionQuestion),
          }),
        },
        resonance: {
          telemetry: {
            averageDissonance,
            domains: telemetryDomains,
          },
        },
        hcdAggregate: {
          overallBurnoutIndex: clamp(
            n(constitution.severityScore, 0) +
              (s(history.priorAttemptOutcome) === "WORSENED" ? 10 : 0),
            0,
            100,
          ),
          criticalDomains: arr(constitution.failureModes),
          elevatedDomains: arr(constitution.dominantDomains),
          riskScore,
        },
        financialExposure: exposure,
        failureModes: arr(constitution.failureModes),
        priorityStack: buildPriorityStack({
          constitution,
          intake,
          guidance,
          evidenceGraph: evidenceGraphSummary,
        }),
        ogr: {
          sovereignCertainty: clamp(n(constitution.clarityScore, 0), 0, 100),
          isAuthorizedToExecute: route === "STRATEGY",
        },
        intakeGovernance,
        observedOutcomeEvidence,
        decisionKernel: executiveKernel,
        governanceImpact: governanceImpact ? {
          predictedIntegrityIndex: governanceImpact.predictedIntegrityIndex,
          predictedStatus: governanceImpact.predictedStatus,
          contagionRisk: contagionMap[0]?.riskLevel ?? "LOW",
          affectedDomains: contagionMap.map((risk) => risk.targetDomain),
          interventionUrgency: route === "STRATEGY" || (contagionMap[0]?.riskLevel === "HIGH") ? "HIGH" : averageDissonance >= 45 ? "MEDIUM" : "LOW",
        } : null,
        ...capabilityStack.blocks,
      },
      // Pass the typed assembler outputs directly into buildCanonicalReportContract.
      // The local `constitution`/`guidance` consts are AnyRecord (intentionally
      // widened via getObject() above) for consumption by AnyRecord-typed local
      // helpers throughout this file. The canonical builder needs the strict
      // ExecutiveReportConstitution / ExecutiveReportGuidance shape per the
      // ConstitutionalAssemblerOutput contract — the typed versions are still
      // available on `assembled` and are used directly here.
      constitution: assembled.constitution,
      guidance: assembled.guidance,
      campaign: {
        id: runKey,
        title: "Executive Reporting Run",
        organisationName: s(intake.organisation, "Prospective Organisation"),
        generatedAt: new Date().toISOString(),
      },
      registry: {
        model: "OGR-IV",
        node: "Canary Wharf",
        protocol: "Sovereign Protocol v2.2",
      },
    });

    const aiDecisionRisk = classifyAIDecisionRisk({
      decisionText: s(decisionNeed.decisionQuestion) || latestDecisionObject?.decisionText || null,
      constraintText: s(intake.currentConstraint) || latestDecisionObject?.constraintText || null,
      priorAttemptText: s(history.priorAttemptOutcome) || latestDecisionObject?.priorAttemptText || null,
      costOfDelayText: s(decisionNeed.whatHappensIfNothingChanges) || latestDecisionObject?.costOfDelayText || null,
      affectedDomain: arr(constitution.dominantDomains)[0] ?? latestDecisionObject?.affectedDomain ?? null,
      aiExposureLevel: latestDecisionObject?.aiExposureLevel,
      aiDisplacementRisk: latestDecisionObject?.aiDisplacementRisk,
      decisionVelocityScore: latestDecisionObject?.decisionVelocityScore,
    });
    const aiAdjustedConsequence = {
      ...aiDecisionRisk,
      projectedAccelerationRisk: Math.min(100, Math.round(aiDecisionRisk.accelerationRiskScore + averageDissonance * 0.2)),
      formula: "AI acceleration risk + average dissonance x 0.2",
      reasoning: [
        `Decision velocity: ${aiDecisionRisk.decisionVelocityScore}/100`,
        `Inferred AI-enabled competitor baseline: ${aiDecisionRisk.competitorBaselineScore}/100`,
        `Acceleration risk: ${aiDecisionRisk.accelerationRiskScore}/100`,
      ],
    };

    const enrichedCanonical = {
      ...canonical,
      subjectId,
      campaignId,
      ladderContext,
      evidenceGraph: {
        nodes: evidenceJourney.evidenceNodes,
        decisionObjects: evidenceJourney.decisionObjects,
        summary: evidenceGraphSummary,
      },
      claimDecisions: capabilityStack.claims,
      aiAdjustedConsequence,
      decisionKernel: executiveKernel,
      governanceImpact: governanceImpact ? {
        simulation: governanceImpact,
        contagionMap,
        affectedDomains: contagionMap.map((risk) => risk.targetDomain),
        interventionUrgency: route === "STRATEGY" || (contagionMap[0]?.riskLevel === "HIGH") ? "HIGH" : averageDissonance >= 45 ? "MEDIUM" : "LOW",
      } : null,
    };

    const viewModel = buildExecutiveReportViewModel(enrichedCanonical as typeof canonical);
    const entitlements = await getExecutiveReportingEntitlements(email);

    const run = await prisma.executiveReportingRun.create({
      data: {
        runKey,
        email,
        fullName: s(intake.fullName) || null,
        organisation: s(intake.organisation) || null,
        role: s(intake.role) || null,
        sector: s(intake.sector) || null,
        source: "executive-reporting",
        status: "completed",
        route: route || null,
        readinessTier: s(constitution.readinessTier) || null,
        authorityType: s(constitution.authorityType) || null,
        canonicalSnapshot: enrichedCanonical as unknown as Prisma.InputJsonValue,
        viewModelSnapshot: viewModel as unknown as Prisma.InputJsonValue,
        ...(campaignId
          ? {
              campaign: {
                connect: {
                  id: campaignId,
                },
              },
            }
          : {}),
      },
    });

    await persistBenchmarkFact({
      subjectHash: runKey,
      assessmentType: "executive_reporting",
      dimensions: {
        sector: s(intake.sector, "unknown"),
        revenueBand: s(constitution.revenueBand, s(economics.revenueBand, "unknown")),
        headcountBand: n(economics.headcountAffected) >= 250 ? "250_plus" : "under_250",
        geography: s(intake.geography, "unknown"),
        maturity: s(constitution.readinessTier, "unknown"),
      },
      metrics: [
        { metric: "averageDissonance", value: averageDissonance },
        { metric: "severityScore", value: n(constitution.severityScore) },
        { metric: "governanceScore", value: n(constitution.governanceScore) },
        { metric: "totalExposure", value: exposure.totalExposure },
      ],
    });

    const executiveAuthorityPacket = buildGenericAuthorityPacket({
      stage: "executive_reporting",
      condition: `${s(constitution.orgState, "DRIFTING")} executive position`,
      contradiction: evidenceGraphSummary.contradictionLabels.length
        ? `Cross-stage contradiction convergence: ${evidenceGraphSummary.contradictionLabels.slice(0, 3).join("; ")}.`
        : `The intake describes ${s(decisionNeed.decisionQuestion, "a decision need")} under ${s(governance.authorityScope, "unclear")} authority.`,
      decisionText: s(decisionNeed.decisionQuestion) || latestDecisionObject?.decisionText || null,
      constraintText: s(intake.currentConstraint) || latestDecisionObject?.constraintText || null,
      priorAttemptText: s(history.priorAttemptOutcome) || latestDecisionObject?.priorAttemptText || null,
      costOfDelayText: s(decisionNeed.whatHappensIfNothingChanges) || latestDecisionObject?.costOfDelayText || null,
      stakeholderText: s(governance.stakeholderBreadth) || latestDecisionObject?.stakeholderText || null,
      affectedDomain: arr(constitution.dominantDomains)[0] ?? null,
      firstMove: s(guidance.nextAction) || "Force the executive decision and assign accountable ownership.",
      skippedConsequence: `Unpriced exposure remains at ${exposure.totalExposure}.`,
      escalationCondition: route === "STRATEGY"
        ? "Strategy Room is ready because the route is strategy-authorized."
        : "Do not enter Strategy Room until the blocked authority or evidence condition is corrected.",
      riskScore: Math.min(100, Math.round(averageDissonance + n(constitution.severityScore, 0) * 0.55 + (exposure.totalExposure > 0 ? 12 : 0))),
      formula: "average dissonance + severity score x 0.55 + exposure presence",
      reasoning: [
        `Average dissonance: ${averageDissonance}`,
        `Severity score: ${n(constitution.severityScore, 0)}`,
        `Total exposure: ${exposure.totalExposure}`,
        `Route: ${route}`,
      ],
      confidence: evidenceQuality === "HIGH" ? 0.82 : evidenceQuality === "LOW" ? 0.58 : 0.7,
      payload: {
        runKey,
        route,
        exposure,
        evidenceGraphSummary,
        aiAdjustedConsequence,
      },
    });

    await persistDiagnosticStage({
      email,
      subjectId,
      campaignId,
      organisation: s(intake.organisation),
      stage: "executive_reporting",
      payload: enrichedCanonical,
      tensions: arr(constitution.failureModes),
      routeDecision: { route, runKey, intakeMode: accessDecision.intakeMode },
      escalationEvent: { route, createdAt: new Date().toISOString() },
      evidenceNodes: executiveAuthorityPacket.nodes,
      decisionObject: executiveAuthorityPacket.decisionObject,
      snapshot: {
        timestamp: new Date().toISOString(),
        stage: "executive_reporting",
        coreMetrics: {
          severityScore: n(constitution.severityScore),
          governanceScore: n(constitution.governanceScore),
          averageDissonance,
        },
        tensions: arr(constitution.failureModes),
        escalationLevel: route === "STRATEGY" ? 3 : route === "DIAGNOSTIC" ? 2 : 1,
        directive: s(guidance.nextAction),
        benchmarkPosition: capabilityStack.blocks.benchmarkPosition,
        trajectoryResult: capabilityStack.blocks.trajectoryOutlook,
      },
    });

    // ── Boardroom qualification: generate dossier if threshold met ──
    const boardroomQualification = qualifiesForBoardroom(enrichedCanonical as any);
    const boardroomDossier = boardroomQualification.qualified
      ? generateBoardroomDossier(enrichedCanonical as any)
      : null;

    return NextResponse.json({
      ok: true,
      runKey: run.runKey,
      route,
      canonical: enrichedCanonical,
      viewModel,
      aiAdjustedConsequence,
      entitlements,
      diagnostics: assembled.diagnostics,
      intake,
      boardroom: {
        qualified: boardroomQualification.qualified,
        reason: boardroomQualification.reason,
        dossier: boardroomDossier,
      },
    });
  } catch (error) {
    console.error("[EXECUTIVE_REPORTING_RUN_ERROR]", error);
    return jsonFailure("Failed to generate executive report.", 500);
  }
}
