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
import { extractAssessmentEvidenceCapture } from "@/lib/product/evidence-capture-contract";
import {
  buildGovernedMemoryFromEvidenceStages,
  buildPatternRecurrenceMemory,
  buildVerificationBoundaryMemory,
} from "@/lib/product/governed-memory-presenter";
import {
  loadPurposeAlignmentEvidence,
  convertPurposeAlignmentToGovernedMemory,
} from "@/lib/alignment/evidence-loader";

function parseMoney(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/£\s?([\d,]+(?:\.\d+)?)/i) || value.match(/\b([\d,]+(?:\.\d+)?)\b/);
  if (!match?.[1]) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
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
    const identity = await resolveIdentity(req);

    if (!identity.authenticated || !identity.email) {
      return res.status(401).json({ ok: false, reason: "AUTH_REQUIRED" });
    }

    const email = identity.email;

    // ── Derive Living Case (server-authoritative) ──
    const livingCase = await deriveLivingCase({ email });

    if (!livingCase) {
      return res.status(200).json({
        ok: true,
        cases: [],
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
        href: boardroomQualification.qualified && livingCase.completedStages.includes("executive_reporting")
          ? "/diagnostics/executive-reporting/run"
          : null,
        historyCount: 0,
      },
      returnBriefs: [],
      governedMemory: null,
      updatedAt: livingCase.createdAt || new Date().toISOString(),
    };

    const journey = await prisma.diagnosticJourney.findUnique({
      where: { journeyKey: livingCase.caseId },
      include: {
        stages: {
          select: { stage: true, createdAt: true, payload: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }).catch(() => null);

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

    if (journey?.stages?.length) {
      const governedMemory = [
        ...buildGovernedMemoryFromEvidenceStages(
          journey.stages.map((stage) => ({
            stage: stage.stage,
            createdAt: stage.createdAt,
            payload: stage.payload,
          })),
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
          verificationCriteria: journey.stages
            .map((stage) => extractAssessmentEvidenceCapture(stage.payload).verificationCriteria ?? null)
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

      caseCard.governedMemory = governedMemory.length ? governedMemory : null;
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

    res.setHeader("Cache-Control", "private, no-cache");
    return res.status(200).json({
      ok: true,
      cases: [caseCard],
      commercial: {
        ownedProducts: owned,
        eligibleProducts: eligible,
        restrictedProducts: restricted,
      },
      credit,
    } satisfies DecisionCentreResponse);
  } catch (error) {
    console.error("[decision-centre/cases]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}
