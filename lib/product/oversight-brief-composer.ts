import { prisma } from "@/lib/prisma.server";
import { getCreditProfile } from "@/lib/decision-ledger/ledger-service";
import { deriveDecisionCreditGovernanceEffect } from "@/lib/product/decision-credit-governance";
import { loadOversightAccount } from "@/lib/product/oversight-account-loader";
import { buildOversightSignals } from "@/lib/product/oversight-signal-builder";
import { buildBuyerVisibleCadencePosture, loadLatestRetainedReviewCycleForAccount } from "@/lib/product/retained-cadence-service";
import { listRetainedReviewCycles } from "@/lib/product/retained-cadence-service";
import type { RetainedReviewCycle } from "@/lib/product/retained-cadence-contract";
import { loadControlRoomState } from "@/lib/product/control-room-state-loader";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import { projectOversightCycleConsequence } from "@/lib/product/oversight-cycle-consequence-projection";
import type { OversightCycle, RetainerOversightAccount } from "@/lib/product/retainer-oversight-contract";
import { describeOversightContinuity } from "@/lib/product/governed-memory-presenter";
import {
  loadPurposeAlignmentEvidence,
  buildOversightBriefPaAggregate,
} from "@/lib/alignment/evidence-loader";
import { loadLatestBehavioralSignalSnapshots } from "@/lib/behavioral/behavioral-signal-snapshot-store";
import { buildBehavioralTrendSummaryFromSnapshots } from "@/lib/behavioral/behavioral-trend-engine";
import type { BehavioralTrendDirection, BehavioralTrendSummary } from "@/lib/behavioral/behavioral-trend-contract";
import { loadPriorArchivedOversightCycles } from "@/lib/product/oversight-cycle-archive";
import { buildRetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-engine";
import type { RetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-contract";
import { createSuppressionInput } from "@/lib/product/suppression-event-helpers";
import { recordSuppression } from "@/lib/product/suppression-ledger";
import { fetchUserBehavioralData } from "@/lib/integrations";

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function toIso(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function periodDefaultStart(end: Date): string {
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return start.toISOString();
}

function previousPeriodStart(currentStartIso: string, currentEndIso: string): string {
  const currentStart = new Date(currentStartIso);
  const currentEnd = new Date(currentEndIso);
  const durationMs = Math.max(currentEnd.getTime() - currentStart.getTime(), 24 * 60 * 60 * 1000);
  return new Date(currentStart.getTime() - durationMs).toISOString();
}

function normalizeEmail(value?: string | null) {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : null;
}

function behavioralTrendPriority(direction: BehavioralTrendDirection): number {
  switch (direction) {
    case "DETERIORATING": return 4;
    case "RECURRING": return 3;
    case "IMPROVING": return 2;
    case "STABLE": return 1;
    default: return 0;
  }
}

function buildBehavioralTrendCopy(direction: BehavioralTrendDirection): string {
  switch (direction) {
    case "IMPROVING":
      return "Behavioral signals are improving across the current review window. Recent operating patterns are moving in a healthier direction.";
    case "DETERIORATING":
      return "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.";
    case "STABLE":
      return "Behavioral signals are stable across the current review window. No material movement is visible from the current evidence.";
    default:
      return "Behavioral trend evidence is insufficient for a cycle-over-cycle reading.";
  }
}

export function hasBehavioralTrendRecurrenceEvidence(
  summary?: BehavioralTrendSummary | null,
): boolean {
  if (!summary || summary.overallDirection !== "DETERIORATING") {
    return false;
  }

  return Boolean(
    summary.hasRecurrence
    || summary.metrics.some((metric) => metric.direction === "RECURRING")
    || summary.repeatedDriftSignals?.length,
  );
}

export function buildBehavioralTrendStructuredAction(
  summary?: BehavioralTrendSummary | null,
): NonNullable<OversightBrief["structuredActions"]>[number] | null {
  if (!hasBehavioralTrendRecurrenceEvidence(summary)) {
    return null;
  }

  return {
    id: "act_behavioral_trend_deterioration",
    scopeType: "ACCOUNT",
    actionType: "REVIEW_OPERATING_CADENCE",
    action: "Recurring behavioral deterioration is visible across oversight windows. Review operating cadence and unresolved commitments before the next oversight cycle.",
    evidenceBasis: summary!.summary,
    severity: "HIGH",
    continuitySourceLabel: "Derived from persisted behavioral snapshot comparison",
    continuityConfidenceLabel: "AGGREGATED",
  };
}

function retainerCycleMemoryActionSeverity(
  summary: RetainerCycleMemorySummary,
): NonNullable<OversightBrief["structuredActions"]>[number]["severity"] {
  if (summary.findings.some((finding) => finding.severity === "CRITICAL")) return "CRITICAL";
  if (summary.findings.some((finding) => finding.severity === "HIGH")) return "HIGH";
  if (summary.findings.some((finding) => finding.severity === "MEDIUM")) return "MEDIUM";
  return "LOW";
}

export function buildRetainerCycleMemoryStructuredAction(
  summary?: RetainerCycleMemorySummary | null,
): NonNullable<OversightBrief["structuredActions"]>[number] | null {
  if (!summary?.escalationRequired || summary.escalationLevel === "NONE") {
    return null;
  }

  const severity = retainerCycleMemoryActionSeverity(summary);
  switch (summary.escalationLevel) {
    case "OPERATING_CADENCE_RESET":
      return {
        id: "act_retainer_cycle_memory_cadence",
        scopeType: "ACCOUNT",
        actionType: "REVIEW_OPERATING_CADENCE",
        action: "Retained cycle memory shows repeated behavioral deterioration or evidence continuity failure. Review operating cadence before the next oversight cycle.",
        evidenceBasis: summary.summary,
        severity,
        continuitySourceLabel: "Retained cycle memory across archived oversight cycles",
        continuityConfidenceLabel: "AGGREGATED",
      };
    case "RETAINED_INTERVENTION":
      return {
        id: "act_retainer_cycle_memory_intervention",
        scopeType: "ACCOUNT",
        actionType: "REVIEW_OPERATING_CADENCE",
        action: "Behavioral deterioration persisted after a prior warning. Move from warning to retained intervention before the next cycle.",
        evidenceBasis: summary.summary,
        severity,
        continuitySourceLabel: "Retained cycle memory across archived oversight cycles",
        continuityConfidenceLabel: "AGGREGATED",
      };
    case "BOARDROOM_REVIEW":
      return {
        id: "act_retainer_cycle_memory_boardroom",
        scopeType: "ACCOUNT",
        actionType: "GENERATE_BOARDROOM_DOSSIER",
        action: "Behavioral deterioration persisted after intervention. Prepare board-level retained review of operating cadence and enforcement history.",
        evidenceBasis: summary.summary,
        severity,
        continuitySourceLabel: "Retained cycle memory across archived oversight cycles",
        continuityConfidenceLabel: "AGGREGATED",
      };
    case "COUNSEL_REVIEW":
      return {
        id: "act_retainer_cycle_memory_counsel",
        scopeType: "ACCOUNT",
        actionType: "ESCALATE_COUNSEL",
        action: "Behavioral deterioration persisted after intervention alongside governance pressure. Escalate to counsel review.",
        evidenceBasis: summary.summary,
        ownerRole: "COUNSEL",
        severity,
        continuitySourceLabel: "Retained cycle memory across archived oversight cycles",
        continuityConfidenceLabel: "AGGREGATED",
      };
    default:
      return null;
  }
}

function matchesRetainedCycleScope(cycle: RetainedReviewCycle, input: {
  accountId?: string | null;
  organisationId?: string | null;
  sponsorUserId?: string | null;
  sponsorEmail?: string | null;
}) {
  const sponsorEmail = normalizeEmail(input.sponsorEmail);
  return (
    (!input.accountId || cycle.accountId === input.accountId)
    && (!input.organisationId || cycle.organisationId === input.organisationId)
    && (!input.sponsorUserId || cycle.sponsorUserId === input.sponsorUserId)
    && (!sponsorEmail || normalizeEmail(cycle.sponsorEmail) === sponsorEmail)
  );
}

export function aggregateBehavioralTrendSummaries(
  userId: string,
  summaries: BehavioralTrendSummary[],
): BehavioralTrendSummary | null {
  if (summaries.length === 0) return null;

  const sorted = [...summaries].sort((a, b) =>
    behavioralTrendPriority(b.overallDirection) - behavioralTrendPriority(a.overallDirection)
    || b.metrics.length - a.metrics.length,
  );
  const representative = sorted[0]!;
  const allMetrics = summaries.flatMap((summary) => summary.metrics);
  const hasDeterioration = summaries.some((summary) => summary.hasDeterioration);
  const hasRecurrence = summaries.some((summary) => summary.hasRecurrence)
    || summaries.some((summary) => summary.metrics.some((metric) => metric.direction === "RECURRING"));
  const repeatedDriftSignals = [...new Set(
    summaries.flatMap((summary) => summary.repeatedDriftSignals ?? []),
  )];
  const insufficientDataKeys = [...new Set(summaries.flatMap((summary) => summary.insufficientDataKeys))];

  return {
    userId,
    source: summaries.length === 1 ? representative.source : "behavioral",
    computedAt: new Date().toISOString(),
    metrics: allMetrics,
    overallDirection: representative.overallDirection,
    summary: buildBehavioralTrendCopy(representative.overallDirection),
    hasDeterioration,
    hasRecurrence,
    repeatedDriftSignals,
    insufficientDataKeys,
  };
}

function buildExecutiveSummary(input: {
  activeCaseCount: number;
  signalCount: number;
  costOfInactionTotal: number;
  boardroomCount: number;
  counselCount: number;
  deterioratedCount: number;
  retainedCyclesReviewed: number;
}): string {
  if (input.activeCaseCount === 0) {
    return "No active cases could be assembled for this oversight period.";
  }

  const clauses = [
    `${input.activeCaseCount} active case${input.activeCaseCount === 1 ? "" : "s"} reviewed`,
    `${input.signalCount} material oversight signal${input.signalCount === 1 ? "" : "s"} detected`,
  ];

  if (input.costOfInactionTotal > 0) {
    clauses.push(`estimated cost of inaction ${input.costOfInactionTotal}`);
  }
  if (input.counselCount > 0) {
    clauses.push(`${input.counselCount} counsel trigger${input.counselCount === 1 ? "" : "s"}`);
  }
  if (input.boardroomCount > 0) {
    clauses.push(`${input.boardroomCount} boardroom-qualified case${input.boardroomCount === 1 ? "" : "s"}`);
  }
  if (input.deterioratedCount > 0) {
    clauses.push(`${input.deterioratedCount} deteriorated outcome${input.deterioratedCount === 1 ? "" : "s"}`);
  }
  if (input.retainedCyclesReviewed > 0) {
    clauses.push(`${input.retainedCyclesReviewed} retained enforcement cycle${input.retainedCyclesReviewed === 1 ? "" : "s"} reviewed`);
  }

  return clauses.join("; ") + ".";
}

function buildCycle(input: {
  accountId: string;
  periodStart: string;
  periodEnd: string;
  caseCount: number;
  counselReviewsTriggered: number;
  boardroomDossiersGenerated: number;
  verifiedOutcomes: number;
  unresolvedCommitments: number;
  costOfInactionEstimate?: number;
  escalationRequired: boolean;
}): OversightCycle {
  return {
    cycleId: `cycle:${input.accountId}:${input.periodStart.slice(0, 10)}`,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    status: input.caseCount === 0
      ? "NOT_STARTED"
      : input.escalationRequired
        ? "ESCALATION_REQUIRED"
        : "BRIEF_READY",
    casesReviewed: input.caseCount,
    casesEscalated: input.counselReviewsTriggered + input.boardroomDossiersGenerated,
    boardroomDossiersGenerated: input.boardroomDossiersGenerated,
    counselReviewsTriggered: input.counselReviewsTriggered,
    verifiedOutcomes: input.verifiedOutcomes,
    unresolvedCommitments: input.unresolvedCommitments,
    costOfInactionEstimate: input.costOfInactionEstimate,
  };
}

export async function composeOversightBrief(input: {
  userId?: string;
  email?: string;
  organisationId?: string;
  periodStart?: string;
  periodEnd?: string;
}): Promise<{
  brief?: OversightBrief;
  account?: RetainerOversightAccount;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const periodEnd = toIso(input.periodEnd, new Date().toISOString());
  const periodStart = toIso(input.periodStart, periodDefaultStart(new Date(periodEnd)));

  const loaded = await loadOversightAccount(input);
  warnings.push(...loaded.warnings);

  if (!loaded.account) {
    warnings.push("No retainer oversight account could be composed from current evidence.");
    return { warnings };
  }

  const latestRetainedCycle = await loadLatestRetainedReviewCycleForAccount({
    accountId: loaded.account.accountId,
    organisationId: input.organisationId ?? loaded.account.organisationId,
    sponsorUserId: input.userId ?? loaded.account.ownerUserId,
    sponsorEmail: input.email ?? undefined,
  });
  const retainedCadence = buildBuyerVisibleCadencePosture(latestRetainedCycle);

  const creditProfile = input.email ? await getCreditProfile(input.email.toLowerCase()) : null;
  if (!creditProfile && input.email) {
    warnings.push("Decision credit profile was unavailable for this oversight scope.");
  }

  const controlRoom = input.organisationId
    ? await loadControlRoomState({
        userId: input.userId ?? null,
        email: input.email ?? null,
        organisationId: input.organisationId,
      })
    : null;

  if (input.organisationId && !controlRoom?.state) {
    warnings.push("Organisation Control Room state was unavailable. Divergence signals remain partial.");
  }

  // ── TEAM AGGREGATE EVIDENCE ──
  // Source join: organisationId (DERIVED) > sponsorUserId > none.
  // createdByEmail does NOT exist on TeamAssessmentCampaign.
  let teamAggregate: Parameters<typeof buildOversightSignals>[0]["teamAggregate"] = null;
  try {
    const p = prisma as any;
    if (p?.teamAssessmentCampaign?.findFirst) {
      const whereClause = input.organisationId
        ? { organisationId: input.organisationId }
        : input.userId
          ? { sponsorUserId: input.userId }
          : null;
      const campaign = whereClause
        ? await p.teamAssessmentCampaign.findFirst({
            where: whereClause,
            include: { aggregate: true },
            orderBy: { createdAt: "desc" },
          })
        : null;
      if (campaign?.aggregate && campaign.aggregate.respondentCount >= 3) {
        const domains = typeof campaign.aggregate.domainsJson === "string"
          ? JSON.parse(campaign.aggregate.domainsJson)
          : campaign.aggregate.domainsJson ?? {};
        const gaps = Object.entries(domains)
          .filter(([, v]: [string, any]) => typeof v?.deltaFromLeader === "number" && v.deltaFromLeader !== null)
          .sort(([, a]: [string, any], [, b]: [string, any]) => Math.abs(b.deltaFromLeader) - Math.abs(a.deltaFromLeader));
        const largest = gaps[0] as [string, any] | undefined;
        const trustDomain = domains.trust_communication ?? domains.trust ?? null;
        teamAggregate = {
          largestGapDomain: largest ? largest[0].replace(/_/g, " ") : undefined,
          largestGapDelta: largest ? Math.abs(largest[1].deltaFromLeader) : undefined,
          trustScore: trustDomain?.teamMean ?? undefined,
          respondentCount: campaign.aggregate.respondentCount,
          claimLevel: campaign.aggregate.claimLevel,
        };
      }
    }
  } catch { /* degrade gracefully */ }

  // ── ENTERPRISE STRAIN EVIDENCE ──
  let enterpriseStrain: Parameters<typeof buildOversightSignals>[0]["enterpriseStrain"] = null;
  try {
    const p = prisma as any;
    if (p?.organisationAssessmentSnapshot?.findFirst && input.organisationId) {
      const snapshot = await p.organisationAssessmentSnapshot.findFirst({
        where: { organisationId: input.organisationId },
        orderBy: { createdAt: "desc" },
      });
      if (snapshot) {
        const weakest = typeof snapshot.weakestDomainsJson === "string"
          ? JSON.parse(snapshot.weakestDomainsJson)
          : snapshot.weakestDomainsJson ?? [];
        enterpriseStrain = {
          fragilitySignal: snapshot.fragilitySignal ?? undefined,
          percentScore: snapshot.percentScore ?? undefined,
          weakestDomains: Array.isArray(weakest) ? weakest : undefined,
        };
      }
    }
  } catch { /* degrade gracefully */ }

  // ── CHECKPOINT OUTCOME SIGNALS ──
  let checkpointSignalCount = 0;
  try {
    const { loadDueCheckpointsForUser } = await import("@/lib/product/checkpoint-service");
    const checkpoints = await loadDueCheckpointsForUser({ email: input.email ?? undefined, userId: input.userId ?? undefined });
    const overdue = checkpoints.filter((c) => c.status === "OVERDUE");
    const blocked = checkpoints.filter((c) => c.responseStatus === "BLOCKED");
    const abandoned = checkpoints.filter((c) => c.responseStatus === "ABANDONED");
    checkpointSignalCount = overdue.length + blocked.length + abandoned.length;
  } catch { /* degrade gracefully */ }

  // ── BEHAVIORAL DATA — calendar and communication corroboration ──
  let behavioralSources: Parameters<typeof buildOversightSignals>[0]["behavioralSources"] = null;
  let behavioralEvidenceStatus: OversightBrief["behavioralEvidenceStatus"] = "unavailable";
  let behavioralTrends: OversightBrief["behavioralTrends"] = null;
  let retainerCycleMemory: OversightBrief["retainerCycleMemory"] = null;
  let behavioralUserId: string | null = input.userId ?? null;
  if (!behavioralUserId && loaded.account.ownerEmail) {
    try {
      const resolvedUser = await prisma.user.findFirst({
        where: { email: loaded.account.ownerEmail.trim().toLowerCase() },
        select: { id: true },
      });
      behavioralUserId = resolvedUser?.id ?? null;
      if (!behavioralUserId) {
        console.warn("[oversight-brief] behavioral user resolution skipped fetch", {
          userIdPresent: Boolean(input.userId),
          emailPresent: Boolean(loaded.account.ownerEmail),
        });
      }
    } catch (error) {
      console.warn("[oversight-brief] behavioral user resolution failed", {
        userIdPresent: Boolean(input.userId),
        emailPresent: Boolean(loaded.account.ownerEmail),
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : "Unknown behavioral user resolution failure",
      });
    }
  }

  if (behavioralUserId) {
    try {
      behavioralSources = await fetchUserBehavioralData(behavioralUserId);
      behavioralEvidenceStatus = behavioralSources.length === 0
        ? "unavailable"
        : behavioralSources.every((source) => source.evidencePosture === "persisted")
          ? "snapshot"
          : "live";
    } catch (error) {
      // Behavioral data is corroborative, not blocking — the brief still proceeds.
      // Log safe degradation metadata only. Never log tokens, attendee data, or event content.
      console.warn("[oversight-brief] behavioral data fetch failed", {
        userIdPresent: Boolean(behavioralUserId),
        emailPresent: Boolean(loaded.account.ownerEmail),
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : "Unknown behavioral data fetch failure",
      });
      behavioralSources = null;
      behavioralEvidenceStatus = "unavailable";
    }

    try {
      const snapshots = await loadLatestBehavioralSignalSnapshots({
        userId: behavioralUserId,
        maxAgeMinutes: 90 * 24 * 60,
        limit: 500,
      });
      const snapshotSources = [...new Set(snapshots.map((snapshot) => snapshot.source))];
      const summaries = snapshotSources
        .map((source) => buildBehavioralTrendSummaryFromSnapshots(
          behavioralUserId!,
          source,
          snapshots.filter((snapshot) => snapshot.source === source),
          periodStart,
          periodEnd,
          previousPeriodStart(periodStart, periodEnd),
        ))
        .filter((summary): summary is BehavioralTrendSummary => Boolean(summary));
      behavioralTrends = aggregateBehavioralTrendSummaries(behavioralUserId, summaries);
      if (behavioralTrends) {
        behavioralTrends.summary = buildBehavioralTrendCopy(behavioralTrends.overallDirection);
      }
    } catch (error) {
      warnings.push("Behavioral trend summary could not be constructed from persisted snapshots. Historical behavior comparison remains unavailable for this cycle.");
      console.warn("[oversight-brief] behavioral trend summary failed", {
        userIdPresent: Boolean(behavioralUserId),
        emailPresent: Boolean(loaded.account.ownerEmail),
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  // Sovereign signals are caller-supplied in v0; composeOversightBrief does not invoke the sovereign engine directly.
  const signals = buildOversightSignals({
    cases: loaded.cases,
    creditProfile,
    controlRoomState: controlRoom?.state ?? null,
    teamAggregate,
    enterpriseStrain,
    retainedEnforcement: loaded.retainedEnforcement ?? null,
    retainedCadence,
    behavioralSources,
  });

  if (loaded.account.accountId) {
    try {
      const priorArchives = await loadPriorArchivedOversightCycles({
        accountId: loaded.account.accountId,
        beforePeriodStart: periodStart,
        limit: 6,
      });
      const priorBehavioralTrends = priorArchives.map(({ record, internalBrief }) => ({
        cycleId: record.cycleId,
        observedAt: record.periodEnd,
        behavioralTrends: internalBrief?.behavioralTrends ?? null,
        behavioralEvidenceStatus: internalBrief?.behavioralEvidenceStatus ?? "unavailable",
      }));
      const priorStructuredActions = priorArchives.flatMap(({ record, internalBrief }) => {
        const trendSummary = internalBrief?.behavioralTrends;
        const hasCadenceWarning = internalBrief?.structuredActions?.some(
          (action) => action.actionType === "REVIEW_OPERATING_CADENCE",
        );
        if (!trendSummary || !hasCadenceWarning) {
          return [];
        }
        return trendSummary.metrics
          .filter((metric) => metric.direction === "DETERIORATING" || metric.direction === "RECURRING")
          .map((metric) => ({
            actionType: "REVIEW_OPERATING_CADENCE" as const,
            source: trendSummary.source,
            signalKey: metric.signalKey,
            createdAt: record.periodEnd,
          }));
      });
      const retainedEnforcementCycles = (await listRetainedReviewCycles())
        .filter((cycle) => matchesRetainedCycleScope(cycle, {
          accountId: loaded.account?.accountId,
          organisationId: loaded.account?.organisationId,
          sponsorUserId: behavioralUserId ?? loaded.account?.ownerUserId ?? null,
          sponsorEmail: loaded.account?.ownerEmail ?? input.email ?? null,
        }))
        .slice(0, 12)
        .map((cycle) => ({
          cycleId: cycle.cycleId,
          cadenceState: cycle.cadenceState,
          completedAt: cycle.completedAt ?? null,
          skippedAt: cycle.skippedAt ?? null,
          escalatedAt: cycle.escalationReason ? cycle.updatedAt : null,
          escalationReason: cycle.escalationReason ?? null,
          updatedAt: cycle.updatedAt ?? null,
        }));
      retainerCycleMemory = buildRetainerCycleMemorySummary({
        generatedAt: new Date().toISOString(),
        accountId: loaded.account.accountId,
        userId: behavioralUserId ?? loaded.account.ownerUserId ?? null,
        currentBehavioralTrends: behavioralTrends,
        currentBehavioralEvidenceStatus: behavioralEvidenceStatus,
        priorBehavioralTrends,
        priorStructuredActions,
        retainedEnforcementCycles,
        governanceFlags: {
          counselReviewRequired: signals.some((signal) =>
            signal.type === "COUNSEL_REVIEW_TRIGGERED"
            || signal.type === "COUNSEL_OR_BOARDROOM_REVIEW",
          ),
          boardroomReviewRequired: signals.some((signal) =>
            signal.type === "BOARDROOM_THRESHOLD_MET",
          ),
        },
      });
    } catch (error) {
      warnings.push("Retained cycle memory could not be assembled from prior oversight cycles. This cycle proceeds without recurrence memory.");
      console.warn("[oversight-brief] retainer cycle memory failed", {
        accountIdPresent: Boolean(loaded.account.accountId),
        userIdPresent: Boolean(behavioralUserId ?? loaded.account.ownerUserId),
        emailPresent: Boolean(loaded.account.ownerEmail ?? input.email),
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  // Inject checkpoint-level signals from the efficacy system
  if (checkpointSignalCount > 0) {
    signals.push({
      id: "efficacy:checkpoint-attention",
      type: "CHECKPOINT_OVERDUE",
      severity: checkpointSignalCount >= 3 ? "HIGH" : "MEDIUM",
      title: `${checkpointSignalCount} checkpoint${checkpointSignalCount === 1 ? "" : "s"} require${checkpointSignalCount === 1 ? "s" : ""} attention`,
      explanation: `The efficacy checkpoint system has detected ${checkpointSignalCount} checkpoint${checkpointSignalCount === 1 ? "" : "s"} that are overdue, user-reported blocked, abandoned, or still awaiting response.`,
      recommendedAction: "Review checkpoint outcomes in Decision Centre before approving this cycle.",
      createdAt: new Date().toISOString(),
    });
  }

  const commitmentsDue = sum(loaded.cases.map((item) =>
    item.verification?.filter((checkpoint) => checkpoint.status === "DUE" || checkpoint.status === "OVERDUE").length ?? 0
  ));
  const commitmentsVerified = sum(loaded.cases.map((item) =>
    item.verification?.filter((checkpoint) =>
      checkpoint.status === "VERIFIED_EXECUTED" || checkpoint.status === "VERIFIED_BLOCKED"
    ).length ?? 0
  ));
  const unresolvedCommitments = sum(loaded.cases.map((item) => item.unresolvedCommitments ?? 0));
  const costSignals = loaded.cases.filter((item) => item.costOfInaction && item.costOfInaction.basis !== "UNAVAILABLE");
  const totalEstimatedCost = sum(costSignals.map((item) => item.costOfInaction?.accumulatedCost ?? 0));
  const boardroomCount = loaded.cases.filter((item) => item.boardroomQualified).length;
  const counselCount = loaded.cases.filter((item) => item.counselTriggered).length;
  const verifiedOutcomeCount = loaded.cases.filter((item) => Boolean(item.outcomeClassification)).length;
  const deterioratedCount = loaded.cases.filter((item) =>
    item.outcomeClassification === "deteriorated" || item.outcomeClassification === "invalid"
  ).length;
  const retainedCyclesReviewed = loaded.retainedEnforcement?.cyclesReviewed ?? 0;
  const escalationRequired = signals.some((signal) =>
    signal.severity === "CRITICAL"
    || signal.type === "COUNSEL_REVIEW_TRIGGERED"
    || signal.type === "COUNSEL_OR_BOARDROOM_REVIEW"
  );

  const cycle = buildCycle({
    accountId: loaded.account.accountId,
    periodStart,
    periodEnd,
    caseCount: loaded.cases.length,
    counselReviewsTriggered: counselCount,
    boardroomDossiersGenerated: boardroomCount,
    verifiedOutcomes: verifiedOutcomeCount,
    unresolvedCommitments,
    costOfInactionEstimate: totalEstimatedCost > 0 ? totalEstimatedCost : undefined,
    escalationRequired,
  });

  const creditGovernance = creditProfile
    ? deriveDecisionCreditGovernanceEffect({
        score: creditProfile.score,
        trend: creditProfile.trend,
        breached: creditProfile.breached,
      })
    : null;

  const requiredActions = [
    ...signals
      .filter((signal) => signal.severity === "CRITICAL" || signal.severity === "HIGH")
      .map((signal) => signal.recommendedAction),
    ...loaded.cases
      .filter((item) => (item.unresolvedCommitments ?? 0) > 0)
      .map((item) => `Verify unresolved commitments for ${item.title}.`),
  ].filter(Boolean);

  const executiveSummary = buildExecutiveSummary({
    activeCaseCount: loaded.cases.length,
    signalCount: signals.length,
    costOfInactionTotal: totalEstimatedCost,
    boardroomCount,
    counselCount,
    deterioratedCount,
    retainedCyclesReviewed,
  });

  // ── PURPOSE ALIGNMENT EVIDENCE AGGREGATE ──
  const paEvidence = await loadPurposeAlignmentEvidence({
    email: input.email ?? undefined,
    subjectId: input.userId ?? undefined,
  });
  const paAggregate = buildOversightBriefPaAggregate(paEvidence);

  const account: RetainerOversightAccount = {
    ...loaded.account,
    currentCycle: cycle,
    oversightSignals: signals,
    nextRequiredAction: requiredActions[0],
  };

  if (loaded.retainerIntakeContext?.suppressionReasons?.length) {
    for (const reason of loaded.retainerIntakeContext.suppressionReasons) {
      void recordSuppression(createSuppressionInput({
        scopeId: loaded.account.organisationId ?? loaded.account.accountId,
        scopeType: loaded.account.organisationId ? "ORGANISATION" : "CONTRACT",
        surface: "OVERSIGHT_BRIEF_COMPOSER",
        fieldName: "retainerIntake",
        evidenceSource: "Retainer intake context",
        evidencePosture: "OPERATOR_RECORDED",
        sourceLabel: "Oversight brief",
        suppressionReason: reason,
        suppressionRule: "INTAKE_SUPPRESSED",
        suppressionRuleCategory: "PRIVACY_BOUNDARY",
        operatorReviewAvailable: true,
      })).catch(() => null);
    }
  }

  const brief: OversightBrief = {
    briefId: `brief:${account.accountId}:${periodStart.slice(0, 10)}`,
    accountId: account.accountId,
    periodStart,
    periodEnd,
    executiveSummary,
    activeCases: loaded.cases.map((item) => ({
      caseId: item.caseId,
      title: item.title,
      state: item.state || "active",
      primaryRisk:
        signals.find((signal) => signal.caseId === item.caseId && (signal.severity === "CRITICAL" || signal.severity === "HIGH"))?.title
        || signals.find((signal) => signal.caseId === item.caseId)?.title,
      nextAction:
        item.verification?.find((checkpoint) => checkpoint.status === "OVERDUE" || checkpoint.status === "DUE")?.prompt
        || (item.counselTriggered ? "Review counsel escalation boundary." : undefined),
    })),
    costOfInaction: totalEstimatedCost > 0
      ? {
          totalEstimated: totalEstimatedCost,
          casesIncluded: costSignals.length,
        }
      : undefined,
    counsel: {
      reviewsTriggered: counselCount,
      requiredNow: signals.filter((signal) =>
        (signal.type === "COUNSEL_REVIEW_TRIGGERED" || signal.type === "COUNSEL_OR_BOARDROOM_REVIEW")
        && signal.severity !== "LOW"
      ).length,
    },
    boardroom: {
      dossiersAvailable: boardroomCount,
      exportsQueued: 0,
    },
    verification: {
      commitmentsDue,
      commitmentsVerified,
      unresolvedBreaches: unresolvedCommitments,
    },
    retainedEnforcement: loaded.retainedEnforcement,
    purposeAlignment: paAggregate,
    retainerIntake: loaded.retainerIntakeContext
      ? {
          source: "RETAINER_INTAKE" as const,
          capturedAt: loaded.retainerIntakeContext.capturedAt,
          mandate: loaded.retainerIntakeContext.mandate,
          oversightScope: loaded.retainerIntakeContext.oversightScope,
          refusalBoundary: loaded.retainerIntakeContext.refusalBoundary ?? null,
          cadenceExpectation: null,
          counselThreshold: null,
          retainedRiskPosture: loaded.retainerIntakeContext.costExposure ?? null,
          clientSafeSummary: loaded.retainerIntakeContext.clientSafeSummary,
          suppressionReasons: loaded.retainerIntakeContext.suppressionReasons,
        }
      : null,
    decisionCredit: creditProfile
      ? {
          score: creditProfile.score,
          trend: creditProfile.trend,
          interpretation: creditGovernance?.explanation,
        }
      : undefined,
    // Deliberately narrowed client-facing signal panel.
    // `account.oversightSignals` retains the full internal signal set for downstream oversight workflows.
    oversightSignals: signals
      .filter((s) =>
        s.type === "TEAM_DIVERGENCE_REPORTED" ||
        s.type === "ENTERPRISE_STRAIN_REPORTED" ||
        s.type === "PATTERN_RECURRED" ||
        s.type === "OUTCOME_DETERIORATED" ||
        s.type === "COST_OF_INACTION_ACCUMULATING" ||
        s.type === "COMMITMENT_UNVERIFIED" ||
        s.type === "RETAINED_REVIEW_OVERDUE" ||
        s.type === "EXECUTION_DRIFT" ||
        s.type === "CHECKPOINT_CONFIRMED" ||
        s.type === "CHECKPOINT_ABANDONED"
      )
      .map((s) => ({
        id: s.id,
        type: s.type,
        severity: s.severity,
        title: s.title,
        explanation: s.explanation,
        recommendedAction: s.recommendedAction,
        sourceLabel: s.sourceLabel ? s.sourceLabel
          : s.type === "TEAM_DIVERGENCE_REPORTED" ? "Source: Team Assessment"
          : s.type === "ENTERPRISE_STRAIN_REPORTED" ? "Source: Enterprise Assessment"
          : s.caseId ? `Source: Case ${s.caseId}` : "Source: Oversight Cycle",
        evidencePosture: s.evidencePosture ? s.evidencePosture
          : s.type === "TEAM_DIVERGENCE_REPORTED" ? "aggregated"
          : s.type === "ENTERPRISE_STRAIN_REPORTED" ? "system-inferred"
          : "system-inferred",
      })),
    behavioralEvidenceStatus,
    behavioralTrends,
    retainerCycleMemory,
    requiredActions: [...new Set(requiredActions)].slice(0, 6),

    // ── Premium intelligence primitives (evidence-only, no fabrication) ──
    // These sections appear only when real evidence exists. If unavailable,
    // they are omitted entirely — not rendered with empty/fake data.

    patternRecurrence: (() => {
      const recurrenceCases = loaded.cases.filter(
        (c) => c.patternRecurrenceStatus === "POSSIBLE_RECURRENCE" || c.patternRecurrenceStatus === "VERIFIED_RECURRENCE",
      );
      if (recurrenceCases.length === 0) return undefined;
      return {
        status: recurrenceCases.some((c) => c.patternRecurrenceStatus === "VERIFIED_RECURRENCE") ? "VERIFIED_RECURRENCE" : "POSSIBLE_RECURRENCE",
        priorCount: recurrenceCases.length,
        explanation: `${recurrenceCases.length} case${recurrenceCases.length !== 1 ? "s show" : " shows"} pattern recurrence across the oversight scope.`,
      };
    })(),

    sovereignSignalRecurrence: (() => {
      const sovereignSignalEvents = signals.filter(
        (s) =>
          s.type === "SOVEREIGN_SIGNAL_PATTERN_RECURRING" ||
          s.type === "SOVEREIGN_SIGNAL_CRITICAL_ACTIVE" ||
          s.type === "PATTERN_RECURRED",
      );
      if (sovereignSignalEvents.length === 0) return null;

      const now = new Date().toISOString();
      const currentCycleSignals = sovereignSignalEvents.map((s, i) => ({
        signalId: s.id,
        signalName: s.title,
        severityBand: (
          s.severity === "CRITICAL" ? "CRITICAL"
          : s.severity === "HIGH" ? "ALERT"
          : s.severity === "MEDIUM" ? "CONCERN"
          : "WATCH"
        ) as "CRITICAL" | "ALERT" | "CONCERN" | "WATCH",
        evidencePosture: s.evidencePosture ?? "SYSTEM_INFERRED",
        isRecurrence: s.type === "PATTERN_RECURRED",
        firstObservedAt: s.createdAt ?? null,
        lastObservedAt: s.createdAt ?? now,
        cycleCount: s.type === "PATTERN_RECURRED" ? 2 : 1,
        movement: (
          s.type === "PATTERN_RECURRED" ? "INCREASING"
          : s.severity === "CRITICAL" ? "UNRESOLVED"
          : "FIRST_OCCURRENCE"
        ) as "INCREASING" | "STABLE" | "REDUCING" | "UNRESOLVED" | "FIRST_OCCURRENCE",
        retainedImplication: s.type === "PATTERN_RECURRED"
          ? "This pattern has appeared across multiple retained oversight cycles. Structural root cause has not been addressed."
          : "First observation in retained oversight record. Monitor across next cycle for movement confirmation.",
        nextReviewObligation: s.type === "PATTERN_RECURRED"
          ? `Verify whether the structural root for "${s.title}" has been addressed before the next oversight cycle closes.`
          : `Track whether "${s.title}" recurs in the next cycle. If repeated, escalate to counsel review.`,
      }));

      const hasCriticalRecurrence = currentCycleSignals.some(
        (s) => s.severityBand === "CRITICAL" && s.isRecurrence,
      );

      const recurringSummary = currentCycleSignals.filter((s) => s.isRecurrence);
      const recurrenceSummary = recurringSummary.length > 0
        ? `${recurringSummary.length} sovereign signal${recurringSummary.length !== 1 ? "s have" : " has"} recurred across oversight cycles. ${hasCriticalRecurrence ? "At least one critical recurrence is active and requires immediate review." : "Pattern movement is being tracked across retained cycles."}`
        : `${currentCycleSignals.length} sovereign signal${currentCycleSignals.length !== 1 ? "s are" : " is"} active in this oversight cycle. First observation across retained oversight.`;

      return {
        totalDistinctSignals: currentCycleSignals.length,
        currentCycleSignals,
        recurrenceSummary,
        hasCriticalRecurrence,
        evidencePosture: "SYSTEM_INFERRED",
      };
    })(),

    // Decision losses — only from signals indicating realised loss
    decisionLosses: (() => {
      const lossSignals = signals.filter((s) => s.type === "OUTCOME_DETERIORATED" || s.type === "COMMITMENT_UNVERIFIED");
      if (lossSignals.length === 0) return undefined;
      return {
        totalKnownLoss: undefined,
        currency: "GBP" as const,
        entries: lossSignals.map((s, i) => ({
          id: `loss_${i}_${s.caseId}`,
          caseId: s.caseId || "",
          category: s.type === "OUTCOME_DETERIORATED" ? "CONSEQUENCE_MATERIALISED" : "TRUST_ERODED",
          description: s.explanation,
          evidenceBasis: [s.title],
          confidence: (s.severity === "CRITICAL" || s.severity === "HIGH" ? "HIGH" : "MEDIUM") as "LOW" | "MEDIUM" | "HIGH",
          clientSafe: true,
        })),
        warnings: ["Decision losses are derived from oversight signals. Independent verification recommended."],
      };
    })(),

    // Strategic options — inferred from cost + commitment signals
    // V0: options are derived from cases with overdue commitments + accumulating cost
    strategicOptions: (() => {
      const atRiskCases = loaded.cases.filter((c) =>
        (c.unresolvedCommitments ?? 0) > 0 && c.costBasisAvailable,
      );
      if (atRiskCases.length === 0) return undefined;
      return {
        valueAtRisk: undefined,
        currency: "GBP" as const,
        options: atRiskCases.map((c, i) => ({
          id: `opt_${i}_${c.caseId}`,
          caseId: c.caseId,
          label: c.title,
          status: "CLOSING" as const,
          closingReason: "Decision delay with unresolved commitments is narrowing the available window.",
          evidenceBasis: ["Derived from unresolved commitments and active cost basis."],
        })),
        warnings: ["Option status is inferred from commitment and cost signals. Confirm with case owner."],
      };
    })(),

    // Irreversibility — inferred from loss signals + high cost + multiple breaches
    irreversibility: (() => {
      const hasHighCost = totalEstimatedCost >= 20000;
      const hasMultipleBreaches = unresolvedCommitments >= 3;
      const hasDeterioration = signals.some((s) => s.type === "OUTCOME_DETERIORATED");
      if (!hasHighCost && !hasMultipleBreaches && !hasDeterioration) return undefined;
      const drivers: Array<{ label: string; evidenceBasis: string[]; weight: number }> = [];
      if (hasHighCost) drivers.push({ label: "High accumulated cost of inaction", evidenceBasis: [`£${totalEstimatedCost.toLocaleString()} accumulated`], weight: 35 });
      if (hasMultipleBreaches) drivers.push({ label: "Multiple unresolved commitment breaches", evidenceBasis: [`${unresolvedCommitments} breaches`], weight: 30 });
      if (hasDeterioration) drivers.push({ label: "Outcome deterioration detected", evidenceBasis: ["Deterioration signal from oversight signals"], weight: 25 });
      const score = Math.min(100, drivers.reduce((sum, d) => sum + d.weight, 0));
      const level = score >= 90 ? "IRREVERSIBLE" : score >= 70 ? "CRITICAL" : score >= 45 ? "HIGH" : "MODERATE";
      return {
        score,
        level: level as "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "IRREVERSIBLE",
        drivers,
        explanation: `Irreversibility index ${score}/100 (${level}). ${drivers.length} contributing driver${drivers.length !== 1 ? "s" : ""}.`,
        warnings: ["Irreversibility is inferred from available signals. Not all drivers may be captured."],
      };
    })(),
  };

  // ── Cycle consequence projection ──
  brief.cadence = {
    status: retainedCadence.state,
    health: retainedCadence.state === "OVERDUE" || retainedCadence.state === "ESCALATED" ? "AT_RISK" : retainedCadence.state === "NOT_CONFIGURED" ? "WATCH" : "HEALTHY",
    currentCycleDueDate: retainedCadence.scheduledFor ?? undefined,
    nextCycleDueDate: retainedCadence.scheduledFor ?? undefined,
    explanation: `${retainedCadence.label} ${retainedCadence.explanation}`.trim(),
  };

  const consequenceProjection = projectOversightCycleConsequence({
    costOfInaction: brief.costOfInaction,
    patternRecurrence: brief.patternRecurrence,
    verification: brief.verification,
    irreversibility: brief.irreversibility,
    strategicOptions: brief.strategicOptions,
    decisionLosses: brief.decisionLosses,
  });
  if (consequenceProjection.available && consequenceProjection.projection) {
    brief.cycleConsequenceProjection = consequenceProjection.projection;
  }
  if (consequenceProjection.warnings.length > 0) {
    warnings.push(...consequenceProjection.warnings);
  }

  // ── Value Protected — what this cycle surfaced ──
  const missedSignals: NonNullable<OversightBrief["valueProtected"]>["missedSignals"] = [];

  if (brief.costOfInaction && brief.costOfInaction.totalEstimated > 0) {
    missedSignals.push({
      label: "Cost accumulation",
      source: "Cost-of-Inaction Clock",
      whyItMatters: `£${brief.costOfInaction.totalEstimated.toLocaleString()} has accumulated across ${brief.costOfInaction.casesIncluded} case${brief.costOfInaction.casesIncluded !== 1 ? "s" : ""} since the last intervention.`,
      evidenceBasis: "Monthly cost estimate from Executive Reporting or Strategy Room",
      severity: brief.costOfInaction.totalEstimated >= 20000 ? "CRITICAL" : brief.costOfInaction.totalEstimated >= 5000 ? "HIGH" : "MEDIUM",
    });
  }
  if (brief.patternRecurrence && brief.patternRecurrence.status !== "NO_PRIOR_PATTERN" && brief.patternRecurrence.status !== "INSUFFICIENT_HISTORY") {
    missedSignals.push({
      label: "Pattern recurrence",
      source: "Pattern Recurrence Engine",
      whyItMatters: brief.patternRecurrence.explanation,
      evidenceBasis: "Cross-case pattern matching from diagnostic journey history",
      severity: brief.patternRecurrence.status === "VERIFIED_RECURRENCE" ? "HIGH" : "MEDIUM",
    });
  }
  if (brief.strategicOptions && brief.strategicOptions.options.some((o) => o.status === "CLOSING")) {
    const closingCount = brief.strategicOptions.options.filter((o) => o.status === "CLOSING").length;
    missedSignals.push({
      label: "Strategic option closing",
      source: "Strategic Option Register",
      whyItMatters: `${closingCount} strategic option${closingCount !== 1 ? "s are" : " is"} closing due to decision delay.`,
      evidenceBasis: "Derived from unresolved commitments and active cost basis",
      severity: "HIGH",
    });
  }
  if (brief.irreversibility && brief.irreversibility.score >= 45) {
    missedSignals.push({
      label: "Irreversibility rising",
      source: "Irreversibility Index",
      whyItMatters: brief.irreversibility.explanation,
      evidenceBasis: brief.irreversibility.drivers.map((d) => d.label).join("; "),
      severity: brief.irreversibility.level === "CRITICAL" || brief.irreversibility.level === "IRREVERSIBLE" ? "CRITICAL" : "HIGH",
    });
  }
  if (brief.boardroom.dossiersAvailable > 0) {
    missedSignals.push({
      label: "Boardroom threshold met",
      source: "Boardroom Mode Engine",
      whyItMatters: "Cost and evidence convergence now justify board-level treatment.",
      evidenceBasis: "Boardroom qualification from exposure and evidence threshold",
      severity: "HIGH",
    });
  }
  if (brief.verification.unresolvedBreaches > 0) {
    missedSignals.push({
      label: "Commitment breach",
      source: "Commitment Verification",
      whyItMatters: `${brief.verification.unresolvedBreaches} commitment${brief.verification.unresolvedBreaches !== 1 ? "s" : ""} remain unverified or breached.`,
      evidenceBasis: "Execution record timing against commitment checkpoint",
      severity: brief.verification.unresolvedBreaches >= 3 ? "HIGH" : "MEDIUM",
    });
  }

  if (missedSignals.length > 0) {
    brief.valueProtected = {
      title: "What this cycle surfaced",
      summary: `This oversight cycle identified ${missedSignals.length} signal${missedSignals.length !== 1 ? "s" : ""} that would likely have remained hidden without governed monitoring.`,
      missedSignals,
    };
  }

  if (missedSignals.length > 0) {
    brief.cancellationLoss = {
      summary: "This cycle preserved visibility over material decision signals that would otherwise return to manual tracking or become harder to detect between reviews.",
      lostVisibility: missedSignals.map((signal) => ({
        area:
          signal.label === "Cost accumulation"
            ? "COST"
            : signal.label === "Pattern recurrence"
              ? "RECURRENCE"
              : signal.label === "Strategic option closing"
                ? "OPTIONS"
                : signal.label === "Irreversibility rising"
                  ? "IRREVERSIBILITY"
                  : signal.label === "Boardroom threshold met"
                    ? "BOARDROOM"
                    : "COMMITMENT",
        description:
          signal.label === "Boardroom threshold met"
            ? "Boardroom-grade consequence visibility would likely revert to manual synthesis between cycles."
            : signal.label === "Pattern recurrence"
              ? "Without continued oversight, this recurring pattern may become harder to detect early."
              : signal.label === "Cost accumulation"
                ? "Accumulating cost exposure would likely return to manual tracking between reviews."
                : signal.whyItMatters,
        evidenceBasis: signal.evidenceBasis,
        severity: signal.severity,
      })),
    };
  }

  // ── Structured Actions ──
  const structuredActions: NonNullable<OversightBrief["structuredActions"]> = [];
  for (const signal of signals) {
    const continuity = describeOversightContinuity(signal.type);
    if (signal.type === "COMMITMENT_UNVERIFIED" && signal.caseId) {
      structuredActions.push({
        id: `act_verify_${signal.caseId}`,
        caseId: signal.caseId,
        scopeType: "CASE",
        actionType: "VERIFY_COMMITMENT",
        action: `Confirm whether the commitment for "${signal.title}" has been executed. If not, classify the blocker as authority, resource, or avoidance before the next cycle.`,
        evidenceBasis: signal.explanation,
        severity: signal.severity === "CRITICAL" ? "CRITICAL" : signal.severity === "HIGH" ? "HIGH" : "MEDIUM",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    }
    if (signal.type === "COUNSEL_REVIEW_TRIGGERED" && signal.caseId) {
      structuredActions.push({
        id: `act_counsel_${signal.caseId}`,
        caseId: signal.caseId,
        scopeType: "CASE",
        actionType: "ESCALATE_COUNSEL",
        action: `Counsel review triggered for this case. Schedule governance review before execution proceeds.`,
        evidenceBasis: signal.explanation,
        ownerRole: "COUNSEL",
        severity: "HIGH",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    }
    if (signal.type === "BOARDROOM_THRESHOLD_MET" && signal.caseId) {
      structuredActions.push({
        id: `act_boardroom_${signal.caseId}`,
        caseId: signal.caseId,
        scopeType: "CASE",
        actionType: "GENERATE_BOARDROOM_DOSSIER",
        action: `Generate Boardroom Dossier for board-level presentation.`,
        evidenceBasis: signal.explanation,
        ownerRole: "BOARD",
        severity: "HIGH",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    }
    if (signal.type === "PATTERN_RECURRED" && signal.caseId) {
      structuredActions.push({
        id: `act_pattern_${signal.caseId}`,
        caseId: signal.caseId,
        scopeType: "CASE",
        actionType: "RECHECK_PATTERN",
        action: `Pattern recurrence detected. Investigate whether the structural root has been addressed or whether intervention is treating symptoms.`,
        evidenceBasis: signal.explanation,
        severity: "MEDIUM",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    }
    if (signal.type === "INTERVENTION_FAILURE_RISK" && signal.caseId) {
      structuredActions.push({
        id: `act_failure_logic_${signal.caseId}`,
        caseId: signal.caseId,
        scopeType: "CASE",
        actionType: "REVIEW_LOSS",
        action: `Review whether the current intervention path is repeating earlier reported failure logic before further execution is committed.`,
        evidenceBasis: signal.explanation,
        severity: signal.severity === "HIGH" ? "HIGH" : "MEDIUM",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    }
    if (signal.type === "DEPENDENCY_RISK" && signal.caseId) {
      structuredActions.push({
        id: `act_dependency_${signal.caseId}`,
        caseId: signal.caseId,
        scopeType: "CASE",
        actionType: "RESOLVE_DEPENDENCY",
        action: `Resolve the blocking dependency before treating this case as execution-ready.`,
        evidenceBasis: signal.explanation,
        severity: signal.severity === "CRITICAL" ? "CRITICAL" : signal.severity === "HIGH" ? "HIGH" : "MEDIUM",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    }
    if (signal.type === "EXECUTION_DRIFT" && signal.caseId) {
      structuredActions.push({
        id: `act_drift_${signal.caseId}`,
        caseId: signal.caseId,
        scopeType: "CASE",
        actionType: "VERIFY_COMMITMENT",
        action: `Verify whether the stop condition has actually ceased before current execution is treated as holding.`,
        evidenceBasis: signal.explanation,
        severity: signal.severity === "HIGH" ? "HIGH" : "MEDIUM",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    } else if (signal.type === "EXECUTION_DRIFT") {
      structuredActions.push({
        id: "act_drift_account",
        scopeType: "ACCOUNT",
        actionType: "REVIEW_OPERATING_CADENCE",
        action: "Review operating cadence against unresolved commitments before the next oversight cycle.",
        evidenceBasis: signal.explanation,
        severity: signal.severity === "HIGH" ? "HIGH" : "MEDIUM",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    }
    if (signal.type === "COUNSEL_OR_BOARDROOM_REVIEW" && signal.caseId) {
      structuredActions.push({
        id: `act_escalation_threshold_${signal.caseId}`,
        caseId: signal.caseId,
        scopeType: "CASE",
        actionType: "ESCALATE_COUNSEL",
        action: `Review whether the captured escalation threshold now requires counsel or board-level handling.`,
        evidenceBasis: signal.explanation,
        ownerRole: "COUNSEL",
        severity: signal.severity === "HIGH" ? "HIGH" : "MEDIUM",
        continuitySourceLabel: continuity.sourceLabel,
        continuityConfidenceLabel: continuity.confidenceLabel,
      });
    }
  }
  if (brief.irreversibility && brief.irreversibility.score >= 60) {
    structuredActions.push({
      id: "act_irreversibility_global",
      scopeType: "ACCOUNT",
      actionType: "ADDRESS_IRREVERSIBILITY",
      action: `Irreversibility index is ${brief.irreversibility.score}/100. Prioritise the highest-weight driver before the situation becomes unrecoverable.`,
      evidenceBasis: brief.irreversibility.explanation,
      severity: brief.irreversibility.score >= 80 ? "CRITICAL" : "HIGH",
      continuitySourceLabel: "Captured in oversight consequence analysis",
      continuityConfidenceLabel: "CAPTURED",
    });
  }
  const behavioralTrendAction = buildBehavioralTrendStructuredAction(brief.behavioralTrends);
  if (behavioralTrendAction) {
    structuredActions.push(behavioralTrendAction);
  }
  const retainerCycleMemoryAction = buildRetainerCycleMemoryStructuredAction(brief.retainerCycleMemory);
  if (retainerCycleMemoryAction) {
    structuredActions.push(retainerCycleMemoryAction);
  }
  if (structuredActions.length > 0) {
    brief.structuredActions = structuredActions;
  }

  // ── Cycle Projection — scenario estimate for next cycle ──
  if (loaded.cases.length > 0) {
    const deteriorationSignals = signals.filter((s) => s.type === "OUTCOME_DETERIORATED" || s.type === "COST_OF_INACTION_ACCUMULATING");
    const patternSignals = signals.filter((s) => s.type === "PATTERN_RECURRED");

    brief.cycleProjection = {
      whatBecameHarder: deteriorationSignals.length > 0
        ? `${deteriorationSignals.length} outcome${deteriorationSignals.length !== 1 ? "s have" : " has"} deteriorated this cycle. Resolution complexity has increased.`
        : "No material deterioration detected this cycle.",
      whatMayBecomeMoreExpensive: totalEstimatedCost > 0
        ? `Cost-of-inaction estimate: £${totalEstimatedCost.toLocaleString()}. This will continue accumulating without intervention.`
        : "No verified cost basis available for projection.",
      whatNeedsReviewBeforeNextCycle: patternSignals.length > 0
        ? `${patternSignals.length} recurring pattern${patternSignals.length !== 1 ? "s" : ""} detected. Review whether structural root has been addressed.`
        : requiredActions.length > 0
          ? requiredActions[0]!
          : "No critical review items identified for the next cycle.",
      sourceLabel: "Cycle projection — scenario estimate, not independently verified",
      evidencePosture: "SYSTEM_INFERRED",
    };
  }

  // ── Stakeholder Friction — recurring authority patterns across cycles ──
  if (loaded.cases.length >= 3) {
    try {
      const { getDiagnosticJourney } = await import("@/lib/diagnostics/journey-store");
      const frictionPatterns: string[] = [];
      let sampleCount = 0;
      const sponsorEmail = input.email ?? loaded.account.ownerEmail ?? loaded.cases.find((item) => item.email)?.email ?? undefined;

      if (sponsorEmail) {
        try {
          const journey = await getDiagnosticJourney({ email: sponsorEmail });
          const caseObj = journey.decisionObjects?.slice(-1)?.[0];
          if (caseObj && (caseObj as any).blocker) {
            sampleCount = 1;
            const { buildStakeholderMapFromCase } = await import("@/lib/decision/stakeholder-map");
            const map = buildStakeholderMapFromCase(caseObj as any);
            if (map.blockers.length > 0) {
              frictionPatterns.push(`Authority tension: ${map.blockers[0]}`);
            }
          }
        } catch { /* degrade gracefully for the single sponsor-safe journey sample */ }
      }

      if (frictionPatterns.length > 0 && sampleCount >= 1) {
        brief.stakeholderFriction = {
          recurringPatterns: [...new Set(frictionPatterns)].slice(0, 5),
          suppressedBelowThreshold: sampleCount < 3,
          sourceLabel: "Repeated stakeholder friction — sponsor-safe aggregate only",
        };
      }
    } catch { /* degrade gracefully */ }
  }

  if (boardroomCount > 0) {
    warnings.push("Boardroom export queue is not yet modelled. Dossier readiness is signal-only in v0.");
  }
  if (signals.length === 0) {
    warnings.push("No material oversight signals were emitted for the current scope.");
  }
  if (!brief.costOfInaction) {
    warnings.push("No verified cost basis was available across the current oversight scope.");
  }
  if (!brief.retainedEnforcement && input.organisationId) {
    warnings.push("No retained enforcement cycle evidence was available for this organisation scope.");
  }

  return {
    brief,
    account,
    warnings,
  };
}
