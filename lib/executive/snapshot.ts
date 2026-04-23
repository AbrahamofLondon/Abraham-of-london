/**
 * Executive Snapshot — compressed view for senior operators.
 *
 * This is a live compression block, not a report product.
 * Shows only what requires immediate attention.
 */

import { prisma } from "@/lib/prisma.server";

export type ExecutiveSnapshot = {
  organisationId: string;
  activeDecisionCount: number;
  criticalContradictions: Array<{
    label: string;
    severity: string;
    confidence: number;
    sourceStage: string;
    decisionText: string | null;
  }>;
  topStakeholderDivergences: Array<{
    stakeholderName: string;
    role: string;
    alignmentState: string;
    decisionText: string;
  }>;
  topDecisionDependencies: Array<{
    parentDecision: string;
    childDecision: string;
    relationshipType: string;
  }>;
  riskTrajectory: "STABILISING" | "DRIFTING" | "ESCALATING";
  requiredActions: string[];
  generatedAt: string;
};

export async function buildExecutiveSnapshot(organisationId: string): Promise<ExecutiveSnapshot> {
  // Active decisions for this organisation
  const decisionObjects = await prisma.diagnosticDecisionObject.findMany({
    where: {
      journey: { organisationKey: organisationId },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      stakeholders: {
        include: { positions: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
      parentDependencies: {
        include: { childDecision: { select: { decisionText: true } } },
      },
      childDependencies: {
        include: { parentDecision: { select: { decisionText: true } } },
      },
      strategyLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Contradiction nodes for this organisation
  const journeyIds = [...new Set(decisionObjects.map((d) => d.journeyId).filter(Boolean))] as string[];
  const contradictionNodes = journeyIds.length > 0
    ? await prisma.diagnosticEvidenceNode.findMany({
        where: { journeyId: { in: journeyIds }, kind: "contradiction" },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  // Critical contradictions (severity high or critical, top 3)
  const criticalContradictions = contradictionNodes
    .filter((n) => n.severity === "critical" || n.severity === "high")
    .slice(0, 3)
    .map((n) => {
      const relatedDecision = decisionObjects.find((d) => d.journeyId === n.journeyId);
      return {
        label: n.label,
        severity: n.severity,
        confidence: n.confidence,
        sourceStage: n.sourceStage,
        decisionText: relatedDecision?.decisionText ?? null,
      };
    });

  // Top stakeholder divergences (BLOCKING or DIVERGENT, top 2)
  const allStakeholders = decisionObjects.flatMap((d) =>
    (d.stakeholders ?? []).map((s) => ({
      stakeholderName: s.name,
      role: s.role,
      alignmentState: s.alignmentState,
      decisionText: d.decisionText,
    })),
  );
  const topDivergences = allStakeholders
    .filter((s) => s.alignmentState === "BLOCKING" || s.alignmentState === "DIVERGENT")
    .slice(0, 2);

  // Top decision dependencies (top 2)
  const allDeps = decisionObjects.flatMap((d) => [
    ...d.parentDependencies.map((dep) => ({
      parentDecision: d.decisionText,
      childDecision: dep.childDecision.decisionText,
      relationshipType: dep.relationshipType,
    })),
    ...d.childDependencies.map((dep) => ({
      parentDecision: dep.parentDecision.decisionText,
      childDecision: d.decisionText,
      relationshipType: dep.relationshipType,
    })),
  ]);
  const topDependencies = allDeps.slice(0, 2);

  // Active decisions (pending or active strategy logs)
  const activeCount = decisionObjects.filter((d) => {
    const log = d.strategyLogs[0];
    return !log || log.status === "pending" || log.status === "blocked";
  }).length;

  // Risk trajectory
  const escalatedCount = decisionObjects.filter((d) => d.strategyLogs[0]?.status === "escalated").length;
  const blockedCount = decisionObjects.filter((d) => d.strategyLogs[0]?.status === "blocked").length;
  const riskTrajectory: ExecutiveSnapshot["riskTrajectory"] =
    escalatedCount > 0 || criticalContradictions.length >= 2 ? "ESCALATING"
    : blockedCount > 0 || criticalContradictions.length >= 1 ? "DRIFTING"
    : "STABILISING";

  // Required actions
  const requiredActions: string[] = [];
  if (criticalContradictions.length > 0) {
    requiredActions.push(`Resolve ${criticalContradictions.length} critical contradiction${criticalContradictions.length > 1 ? "s" : ""}`);
  }
  if (topDivergences.length > 0) {
    requiredActions.push(`Address ${topDivergences.length} stakeholder divergence${topDivergences.length > 1 ? "s" : ""}`);
  }
  if (blockedCount > 0) {
    requiredActions.push(`Unblock ${blockedCount} decision${blockedCount > 1 ? "s" : ""}`);
  }
  if (escalatedCount > 0) {
    requiredActions.push(`Handle ${escalatedCount} escalation${escalatedCount > 1 ? "s" : ""}`);
  }
  const deps = allDeps.filter((d) => d.relationshipType === "BLOCKS");
  if (deps.length > 0) {
    requiredActions.push(`Resolve ${deps.length} blocking dependency chain${deps.length > 1 ? "s" : ""}`);
  }

  return {
    organisationId,
    activeDecisionCount: activeCount,
    criticalContradictions,
    topStakeholderDivergences: topDivergences,
    topDecisionDependencies: topDependencies,
    riskTrajectory,
    requiredActions,
    generatedAt: new Date().toISOString(),
  };
}
