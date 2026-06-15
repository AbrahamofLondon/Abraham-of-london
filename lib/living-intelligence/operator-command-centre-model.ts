/**
 * lib/living-intelligence/operator-command-centre-model.ts
 *
 * Pure model derivation for the Operator Command Centre.
 *
 * Takes the LivingStateReportSnapshot and derives the aggregated command centre
 * model. This is a pure projection — it does not read files, does not access
 * the engine, and does not invent state.
 *
 * The model answers:
 *   1. What is currently blocked across the estate?
 *   2. Which blocked objects matter most?
 *   3. Which domains carry the highest operational risk?
 *   4. What can the operator act on now?
 *   5. What has no repair route?
 *   6. What is unsafe to automate?
 *   7. What requires owner decision?
 *   8. What is user-safe versus operator-only?
 *   9. What has repeated since previous runs?
 *  10. What has resolved, regressed, or worsened?
 */

import type { LivingStateObject, LivingStateSeverity } from "@/lib/living-intelligence/living-state-object-contract";
import type { LivingStateReportSnapshot } from "@/lib/living-intelligence/living-state-report-loader";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PriorityQueueItem = {
  id: string;
  domain: string;
  title: string;
  stage: string;
  severity: "blocker" | "governed_tension" | "warning" | "informational";
  reason: string;
  nextAction: string;
  owner: string;
  repairRoute?: string;
  safeToAutomate: boolean;
};

export type DomainAlert = {
  domain: string;
  summary: string;
  blocked: number;
  topRisk: string;
};

export type OperatorCommandCentreModel = {
  generatedAt: string;
  totals: {
    objects: number;
    blocked: number;
    governedTensions: number;
    warnings: number;
    missingRepairRoutes: number;
    unsafeToAutomate: number;
    ownerDecisions: number;
    userSafe: number;
    operatorOnly: number;
  };
  byDomain: Record<
    string,
    {
      objects: number;
      blocked: number;
      governedTensions: number;
      warnings: number;
      missingRepairRoutes: number;
      unsafeToAutomate: number;
    }
  >;
  priorityQueue: PriorityQueueItem[];
  domainAlerts: DomainAlert[];
  memory: {
    repeated: number;
    resolved: number;
    regressed: number;
    newIssues: number;
  };
  refusedToInfer: string[];
};

// ─── Severity rank for sorting ───────────────────────────────────────────────

const SEVERITY_RANK: Record<string, number> = {
  blocker: 4,
  governed_tension: 3,
  warning: 2,
  informational: 1,
};

// ─── Domain display labels ───────────────────────────────────────────────────

const DOMAIN_LABELS: Record<string, string> = {
  boardroom: "Boardroom",
  assessment: "Assessment",
  commercial: "Commercial",
  fulfilment: "Fulfilment",
  gmi: "GMI",
  content: "Content",
  decision_centre: "Decision Centre",
  strategy_room: "Strategy Room",
  retainer_oversight: "Retainer Oversight",
  professional: "Professional",
};

// ─── Model derivation ────────────────────────────────────────────────────────

export function buildOperatorCommandCentreModel(
  snapshot: LivingStateReportSnapshot,
): OperatorCommandCentreModel {
  const objects = snapshot.objects;
  const now = snapshot.generatedAt ?? new Date().toISOString();

  // ── Totals ──────────────────────────────────────────────────────────────────
  const blocked = objects.filter((o) =>
    o.blockers.some((b) => b.severity === "blocker"),
  ).length;

  const governedTensions = objects.filter((o) =>
    o.blockers.some((b) => b.severity === "governed_tension"),
  ).length;

  const warnings = objects.filter((o) =>
    o.blockers.some((b) => b.severity === "warning"),
  ).length;

  const missingRepairRoutes = objects.filter((o) =>
    o.blockers.some((b) => b.code === "missing_repair_path" || b.code === "route_missing"),
  ).length;

  const unsafeToAutomate = objects.filter((o) => !o.safeToAutomate).length;

  const ownerDecisions = objects.filter((o) =>
    o.blockers.some((b) => b.code === "owner_decision_required"),
  ).length;

  const userSafe = objects.filter((o) => o.safeToShowUser).length;
  const operatorOnly = objects.filter((o) => !o.safeToShowUser).length;

  // ── By domain ───────────────────────────────────────────────────────────────
  const domainKeys = [...new Set(objects.map((o) => o.domain))].sort();
  const byDomain: Record<string, {
    objects: number;
    blocked: number;
    governedTensions: number;
    warnings: number;
    missingRepairRoutes: number;
    unsafeToAutomate: number;
  }> = {};

  for (const domain of domainKeys) {
    const domainObjects = objects.filter((o) => o.domain === domain);
    byDomain[domain] = {
      objects: domainObjects.length,
      blocked: domainObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length,
      governedTensions: domainObjects.filter((o) => o.blockers.some((b) => b.severity === "governed_tension")).length,
      warnings: domainObjects.filter((o) => o.blockers.some((b) => b.severity === "warning")).length,
      missingRepairRoutes: domainObjects.filter((o) =>
        o.blockers.some((b) => b.code === "missing_repair_path" || b.code === "route_missing"),
      ).length,
      unsafeToAutomate: domainObjects.filter((o) => !o.safeToAutomate).length,
    };
  }

  // ── Priority queue ──────────────────────────────────────────────────────────
  const priorityQueue: PriorityQueueItem[] = [];

  for (const object of objects) {
    if (object.blockers.length === 0) continue;

    // Determine the highest severity among blockers.
    const topBlocker = object.blockers.reduce((a, b) =>
      (SEVERITY_RANK[b.severity] ?? 0) > (SEVERITY_RANK[a.severity] ?? 0) ? b : a,
    );

    const topSeverity = topBlocker.severity;

    // Collect unique owners from blockers.
    const owners = [...new Set(object.blockers.map((b) => b.actionOwner))];

    // Find the first repair route.
    const repairRoute = object.blockers.find((b) => b.repairRoute)?.repairRoute;

    priorityQueue.push({
      id: object.id,
      domain: object.domain,
      title: object.title,
      stage: object.currentStage,
      severity: topSeverity,
      reason: topBlocker.explanation.slice(0, 200),
      nextAction: topBlocker.requiredAction,
      owner: owners.join(", "),
      repairRoute,
      safeToAutomate: object.safeToAutomate,
    });
  }

  // Sort: blocker first, then governed_tension, then warning, then informational.
  // Within same severity, missing repair route before others.
  priorityQueue.sort((a, b) => {
    const sevDiff = (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0);
    if (sevDiff !== 0) return sevDiff;
    // Missing repair route ranks higher within same severity.
    const aHasMissing = !a.repairRoute && a.severity === "blocker" ? 1 : 0;
    const bHasMissing = !b.repairRoute && b.severity === "blocker" ? 1 : 0;
    return bHasMissing - aHasMissing;
  });

  // ── Domain alerts ───────────────────────────────────────────────────────────
  const domainAlerts: DomainAlert[] = [];

  for (const domain of domainKeys) {
    const d = byDomain[domain];
    if (!d) continue;
    if (d.blocked === 0 && d.governedTensions === 0 && d.warnings === 0) continue;

    const label = DOMAIN_LABELS[domain] ?? domain;
    const domainObjects = objects.filter((o) => o.domain === domain);

    // Find top risk: most severe blocker explanation.
    let topRisk = "No blockers";
    for (const obj of domainObjects) {
      for (const b of obj.blockers) {
        if (b.severity === "blocker") {
          topRisk = b.explanation.slice(0, 120);
          break;
        }
      }
      if (topRisk !== "No blockers") break;
    }
    if (topRisk === "No blockers") {
      for (const obj of domainObjects) {
        for (const b of obj.blockers) {
          topRisk = b.explanation.slice(0, 120);
          break;
        }
        if (topRisk !== "No blockers") break;
      }
    }

    const parts: string[] = [];
    if (d.blocked > 0) parts.push(`${d.blocked} blocked`);
    if (d.governedTensions > 0) parts.push(`${d.governedTensions} tension(s)`);
    if (d.warnings > 0) parts.push(`${d.warnings} warning(s)`);
    if (d.missingRepairRoutes > 0) parts.push(`${d.missingRepairRoutes} missing repair route(s)`);

    domainAlerts.push({
      domain,
      summary: `${label}: ${parts.join(", ")}.`,
      blocked: d.blocked,
      topRisk,
    });
  }

  // Sort domain alerts by blocked count descending.
  domainAlerts.sort((a, b) => b.blocked - a.blocked);

  // ── Memory ──────────────────────────────────────────────────────────────────
  const memory = snapshot.memory ?? {
    newIssues: 0,
    repeatedIssues: 0,
    resolvedIssues: 0,
    regressions: 0,
    rememberedObjects: 0,
  };

  return {
    generatedAt: now,
    totals: {
      objects: objects.length,
      blocked,
      governedTensions,
      warnings,
      missingRepairRoutes,
      unsafeToAutomate,
      ownerDecisions,
      userSafe,
      operatorOnly,
    },
    byDomain,
    priorityQueue,
    domainAlerts,
    memory: {
      repeated: memory.repeatedIssues,
      resolved: memory.resolvedIssues,
      regressed: memory.regressions,
      newIssues: memory.newIssues,
    },
    refusedToInfer: snapshot.refusedToInfer,
  };
}
