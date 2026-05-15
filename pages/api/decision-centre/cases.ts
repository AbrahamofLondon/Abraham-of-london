/**
 * pages/api/decision-centre/cases.ts — Decision Centre API
 *
 * Server-authoritative Living Case endpoint. Returns governed case state
 * for the authenticated user. Never trusts sessionStorage.
 *
 * Response: DecisionCentreResponse from lib/product/decision-centre-contract.ts
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import { getDiagnosticJourney, type DiagnosticJourneyRecord } from "@/lib/diagnostics/journey-store";
import {
  deriveLivingCase,
  isAdmissibleFor,
  type LivingCase,
} from "@/lib/product/living-case-store";
import {
  deriveCognitiveState,
  type DecisionCentreCase,
  type DecisionCentreResponse,
  type SurfaceAdmissionStatus,
  type DecisionCreditSummary,
  type RetainerReadiness,
  type PatternRecurrenceSummary,
  type ReturnBriefReference,
  type StrategyRoomSessionRef,
} from "@/lib/product/decision-centre-contract";
import type { StageEntry } from "@/lib/product/evidence-stage-contract";
import { qualifiesForBoardroom } from "@/lib/constitution/boardroom-mode";
import { deriveDecisionCreditGovernanceEffect } from "@/lib/product/decision-credit-governance";
import { detectPatternRecurrenceV0 } from "@/lib/product/pattern-recurrence";
import { findLatestStrategyExecutionRecord } from "@/lib/strategy-room/execution-record";
import { calculateCostOfInactionClock } from "@/lib/product/cost-of-inaction-clock";
import { deriveOversightCadenceState } from "@/lib/product/oversight-cadence-engine";
import { loadPreviousArchivedOversightCycle } from "@/lib/product/oversight-cycle-archive";
import { loadBoardroomArchiveSummary } from "@/lib/product/boardroom-archive";
import { toDecisionCentreRetainerMemoryPreview } from "@/lib/product/decision-centre-retainer-memory";
import { computeIrreversibilityIndex } from "@/lib/product/irreversibility-index";
import { extractAssessmentEvidenceCapture } from "@/lib/product/evidence-capture-contract";
import { buildClientSafeProvenanceCaseHref } from "@/lib/product/client-safe-provenance-contract";
import {
  buildGovernedMemoryFromEvidenceStages,
  buildPatternRecurrenceMemory,
  buildVerificationBoundaryMemory,
} from "@/lib/product/governed-memory-presenter";
import {
  loadPurposeAlignmentEvidence,
  convertPurposeAlignmentToGovernedMemory,
} from "@/lib/alignment/evidence-loader";
import {
  buildDecisionVelocitySnapshot,
  buildDecisionVelocitySummary,
  buildDecisionVelocityMemoryItems,
  type DecisionVelocitySnapshot,
} from "@/lib/analytics/decision-velocity";
import {
  buildWhatChangedSummary,
  type ComparableCaseState,
} from "@/lib/analytics/what-changed";
import { buildCrossAssessmentIntelligence } from "@/lib/analytics/cross-assessment-intelligence";
import { buildContradictionMapView } from "@/lib/analytics/contradiction-graph-presenter";
import type { IntelligenceDataQuality, IntelligenceScope } from "@/lib/product/intelligence-contract";
import { createFieldProvenance } from "@/lib/product/field-provenance-contract";

function parseMoney(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/£\s?([\d,]+(?:\.\d+)?)/i) || value.match(/\b([\d,]+(?:\.\d+)?)\b/);
  if (!match?.[1]) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function normaliseText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normaliseQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stagePayload(journey: DiagnosticJourneyRecord, stage: string): Record<string, unknown> {
  return asRecord(journey.stages[stage as keyof typeof journey.stages]);
}

function findStageTimestamp(journey: DiagnosticJourneyRecord, stage: string): string | null {
  const payload = stagePayload(journey, stage);
  return normaliseText(payload.createdAt)
    || normaliseText(payload.assessedAt)
    || normaliseText(payload.completedAt)
    || null;
}

function pickCoherenceBand(payload: Record<string, unknown>): string | null {
  return normaliseText(payload.profile)
    || normaliseText(payload.coherenceBand)
    || normaliseText(payload.band)
    || null;
}

function pickWeakestDomain(payload: Record<string, unknown>): string | null {
  return normaliseText(payload.weakestDomain)
    || (Array.isArray(payload.weakestDomains) && payload.weakestDomains.length > 0 ? normaliseText(payload.weakestDomains[0]) : null)
    || null;
}

function pickAuthorityClarity(payload: Record<string, unknown>): "CLEAR" | "UNCLEAR" | "MIXED" | null {
  const authorityScore = typeof payload.authorityScore === "number" ? payload.authorityScore : null;
  const clarityScore = typeof payload.clarityScore === "number" ? payload.clarityScore : null;
  const governanceScore = typeof payload.governanceScore === "number" ? payload.governanceScore : null;
  const score = authorityScore ?? clarityScore ?? governanceScore;
  if (score == null) return null;
  if (score >= 70) return "CLEAR";
  if (score <= 45) return "UNCLEAR";
  return "MIXED";
}

function pickRouteDecision(livingCase: LivingCase): string | null {
  const last = livingCase.routeDecisions.at(-1);
  if (!last || typeof last !== "object") return null;
  return normaliseText((last as Record<string, unknown>).route)?.toUpperCase() ?? null;
}

function classifyFinancialExposureBand(monthlyCost: number | null): string | null {
  if (monthlyCost == null || monthlyCost <= 0) return null;
  if (monthlyCost >= 100000) return "CRITICAL";
  if (monthlyCost >= 25000) return "HIGH";
  if (monthlyCost >= 5000) return "MODERATE";
  return "LOW";
}

function deriveComparableStates(input: {
  livingCase: LivingCase;
  journey: DiagnosticJourneyRecord;
  checkpoints: Array<{
    createdAt: string;
    dueAt: string;
    responseStatus?: string | null;
    respondedAt?: string | null;
  }>;
  decisionVelocity: DecisionVelocitySnapshot | null;
  financialExposureBand: string | null;
  irreversibilityBand: string | null;
  strategyRoomExecutionStatus: string | null;
  counselCaseStatus: string | null;
}): { current: ComparableCaseState; previous: ComparableCaseState | null } {
  const purposePayload = stagePayload(input.journey, "purpose_alignment");
  const currentCheckpoint = input.checkpoints.at(-1) ?? null;
  const previousCheckpoint = input.checkpoints.length > 1 ? input.checkpoints[input.checkpoints.length - 2] : null;
  const currentObservedAt = currentCheckpoint?.respondedAt ?? currentCheckpoint?.createdAt ?? findStageTimestamp(input.journey, "purpose_alignment") ?? input.livingCase.createdAt;
  const previousObservedAt = previousCheckpoint?.respondedAt ?? previousCheckpoint?.createdAt ?? (input.journey.snapshots.length >= 2 ? input.journey.snapshots[input.journey.snapshots.length - 2]?.timestamp ?? null : null);

  const current: ComparableCaseState = {
    observedAt: currentObservedAt,
    coherenceBand: pickCoherenceBand(purposePayload),
    weakestDomain: pickWeakestDomain(purposePayload),
    contradictionCount: input.livingCase.contradictions.length,
    checkpointResponseStatus: currentCheckpoint?.responseStatus ?? null,
    decisionVelocityBand: input.decisionVelocity?.velocityBand ?? null,
    financialExposureBand: input.financialExposureBand,
    irreversibilityBand: input.irreversibilityBand,
    routeDecision: pickRouteDecision(input.livingCase),
    strategyRoomExecutionStatus: input.strategyRoomExecutionStatus,
    counselCaseStatus: input.counselCaseStatus,
  };

  const previousVelocity = previousCheckpoint
    ? buildDecisionVelocitySnapshot({
        caseId: input.livingCase.caseId,
        journeyId: input.journey.journeyKey,
        userId: input.livingCase.subjectKey,
        userEmail: input.livingCase.email,
        sourceSurface: "DECISION_CENTRE",
        diagnosisAt: input.journey.startedAt,
        checkpointCreatedAt: previousCheckpoint.createdAt,
        firstResponseAt: previousCheckpoint.respondedAt ?? null,
        completedAt: previousCheckpoint.responseStatus === "COMPLETED" ? previousCheckpoint.respondedAt ?? null : null,
        responseStatus: previousCheckpoint.responseStatus ?? null,
        outcomeClassification: null,
      })
    : null;

  const previous: ComparableCaseState = {
    observedAt: previousObservedAt,
    coherenceBand: null,
    weakestDomain: null,
    contradictionCount: null,
    checkpointResponseStatus: previousCheckpoint?.responseStatus ?? null,
    decisionVelocityBand: previousVelocity?.velocityBand ?? null,
    financialExposureBand: null,
    irreversibilityBand: null,
    routeDecision: input.livingCase.routeDecisions.length > 1
      ? normaliseText((input.livingCase.routeDecisions[input.livingCase.routeDecisions.length - 2] as Record<string, unknown>)?.route)?.toUpperCase() ?? null
      : null,
    strategyRoomExecutionStatus: null,
    counselCaseStatus: null,
  };

  if (input.journey.snapshots.length >= 2) {
    const previousSnapshot = input.journey.snapshots[input.journey.snapshots.length - 2]!;
    previous.contradictionCount = previousSnapshot.tensions.length;
  }

  return {
    current,
    previous: Object.values(previous).some((value) => value != null) ? previous : null,
  };
}

function buildCrossAssessmentSignals(input: {
  journey: DiagnosticJourneyRecord;
  livingCase: LivingCase;
  latestDecisionLogStatus?: string | null;
}): Array<{ stage: string; payload: unknown }> {
  const stages: Array<{ key: string }> = [
    { key: "purpose_alignment" },
    { key: "constitutional" },
    { key: "team" },
    { key: "enterprise" },
    { key: "executive_reporting" },
    { key: "strategy_room" },
  ];

  return stages
    .map(({ key }) => {
      const payload = stagePayload(input.journey, key);
      if (Object.keys(payload).length === 0 && !input.livingCase.completedStages.includes(key as never)) return null;
      return {
        stage: key,
        payload: {
          ...payload,
          _blocked: key === "strategy_room" ? input.latestDecisionLogStatus === "blocked" : null,
          _contradictionCount: input.livingCase.evidenceNodes.filter((node) => node.sourceStage === key && node.kind === "contradiction").length,
        },
      };
    })
    .filter(Boolean) as Array<{ stage: string; payload: unknown }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildStageChecklist(livingCase: LivingCase): StageEntry[] {
  const completed = new Set(livingCase.completedStages);
  const stages: StageEntry[] = [
    { key: "fast_diagnostic", label: "Fast Diagnostic", status: completed.has("purpose_alignment") || completed.has("constitutional") ? "completed" : "not_started" },
    { key: "purpose_alignment", label: "Purpose Alignment", status: completed.has("purpose_alignment") ? "completed" : "not_started" },
    { key: "constitutional", label: "Constitutional Diagnostic", status: completed.has("constitutional") ? "completed" : "not_started" },
    { key: "team", label: "Team Assessment", status: completed.has("team") ? "completed" : "not_started" },
    { key: "enterprise", label: "Enterprise Assessment", status: completed.has("enterprise") ? "completed" : "not_started" },
    { key: "executive_reporting", label: "Executive Reporting", status: completed.has("executive_reporting") ? "completed" : "not_started" },
    { key: "strategy_room", label: "Strategy Room", status: completed.has("strategy_room") ? "completed" : "not_started" },
    { key: "outcome_verification", label: "Outcome Verification", status: "not_started" },
  ];

  // Add bespoke contributions from evidence nodes
  for (const stage of stages) {
    if (stage.status !== "completed") continue;
    const stageKey = stage.key === "fast_diagnostic" ? "purpose_alignment" : stage.key;
    const nodes = livingCase.evidenceNodes.filter((n) => n.sourceStage === stageKey);
    const contradictions = nodes.filter((n) => n.kind === "contradiction");
    if (contradictions.length > 0 && contradictions[0]) {
      stage.contribution = contradictions[0].summary;
    } else if (nodes.length > 0 && nodes[0]) {
      stage.contribution = nodes[0].summary;
    }
  }

  return stages;
}

function buildAdmissionStatus(
  livingCase: LivingCase,
  surface: "executive_reporting" | "strategy_room",
): SurfaceAdmissionStatus {
  const result = isAdmissibleFor(livingCase, surface);
  const surfaceLabel = surface === "executive_reporting" ? "Executive Reporting" : "Strategy Room";

  if (result.admissible) {
    return {
      surface: surfaceLabel,
      status: "ADMITTED",
      reasons: [result.reason],
    };
  }

  return {
    surface: surfaceLabel,
    status: "RESTRICTED",
    reasons: [result.reason],
    repairActions: [result.reason],
      returnPath: "/diagnostics",
  };
}

function buildCaseTitle(livingCase: LivingCase): string {
  if (livingCase.primaryDecision?.decisionText) {
    const text = livingCase.primaryDecision.decisionText;
    return text.length > 80 ? text.slice(0, 77) + "..." : text;
  }
  return "Active case";
}

async function getOwnedProducts(email: string): Promise<string[]> {
  try {
    const entitlements = await prisma.clientEntitlement.findMany({
      where: { email, status: "active" },
      select: { productCode: true },
    });
    return entitlements.map((e) => e.productCode);
  } catch {
    return [];
  }
}

function deriveEligibleProducts(livingCase: LivingCase, owned: string[]): string[] {
  const eligible: string[] = [];
  const ownedSet = new Set(owned);

  if (!ownedSet.has("assessment.executive_reporting")) {
    const erAdmissible = isAdmissibleFor(livingCase, "executive_reporting");
    if (erAdmissible.admissible) eligible.push("executive_reporting");
  }

  if (!ownedSet.has("strategy-room.entry")) {
    const srAdmissible = isAdmissibleFor(livingCase, "strategy_room");
    if (srAdmissible.admissible) eligible.push("strategy_room");
  }

  return eligible;
}

function derivePaymentRequired(eligible: string[], owned: string[]): string[] {
  const ownedSet = new Set(owned);
  return eligible.filter((p) => {
    if (p === "executive_reporting") return !ownedSet.has("assessment.executive_reporting");
    if (p === "strategy_room") return !ownedSet.has("strategy-room.entry");
    return false;
  });
}

function deriveRestrictedProducts(livingCase: LivingCase, owned: string[]): string[] {
  const restricted: string[] = [];
  const ownedSet = new Set(owned);

  if (!ownedSet.has("assessment.executive_reporting")) {
    const er = isAdmissibleFor(livingCase, "executive_reporting");
    if (!er.admissible) restricted.push("executive_reporting");
  }

  if (!ownedSet.has("strategy-room.entry")) {
    const sr = isAdmissibleFor(livingCase, "strategy_room");
    if (!sr.admissible) restricted.push("strategy_room");
  }

  return restricted;
}

function deriveNextAction(livingCase: LivingCase): string | null {
  // Highest priority: unresolved contradictions
  if (livingCase.contradictions.length > 0) {
    const sorted = [...livingCase.contradictions].sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity),
    );
    const highest = sorted[0];
    if (highest) return `Resolve contradiction: ${highest.summary}`;
  }

  // Missing stages
  if (!livingCase.completedStages.includes("constitutional")) {
    return "Complete the Constitutional Diagnostic to establish structural evidence.";
  }
  if (!livingCase.completedStages.includes("enterprise") && livingCase.completedStages.includes("team")) {
    return "Complete the Enterprise Assessment to map institutional pressure.";
  }

  // ER eligible but not purchased
  const erAdmissible = isAdmissibleFor(livingCase, "executive_reporting");
  if (erAdmissible.admissible) {
    return "Commission Executive Reporting — evidence supports a governed brief.";
  }

  return null;
}

function deriveRetainerReadiness(input: {
  livingCase: LivingCase;
  recurrence: PatternRecurrenceSummary | null;
  boardroomQualified: boolean;
  counselTriggered: boolean;
  costBasisAvailable: boolean;
  unresolvedCommitments: number;
  credit?: DecisionCreditSummary | null;
  outcomeStatus?: string | null;
}): RetainerReadiness | null {
  const signals: string[] = [];

  if (input.boardroomQualified) signals.push("boardroom threshold met");
  if (input.recurrence?.status === "VERIFIED_RECURRENCE") signals.push("recurrence detected");
  if (input.recurrence?.status === "POSSIBLE_RECURRENCE") signals.push("possible recurrence");
  if (input.counselTriggered) signals.push("counsel trigger present");
  if (input.unresolvedCommitments > 0) signals.push("unresolved commitment remains");
  if (input.costBasisAvailable) signals.push("cost basis available");
  if (input.credit && (input.credit.trend === "declining" || input.credit.score < 60)) signals.push("decision credit weakening");
  if (input.outcomeStatus === "deteriorated" || input.outcomeStatus === "invalid") signals.push("outcome deteriorated");

  if (signals.length === 0) {
    return {
      level: "LOW",
      reason: "Current evidence supports case progression, but recurring oversight conditions are not yet established.",
      signals: [],
    };
  }

  const level = signals.some((signal) =>
    signal === "boardroom threshold met"
      || signal === "recurrence detected"
      || signal === "counsel trigger present"
      || signal === "outcome deteriorated"
  )
    ? "HIGH"
    : signals.length >= 2
      ? "MEDIUM"
      : "LOW";

  const orderedSignals = [...new Set(signals)];
  return {
    level,
    reason: `Reason: ${orderedSignals.join(", ")}.`,
    signals: orderedSignals,
  };
}

function severityRank(severity: string): number {
  switch (severity) {
    case "critical": return 4;
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
    default: return 0;
  }
}

function daysSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return diff >= 0 ? Math.round(diff / (1000 * 60 * 60 * 24)) : 0;
}

function deriveCaseIrreversibility(input: {
  monthlyCost: number | null;
  createdAt: string | null | undefined;
  unresolvedContradictions: number;
  blockedDecisions: number;
  boardroomQualified: boolean;
  sourceLabel?: string;
  nextAction?: string | null;
}) {
  const daysWithoutAction = daysSince(input.createdAt);
  const signalCount = [
    input.monthlyCost != null && input.monthlyCost > 0,
    daysWithoutAction != null && daysWithoutAction > 0,
    input.unresolvedContradictions > 0,
    input.blockedDecisions > 0,
  ].filter(Boolean).length;

  if (signalCount < 2) return null;

  const index = computeIrreversibilityIndex({
    daysWithoutAction: daysWithoutAction ?? undefined,
    executionFailures: input.blockedDecisions || undefined,
    costAccumulated: input.monthlyCost ? input.monthlyCost * Math.max(1, daysWithoutAction ?? 1) / 30 : undefined,
    costThreshold: input.monthlyCost ? input.monthlyCost * 3 : undefined,
    consequenceMaterialised: input.boardroomQualified,
    factors: input.unresolvedContradictions > 0
      ? [{
          factor: "TRUST_EROSION",
          contribution: Math.min(20, input.unresolvedContradictions * 6),
          description: `${input.unresolvedContradictions} unresolved contradiction${input.unresolvedContradictions === 1 ? "" : "s"} remain active.`,
        }]
      : undefined,
  });

  return {
    level: index.level,
    score: index.score,
    summary: `${index.summary} This is an irreversibility estimate, not a verified external fact.`,
    windowRemaining: index.windowRemaining ?? null,
    evidencePosture: signalCount >= 3 ? "SYSTEM_INFERRED" as const : "PARTIAL" as const,
    sourceLabel: input.sourceLabel ?? "Recorded case signals",
    computedAt: new Date().toISOString(),
    evidenceBasis: "Based on recorded signals.",
    nextAction: input.nextAction ?? null,
  };
}

function latestEvidenceTimestamp(input: {
  livingCase: LivingCase;
  journey?: DiagnosticJourneyRecord | null;
  latestCheckpoint?: { respondedAt?: string | null; createdAt?: string | null } | null;
  latestOutcome?: { createdAt?: Date | string | null } | null;
}): string {
  const candidates = [
    input.latestCheckpoint?.respondedAt ?? null,
    input.latestCheckpoint?.createdAt ?? null,
    input.latestOutcome?.createdAt ? new Date(input.latestOutcome.createdAt).toISOString() : null,
    ...(input.journey ? Object.keys(input.journey.stages).map((stage) => findStageTimestamp(input.journey!, stage)) : []),
    input.livingCase.createdAt ?? null,
  ].filter((value): value is string => Boolean(value));
  return candidates
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((item) => !Number.isNaN(item.time))
    .sort((a, b) => b.time - a.time)[0]?.value ?? new Date().toISOString();
}

function buildUrgencyReasons(input: {
  requiresResponse: DecisionCentreResponse["checkpoints"]["requiresResponse"];
  recentResponses: DecisionCentreResponse["checkpoints"]["recentResponses"];
  caseCard: DecisionCentreCase;
}): string[] {
  const reasons: string[] = [];
  if (input.requiresResponse.some((item) => item.status === "OVERDUE")) reasons.push("checkpoint overdue");
  if (input.recentResponses.some((item) => item.responseStatus === "BLOCKED")) reasons.push("blocked checkpoint");
  if ((input.caseCard.costOfInaction?.accumulatedCost ?? 0) >= 10000) reasons.push("financial exposure high");
  if ((input.caseCard.irreversibility?.score ?? 0) >= 45) reasons.push("irreversibility high");
  if (input.caseCard.contradictionMap?.activeContradictions.some((item) => item.trend === "WORSENING")) reasons.push("contradiction worsening");
  if (input.caseCard.strategyRoomActive) reasons.push("strategy room active");
  if (input.caseCard.returnBriefTriggered) reasons.push("return brief triggered");
  if (input.caseCard.counselWarranted) reasons.push("counsel warranted");
  return reasons;
}

function urgencyScore(reasons: string[]): number {
  const weight: Record<string, number> = {
    "checkpoint overdue": 100,
    "blocked checkpoint": 90,
    "financial exposure high": 70,
    "irreversibility high": 60,
    "contradiction worsening": 50,
    "strategy room active": 40,
    "return brief triggered": 35,
    "counsel warranted": 30,
  };
  return reasons.reduce((sum, reason) => sum + (weight[reason] ?? 0), 0);
}

async function resolveRetainerContext(input: {
  organisationName?: string | null;
  caseId: string;
}) {
  const organisation = input.organisationName
    ? await prisma.organisation.findFirst({
        where: {
          OR: [
            { name: input.organisationName },
            { slug: input.organisationName },
          ],
        },
        select: { id: true },
      })
    : null;

  const contract = organisation
    ? await prisma.retainerContract.findFirst({
        where: { organisationId: organisation.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: { id: true, tier: true },
      })
    : null;

  const previousCycle = contract
    ? await loadPreviousArchivedOversightCycle({
        accountId: contract.id,
        beforePeriodStart: new Date().toISOString(),
      })
    : null;

  const cadence = contract
    ? deriveOversightCadenceState({
        tier: contract.tier === "INSTITUTIONAL"
          ? "INSTITUTIONAL_COMMAND"
          : contract.tier === "OPERATIONAL"
            ? "EXECUTIVE_OVERSIGHT"
            : "GOVERNED_CONTINUITY",
        latestArchivedCycle: previousCycle?.record
          ? {
              periodEnd: previousCycle.record.periodEnd,
              createdAt: previousCycle.record.createdAt,
              approvedAt: previousCycle.record.approvedAt,
              deliveredAt: previousCycle.record.deliveredAt,
              deliveryStatus: previousCycle.record.deliveryStatus,
            }
          : null,
      })
    : null;

  const boardroomArchive = await loadBoardroomArchiveSummary({
    organisationId: organisation?.id ?? null,
    caseIds: [input.caseId],
  }).catch(() => null);

  return {
    contractId: contract?.id ?? null,
    cadence,
    boardroomHistoryCount: boardroomArchive?.totalDossiers ?? 0,
    retainerMemoryPreview: toDecisionCentreRetainerMemoryPreview(previousCycle?.clientSafeBrief?.retainerCycleMemory ?? null),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const generatedAt = new Date().toISOString();
    const identity = await resolveIdentity(req);
    const requestedCaseId = normaliseQueryValue(req.query.caseId);
    const requestedJourneyId = normaliseQueryValue(req.query.journeyId);
    const requestedStrategyRoomSessionId = normaliseQueryValue(req.query.strategyRoomSessionId);
    const requestedExecutiveRunId = normaliseQueryValue(req.query.executiveRunId);
    const accountWide = normaliseQueryValue(req.query.accountWide) === "true";

    if (!identity.authenticated || !identity.email) {
      return res.status(401).json({ ok: false, reason: "AUTH_REQUIRED" });
    }

    const email = identity.email;

    // ── Derive Living Case (server-authoritative) ──
    const livingCase = await deriveLivingCase({ email });

    if (!livingCase) {
      return res.status(200).json({
        ok: true,
        generatedAt,
        dataQuality: "EMPTY",
        evidencePosture: "INSUFFICIENT_DATA",
        scope: {
          userId: identity.subjectId ?? null,
          userEmail: email,
          sourceSurface: "DECISION_CENTRE",
          scopeLabel: "Decision Centre account view",
          scopeType: "ACCOUNT",
        },
        provenance: [],
      emptyState: {
        reason: "No decision memory has been created yet.",
        nextAction: "Start with Fast Diagnostic.",
      },
      retainerMemoryPreview: null,
      cases: [],
        mostUrgentCase: null,
        checkpoints: {
          requiresResponse: [],
          recentResponses: [],
        },
        commercial: { ownedProducts: [], eligibleProducts: [], restrictedProducts: [] },
        credit: null,
      } satisfies DecisionCentreResponse);
    }

    // ── Build case card ──
    const owned = await getOwnedProducts(email);
    const eligible = deriveEligibleProducts(livingCase, owned);
    const paymentRequired = derivePaymentRequired(eligible, owned);
    const restricted = deriveRestrictedProducts(livingCase, owned);

    const recurrenceResult = await detectPatternRecurrenceV0({
      email,
      organisationKey: livingCase.organisation,
      currentCaseId: livingCase.caseId,
      contradiction: livingCase.contradictions[0]?.summary || null,
      decisionText: livingCase.primaryDecision?.decisionText || null,
    });
    const patternRecurrence: PatternRecurrenceSummary | null =
      recurrenceResult.status === "INSUFFICIENT_HISTORY" && recurrenceResult.priorCount === 0
        ? null
        : recurrenceResult;

    const monthlyCost = parseMoney(livingCase.primaryDecision?.costOfDelayText);
    const boardroomQualification = (() => {
      if (!monthlyCost) {
        return {
          qualified: false,
          reason: "This is not a board-level issue. Resolve operationally.",
        };
      }
      return qualifiesForBoardroom({
        economics: { estimatedMonthlyCost: monthlyCost },
        accuracyFeedback: {
          response: livingCase.evidenceTier === "multi_source" || livingCase.evidenceTier === "outcome_verified"
            ? "yes"
            : "partial",
        },
      } as never);
    })();

    const latestExecutionRecord = await findLatestStrategyExecutionRecord({
      email,
    });
    const latestDecisionLog = latestExecutionRecord?.sessionId
      ? await prisma.strategyDecisionLog.findFirst({
          where: { sessionId: latestExecutionRecord.sessionId },
          orderBy: { updatedAt: "desc" },
          select: { status: true },
        })
      : null;
    const unresolvedCommitments = latestDecisionLog && latestDecisionLog.status !== "executed" ? 1 : 0;
    const counselTriggered = livingCase.completedStages.includes("strategy_room")
      && (latestDecisionLog?.status === "blocked" || livingCase.contradictions.length >= 2);
    const blockedDecisionCount = latestDecisionLog?.status === "blocked" ? 1 : 0;

    // ── Return Brief entries ────────────────────────────────────────────────
    // Query SR execution sessions that have trigger conditions (blocked/pending
    // decisions, or sessions old enough that trajectory re-evaluation is due).
    // Each qualifying session surfaces as a client-safe Return Brief entry with
    // a direct link to /briefing/return/[sessionKey].  We do NOT call
    // generateReturnBrief() here — that runs lazily when the user opens the
    // brief page.  This query just determines visibility.
    const returnBriefs: ReturnBriefReference[] = await (async () => {
      try {
        const srSessions = await prisma.strategyRoomExecutionSession.findMany({
          where: { email },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            sessionKey: true,
            updatedAt: true,
            canonicalSnapshot: true,
            decisions: {
              select: { status: true },
            },
          },
        });

        const entries: ReturnBriefReference[] = [];
        for (const s of srSessions) {
          const blocked = s.decisions.filter((d) => d.status === "blocked").length;
          const pending  = s.decisions.filter((d) => d.status === "pending").length;
          const daysElapsed = Math.floor(
            (Date.now() - s.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
          );
          // Qualify: any unresolved decision, or session dormant > 14 days
          const qualifies = blocked > 0 || pending > 0 || daysElapsed > 14;
          if (!qualifies) continue;

          const snapshot = (() => {
            try {
              return typeof s.canonicalSnapshot === "string"
                ? JSON.parse(s.canonicalSnapshot)
                : s.canonicalSnapshot ?? null;
            } catch { return null; }
          })();

          const trajectoryRaw: string =
            (typeof snapshot?.trajectory === "string" && snapshot.trajectory)
              ? snapshot.trajectory
              : blocked > 0 ? "DETERIORATING" : "FRAGILE";

          const status: ReturnBriefReference["status"] =
            blocked > 0 ? "ACTIVE"
            : pending > 0 ? "ACTIVE"
            : "UNKNOWN";

          entries.push({
            sessionId: s.id,
            sessionKey: s.sessionKey,
            status,
            trajectory: trajectoryRaw,
            generatedAt: s.updatedAt.toISOString(),
            href: `/briefing/return/${s.sessionKey}`,
          });
        }
        return entries;
      } catch {
        // Best-effort — return empty so the rest of the card still renders
        return [];
      }
    })();

    let credit: DecisionCreditSummary | null = null;
    let creditGovernanceExplanation: string | null = null;
    try {
      const { getCreditProfile } = await import("@/lib/decision-ledger/ledger-service");
      const profile = await getCreditProfile(email);
      if (profile) {
        credit = {
          score: profile.score,
          trend: profile.trend as "improving" | "stable" | "declining",
          fulfilled: profile.fulfilled,
          breached: profile.breached,
          disputed: profile.disputed,
        };
        creditGovernanceExplanation = deriveDecisionCreditGovernanceEffect({
          score: profile.score,
          trend: profile.trend,
          breached: profile.breached,
        }).explanation;
      }
    } catch {
      // Decision credit is best-effort — not critical
    }

    const caseCard: DecisionCentreCase = {
      caseId: livingCase.caseId,
      scope: {
        userId: identity.subjectId ?? null,
        userEmail: email,
        caseId: livingCase.caseId,
        journeyId: null,
        strategyRoomSessionId: latestExecutionRecord?.sessionId ?? null,
        executiveRunId: null,
        organisationId: livingCase.organisation ?? null,
        sourceSurface: accountWide ? "INTELLIGENCE_MEMORY" : "DECISION_CENTRE",
        scopeLabel: accountWide ? "Account-wide view" : buildCaseTitle(livingCase),
        scopeType: accountWide ? "ACCOUNT" : "CASE",
      },
      title: buildCaseTitle(livingCase),
      decisionText: livingCase.primaryDecision?.decisionText || null,
      cognitiveState: deriveCognitiveState(livingCase),
      evidenceTier: livingCase.evidenceTier,
      completedStages: buildStageChecklist(livingCase),
      admission: {
        executiveReporting: buildAdmissionStatus(livingCase, "executive_reporting"),
        strategyRoom: buildAdmissionStatus(livingCase, "strategy_room"),
      },
      continuity: livingCase.contradictions.length > 0
        ? {
            status: livingCase.contradictions.length >= 3 ? "VERIFIED_PATTERN" : "REPEATED",
            priorOccurrences: livingCase.contradictions.length,
            trend: "stable",
            summary: livingCase.contradictions[0]?.summary || undefined,
          }
        : livingCase.stageCount > 0
          ? { status: "NEW", summary: "Case under initial evidence gathering." }
          : null,
      commercial: {
        ownedProducts: owned,
        eligibleProducts: eligible,
        paymentRequiredFor: paymentRequired,
        restrictedProducts: restricted,
      },
      costOfInaction: (() => {
        const costText = livingCase.primaryDecision?.costOfDelayText;
        if (!costText) return null;
        const monthly = parseFloat(costText.replace(/[^\d.]/g, "")) || 0;
        if (monthly <= 0) return null;
        const startedAt = livingCase.createdAt || new Date().toISOString();
        const result = calculateCostOfInactionClock({ monthlyCostEstimate: monthly, startedAt });
        if (result.basis === "UNAVAILABLE" || result.accumulatedCost <= 0) return null;
        return { accumulatedCost: result.accumulatedCost, daysElapsed: result.daysElapsed, basis: result.basis };
      })(),
      valueAtRisk: (() => {
        const signals: string[] = [];
        if (livingCase.contradictions.length > 0) signals.push(`${livingCase.contradictions.length} unresolved contradiction${livingCase.contradictions.length !== 1 ? "s" : ""}`);
        if (livingCase.completedStages.length >= 3) signals.push("multi-source evidence accumulated");
        if (livingCase.unresolvedTensions.length > 0) signals.push(`${livingCase.unresolvedTensions.length} unresolved tension${livingCase.unresolvedTensions.length !== 1 ? "s" : ""}`);
        return signals.length > 0 ? `If you stopped here, the following visibility would be lost: ${signals.join(", ")}.` : null;
      })(),
      nextRequiredAction: deriveNextAction(livingCase),
      unresolvedContradictions: livingCase.contradictions.length,
      latestDirective: livingCase.latestDirective,
      outcomeStatus: null,
      patternRecurrence,
      boardroom: {
        qualified: boardroomQualification.qualified,
        reason: boardroomQualification.reason,
        href: boardroomQualification.qualified && latestExecutionRecord?.sessionId
          ? `/boardroom/${latestExecutionRecord.sessionId}`
          : null,
        historyCount: 0,
      },
      strategyRoomActive: Boolean(latestExecutionRecord?.sessionId),
      strategyRoomRecord: latestExecutionRecord?.sessionId
        ? ({
            sessionId: latestExecutionRecord.sessionId,
            href: `/strategy-room/session/${latestExecutionRecord.sessionId}`,
            provenanceStatus: "available",
            provenanceHref: buildClientSafeProvenanceCaseHref({
              subjectType: "STRATEGY_ROOM_RECORD",
              subjectId: latestExecutionRecord.sessionId,
            }),
          } satisfies StrategyRoomSessionRef)
        : null,
      counselWarranted: counselTriggered,
      returnBriefTriggered: false,
      urgencyReasons: [],
      decisionVelocity: null,
      decisionVelocitySummary: null,
      whatChanged: null,
      crossAssessmentIntelligence: null,
      contradictionMap: null,
      irreversibility: null,
      returnBriefs,
      governedMemory: null,
      updatedAt: livingCase.createdAt || generatedAt,
      lastEvidenceAt: livingCase.createdAt || generatedAt,
    };

    const journey = await getDiagnosticJourney({
      email: livingCase.email ?? undefined,
      subjectId: livingCase.subjectKey ?? undefined,
    });

    const outcomeWhere = [
      ...(journey?.id ? [{ baselineJourneyId: journey.id }, { followUpJourneyId: journey.id }] : []),
      ...(latestExecutionRecord?.sessionId ? [{ sessionId: latestExecutionRecord.sessionId }] : []),
    ];
    const latestOutcome = outcomeWhere.length > 0
      ? await prisma.outcomeVerificationRecord.findFirst({
          where: { OR: outcomeWhere },
          orderBy: { createdAt: "desc" },
          select: { outcomeClassification: true, createdAt: true },
        }).catch(() => null)
      : null;
    caseCard.outcomeStatus = latestOutcome?.outcomeClassification || null;

    const journeyStages = Object.entries(journey.stages).map(([stage, payload]) => ({
      stage,
      createdAt: findStageTimestamp(journey, stage),
      payload,
    }));

    if (journeyStages.length > 0) {
      const governedMemory = [
        ...buildGovernedMemoryFromEvidenceStages(
          journeyStages,
          { relatedCaseId: livingCase.caseId },
        ),
        ...buildPatternRecurrenceMemory({
          caseId: livingCase.caseId,
          sourceSurface: "DECISION_CENTRE",
          capturedAt: caseCard.updatedAt,
          status: patternRecurrence?.status ?? null,
          priorCount: patternRecurrence?.priorCount,
          explanation: patternRecurrence?.explanation ?? null,
        }),
        ...buildVerificationBoundaryMemory({
          caseId: livingCase.caseId,
          verificationCriteria: Object.values(journey.stages)
            .map((payload) => extractAssessmentEvidenceCapture(payload).verificationCriteria ?? null)
            .filter((value): value is string => Boolean(value))
            .at(-1) ?? null,
          outcomeStatus: caseCard.outcomeStatus,
          capturedAt: latestOutcome?.createdAt ?? caseCard.updatedAt,
        }),
      ];
      // ── PURPOSE ALIGNMENT EVIDENCE ──
      const paEvidence = await loadPurposeAlignmentEvidence({
        email: livingCase.email ?? undefined,
        subjectId: livingCase.subjectKey ?? undefined,
      });
      const paMemoryItems = convertPurposeAlignmentToGovernedMemory(paEvidence);
      if (paMemoryItems.length > 0) {
        governedMemory.push(...paMemoryItems);
      }

      const { loadCheckpointsForCase } = await import("@/lib/product/checkpoint-service");
      const caseCheckpoints = await loadCheckpointsForCase(livingCase.caseId);
      const sortedCaseCheckpoints = [...caseCheckpoints].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const firstCheckpoint = sortedCaseCheckpoints[0] ?? null;
      const firstRespondedCheckpoint = sortedCaseCheckpoints.find((checkpoint) => Boolean(checkpoint.respondedAt)) ?? null;
      const firstCompletedCheckpoint = sortedCaseCheckpoints.find((checkpoint) => checkpoint.responseStatus === "COMPLETED") ?? null;
      const latestCheckpoint = sortedCaseCheckpoints.at(-1) ?? null;
      const monthlyExposureBand = classifyFinancialExposureBand(monthlyCost);
      caseCard.irreversibility = deriveCaseIrreversibility({
        monthlyCost,
        createdAt: livingCase.createdAt,
        unresolvedContradictions: livingCase.contradictions.length,
        blockedDecisions: blockedDecisionCount,
        boardroomQualified: boardroomQualification.qualified,
        sourceLabel: "Recorded case signals",
        nextAction: caseCard.nextRequiredAction,
      });

      if (firstCheckpoint) {
        caseCard.decisionVelocity = buildDecisionVelocitySnapshot({
          caseId: livingCase.caseId,
          journeyId: journey.journeyKey,
          userId: livingCase.subjectKey,
          userEmail: livingCase.email,
          sourceSurface: latestCheckpoint?.surface ?? "DECISION_CENTRE",
          diagnosisAt: journey.startedAt,
          checkpointCreatedAt: firstCheckpoint.createdAt,
          firstResponseAt: firstRespondedCheckpoint?.respondedAt ?? null,
          completedAt: firstCompletedCheckpoint?.respondedAt ?? null,
          responseStatus: latestCheckpoint?.responseStatus ?? null,
          outcomeClassification: caseCard.outcomeStatus,
        });
        governedMemory.push(...buildDecisionVelocityMemoryItems(caseCard.decisionVelocity));
      }
      caseCard.decisionVelocitySummary = buildDecisionVelocitySummary({
        checkpoints: sortedCaseCheckpoints.map((checkpoint) => ({
          createdAt: checkpoint.createdAt,
          dueAt: checkpoint.dueAt,
          responseStatus: checkpoint.responseStatus ?? null,
          respondedAt: checkpoint.respondedAt ?? null,
        })),
        scope: caseCard.scope,
        sourceLabel: "Checkpoint history",
        generatedAt,
        sourceSurfaces: ["Checkpoint history", "Decision Centre"],
      });

      const comparable = deriveComparableStates({
        livingCase,
        journey,
        checkpoints: sortedCaseCheckpoints.map((checkpoint) => ({
          createdAt: checkpoint.createdAt,
          dueAt: checkpoint.dueAt,
          responseStatus: checkpoint.responseStatus ?? null,
          respondedAt: checkpoint.respondedAt ?? null,
        })),
        decisionVelocity: caseCard.decisionVelocity ?? null as any,
        financialExposureBand: monthlyExposureBand,
        irreversibilityBand: caseCard.irreversibility?.level ?? null,
        strategyRoomExecutionStatus: latestDecisionLog?.status?.toUpperCase() ?? null,
        counselCaseStatus: counselTriggered ? "OPEN_SIGNAL" : null,
      });
      caseCard.whatChanged = buildWhatChangedSummary({
        previous: comparable.previous,
        current: comparable.current,
        scope: caseCard.scope,
        sourceLabel: "Case comparison engine",
        evidencePosture: "SYSTEM_INFERRED",
        generatedAt,
      });
      caseCard.crossAssessmentIntelligence = buildCrossAssessmentIntelligence({
        livingCase,
        scope: caseCard.scope,
        stages: buildCrossAssessmentSignals({
          journey,
          livingCase,
          latestDecisionLogStatus: latestDecisionLog?.status ?? null,
        }),
        purposeAlignment: paEvidence,
        strategyRoomActive: caseCard.strategyRoomActive,
        latestCheckpointStatus: latestCheckpoint?.responseStatus ?? latestCheckpoint?.status ?? null,
        generatedAt,
      });
      caseCard.contradictionMap = buildContradictionMapView({
        scope: caseCard.scope,
        livingCase,
        createdAt: livingCase.createdAt,
        generatedAt,
        nextAction: caseCard.nextRequiredAction,
      });

      caseCard.governedMemory = governedMemory.length ? governedMemory : null;
      caseCard.scope.journeyId = journey.journeyKey;
    }

    const retainerReadiness = deriveRetainerReadiness({
      livingCase,
      recurrence: patternRecurrence,
      boardroomQualified: boardroomQualification.qualified,
      counselTriggered,
      costBasisAvailable: Boolean(monthlyCost),
      unresolvedCommitments,
      credit,
      outcomeStatus: caseCard.outcomeStatus,
    });
    if (
      retainerReadiness &&
      (retainerReadiness.level === "MEDIUM" || retainerReadiness.level === "HIGH") &&
      creditGovernanceExplanation &&
      credit?.trend === "declining"
    ) {
      retainerReadiness.reason = `${retainerReadiness.reason} ${creditGovernanceExplanation}`;
      retainerReadiness.signals = [...new Set([...(retainerReadiness.signals || []), "decision credit weakening"])];
    }

    const retainerContext = await resolveRetainerContext({
      organisationName: livingCase.organisation,
      caseId: livingCase.caseId,
    });
    caseCard.boardroom = caseCard.boardroom
      ? { ...caseCard.boardroom, historyCount: retainerContext.boardroomHistoryCount }
      : caseCard.boardroom;
    if (retainerReadiness && retainerContext.cadence) {
      retainerReadiness.cadenceStatus = retainerContext.cadence.status;
      if (retainerContext.cadence.status !== "ON_TRACK" && retainerContext.cadence.status !== "FIRST_CYCLE_PENDING") {
        retainerReadiness.signals = [...new Set([...(retainerReadiness.signals || []), `cadence ${retainerContext.cadence.status.toLowerCase()}`])];
      }
    }

    caseCard.retainerReadiness = retainerReadiness;
    caseCard.lastEvidenceAt = latestEvidenceTimestamp({
      livingCase,
      journey,
      latestOutcome,
    });
    caseCard.updatedAt = caseCard.lastEvidenceAt;

    const executiveRunMatch = requestedExecutiveRunId
      ? await prisma.executiveReportingRun.findFirst({
          where: {
            OR: [{ id: requestedExecutiveRunId }, { runKey: requestedExecutiveRunId }],
            email,
          },
          select: { id: true, runKey: true },
        }).catch(() => null)
      : null;
    if (executiveRunMatch) {
      caseCard.scope.executiveRunId = executiveRunMatch.id;
    }

    let checkpointSections: DecisionCentreResponse["checkpoints"] = {
      requiresResponse: [],
      recentResponses: [],
    };
    try {
      const { loadDueCheckpointsForUser } = await import("@/lib/product/checkpoint-service");
      const checkpoints = await loadDueCheckpointsForUser({ email });
      const mapped = checkpoints.map((c) => ({
        id: c.id,
        sourceSurface: c.surface,
        sourceLabel: c.sourceLabel ?? `Checkpoint from ${c.surface.replace(/_/g, " ").toLowerCase()}`,
        evidencePosture: c.evidencePosture ?? "SYSTEM_INFERRED",
        commandTitle: c.commandTitle,
        verificationQuestion: c.verificationQuestion,
        dueAt: c.dueAt,
        status: c.status,
        responseStatus: c.responseStatus ?? null,
        respondedAt: c.respondedAt ?? null,
        evidenceNote: c.evidenceNote ?? null,
      }));
      checkpointSections = {
        requiresResponse: mapped.filter((checkpoint) => checkpoint.status !== "RESPONDED"),
        recentResponses: mapped.filter((checkpoint) => checkpoint.status === "RESPONDED"),
      };
    } catch { /* best-effort */ }

    caseCard.urgencyReasons = buildUrgencyReasons({
      requiresResponse: checkpointSections.requiresResponse,
      recentResponses: checkpointSections.recentResponses,
      caseCard,
    });

    const matchesRequestedScope =
      (!requestedCaseId || caseCard.caseId === requestedCaseId)
      && (!requestedJourneyId || caseCard.scope.journeyId === requestedJourneyId)
      && (!requestedStrategyRoomSessionId
        || caseCard.scope.strategyRoomSessionId === requestedStrategyRoomSessionId
        || caseCard.returnBriefs.some((item) => item.sessionId === requestedStrategyRoomSessionId || item.sessionKey === requestedStrategyRoomSessionId))
      && (!requestedExecutiveRunId || executiveRunMatch != null);

    const cases = matchesRequestedScope ? [caseCard] : [];
    const ranked = [...cases].sort((a, b) => urgencyScore(b.urgencyReasons ?? []) - urgencyScore(a.urgencyReasons ?? []));
    const mostUrgentCase = ranked[0] && (ranked[0].urgencyReasons?.length ?? 0) > 0
      ? { caseId: ranked[0].caseId, reasons: ranked[0].urgencyReasons ?? [] }
      : null;
    const dataQuality: IntelligenceDataQuality = cases.length === 0
      ? "EMPTY"
      : accountWide
        ? "ACCOUNT_SCOPED"
        : caseCard.decisionVelocitySummary?.meta.dataQuality === "MATURE"
          || caseCard.crossAssessmentIntelligence?.meta.dataQuality === "MATURE"
          || caseCard.contradictionMap?.meta.dataQuality === "MATURE"
          ? "MATURE"
          : "CASE_SCOPED";

    res.setHeader("Cache-Control", "private, no-cache");
    return res.status(200).json({
      ok: true,
      generatedAt,
      dataQuality,
      evidencePosture: cases.some((item) => item.crossAssessmentIntelligence || item.contradictionMap)
        ? "SYSTEM_INFERRED"
        : "INSUFFICIENT_DATA",
      scope: caseCard.scope,
      provenance: cases.flatMap((item) => [
        ...(item.decisionVelocitySummary?.meta.provenance ?? []),
        ...(item.whatChanged?.meta.provenance ?? []),
        ...(item.crossAssessmentIntelligence?.meta.provenance ?? []),
        ...(item.contradictionMap?.meta.provenance ?? []),
      ]),
      emptyState: cases.length === 0 ? {
        reason: "No case-bound intelligence could be matched to this scope.",
        nextAction: "Open the original case surface or complete another governed stage.",
      } : undefined,
      retainerMemoryPreview: retainerContext.retainerMemoryPreview,
      cases,
      mostUrgentCase,
      checkpoints: checkpointSections,
      commercial: {
        ownedProducts: owned,
        eligibleProducts: eligible,
        restrictedProducts: restricted,
      },
      credit,
    } as any);
  } catch (error) {
    console.error("[decision-centre/cases]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}
