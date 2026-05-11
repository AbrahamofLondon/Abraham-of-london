/**
 * Boardroom Dossier Builder
 *
 * Aggregates organisational intelligence into a structured dossier
 * for board-level decision governance review.
 *
 * All summaries are deterministic — no AI generation.
 */

import { prisma } from "@/lib/prisma.server";
import type {
  BoardroomDossier,
  DecisionPortfolioEntry,
  ContradictionEntry,
  AuthorityMapEntry,
  RiskExposureEntry,
  CommitmentEntry,
  BreachEntry,
  OutcomeEntry,
  BoardAction,
} from "./dossier-types";
import {
  buildSovereignSignalAssessment,
  buildInsufficientEvidenceAssessment,
} from "@/lib/sovereign/sovereign-signal-public-dto";
import { detectIntelligenceSignals } from "@/lib/sovereign/intelligence-signals";

function defaultPeriod(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 90);
  return { from, to };
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export async function buildBoardroomDossier(
  organisationId: string,
  period?: { from: Date; to: Date },
): Promise<BoardroomDossier> {
  const { from, to } = period ?? defaultPeriod();
  const missingFields: string[] = [];

  // 1. Verify organisation exists
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: { memberships: true },
  });

  if (!org) {
    throw new Error(`Organisation not found: ${organisationId}`);
  }

  // 2. Load decisions from DiagnosticDecisionObject via journeys linked to org
  const journeys = await prisma.diagnosticJourney.findMany({
    where: {
      organisationKey: org.slug,
      createdAt: { gte: from, lte: to },
    },
    select: { id: true },
  });

  const journeyIds = journeys.map((j) => j.id);

  let decisions: DecisionPortfolioEntry[] = [];
  if (journeyIds.length > 0) {
    const rawDecisions = await prisma.diagnosticDecisionObject.findMany({
      where: {
        journeyId: { in: journeyIds },
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    decisions = rawDecisions.map((d) => ({
      decisionId: d.id,
      decisionText: d.decisionText,
      sourceStage: d.sourceStage,
      affectedDomain: d.affectedDomain,
      confidence: d.confidence,
      aiExposureLevel: d.aiExposureLevel,
      decisionVelocityScore: d.decisionVelocityScore,
      forwardTerrainState: d.forwardTerrainState,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  if (decisions.length === 0) missingFields.push("decisionPortfolio");

  // 3. Pull contradictions from collision data (stored in journey metadata)
  const contradictions: ContradictionEntry[] = [];
  if (journeyIds.length > 0) {
    const journeysWithCollisions = await prisma.diagnosticJourney.findMany({
      where: {
        id: { in: journeyIds },
        NOT: { mergedTensionThread: { equals: undefined } },
      },
      select: { mergedTensionThread: true },
    });

    for (const j of journeysWithCollisions) {
      const thread = safeJsonParse<{ collisions?: Array<{
        type?: string;
        severity?: string;
        userA?: { role?: string; claim?: string };
        userB?: { role?: string; claim?: string };
        message?: string;
      }> }>(j.mergedTensionThread, {});
      if (thread.collisions && Array.isArray(thread.collisions)) {
        for (const c of thread.collisions) {
          contradictions.push({
            type: c.type ?? "unknown",
            severity: c.severity ?? "medium",
            userA: { role: c.userA?.role, claim: c.userA?.claim ?? "" },
            userB: { role: c.userB?.role, claim: c.userB?.claim ?? "" },
            message: c.message ?? "",
          });
        }
      }
    }
  }

  if (contradictions.length === 0) missingFields.push("topContradictions");

  // 4. Authority map from OrganisationMembership
  const authorityMap: AuthorityMapEntry[] = org.memberships.map((m) => ({
    membershipId: m.id,
    email: m.email,
    fullName: m.fullName,
    roleTitle: m.roleTitle,
    teamName: m.teamName,
    functionName: m.functionName,
    seniorityBand: m.seniorityBand,
    isExecutive: m.isExecutive,
    status: m.status,
  }));

  if (authorityMap.length === 0) missingFields.push("authorityMap");

  // 5. Risk exposure — contracts with breachCount > 0
  const riskContracts = await prisma.patternBreakerContract.findMany({
    where: {
      breachCount: { gt: 0 },
      createdAt: { gte: from, lte: to },
      ownerEmail: { in: org.memberships.map((m) => m.email) },
    },
    orderBy: { breachCount: "desc" },
    take: 20,
  });

  const riskExposure: RiskExposureEntry[] = riskContracts.map((c) => ({
    contractId: c.id,
    commitment: c.commitment,
    breachCount: c.breachCount,
    escalationLevel: c.escalationLevel,
    dueAt: c.dueAt.toISOString(),
    status: c.status,
  }));

  if (riskExposure.length === 0) missingFields.push("riskExposure");

  // 6. Open commitments — contracts not yet verified
  const memberEmails = org.memberships.map((m) => m.email);
  const openContracts = await prisma.patternBreakerContract.findMany({
    where: {
      verificationStatus: { not: "verified" },
      ownerEmail: { in: memberEmails },
      createdAt: { gte: from, lte: to },
    },
    orderBy: { dueAt: "asc" },
    take: 30,
  });

  const openCommitments: CommitmentEntry[] = openContracts.map((c) => ({
    contractId: c.id,
    commitment: c.commitment,
    avoidedPattern: c.avoidedPattern,
    dueAt: c.dueAt.toISOString(),
    status: c.status,
    verificationStatus: c.verificationStatus,
    createdAt: c.createdAt.toISOString(),
  }));

  if (openCommitments.length === 0) missingFields.push("openCommitments");

  // 7. Breaches
  const breaches: BreachEntry[] = riskContracts.map((c) => ({
    contractId: c.id,
    commitment: c.commitment,
    breachCount: c.breachCount,
    escalationLevel: c.escalationLevel,
    consequenceOfInaction: c.consequenceOfInaction,
    dueAt: c.dueAt.toISOString(),
  }));

  if (breaches.length === 0) missingFields.push("breaches");

  // 8. Verified outcomes
  const rawOutcomes = await prisma.outcomeVerificationRecord.findMany({
    where: {
      organisationKey: org.slug,
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const verifiedOutcomes: OutcomeEntry[] = rawOutcomes.map((o) => ({
    outcomeId: o.id,
    outcomeClassification: o.outcomeClassification,
    magnitudeOfChange: o.magnitudeOfChange,
    effectivenessScore: o.effectivenessScore,
    decisionVelocityDelta: o.decisionVelocityDelta,
    competitivePositionShift: o.competitivePositionShift,
    createdAt: o.createdAt.toISOString(),
  }));

  if (verifiedOutcomes.length === 0) missingFields.push("verifiedOutcomes");

  // 9. Financial impact — summed from outcome payloads
  let totalCostOfDelay = 0;
  let totalRecovered = 0;
  for (const o of rawOutcomes) {
    const payload = safeJsonParse<{
      costOfDelay?: number;
      recoveredValue?: number;
    }>(o.payload, {});
    if (typeof payload.costOfDelay === "number") totalCostOfDelay += payload.costOfDelay;
    if (typeof payload.recoveredValue === "number") totalRecovered += payload.recoveredValue;
  }

  if (totalCostOfDelay === 0 && totalRecovered === 0) missingFields.push("financialImpact");

  // 10. Recommended board actions
  const recommendedBoardActions: BoardAction[] = [];

  for (const breach of riskContracts) {
    if (breach.breachCount >= 3 || breach.escalationLevel === "critical") {
      recommendedBoardActions.push({
        priority: breach.escalationLevel === "critical" ? "critical" : "high",
        category: "breach_escalation",
        description: `Contract "${breach.commitment.slice(0, 80)}" has ${breach.breachCount} breaches at escalation level "${breach.escalationLevel}". Immediate board attention required.`,
        relatedEntityId: breach.id,
      });
    }
  }

  const criticalDecisions = decisions.filter(
    (d) => d.aiExposureLevel === "CRITICAL" || d.forwardTerrainState === "DISRUPTING",
  );
  for (const d of criticalDecisions.slice(0, 5)) {
    recommendedBoardActions.push({
      priority: "high",
      category: "decision_governance",
      description: `Decision "${d.decisionText.slice(0, 80)}" has ${d.aiExposureLevel} AI exposure with ${d.forwardTerrainState} terrain. Strategic oversight recommended.`,
      relatedEntityId: d.decisionId,
    });
  }

  const criticalContradictions = contradictions.filter((c) => c.severity === "critical");
  for (const c of criticalContradictions.slice(0, 3)) {
    recommendedBoardActions.push({
      priority: "critical",
      category: "structural_contradiction",
      description: `Critical contradiction detected: ${c.message.slice(0, 120)}`,
      relatedEntityId: null,
    });
  }

  if (recommendedBoardActions.length === 0) missingFields.push("recommendedBoardActions");

  // 11. Data completeness
  const totalFields = 10;
  const completenessScore = Math.round(((totalFields - missingFields.length) / totalFields) * 100);

  // 12. Executive summary (deterministic)
  const summaryParts: string[] = [];
  summaryParts.push(`Boardroom dossier for organisation "${org.name}" covering ${from.toISOString().split("T")[0]} to ${to.toISOString().split("T")[0]}.`);
  summaryParts.push(`${decisions.length} decisions tracked across ${journeyIds.length} diagnostic journeys.`);
  if (contradictions.length > 0) {
    summaryParts.push(`${contradictions.length} contradictions detected (${criticalContradictions.length} critical).`);
  }
  summaryParts.push(`${openCommitments.length} open commitments, ${breaches.length} breaches recorded.`);
  summaryParts.push(`${verifiedOutcomes.length} outcomes verified. Data completeness: ${completenessScore}%.`);
  if (recommendedBoardActions.length > 0) {
    summaryParts.push(`${recommendedBoardActions.length} actions recommended for board attention.`);
  }

  // 13. Sovereign signal assessment — derived from dossier evidence
  // Input inference: breach count → failure modes, contradictions → narrative coherence,
  // decisions → session count, critical actions → trajectory signal
  const hasCriticalBreaches = riskContracts.some((c) => c.escalationLevel === "critical");
  const hasAuthorityClearance = authorityMap.some((m) => m.isExecutive);
  const sovereignSignalInput = {
    posture: (hasCriticalBreaches ? "MISALIGNED" : contradictions.length > 3 ? "DRIFTING" : "ALIGNED") as "SOVEREIGN" | "ALIGNED" | "DRIFTING" | "MISALIGNED" | "DISORDERED",
    authorityType: (hasCriticalBreaches && !hasAuthorityClearance ? "UNCLEAR" : "DELEGATED") as "DIRECT" | "DELEGATED" | "CONTESTED" | "UNCLEAR",
    readinessTier: (hasCriticalBreaches ? "FRAGILE" : "ADVISORY") as "SOVEREIGN" | "ADVISORY" | "EXECUTION" | "FRAGILE",
    trajectory: (hasCriticalBreaches ? "DETERIORATING" : openCommitments.length > 5 ? "STABLE" : "IMPROVING") as "IMPROVING" | "STABLE" | "DETERIORATING" | "COLLAPSING",
    failureModeCount: breaches.length,
    narrativeCoherence: contradictions.length === 0 ? 65 : Math.max(20, 65 - contradictions.length * 8),
    interventionReadiness: hasCriticalBreaches ? 28 : openCommitments.length > 5 ? 40 : 55,
    sessionCount: decisions.length,
  };

  let sovereignSignalAssessment = buildInsufficientEvidenceAssessment();
  if (decisions.length >= 3 || breaches.length >= 1) {
    const rawSignals = detectIntelligenceSignals(sovereignSignalInput);
    if (rawSignals.length > 0) {
      sovereignSignalAssessment = buildSovereignSignalAssessment(
        rawSignals,
        "SINGLE_SOURCE_INDICATED",
        3,
      );
    }
  }

  return {
    organisationId,
    generatedAt: new Date().toISOString(),
    period: { from: from.toISOString(), to: to.toISOString() },
    executiveSummary: summaryParts.join(" "),
    decisionPortfolio: decisions,
    topContradictions: contradictions.slice(0, 10),
    authorityMap,
    riskExposure,
    openCommitments,
    breaches,
    verifiedOutcomes,
    financialImpact: { totalCostOfDelay, totalRecovered, currency: "GBP" },
    recommendedBoardActions,
    dataCompleteness: { score: completenessScore, missingFields },
    sovereignSignalAssessment,
  };
}
