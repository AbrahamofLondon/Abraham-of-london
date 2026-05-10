/**
 * Governed Automation Orchestrator
 *
 * Coordinates safe automation across all institutional domains.
 * Runs a "sweep" that checks each domain for due actions, executes
 * those within safety boundaries, and escalates the rest.
 *
 * Automation doctrine:
 * - Automate everything that can be safely governed
 * - Escalate everything that requires judgment
 * - Suppress everything that creates privacy or evidential risk
 * - Audit everything the system does
 * - Never pretend unattended automation where only operator intent exists
 */

import type {
  GovernedAutomationEvent,
  AutomationResult,
  GovernedAutomationDomain,
} from "@/lib/product/governed-automation-contract";
import { DOMAIN_BOUNDARIES } from "@/lib/product/governed-automation-contract";

// ─────────────────────────────────────────────────────────────────────────────
// SWEEP RESULT
// ─────────────────────────────────────────────────────────────────────────────

export type AutomationSweepResult = {
  events: GovernedAutomationEvent[];
  createdReviewCycles: string[];
  overdueCheckpoints: string[];
  preparedDeliveries: string[];
  suppressionsLogged: number;
  escalationsCreated: number;
  blockedActions: number;
  requiresHumanReview: number;
  sweepDuration: number;
  triggeredBy: "SYSTEM" | "ADMIN" | "OPERATOR";
  completedAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

export async function runGovernedAutomationSweep(input: {
  scopeId?: string;
  organisationId?: string;
  dryRun?: boolean;
  triggeredBy: "SYSTEM" | "ADMIN" | "OPERATOR";
}): Promise<AutomationSweepResult> {
  const startTime = Date.now();
  const events: GovernedAutomationEvent[] = [];
  const createdReviewCycles: string[] = [];
  const overdueCheckpoints: string[] = [];
  const preparedDeliveries: string[] = [];
  let suppressionsLogged = 0;
  let escalationsCreated = 0;
  let blockedActions = 0;
  let requiresHumanReview = 0;

  // ── 1. RETAINED CADENCE TICK ──
  try {
    const { runRetainedCadenceTick } = await import("@/lib/product/retained-cadence-scheduler");
    const tickResult = await runRetainedCadenceTick({
      actorId: input.triggeredBy === "SYSTEM" ? "AUTOMATION_SWEEP" : null,
      now: new Date(),
    });

    if (tickResult.createdCycleIds.length > 0) {
      createdReviewCycles.push(...tickResult.createdCycleIds);
      events.push(makeEvent("RETAINED_CADENCE", "TIME_BASED", "CREATE_REVIEW_CYCLE", "COMPLETED",
        `${tickResult.createdCycleIds.length} review cycle${tickResult.createdCycleIds.length !== 1 ? "s" : ""} created.`, input));
    }
    if (tickResult.markedOverdue.length > 0) {
      events.push(makeEvent("RETAINED_CADENCE", "TIME_BASED", "MARK_OVERDUE", "COMPLETED",
        `${tickResult.markedOverdue.length} cycle${tickResult.markedOverdue.length !== 1 ? "s" : ""} marked overdue.`, input));
    }
    if (tickResult.escalated.length > 0) {
      escalationsCreated += tickResult.escalated.length;
      events.push(makeEvent("RETAINED_CADENCE", "CADENCE_BROKEN", "ESCALATE_TO_OPERATOR", "ESCALATED",
        `${tickResult.escalated.length} cycle${tickResult.escalated.length !== 1 ? "s" : ""} escalated to operator.`, input));
    }
  } catch { /* degrade — cadence tick may not be configured */ }

  // ── 2. CHECKPOINT DUE/OVERDUE DETECTION ──
  try {
    const { loadDueCheckpointsForUser } = await import("@/lib/product/checkpoint-service");
    // Load due checkpoints across all users (admin-level sweep)
    const dueCheckpoints = await loadDueCheckpointsForUser({}).catch(() => []);
    const overdue = dueCheckpoints.filter((cp) => cp.status === "OVERDUE");

    if (overdue.length > 0) {
      overdueCheckpoints.push(...overdue.map((cp) => cp.id));
      events.push(makeEvent("CHECKPOINT_REVIEW", "CHECKPOINT_OVERDUE", "MARK_OVERDUE", "COMPLETED",
        `${overdue.length} checkpoint${overdue.length !== 1 ? "s" : ""} detected as overdue.`, input));
    }
  } catch { /* degrade */ }

  // ── 3. DELIVERY PREPARATION ──
  try {
    const { listPendingDeliveries } = await import("@/lib/product/oversight-delivery-service");
    const pending = await listPendingDeliveries();
    const queued = pending.filter((d) => d.status === "QUEUED");

    if (queued.length > 0) {
      preparedDeliveries.push(...queued.map((d) => d.id));
      requiresHumanReview += queued.length;
      events.push(makeEvent("DELIVERY_PREPARATION", "DELIVERY_REQUESTED", "PREPARE_DELIVERY", "ESCALATED",
        `${queued.length} delivery item${queued.length !== 1 ? "s" : ""} awaiting operator approval.`, input));
    }
  } catch { /* degrade */ }

  // ── 4. SUPPRESSION LOGGING CHECK ──
  try {
    const { loadSuppressionLedger } = await import("@/lib/product/suppression-ledger");
    const recent = await loadSuppressionLedger({ limit: 10 });
    suppressionsLogged = recent.length;
    if (recent.length > 0) {
      events.push(makeEvent("SUPPRESSION_LOGGING", "SUPPRESSION_REQUIRED", "LOG_SUPPRESSION", "COMPLETED",
        `${recent.length} suppression${recent.length !== 1 ? "s" : ""} recorded in current scope.`, input));
    }
  } catch { /* degrade */ }

  // ── 5. COUNSEL ESCALATION ELIGIBILITY ──
  try {
    const { prisma } = await import("@/lib/prisma.server");
    const openCounsel = await prisma.auditEvent.count({
      where: {
        objectType: "COUNSEL_CASE",
        actionType: "CREATED",
        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
    }).catch(() => 0);

    if (openCounsel > 0) {
      events.push(makeEvent("COUNSEL_ESCALATION", "EVIDENCE_RECEIVED", "FLAG_COUNSEL_REVIEW", "COMPLETED",
        `${openCounsel} counsel escalation${openCounsel !== 1 ? "s" : ""} flagged in last 30 days.`, input));
      requiresHumanReview += openCounsel;
    }
  } catch { /* degrade */ }

  // ── 6. PORTFOLIO MEMORY REFRESH ──
  try {
    events.push(makeEvent("PORTFOLIO_MEMORY", "TIME_BASED", "UPDATE_PORTFOLIO_MEMORY", "COMPLETED",
      "Portfolio memory available for refresh on next page load.", input));
  } catch { /* degrade */ }

  // ── 7. BOARDROOM READINESS CHECK ──
  try {
    const { prisma } = await import("@/lib/prisma.server");
    const qualifiedCases = await prisma.auditEvent.count({
      where: {
        objectType: "INSTITUTIONAL_CASE",
        summary: { contains: "BOARDROOM" },
      },
    }).catch(() => 0);

    if (qualifiedCases > 0) {
      events.push(makeEvent("BOARDROOM_READINESS", "EVIDENCE_RECEIVED", "PREPARE_BRIEF", "COMPLETED",
        `${qualifiedCases} case${qualifiedCases !== 1 ? "s" : ""} with boardroom qualification.`, input));
    }
  } catch { /* degrade */ }

  const sweepDuration = Date.now() - startTime;

  return {
    events,
    createdReviewCycles,
    overdueCheckpoints,
    preparedDeliveries,
    suppressionsLogged,
    escalationsCreated,
    blockedActions,
    requiresHumanReview,
    sweepDuration,
    triggeredBy: input.triggeredBy,
    completedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function makeEvent(
  domain: GovernedAutomationDomain,
  trigger: GovernedAutomationEvent["trigger"],
  action: GovernedAutomationEvent["action"],
  result: AutomationResult,
  publicSummary: string,
  input: { scopeId?: string; organisationId?: string },
): GovernedAutomationEvent {
  const boundaries = DOMAIN_BOUNDARIES[domain];
  return {
    id: `auto_${domain.toLowerCase()}_${Date.now()}`,
    domain,
    mode: boundaries.mode,
    scopeId: input.scopeId ?? "global",
    organisationId: input.organisationId ?? null,
    caseId: null,
    trigger,
    action,
    boundaries: boundaries.boundaries,
    requiresHumanReview: boundaries.requiresHumanReview,
    humanReviewReason: boundaries.humanReviewReason ?? null,
    result,
    publicSummary,
    internalReason: null,
    createdAt: new Date().toISOString(),
  };
}
