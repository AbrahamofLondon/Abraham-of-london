import { prisma } from "@/lib/prisma.server";

export type DependencyRelationship = "BLOCKS" | "ENABLES" | "AMPLIFIES" | "CONSTRAINS";
export type StakeholderInfluence = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type StakeholderAlignment = "ALIGNED" | "DIVERGENT" | "BLOCKING" | "UNKNOWN";
export type AuditActorType = "USER" | "ADMIN" | "SYSTEM";
export type AuditObjectType = "DECISION" | "CONTRACT" | "ENFORCEMENT_CYCLE" | "STAKEHOLDER" | "OUTCOME" | "PLAYBOOK";
export type AuditActionType = "CREATED" | "UPDATED" | "LINKED" | "BLOCKED" | "RESOLVED" | "TERMINATED";

const RELATIONSHIPS: DependencyRelationship[] = ["BLOCKS", "ENABLES", "AMPLIFIES", "CONSTRAINS"];
const INFLUENCE: StakeholderInfluence[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const ALIGNMENT: StakeholderAlignment[] = ["ALIGNED", "DIVERGENT", "BLOCKING", "UNKNOWN"];

function assertOneOf<T extends string>(value: string, allowed: readonly T[], label: string): T {
  const normalized = value.trim().toUpperCase();
  if (allowed.includes(normalized as T)) return normalized as T;
  throw new Error(`Invalid ${label}`);
}

export async function recordAuditEvent(input: {
  actorType: AuditActorType;
  actorId?: string | null;
  objectType: AuditObjectType;
  objectId: string;
  actionType: AuditActionType;
  summary: string;
  metadata?: unknown;
}) {
  return prisma.auditEvent.create({
    data: {
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      objectType: input.objectType,
      objectId: input.objectId,
      actionType: input.actionType,
      summary: input.summary,
      metadata: (input.metadata ?? null) as never,
    },
  });
}

export async function recordFoundationTelemetry(input: {
  organisationId?: string | null;
  contractId?: string | null;
  decisionObjectId?: string | null;
  eventType: string;
  value?: number | null;
  metadata?: unknown;
}) {
  return prisma.foundationTelemetryEvent.create({
    data: {
      organisationId: input.organisationId ?? null,
      contractId: input.contractId ?? null,
      decisionObjectId: input.decisionObjectId ?? null,
      eventType: input.eventType,
      value: input.value ?? null,
      metadata: (input.metadata ?? null) as never,
    },
  });
}

export async function createDecisionDependency(input: {
  parentDecisionId: string;
  childDecisionId: string;
  relationshipType: DependencyRelationship | string;
  actorId?: string | null;
}) {
  const relationshipType = assertOneOf(input.relationshipType, RELATIONSHIPS, "relationshipType");
  if (input.parentDecisionId === input.childDecisionId) {
    throw new Error("Decision dependency cannot reference itself");
  }

  const [parent, child] = await Promise.all([
    prisma.diagnosticDecisionObject.findUnique({ where: { id: input.parentDecisionId }, select: { id: true } }),
    prisma.diagnosticDecisionObject.findUnique({ where: { id: input.childDecisionId }, select: { id: true } }),
  ]);

  if (!parent || !child) {
    throw new Error("Both dependency decisions must resolve to DiagnosticDecisionObject");
  }

  const dependency = await prisma.decisionDependency.create({
    data: {
      parentDecisionId: input.parentDecisionId,
      childDecisionId: input.childDecisionId,
      relationshipType,
    },
  });

  await recordAuditEvent({
    actorType: input.actorId ? "ADMIN" : "SYSTEM",
    actorId: input.actorId ?? null,
    objectType: "DECISION",
    objectId: input.childDecisionId,
    actionType: "LINKED",
    summary: `Decision ${input.childDecisionId} linked to ${input.parentDecisionId} as ${relationshipType}.`,
    metadata: { dependencyId: dependency.id, parentDecisionId: input.parentDecisionId, relationshipType },
  }).catch(() => null);

  return dependency;
}

export async function getDecisionImpactView(decisionObjectId: string) {
  const decision = await prisma.diagnosticDecisionObject.findUnique({
    where: { id: decisionObjectId },
    include: {
      parentDependencies: { include: { childDecision: true } },
      childDependencies: { include: { parentDecision: true } },
      stakeholders: { include: { positions: { orderBy: { createdAt: "desc" }, take: 3 } } },
    },
  });

  if (!decision) throw new Error("Decision not found");

  const upstreamBlockers = decision.childDependencies
    .filter((dep) => dep.relationshipType === "BLOCKS" || dep.relationshipType === "CONSTRAINS")
    .map((dep) => ({
      dependencyId: dep.id,
      decisionId: dep.parentDecisionId,
      relationshipType: dep.relationshipType,
      decisionText: dep.parentDecision.decisionText,
    }));
  const downstreamConsequences = decision.parentDependencies.map((dep) => ({
    dependencyId: dep.id,
    decisionId: dep.childDecisionId,
    relationshipType: dep.relationshipType,
    decisionText: dep.childDecision.decisionText,
  }));
  const blockingStakeholders = decision.stakeholders.filter((s) => s.alignmentState === "BLOCKING");
  const criticalPath =
    upstreamBlockers.length > 0 ||
    downstreamConsequences.some((dep) => dep.relationshipType === "ENABLES" || dep.relationshipType === "AMPLIFIES") ||
    blockingStakeholders.some((s) => s.influenceLevel === "HIGH" || s.influenceLevel === "CRITICAL");

  return {
    decisionId: decision.id,
    upstreamBlockers,
    downstreamConsequences,
    dependencyCount: decision.parentDependencies.length + decision.childDependencies.length,
    criticalPath,
    stakeholderClassification: classifyDecisionStakeholders(decision.stakeholders),
  };
}

export function classifyDecisionStakeholders(stakeholders: Array<{
  influenceLevel: string;
  alignmentState: string;
  role?: string | null;
  function?: string | null;
}>) {
  const blockers = stakeholders.filter((s) => s.alignmentState === "BLOCKING");
  const divergent = stakeholders.filter((s) => s.alignmentState === "DIVERGENT");
  const criticalBlockers = blockers.filter((s) => s.influenceLevel === "HIGH" || s.influenceLevel === "CRITICAL");
  const hasOwner = stakeholders.some((s) => /owner|sponsor|accountable|executive|ceo|chair/i.test(`${s.role} ${s.function}`));

  if (stakeholders.length === 0) return "hidden ownership gap";
  if (criticalBlockers.length === 1) return "single-point blocker";
  if (criticalBlockers.length > 1 || divergent.length >= 2) return "authority divergence";
  if (!hasOwner) return "decision orphaning";
  return "mapped authority";
}

export async function createDecisionStakeholder(input: {
  decisionObjectId: string;
  name: string;
  role: string;
  functionName: string;
  influenceLevel: StakeholderInfluence | string;
  alignmentState: StakeholderAlignment | string;
  positionSummary?: string | null;
  contradictionFlag?: boolean;
  actorId?: string | null;
}) {
  const decision = await prisma.diagnosticDecisionObject.findUnique({
    where: { id: input.decisionObjectId },
    select: { id: true },
  });
  if (!decision) throw new Error("decisionObjectId does not resolve to DiagnosticDecisionObject");

  const stakeholder = await prisma.decisionStakeholder.create({
    data: {
      decisionObjectId: input.decisionObjectId,
      name: input.name.trim(),
      role: input.role.trim(),
      function: input.functionName.trim(),
      influenceLevel: assertOneOf(input.influenceLevel, INFLUENCE, "influenceLevel"),
      alignmentState: assertOneOf(input.alignmentState, ALIGNMENT, "alignmentState"),
    },
  });

  if (input.positionSummary?.trim()) {
    await prisma.stakeholderPosition.create({
      data: {
        stakeholderId: stakeholder.id,
        summary: input.positionSummary.trim(),
        confidence: 0.7,
        contradictionFlag: Boolean(input.contradictionFlag),
      },
    });
  }

  await recordAuditEvent({
    actorType: input.actorId ? "ADMIN" : "SYSTEM",
    actorId: input.actorId ?? null,
    objectType: "STAKEHOLDER",
    objectId: stakeholder.id,
    actionType: "CREATED",
    summary: `${stakeholder.name} attached to decision ${input.decisionObjectId}.`,
    metadata: { decisionObjectId: input.decisionObjectId, alignmentState: stakeholder.alignmentState },
  }).catch(() => null);

  if (stakeholder.alignmentState === "BLOCKING" || stakeholder.alignmentState === "DIVERGENT") {
    await recordFoundationTelemetry({
      decisionObjectId: input.decisionObjectId,
      eventType: "stakeholder_divergence",
      value: stakeholder.alignmentState === "BLOCKING" ? 2 : 1,
      metadata: { stakeholderId: stakeholder.id, influenceLevel: stakeholder.influenceLevel },
    }).catch(() => null);
  }

  return stakeholder;
}

export async function createEnforcementPlaybook(input: {
  name: string;
  triggerPattern: string;
  actionSequence: unknown;
  expectedOutcome?: string | null;
  actorId?: string | null;
}) {
  const playbook = await prisma.enforcementPlaybook.create({
    data: {
      name: input.name.trim(),
      triggerPattern: input.triggerPattern.trim(),
      actionSequence: input.actionSequence as never,
      expectedOutcome: input.expectedOutcome?.trim() || null,
    },
  });

  await recordAuditEvent({
    actorType: input.actorId ? "ADMIN" : "SYSTEM",
    actorId: input.actorId ?? null,
    objectType: "PLAYBOOK",
    objectId: playbook.id,
    actionType: "CREATED",
    summary: `Enforcement playbook created: ${playbook.name}.`,
    metadata: { triggerPattern: playbook.triggerPattern },
  }).catch(() => null);

  return playbook;
}

export async function applyEnforcementPlaybook(input: {
  playbookId: string;
  retainedDecisionId: string;
  actorId?: string | null;
}) {
  const [playbook, retainedDecision] = await Promise.all([
    prisma.enforcementPlaybook.findUnique({ where: { id: input.playbookId } }),
    prisma.retainedDecision.findUnique({ where: { id: input.retainedDecisionId }, include: { contract: true } }),
  ]);

  if (!playbook || playbook.status !== "ACTIVE") throw new Error("Active playbook not found");
  if (!retainedDecision) throw new Error("Retained decision not found");
  if (retainedDecision.contract.status !== "ACTIVE") throw new Error("Retainer contract is not active");

  const application = await prisma.playbookApplication.create({
    data: {
      playbookId: input.playbookId,
      retainedDecisionId: input.retainedDecisionId,
      appliedBy: input.actorId ?? null,
      status: "APPLIED",
    },
  });

  await Promise.all([
    recordAuditEvent({
      actorType: input.actorId ? "ADMIN" : "SYSTEM",
      actorId: input.actorId ?? null,
      objectType: "PLAYBOOK",
      objectId: playbook.id,
      actionType: "LINKED",
      summary: `Playbook ${playbook.name} applied to retained decision ${input.retainedDecisionId}.`,
      metadata: { applicationId: application.id, retainedDecisionId: input.retainedDecisionId },
    }),
    recordFoundationTelemetry({
      contractId: retainedDecision.contractId,
      decisionObjectId: retainedDecision.decisionObjectId,
      eventType: "playbook_applied",
      value: 1,
      metadata: { playbookId: playbook.id, triggerPattern: playbook.triggerPattern },
    }),
  ]).catch(() => null);

  return application;
}

export async function getFoundationTelemetrySummary() {
  const [
    decisionsPerContract,
    stakeholderDivergence,
    playbookUsage,
    recurrence,
    recentAuditEvents,
  ] = await Promise.all([
    prisma.retainedDecision.groupBy({ by: ["contractId"], _count: { id: true } }),
    prisma.decisionStakeholder.groupBy({ by: ["alignmentState"], _count: { id: true } }),
    prisma.playbookApplication.groupBy({ by: ["playbookId"], _count: { id: true } }),
    prisma.foundationTelemetryEvent.groupBy({ by: ["eventType"], _count: { id: true }, _avg: { value: true } }),
    prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return {
    decisionsPerContract,
    stakeholderDivergence,
    playbookUsage,
    recurrence,
    recentAuditEvents,
  };
}

export async function getExecutiveRiskSnapshot() {
  const [
    activeContracts,
    activeDecisions,
    criticalAiDecisions,
    blockingStakeholders,
    unresolvedCycles,
    recentAuditEvents,
  ] = await Promise.all([
    prisma.retainerContract.count({ where: { status: "ACTIVE" } }),
    prisma.retainedDecision.count({ where: { status: { in: ["ACTIVE", "MONITORED"] } } }),
    prisma.diagnosticDecisionObject.count({ where: { aiExposureLevel: { in: ["HIGH", "CRITICAL"] } } }),
    prisma.decisionStakeholder.count({ where: { alignmentState: "BLOCKING" } }),
    prisma.enforcementCycle.count({ where: { outcomeDelta: null } }),
    prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return {
    activeContracts,
    activeDecisions,
    criticalAiDecisions,
    blockingStakeholders,
    unresolvedCycles,
    recentAuditEvents,
    launchRisk:
      blockingStakeholders > 0 || criticalAiDecisions > activeDecisions
        ? "ELEVATED"
        : activeDecisions > 0
          ? "CONTROLLED"
          : "INSUFFICIENT_SIGNAL",
  };
}
