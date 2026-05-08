import "server-only";

import { prisma } from "@/lib/prisma.server";
import { getCreditProfile } from "@/lib/decision-ledger/ledger-service";
import { deriveDecisionCreditGovernanceEffect } from "@/lib/product/decision-credit-governance";
import { loadOversightAccount } from "@/lib/product/oversight-account-loader";
import { buildOversightSignals } from "@/lib/product/oversight-signal-builder";
import { loadControlRoomState } from "@/lib/product/control-room-state-loader";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import { projectOversightCycleConsequence } from "@/lib/product/oversight-cycle-consequence-projection";
import type { OversightCycle, RetainerOversightAccount } from "@/lib/product/retainer-oversight-contract";
import { describeOversightContinuity } from "@/lib/product/governed-memory-presenter";
import {
  loadPurposeAlignmentEvidence,
  buildOversightBriefPaAggregate,
} from "@/lib/alignment/evidence-loader";

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

  const signals = buildOversightSignals({
    cases: loaded.cases,
    creditProfile,
    controlRoomState: controlRoom?.state ?? null,
    teamAggregate,
    enterpriseStrain,
    retainedEnforcement: loaded.retainedEnforcement ?? null,
  });

  // Inject checkpoint-level signals from the efficacy system
  if (checkpointSignalCount > 0) {
    signals.push({
      id: "efficacy:checkpoint-attention",
      type: "CHECKPOINT_OVERDUE" as any,
      severity: checkpointSignalCount >= 3 ? "HIGH" : "MEDIUM",
      title: `${checkpointSignalCount} checkpoint${checkpointSignalCount === 1 ? "" : "s"} require${checkpointSignalCount === 1 ? "s" : ""} attention`,
      explanation: `The efficacy checkpoint system has detected ${checkpointSignalCount} overdue, blocked, or abandoned checkpoint${checkpointSignalCount === 1 ? "" : "s"} that should be reviewed in this oversight cycle.`,
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
    oversightSignals: signals
      .filter((s) =>
        s.type === "TEAM_DIVERGENCE_REPORTED" ||
        s.type === "ENTERPRISE_STRAIN_REPORTED" ||
        s.type === "PATTERN_RECURRED" ||
        s.type === "OUTCOME_DETERIORATED" ||
        s.type === "COST_OF_INACTION_ACCUMULATING" ||
        s.type === "COMMITMENT_UNVERIFIED"
      )
      .map((s) => ({
        id: s.id,
        type: s.type,
        severity: s.severity,
        title: s.title,
        explanation: s.explanation,
        recommendedAction: s.recommendedAction,
        sourceLabel: s.type === "TEAM_DIVERGENCE_REPORTED" ? "Source: Team Assessment"
          : s.type === "ENTERPRISE_STRAIN_REPORTED" ? "Source: Enterprise Assessment"
          : s.caseId ? `Source: Case ${s.caseId}` : "Source: Oversight Cycle",
        evidencePosture: s.type === "TEAM_DIVERGENCE_REPORTED" ? "aggregated"
          : s.type === "ENTERPRISE_STRAIN_REPORTED" ? "system-inferred"
          : "system-inferred",
      })),
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
        actionType: "VERIFY_COMMITMENT",
        action: `Verify whether the stop condition has actually ceased before current execution is treated as holding.`,
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
      actionType: "ADDRESS_IRREVERSIBILITY",
      action: `Irreversibility index is ${brief.irreversibility.score}/100. Prioritise the highest-weight driver before the situation becomes unrecoverable.`,
      evidenceBasis: brief.irreversibility.explanation,
      severity: brief.irreversibility.score >= 80 ? "CRITICAL" : "HIGH",
      continuitySourceLabel: "Captured in oversight consequence analysis",
      continuityConfidenceLabel: "CAPTURED",
    });
  }
  if (structuredActions.length > 0) {
    brief.structuredActions = structuredActions;
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
