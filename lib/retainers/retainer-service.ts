import { prisma } from "@/lib/prisma.server";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { aiStatusSignalFromDelta, classifyAIDecisionRisk } from "@/lib/diagnostics/ai-decision-risk";
import { recordAuditEvent, recordFoundationTelemetry } from "@/lib/enterprise-foundation/authority-foundation";

export type RetainerTier = "CORE" | "OPERATIONAL" | "INSTITUTIONAL";
export type RetainerStatus = "ACTIVE" | "PAUSED" | "TERMINATED";
export type RetainedDecisionPriority = "HIGH" | "MEDIUM" | "LOW";
export type RetainedDecisionStatus = "ACTIVE" | "MONITORED" | "RESOLVED";

export const RETAINER_DECISION_CAPACITY: Record<RetainerTier, number> = {
  CORE: 1,
  OPERATIONAL: 3,
  INSTITUTIONAL: 999,
};

export const RETAINER_ENTITLEMENT_SLUGS: Record<RetainerTier, string> = {
  CORE: "retainer_core",
  OPERATIONAL: "retainer_operational",
  INSTITUTIONAL: "retainer_institutional",
};

const CAPACITY_COUNTED_STATUSES: RetainedDecisionStatus[] = ["ACTIVE", "MONITORED"];

export function normalizeRetainerTier(value: string): RetainerTier {
  const tier = value.trim().toUpperCase();
  if (tier === "CORE" || tier === "OPERATIONAL" || tier === "INSTITUTIONAL") return tier;
  throw new Error("Invalid retainer tier");
}

export function getDecisionCapacityForTier(tier: RetainerTier): number {
  return RETAINER_DECISION_CAPACITY[tier];
}

export function getEntitlementSlugForTier(tier: RetainerTier): string {
  return RETAINER_ENTITLEMENT_SLUGS[tier];
}

export async function createRetainerContract(input: {
  organisationId: string;
  tier: RetainerTier | string;
  status?: RetainerStatus;
  startDate?: Date;
  endDate?: Date | null;
  stripeSubscriptionId?: string | null;
  actorId?: string | null;
}) {
  const tier = normalizeRetainerTier(input.tier);
  const organisation = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true },
  });

  if (!organisation) {
    throw new Error("Organisation not found");
  }

  const contract = await prisma.retainerContract.create({
    data: {
      organisationId: input.organisationId,
      tier,
      status: input.status ?? "ACTIVE",
      decisionCapacity: getDecisionCapacityForTier(tier),
      startDate: input.startDate ?? new Date(),
      endDate: input.endDate ?? null,
      billingCycle: "MONTHLY",
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      entitlementSlug: getEntitlementSlugForTier(tier),
    },
  });

  await recordAuditEvent({
    actorType: input.actorId ? "ADMIN" : "SYSTEM",
    actorId: input.actorId ?? null,
    objectType: "CONTRACT",
    objectId: contract.id,
    actionType: "CREATED",
    summary: `Retainer contract created for organisation ${input.organisationId}.`,
    metadata: { tier, decisionCapacity: contract.decisionCapacity, entitlementSlug: contract.entitlementSlug },
  }).catch(() => null);

  return contract;
}

export async function syncRetainerContractFromSubscription(input: {
  stripeSubscriptionId: string;
  status: "active" | "trialing" | "past_due" | "paused" | "canceled" | "unpaid" | string;
}) {
  const status: RetainerStatus =
    input.status === "active" || input.status === "trialing"
      ? "ACTIVE"
      : input.status === "canceled"
        ? "TERMINATED"
        : "PAUSED";

  const result = await prisma.retainerContract.updateMany({
    where: { stripeSubscriptionId: input.stripeSubscriptionId },
    data: { status },
  });

  await recordAuditEvent({
    actorType: "SYSTEM",
    objectType: "CONTRACT",
    objectId: input.stripeSubscriptionId,
    actionType: status === "TERMINATED" ? "TERMINATED" : "UPDATED",
    summary: `Stripe subscription changed retainer contract state to ${status}.`,
    metadata: { stripeSubscriptionId: input.stripeSubscriptionId, stripeStatus: input.status },
  }).catch(() => null);

  return result;
}

export async function assertActiveRetainerContract(contractId: string) {
  const contract = await prisma.retainerContract.findUnique({
    where: { id: contractId },
    include: { organisation: true },
  });

  if (!contract) {
    throw new Error("Retainer contract not found");
  }

  if (contract.status !== "ACTIVE") {
    throw new Error("Retainer contract is not active");
  }

  return contract;
}

export async function verifyRetainerAccess(input: {
  contractId?: string | null;
  organisationId?: string | null;
  email?: string | null;
}) {
  const contract = input.contractId
    ? await prisma.retainerContract.findUnique({ where: { id: input.contractId } })
    : input.organisationId
      ? await prisma.retainerContract.findFirst({
          where: { organisationId: input.organisationId },
          orderBy: { createdAt: "desc" },
        })
      : null;

  if (!contract || contract.status !== "ACTIVE") {
    return { ok: false, contract: null, reason: "NO_ACTIVE_RETAINER_CONTRACT" as const };
  }

  if (input.email) {
    const entitlement = await resolveCanonicalEntitlement({
      email: input.email,
      slug: contract.entitlementSlug,
    });

    if (!entitlement.granted) {
      return { ok: false, contract, reason: "RETAINER_ENTITLEMENT_MISSING" as const };
    }
  }

  return { ok: true, contract, reason: null };
}

export async function createRetainedDecision(input: {
  contractId: string;
  decisionObjectId: string;
  priorityLevel?: RetainedDecisionPriority;
  aiLeverageAction?: string | null;
  actorId?: string | null;
}) {
  const contract = await assertActiveRetainerContract(input.contractId);

  const decisionObject = await prisma.diagnosticDecisionObject.findUnique({
    where: { id: input.decisionObjectId },
  });

  if (!decisionObject) {
    throw new Error("decisionObjectId does not resolve to DiagnosticDecisionObject");
  }

  const aiRisk = classifyAIDecisionRisk(decisionObject);
  const aiLeverageAction = input.aiLeverageAction?.trim() || null;
  if (aiRisk.requiresAILeverageAction && !aiLeverageAction) {
    throw new Error("AI leverage action is required for HIGH or CRITICAL AI exposure decisions");
  }

  const activeDecisions = await prisma.retainedDecision.count({
    where: {
      contractId: input.contractId,
      status: { in: CAPACITY_COUNTED_STATUSES },
    },
  });

  if (activeDecisions >= contract.decisionCapacity) {
    throw new Error("Decision capacity exceeded");
  }

  const retainedDecision = await prisma.retainedDecision.create({
    data: {
      contractId: input.contractId,
      decisionObjectId: input.decisionObjectId,
      priorityLevel: input.priorityLevel ?? "MEDIUM",
      status: "ACTIVE",
      aiLeverageAction,
    },
  });

  await Promise.all([
    recordAuditEvent({
      actorType: input.actorId ? "ADMIN" : "SYSTEM",
      actorId: input.actorId ?? null,
      objectType: "DECISION",
      objectId: input.decisionObjectId,
      actionType: "LINKED",
      summary: `Decision linked to retainer contract ${input.contractId}.`,
      metadata: { retainedDecisionId: retainedDecision.id, priorityLevel: retainedDecision.priorityLevel },
    }),
    recordFoundationTelemetry({
      organisationId: contract.organisationId,
      contractId: input.contractId,
      decisionObjectId: input.decisionObjectId,
      eventType: "decision_retained",
      value: 1,
      metadata: { priorityLevel: retainedDecision.priorityLevel, aiExposureLevel: decisionObject.aiExposureLevel },
    }),
  ]).catch(() => null);

  return retainedDecision;
}

export async function recordEnforcementCycle(input: {
  retainedDecisionId: string;
  cycleDate?: Date;
  actionsTaken: unknown;
  contradictionsUpdated: unknown;
  outcomeDelta?: number | null;
  aiDriftDelta?: number | null;
  actorId?: string | null;
}) {
  const retainedDecision = await prisma.retainedDecision.findUnique({
    where: { id: input.retainedDecisionId },
    include: { contract: true },
  });

  if (!retainedDecision) {
    throw new Error("Retained decision not found");
  }

  if (retainedDecision.contract.status !== "ACTIVE") {
    throw new Error("Retainer contract is not active");
  }

  const cycle = await prisma.enforcementCycle.create({
    data: {
      retainedDecisionId: input.retainedDecisionId,
      cycleDate: input.cycleDate ?? new Date(),
      actionsTaken: input.actionsTaken as never,
      contradictionsUpdated: input.contradictionsUpdated as never,
      outcomeDelta: input.outcomeDelta ?? null,
      aiDriftDelta: input.aiDriftDelta ?? 0,
      aiStatusSignal: aiStatusSignalFromDelta(input.aiDriftDelta ?? 0),
    },
  });

  await Promise.all([
    recordAuditEvent({
      actorType: input.actorId ? "ADMIN" : "SYSTEM",
      actorId: input.actorId ?? null,
      objectType: "ENFORCEMENT_CYCLE",
      objectId: cycle.id,
      actionType: "CREATED",
      summary: `Enforcement cycle recorded for retained decision ${input.retainedDecisionId}.`,
      metadata: { retainedDecisionId: input.retainedDecisionId, outcomeDelta: cycle.outcomeDelta, aiStatusSignal: cycle.aiStatusSignal },
    }),
    recordFoundationTelemetry({
      contractId: retainedDecision.contractId,
      decisionObjectId: retainedDecision.decisionObjectId,
      eventType: "enforcement_cycle_recorded",
      value: cycle.outcomeDelta ?? 0,
      metadata: { cycleId: cycle.id, aiDriftDelta: cycle.aiDriftDelta, aiStatusSignal: cycle.aiStatusSignal },
    }),
  ]).catch(() => null);

  return cycle;
}

export async function getRetainerDecisionSurface(input: {
  organisationId?: string | null;
  contractId?: string | null;
}) {
  const contracts = await prisma.retainerContract.findMany({
    where: {
      ...(input.contractId ? { id: input.contractId } : {}),
      ...(input.organisationId ? { organisationId: input.organisationId } : {}),
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    include: {
      organisation: { select: { id: true, name: true, slug: true } },
      retainedDecisions: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          decisionObject: {
            include: {
              childDependencies: { include: { parentDecision: true } },
              parentDependencies: { include: { childDecision: true } },
              stakeholders: { include: { positions: { orderBy: { createdAt: "desc" }, take: 2 } } },
            },
          },
          playbookApplications: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { playbook: true },
          },
          enforcementCycles: { orderBy: { cycleDate: "desc" }, take: 5 },
        },
      },
    },
  });

  return contracts.map((contract) => ({
    id: contract.id,
    organisation: contract.organisation,
    tier: contract.tier,
    status: contract.status,
    decisionCapacity: contract.decisionCapacity,
    activeDecisionCount: contract.retainedDecisions.filter((decision) =>
      CAPACITY_COUNTED_STATUSES.includes(decision.status as RetainedDecisionStatus),
    ).length,
    retainedDecisions: contract.retainedDecisions.map((decision) => ({
      id: decision.id,
      priorityLevel: decision.priorityLevel,
      status: decision.status,
      decisionObjectId: decision.decisionObjectId,
      decisionText: decision.decisionObject.decisionText,
      constraintText: decision.decisionObject.constraintText,
      costOfDelayText: decision.decisionObject.costOfDelayText,
      sourceStage: decision.decisionObject.sourceStage,
      aiLeverageAction: decision.aiLeverageAction,
      ai: classifyAIDecisionRisk(decision.decisionObject),
      dependencies: {
        upstreamBlockers: decision.decisionObject.childDependencies
          .filter((dep) => dep.relationshipType === "BLOCKS" || dep.relationshipType === "CONSTRAINS")
          .map((dep) => ({
            decisionId: dep.parentDecisionId,
            relationshipType: dep.relationshipType,
            decisionText: dep.parentDecision.decisionText,
          })),
        downstreamConsequences: decision.decisionObject.parentDependencies.map((dep) => ({
          decisionId: dep.childDecisionId,
          relationshipType: dep.relationshipType,
          decisionText: dep.childDecision.decisionText,
        })),
      },
      stakeholders: decision.decisionObject.stakeholders.map((stakeholder) => ({
        id: stakeholder.id,
        name: stakeholder.name,
        role: stakeholder.role,
        function: stakeholder.function,
        influenceLevel: stakeholder.influenceLevel,
        alignmentState: stakeholder.alignmentState,
        latestPosition: stakeholder.positions[0]?.summary ?? null,
      })),
      playbookApplications: decision.playbookApplications.map((application) => ({
        id: application.id,
        status: application.status,
        playbookName: application.playbook.name,
        triggerPattern: application.playbook.triggerPattern,
        createdAt: application.createdAt.toISOString(),
      })),
      enforcementCycles: decision.enforcementCycles.map((cycle) => ({
        id: cycle.id,
        cycleDate: cycle.cycleDate.toISOString(),
        actionsTaken: cycle.actionsTaken,
        contradictionsUpdated: cycle.contradictionsUpdated,
        outcomeDelta: cycle.outcomeDelta,
        aiDriftDelta: cycle.aiDriftDelta,
        aiStatusSignal: cycle.aiStatusSignal,
      })),
    })),
  }));
}
