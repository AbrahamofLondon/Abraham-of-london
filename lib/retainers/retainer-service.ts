import { prisma } from "@/lib/prisma.server";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";

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
}) {
  const tier = normalizeRetainerTier(input.tier);
  const organisation = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true },
  });

  if (!organisation) {
    throw new Error("Organisation not found");
  }

  return prisma.retainerContract.create({
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

  return prisma.retainerContract.updateMany({
    where: { stripeSubscriptionId: input.stripeSubscriptionId },
    data: { status },
  });
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
}) {
  const contract = await assertActiveRetainerContract(input.contractId);

  const decisionObject = await prisma.diagnosticDecisionObject.findUnique({
    where: { id: input.decisionObjectId },
    select: { id: true },
  });

  if (!decisionObject) {
    throw new Error("decisionObjectId does not resolve to DiagnosticDecisionObject");
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

  return prisma.retainedDecision.create({
    data: {
      contractId: input.contractId,
      decisionObjectId: input.decisionObjectId,
      priorityLevel: input.priorityLevel ?? "MEDIUM",
      status: "ACTIVE",
    },
  });
}

export async function recordEnforcementCycle(input: {
  retainedDecisionId: string;
  cycleDate?: Date;
  actionsTaken: unknown;
  contradictionsUpdated: unknown;
  outcomeDelta?: number | null;
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

  return prisma.enforcementCycle.create({
    data: {
      retainedDecisionId: input.retainedDecisionId,
      cycleDate: input.cycleDate ?? new Date(),
      actionsTaken: input.actionsTaken as never,
      contradictionsUpdated: input.contradictionsUpdated as never,
      outcomeDelta: input.outcomeDelta ?? null,
    },
  });
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
          decisionObject: true,
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
      enforcementCycles: decision.enforcementCycles.map((cycle) => ({
        id: cycle.id,
        cycleDate: cycle.cycleDate.toISOString(),
        actionsTaken: cycle.actionsTaken,
        contradictionsUpdated: cycle.contradictionsUpdated,
        outcomeDelta: cycle.outcomeDelta,
      })),
    })),
  }));
}
