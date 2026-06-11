/**
 * lib/retainers/retainer-pipeline-service.ts
 *
 * Governed retainer pipeline service.
 * All state lives in the database. No auto-approval. No fake contracts.
 *
 * Rules:
 *   - Intake creates CANDIDATE only
 *   - CANDIDATE → REVIEW_READY requires admin action
 *   - Contract requires APPROVED readiness
 *   - First cycle requires ACTIVE contract
 *   - All admin actions are audit logged
 */

import { prisma } from "@/lib/prisma.server";
import type { ReadinessIntakeInput } from "./retainer-pipeline-contracts";
import {
  contractStatusToStage,
  readinessClassToStage,
  TIER_LABELS,
} from "./retainer-pipeline-contracts";
import type {
  AdminActionResult,
  ClientSafeContractStatus,
  ClientSafeCycleStatus,
} from "./retainer-pipeline-contracts";

// ─── INTAKE — creates CANDIDATE only ─────────────────────────────────────────

export async function createReadinessCandidate(
  input: ReadinessIntakeInput,
): Promise<{ id: string; readinessClass: string }> {
  const evaluation = await prisma.retainerReadinessEvaluation.create({
    data: {
      userEmail: input.contactEmail.toLowerCase().trim(),
      readinessClass: "CANDIDATE",
      adminApprovalRequired: true,
      evaluatorNotes: buildIntakeNarrativeSummary(input),
      evidenceSourceIds: input.priorBoardroomOrderId
        ? JSON.stringify([{ type: "boardroom_order", id: input.priorBoardroomOrderId }])
        : JSON.stringify([]),
    },
    select: { id: true, readinessClass: true },
  });

  await prisma.accessAuditLog.create({
    data: {
      actorType: "USER",
      actorEmail: input.contactEmail.toLowerCase().trim(),
      action: "retainer_readiness.candidate_created",
      targetType: "retainer_readiness_evaluation",
      targetKey: evaluation.id,
      success: true,
      reason: "Intake form submitted",
      metadata: {
        organisationType: input.organisationType,
        urgencyLevel: input.urgencyLevel,
        consentToReview: input.consentToReview,
      },
    },
  }).catch(() => undefined);

  return evaluation;
}

function buildIntakeNarrativeSummary(input: ReadinessIntakeInput): string {
  return [
    `Org type: ${input.organisationType}`,
    `Decision pressure: ${input.decisionPressureFrequency}`,
    `Active decisions: ${input.activeDecisionsCount}`,
    `Unresolved risks: ${input.unresolvedRisks}`,
    `Monthly need: ${input.monthlyOversightNeed}`,
    `Urgency: ${input.urgencyLevel}`,
    `Governance context: ${input.governanceContext}`,
    input.priorProductUse ? `Prior product use: ${input.priorProductUse}` : null,
    input.priorBoardroomOrderId ? `Prior order: ${input.priorBoardroomOrderId}` : null,
  ].filter(Boolean).join(" | ");
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function listReadinessCandidates(opts?: {
  readinessClass?: string[];
  limit?: number;
}) {
  return prisma.retainerReadinessEvaluation.findMany({
    where: opts?.readinessClass?.length
      ? { readinessClass: { in: opts.readinessClass } }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
  });
}

export async function getReadinessCandidateById(id: string) {
  return prisma.retainerReadinessEvaluation.findUnique({ where: { id } });
}

export async function getContractById(id: string) {
  return prisma.retainerContract.findUnique({ where: { id } });
}

export async function listCyclesForContract(contractId: string) {
  return prisma.oversightReviewCycle.findMany({
    where: { contractId },
    orderBy: { cycleNumber: "asc" },
  });
}

// ─── ADMIN ACTIONS ────────────────────────────────────────────────────────────

export async function markReviewReady(
  evaluationId: string,
  adminEmail: string,
): Promise<AdminActionResult<{ readinessClass: string }>> {
  const evaluation = await prisma.retainerReadinessEvaluation.findUnique({
    where: { id: evaluationId },
    select: { id: true, readinessClass: true },
  });
  if (!evaluation) return { ok: false, reason: "NOT_FOUND" };
  if (evaluation.readinessClass !== "CANDIDATE") {
    return { ok: false, reason: `Cannot advance from ${evaluation.readinessClass} to REVIEW_READY` };
  }

  const updated = await prisma.retainerReadinessEvaluation.update({
    where: { id: evaluationId },
    data: { readinessClass: "REVIEW_READY", updatedAt: new Date() },
    select: { readinessClass: true },
  });

  await logAdminAction(adminEmail, "retainer_readiness.marked_review_ready", "retainer_readiness_evaluation", evaluationId);
  return { ok: true, data: updated };
}

export async function approveForOffer(
  evaluationId: string,
  adminEmail: string,
  notes?: string,
): Promise<AdminActionResult<{ readinessClass: string }>> {
  const evaluation = await prisma.retainerReadinessEvaluation.findUnique({
    where: { id: evaluationId },
    select: { id: true, readinessClass: true },
  });
  if (!evaluation) return { ok: false, reason: "NOT_FOUND" };
  if (evaluation.readinessClass !== "REVIEW_READY") {
    return { ok: false, reason: "Approval requires REVIEW_READY status" };
  }

  const updated = await prisma.retainerReadinessEvaluation.update({
    where: { id: evaluationId },
    data: {
      readinessClass: "APPROVED",
      adminApprovedAt: new Date(),
      adminApprovedBy: adminEmail,
      ...(notes ? { evaluatorNotes: notes } : {}),
      updatedAt: new Date(),
    },
    select: { readinessClass: true },
  });

  await logAdminAction(adminEmail, "retainer_readiness.approved", "retainer_readiness_evaluation", evaluationId, { notes });
  return { ok: true, data: updated };
}

export async function rejectCandidate(
  evaluationId: string,
  adminEmail: string,
  reason: string,
  routeTo?: string,
): Promise<AdminActionResult<{ readinessClass: string }>> {
  const evaluation = await prisma.retainerReadinessEvaluation.findUnique({
    where: { id: evaluationId },
    select: { id: true },
  });
  if (!evaluation) return { ok: false, reason: "NOT_FOUND" };

  const updated = await prisma.retainerReadinessEvaluation.update({
    where: { id: evaluationId },
    data: {
      readinessClass: "NOT_READY",
      evaluatorNotes: `REJECTED: ${reason}${routeTo ? ` | Route to: ${routeTo}` : ""}`,
      updatedAt: new Date(),
    },
    select: { readinessClass: true },
  });

  await logAdminAction(adminEmail, "retainer_readiness.rejected", "retainer_readiness_evaluation", evaluationId, { reason, routeTo });
  return { ok: true, data: updated };
}

export async function addEvaluatorNotes(
  evaluationId: string,
  adminEmail: string,
  notes: string,
): Promise<AdminActionResult<void>> {
  const evaluation = await prisma.retainerReadinessEvaluation.findUnique({
    where: { id: evaluationId },
    select: { id: true },
  });
  if (!evaluation) return { ok: false, reason: "NOT_FOUND" };

  await prisma.retainerReadinessEvaluation.update({
    where: { id: evaluationId },
    data: { evaluatorNotes: notes, updatedAt: new Date() },
  });

  await logAdminAction(adminEmail, "retainer_readiness.notes_added", "retainer_readiness_evaluation", evaluationId);
  return { ok: true, data: undefined };
}

// ─── CONTRACT CREATION ────────────────────────────────────────────────────────

export async function createContractFromApprovedReadiness(input: {
  evaluationId: string;
  tier: string;
  adminEmail: string;
  orgName?: string;
}): Promise<AdminActionResult<{ contractId: string; organisationId: string }>> {
  const evaluation = await prisma.retainerReadinessEvaluation.findUnique({
    where: { id: input.evaluationId },
    select: { id: true, readinessClass: true, organisationId: true, userEmail: true },
  });
  if (!evaluation) return { ok: false, reason: "NOT_FOUND" };
  if (evaluation.readinessClass !== "APPROVED") {
    return { ok: false, reason: "Contract creation requires APPROVED readiness" };
  }

  const validTiers = ["CORE", "OPERATIONAL", "INSTITUTIONAL"];
  const tier = input.tier.toUpperCase();
  if (!validTiers.includes(tier)) {
    return { ok: false, reason: `Invalid tier: ${tier}` };
  }

  // Resolve or create organisation
  let organisationId = evaluation.organisationId ?? null;
  if (!organisationId) {
    const email = evaluation.userEmail ?? "unknown";
    const domainParts = email.split("@");
    const domain = domainParts.length > 1 ? (domainParts[1] ?? "unknown") : "unknown";
    const slug = `retainer-${domain.replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;
    const org = await prisma.organisation.create({
      data: {
        name: input.orgName ?? domain,
        slug,
        status: "active",
      },
      select: { id: true },
    });
    organisationId = org.id;

    await prisma.retainerReadinessEvaluation.update({
      where: { id: input.evaluationId },
      data: { organisationId, updatedAt: new Date() },
    });
  }

  const decisionCapacityMap: Record<string, number> = { CORE: 1, OPERATIONAL: 3, INSTITUTIONAL: 999 };
  const entitlementSlugMap: Record<string, string> = {
    CORE: "retainer_core", OPERATIONAL: "retainer_operational", INSTITUTIONAL: "retainer_institutional",
  };

  const contract = await prisma.retainerContract.create({
    data: {
      organisationId,
      tier,
      status: "ACTIVE",
      decisionCapacity: decisionCapacityMap[tier] ?? 1,
      startDate: new Date(),
      billingCycle: "MONTHLY",
      entitlementSlug: entitlementSlugMap[tier] ?? "retainer_core",
    },
    select: { id: true },
  });

  await logAdminAction(input.adminEmail, "retainer_contract.created", "retainer_contract", contract.id, {
    tier, evaluationId: input.evaluationId,
  });

  return { ok: true, data: { contractId: contract.id, organisationId } };
}

// ─── FIRST CYCLE CREATION ─────────────────────────────────────────────────────

export async function createFirstOversightCycle(input: {
  contractId: string;
  adminEmail: string;
}): Promise<AdminActionResult<{ cycleId: string }>> {
  const contract = await prisma.retainerContract.findUnique({
    where: { id: input.contractId },
    select: { id: true, status: true },
  });
  if (!contract) return { ok: false, reason: "CONTRACT_NOT_FOUND" };
  if (contract.status !== "ACTIVE") {
    return { ok: false, reason: "First cycle requires ACTIVE contract" };
  }

  const existingCycles = await prisma.oversightReviewCycle.count({
    where: { contractId: input.contractId },
  });

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + 30);
  const nextCycleDate = new Date(periodEnd);
  nextCycleDate.setDate(nextCycleDate.getDate() + 1);

  const cycle = await prisma.oversightReviewCycle.create({
    data: {
      contractId: input.contractId,
      cycleNumber: existingCycles + 1,
      periodStart,
      periodEnd,
      status: "OPEN",
      nextCycleDate,
      clientHealthStatus: "UNKNOWN",
    },
    select: { id: true },
  });

  await logAdminAction(input.adminEmail, "oversight_cycle.created", "oversight_review_cycle", cycle.id, {
    contractId: input.contractId, cycleNumber: existingCycles + 1,
  });

  return { ok: true, data: { cycleId: cycle.id } };
}

// ─── CLIENT-SAFE STATUS ───────────────────────────────────────────────────────

export async function getClientSafeContractStatus(
  contractId: string,
): Promise<ClientSafeContractStatus | null> {
  const contract = await prisma.retainerContract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      tier: true,
      status: true,
      startDate: true,
      decisionCapacity: true,
    },
  });
  if (!contract || contract.status === "TERMINATED") return null;

  const latestCycle = await prisma.oversightReviewCycle.findFirst({
    where: { contractId },
    orderBy: { cycleNumber: "desc" },
    select: {
      cycleNumber: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      nextCycleDate: true,
      clientHealthStatus: true,
      outcomeSummary: true,
      clientNotes: true,
      // internalNotes intentionally excluded
    },
  });

  const hasOpenCycle = latestCycle?.status === "OPEN" || latestCycle?.status === "UNDER_REVIEW";
  const pipelineStage = contractStatusToStage(contract.status, !!hasOpenCycle);

  const currentCycle: ClientSafeCycleStatus | null = latestCycle
    ? {
        cycleNumber: latestCycle.cycleNumber,
        status: latestCycle.status,
        periodStart: latestCycle.periodStart.toISOString(),
        periodEnd: latestCycle.periodEnd.toISOString(),
        nextCycleDate: latestCycle.nextCycleDate?.toISOString() ?? null,
        clientHealthStatus: latestCycle.clientHealthStatus,
        outcomeSummary: latestCycle.outcomeSummary ?? null,
        clientNotes: latestCycle.clientNotes ?? null,
      }
    : null;

  return {
    contractId: contract.id,
    tier: contract.tier,
    tierLabel: TIER_LABELS[contract.tier] ?? contract.tier,
    contractStatus: contract.status,
    pipelineStage,
    startDate: contract.startDate.toISOString(),
    currentCycle,
    nextReviewDue: latestCycle?.nextCycleDate?.toISOString() ?? null,
    whatIsBeingMonitored: resolveMonitoringScope(contract.decisionCapacity, contract.tier),
    whatIsNotYetVerified: resolveUnverifiedScope(latestCycle?.status ?? null),
    outstandingCommitments: [],
  };
}

function resolveMonitoringScope(decisionCapacity: number, tier: string): string[] {
  const base = ["Decision commitments from prior briefs", "Execution drift against stated commitments"];
  if (tier === "OPERATIONAL" || tier === "INSTITUTIONAL") {
    base.push("Multi-thread risk exposure", "Cross-decision dependency conflicts");
  }
  if (tier === "INSTITUTIONAL") {
    base.push("Board-level governance continuity", "Stakeholder alignment drift");
  }
  return base;
}

function resolveUnverifiedScope(cycleStatus: string | null): string[] {
  if (!cycleStatus || cycleStatus === "OPEN") {
    return ["Outcome verification pending current cycle completion", "Drift score not yet calculated"];
  }
  if (cycleStatus === "UNDER_REVIEW") {
    return ["Outcome verification under review"];
  }
  return [];
}

// ─── CASE STUDY LINKAGE PATH ──────────────────────────────────────────────────

export async function createCaseStudyDraftFromCycle(input: {
  cycleId: string;
  contractId: string;
  adminEmail: string;
}): Promise<AdminActionResult<{ caseStudyId: string }>> {
  const cycle = await prisma.oversightReviewCycle.findUnique({
    where: { id: input.cycleId },
    select: { id: true, status: true, outcomeSummary: true, contractId: true },
  });
  if (!cycle) return { ok: false, reason: "CYCLE_NOT_FOUND" };
  if (cycle.contractId !== input.contractId) return { ok: false, reason: "CYCLE_CONTRACT_MISMATCH" };
  if (cycle.status !== "COMPLETED") {
    return { ok: false, reason: "Case study draft requires a COMPLETED cycle" };
  }

  // Check sufficient evidence
  if (!cycle.outcomeSummary) {
    return { ok: false, reason: "Cycle has no outcome summary — insufficient evidence for case study" };
  }

  const cs = await prisma.caseStudy.create({
    data: {
      title: `Retainer Oversight — Cycle ${input.cycleId.slice(0, 8)}`,
      status: "DRAFT",
      anonymised: true,
      publicationAllowed: false,
      verificationStatus: "UNVERIFIED",
      consentStatus: "PENDING",
      narrative: {
        productCode: "retainer-oversight",
        evidenceStatus: "EVIDENCE_LINKED",
        outcomeStatus: "PENDING_REVIEW",
        adminNotes: `Created from oversight cycle ${input.cycleId}`,
      },
    },
    select: { id: true },
  });

  await prisma.caseStudyEvidence.create({
    data: {
      caseStudyId: cs.id,
      sourceType: "oversight_review_cycle",
      sourceId: input.cycleId,
      verificationStatus: "PENDING",
      notes: "Linked from cycle completion",
    },
  });

  await logAdminAction(input.adminEmail, "case_study.created_from_cycle", "case_study", cs.id, {
    cycleId: input.cycleId, contractId: input.contractId,
  });

  return { ok: true, data: { caseStudyId: cs.id } };
}

// ─── DASHBOARD COUNTS ─────────────────────────────────────────────────────────

export async function getRetainerPipelineCounts() {
  const [readinessCandidates, reviewReadyCandidates, approvedOffers] = await Promise.all([
    prisma.retainerReadinessEvaluation.count({ where: { readinessClass: "CANDIDATE" } }),
    prisma.retainerReadinessEvaluation.count({ where: { readinessClass: "REVIEW_READY" } }),
    prisma.retainerReadinessEvaluation.count({ where: { readinessClass: "APPROVED" } }),
  ]);
  return { readinessCandidates, reviewReadyCandidates, approvedOffers };
}

// ─── INTERNAL ─────────────────────────────────────────────────────────────────

async function logAdminAction(
  adminEmail: string,
  action: string,
  targetType: string,
  targetKey: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.accessAuditLog.create({
    data: {
      actorType: "ADMIN",
      actorEmail: adminEmail,
      action,
      targetType,
      targetKey,
      success: true,
      reason: "Admin pipeline action",
      metadata: (metadata ?? {}) as any,
    },
  }).catch(() => undefined);
}
