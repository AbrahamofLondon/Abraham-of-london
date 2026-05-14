/**
 * lib/admin/admin-action-doctrine.ts
 *
 * Deterministic operator action doctrine layer.
 *
 * Consumes already-computed admin signals (from operator-command-centre.ts
 * queue cards) and returns prioritised, evidence-governed action recommendations.
 *
 * Rules:
 *   1. Never invent data — only derive from supplied signals.
 *   2. Never call external services.
 *   3. No AI, no heuristics — rules only.
 *   4. Unavailable data sources are cautious (unknown ≠ zero).
 *   5. Priority: CRITICAL > HIGH > MEDIUM > LOW.
 *   6. Doctrine order: overdue cadence → failed delivery → unresolved suppression
 *      → outcome verification → review bench backlog → readiness gaps.
 */

import type { OperatorQueueCard } from "@/lib/admin/operator-command-centre";

// ─── Public types ─────────────────────────────────────────────────────────────

export type DoctrineSignalSource =
  | "OPERATOR_QUEUE"
  | "RETAINER_READINESS"
  | "CADENCE"
  | "REPORT_STATE"
  | "DELIVERY"
  | "SUPPRESSION"
  | "OUTCOME_VERIFICATION"
  | "OVERSIGHT_BATCH"
  | "ACCESS_DIAGNOSTIC"
  | "EVENT_LOG";

export type DoctrinePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AdminActionDoctrineSignal = {
  source: DoctrineSignalSource;
  severity: DoctrinePriority;
  status: string;
  label: string;
  evidence: string[];
  href?: string;
};

export type AdminActionDoctrineRecommendation = {
  id: string;
  priority: DoctrinePriority;
  title: string;
  rationale: string;
  recommendedAction: string;
  href?: string;
  actionLabel?: string;
  blockers?: string[];
  evidence: string[];
};

// ─── Priority ordering ────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<DoctrinePriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function metricValue(card: OperatorQueueCard, label: string): number | null {
  return card.metrics.find((m) => m.label === label)?.value ?? null;
}

function cardByIdFromSignalList(
  cards: OperatorQueueCard[],
  id: OperatorQueueCard["id"],
): OperatorQueueCard | undefined {
  return cards.find((c) => c.id === id);
}

// ─── Signal extraction ────────────────────────────────────────────────────────

/**
 * Extract doctrine signals from operator queue cards.
 * Each card may emit zero, one, or several signals depending on its metrics.
 */
export function extractDoctrineSignals(cards: OperatorQueueCard[]): AdminActionDoctrineSignal[] {
  const signals: AdminActionDoctrineSignal[] = [];

  for (const card of cards) {
    if (card.status === "unavailable") {
      signals.push({
        source: cardSourceMap[card.id] ?? "OPERATOR_QUEUE",
        severity: "MEDIUM",
        status: "UNAVAILABLE",
        label: `${card.title} data unavailable`,
        evidence: [
          `${card.title} source could not be loaded. Treat as unknown, not zero.`,
        ],
        href: card.href,
      });
      continue;
    }

    switch (card.id) {
      case "retained-cadence": {
        const overdue = metricValue(card, "Overdue");
        const dueThisWeek = metricValue(card, "Due this week");
        if (overdue && overdue > 0) {
          signals.push({
            source: "CADENCE",
            severity: "CRITICAL",
            status: "OVERDUE",
            label: `${overdue} retained cadence cycle${overdue !== 1 ? "s" : ""} overdue`,
            evidence: [
              `${overdue} cycle${overdue !== 1 ? "s" : ""} past scheduled review date.`,
              "Overdue cycles block client-safe delivery approval.",
            ],
            href: card.href,
          });
        }
        if (dueThisWeek && dueThisWeek > 0) {
          signals.push({
            source: "CADENCE",
            severity: "HIGH",
            status: "DUE_THIS_WEEK",
            label: `${dueThisWeek} cadence cycle${dueThisWeek !== 1 ? "s" : ""} due this week`,
            evidence: [
              `${dueThisWeek} cycle${dueThisWeek !== 1 ? "s" : ""} scheduled within 7 days.`,
            ],
            href: card.href,
          });
        }
        break;
      }

      case "delivery-queue": {
        const failed = metricValue(card, "Failed");
        const pending = metricValue(card, "Pending approval/send");
        const safeToApprove = metricValue(card, "Safe to approve");
        if (failed && failed > 0) {
          signals.push({
            source: "DELIVERY",
            severity: "HIGH",
            status: "FAILED",
            label: `${failed} delivery item${failed !== 1 ? "s" : ""} failed`,
            evidence: [
              `${failed} delivery transport failure${failed !== 1 ? "s" : ""} require operator review.`,
              "Failed deliveries halt the client engagement workflow.",
            ],
            href: card.href,
          });
        }
        if (safeToApprove && safeToApprove > 0) {
          signals.push({
            source: "DELIVERY",
            severity: "MEDIUM",
            status: "READY_TO_APPROVE",
            label: `${safeToApprove} client-safe item${safeToApprove !== 1 ? "s" : ""} ready for approval`,
            evidence: [
              `${safeToApprove} item${safeToApprove !== 1 ? "s" : ""} marked client-safe, pending operator approval.`,
            ],
            href: card.href,
          });
        } else if (pending && pending > 0) {
          signals.push({
            source: "DELIVERY",
            severity: "LOW",
            status: "PENDING",
            label: `${pending} delivery item${pending !== 1 ? "s" : ""} pending`,
            evidence: [`${pending} item${pending !== 1 ? "s" : ""} awaiting progression.`],
            href: card.href,
          });
        }
        break;
      }

      case "suppression-ledger": {
        const highRisk = metricValue(card, "High-risk");
        const unresolved = metricValue(card, "Unresolved");
        if (highRisk && highRisk > 0) {
          signals.push({
            source: "SUPPRESSION",
            severity: "HIGH",
            status: "HIGH_RISK_UNRESOLVED",
            label: `${highRisk} high-risk suppression${highRisk !== 1 ? "s" : ""} unresolved`,
            evidence: [
              `${highRisk} suppression${highRisk !== 1 ? "s" : ""} flagged privacy, legal, or counsel risk.`,
              "High-risk suppressions must be reviewed before client-safe brief release.",
            ],
            href: card.href,
          });
        } else if (unresolved && unresolved > 0) {
          signals.push({
            source: "SUPPRESSION",
            severity: "MEDIUM",
            status: "UNRESOLVED",
            label: `${unresolved} suppression${unresolved !== 1 ? "s" : ""} pending review`,
            evidence: [
              `${unresolved} suppression event${unresolved !== 1 ? "s" : ""} awaiting operator decision.`,
            ],
            href: card.href,
          });
        }
        break;
      }

      case "outcome-verification": {
        const overdue = metricValue(card, "Overdue");
        const critical = metricValue(card, "Critical");
        const pending = metricValue(card, "Pending");
        if (overdue && overdue > 0) {
          signals.push({
            source: "OUTCOME_VERIFICATION",
            severity: "CRITICAL",
            status: "OVERDUE",
            label: `${overdue} outcome verification record${overdue !== 1 ? "s" : ""} overdue`,
            evidence: [
              `${overdue} record${overdue !== 1 ? "s" : ""} have exceeded review SLA.`,
              "Overdue outcome records must be resolved before the next retained cycle completes.",
            ],
            href: card.href,
          });
        } else if (critical && critical > 0) {
          signals.push({
            source: "OUTCOME_VERIFICATION",
            severity: "HIGH",
            status: "CRITICAL_PENDING",
            label: `${critical} critical outcome record${critical !== 1 ? "s" : ""} pending`,
            evidence: [
              `${critical} record${critical !== 1 ? "s" : ""} in critical SLA band.`,
            ],
            href: card.href,
          });
        } else if (pending && pending > 0) {
          signals.push({
            source: "OUTCOME_VERIFICATION",
            severity: "MEDIUM",
            status: "PENDING",
            label: `${pending} outcome record${pending !== 1 ? "s" : ""} pending review`,
            evidence: [`${pending} outcome record${pending !== 1 ? "s" : ""} awaiting operator review.`],
            href: card.href,
          });
        }
        break;
      }

      case "oversight-reviews": {
        const suppressed = metricValue(card, "Suppressed");
        if (suppressed && suppressed > 0) {
          signals.push({
            source: "OVERSIGHT_BATCH",
            severity: "MEDIUM",
            status: "SUPPRESSED_PENDING",
            label: `${suppressed} suppressed section${suppressed !== 1 ? "s" : ""} awaiting review`,
            evidence: [
              `${suppressed} suppressed section${suppressed !== 1 ? "s" : ""} have not been operator-reviewed.`,
            ],
            href: card.href,
          });
        }
        break;
      }

      case "retainer-readiness": {
        const notReady = metricValue(card, "Accounts not ready");
        const warnings = metricValue(card, "Readiness warnings");
        if (notReady && notReady > 0) {
          signals.push({
            source: "RETAINER_READINESS",
            severity: "MEDIUM",
            status: "NOT_CONFIGURED",
            label: `${notReady} retained account${notReady !== 1 ? "s" : ""} not configured`,
            evidence: [
              `${notReady} account${notReady !== 1 ? "s" : ""} have no cadence cycle set up.`,
            ],
            href: card.href,
          });
        } else if (warnings && warnings > 0) {
          signals.push({
            source: "RETAINER_READINESS",
            severity: "LOW",
            status: "WARNINGS",
            label: `${warnings} retainer readiness warning${warnings !== 1 ? "s" : ""}`,
            evidence: [`${warnings} readiness concern${warnings !== 1 ? "s" : ""} across retained accounts.`],
            href: card.href,
          });
        }
        break;
      }
    }
  }

  return signals;
}

const cardSourceMap: Partial<Record<OperatorQueueCard["id"], DoctrineSignalSource>> = {
  "retained-cadence": "CADENCE",
  "delivery-queue": "DELIVERY",
  "suppression-ledger": "SUPPRESSION",
  "outcome-verification": "OUTCOME_VERIFICATION",
  "oversight-reviews": "OVERSIGHT_BATCH",
  "retainer-readiness": "RETAINER_READINESS",
};

// ─── Recommendation rules ─────────────────────────────────────────────────────

/**
 * Convert signals into prioritised doctrine recommendations.
 * Rules are applied in explicit doctrine order; each rule emits at most one recommendation.
 */
export function buildDoctrineRecommendations(
  signals: AdminActionDoctrineSignal[],
): AdminActionDoctrineRecommendation[] {
  const recommendations: AdminActionDoctrineRecommendation[] = [];

  const has = (source: DoctrineSignalSource, status?: string) =>
    signals.some((s) => s.source === source && (status === undefined || s.status === status));

  const get = (source: DoctrineSignalSource, status?: string) =>
    signals.find((s) => s.source === source && (status === undefined || s.status === status));

  const isUnavailable = (source: DoctrineSignalSource) =>
    signals.some((s) => s.source === source && s.status === "UNAVAILABLE");

  // ── Rule 1: Overdue cadence ──────────────────────────────────────────────
  if (has("CADENCE", "OVERDUE")) {
    const sig = get("CADENCE", "OVERDUE")!;
    const deliveryFailed = has("DELIVERY", "FAILED");
    recommendations.push({
      id: "cadence-overdue",
      priority: "CRITICAL",
      title: "Complete overdue retained cadence review",
      rationale:
        "Overdue cadence cycles block client-safe delivery approval and accumulate governance risk with each day of delay.",
      recommendedAction: "Open the retained cadence queue and start or complete the overdue review cycles before approving any delivery items.",
      href: sig.href ?? "/admin/retained-cadence",
      actionLabel: "Go to cadence queue",
      blockers: deliveryFailed ? ["Resolve failed delivery items before marking review complete."] : undefined,
      evidence: sig.evidence,
    });
  }

  // ── Rule 2: Outcome verification overdue ─────────────────────────────────
  if (has("OUTCOME_VERIFICATION", "OVERDUE")) {
    const sig = get("OUTCOME_VERIFICATION", "OVERDUE")!;
    const cadenceOverdue = has("CADENCE", "OVERDUE");
    recommendations.push({
      id: "outcome-verification-overdue",
      priority: "CRITICAL",
      title: "Resolve overdue outcome verification records",
      rationale:
        "Outcome records past SLA cannot be included in the next retained cycle until resolved. They directly affect client trust scoring.",
      recommendedAction:
        "Open the outcome verification queue and clear or escalate records past their review SLA before the next cadence cycle completes.",
      href: sig.href ?? "/admin/outcome-verification",
      actionLabel: "Go to outcome verification",
      blockers: cadenceOverdue
        ? ["Cadence review is also overdue — address in parallel."]
        : undefined,
      evidence: sig.evidence,
    });
  }

  // ── Rule 3: Failed delivery ───────────────────────────────────────────────
  if (has("DELIVERY", "FAILED")) {
    const sig = get("DELIVERY", "FAILED")!;
    const suppressionRisk = has("SUPPRESSION", "HIGH_RISK_UNRESOLVED");
    recommendations.push({
      id: "delivery-failed",
      priority: "HIGH",
      title: "Resolve failed delivery transport",
      rationale:
        "Failed deliveries halt the client engagement workflow and may indicate transport or configuration errors that require investigation.",
      recommendedAction:
        "Open the delivery queue, identify failed items, and resolve transport failures before marking any report cycle complete.",
      href: sig.href ?? "/admin/delivery-queue",
      actionLabel: "Go to delivery queue",
      blockers: suppressionRisk
        ? ["High-risk suppressions are also unresolved — review the suppression ledger before re-attempting delivery."]
        : undefined,
      evidence: sig.evidence,
    });
  }

  // ── Rule 4: High-risk suppression ────────────────────────────────────────
  if (has("SUPPRESSION", "HIGH_RISK_UNRESOLVED")) {
    const sig = get("SUPPRESSION", "HIGH_RISK_UNRESOLVED")!;
    recommendations.push({
      id: "suppression-high-risk",
      priority: "HIGH",
      title: "Review high-risk suppression before releasing client-safe brief",
      rationale:
        "Suppressions flagged with privacy, legal, or counsel-risk indicators must receive operator review before any client-safe brief is approved for delivery.",
      recommendedAction:
        "Open the suppression ledger, review flagged entries, and either confirm suppression or override with a recorded justification.",
      href: sig.href ?? "/admin/suppression-ledger",
      actionLabel: "Go to suppression ledger",
      evidence: sig.evidence,
    });
  }

  // ── Rule 5: Cadence due this week ────────────────────────────────────────
  if (has("CADENCE", "DUE_THIS_WEEK") && !has("CADENCE", "OVERDUE")) {
    const sig = get("CADENCE", "DUE_THIS_WEEK")!;
    recommendations.push({
      id: "cadence-due-this-week",
      priority: "HIGH",
      title: "Retained cadence review due this week",
      rationale:
        "Cycles due within 7 days should be started proactively to avoid entering overdue state, which carries higher governance risk.",
      recommendedAction:
        "Open the retained cadence queue and start the review cycle for any accounts due within 7 days.",
      href: sig.href ?? "/admin/retained-cadence",
      actionLabel: "Go to cadence queue",
      evidence: sig.evidence,
    });
  }

  // ── Rule 6: Outcome verification — critical pending ───────────────────────
  if (has("OUTCOME_VERIFICATION", "CRITICAL_PENDING") && !has("OUTCOME_VERIFICATION", "OVERDUE")) {
    const sig = get("OUTCOME_VERIFICATION", "CRITICAL_PENDING")!;
    recommendations.push({
      id: "outcome-verification-critical",
      priority: "HIGH",
      title: "Outcome verification queue has critical records",
      rationale:
        "Records in the critical SLA band are near their overdue threshold. Acting now prevents SLA breach.",
      recommendedAction:
        "Review and resolve critical-band outcome records before they enter the overdue state.",
      href: sig.href ?? "/admin/outcome-verification",
      actionLabel: "Go to outcome verification",
      evidence: sig.evidence,
    });
  }

  // ── Rule 7: Unresolved suppression (non-high-risk) ───────────────────────
  if (has("SUPPRESSION", "UNRESOLVED") && !has("SUPPRESSION", "HIGH_RISK_UNRESOLVED")) {
    const sig = get("SUPPRESSION", "UNRESOLVED")!;
    recommendations.push({
      id: "suppression-unresolved",
      priority: "MEDIUM",
      title: "Suppression ledger has pending operator decisions",
      rationale:
        "Unresolved suppressions accumulate in the ledger and may later block delivery if not addressed.",
      recommendedAction:
        "Work through the suppression ledger and confirm or override each pending entry.",
      href: sig.href ?? "/admin/suppression-ledger",
      actionLabel: "Go to suppression ledger",
      evidence: sig.evidence,
    });
  }

  // ── Rule 8: Delivery items ready to approve ───────────────────────────────
  if (
    has("DELIVERY", "READY_TO_APPROVE")
    && !has("DELIVERY", "FAILED")
    && !has("CADENCE", "OVERDUE")
    && !has("SUPPRESSION", "HIGH_RISK_UNRESOLVED")
  ) {
    const sig = get("DELIVERY", "READY_TO_APPROVE")!;
    recommendations.push({
      id: "delivery-ready-to-approve",
      priority: "MEDIUM",
      title: "Client-safe delivery items ready for approval",
      rationale:
        "Items cleared as client-safe are waiting for operator sign-off before they can be sent.",
      recommendedAction: "Open the delivery queue and approve client-safe items.",
      href: sig.href ?? "/admin/delivery-queue",
      actionLabel: "Go to delivery queue",
      evidence: sig.evidence,
    });
  }

  // ── Rule 9: Oversight review suppressed sections ──────────────────────────
  if (has("OVERSIGHT_BATCH", "SUPPRESSED_PENDING")) {
    const sig = get("OVERSIGHT_BATCH", "SUPPRESSED_PENDING")!;
    recommendations.push({
      id: "oversight-suppressed-pending",
      priority: "MEDIUM",
      title: "Suppressed sections in oversight review require operator check",
      rationale:
        "Suppressions applied during brief generation must be reviewed before the cycle is considered complete.",
      recommendedAction:
        "Open the oversight review bench and check suppressed sections for the affected cycles.",
      href: sig.href ?? "/admin/oversight-review",
      actionLabel: "Go to oversight review",
      evidence: sig.evidence,
    });
  }

  // ── Rule 10: Retainer accounts not configured ────────────────────────────
  if (has("RETAINER_READINESS", "NOT_CONFIGURED")) {
    const sig = get("RETAINER_READINESS", "NOT_CONFIGURED")!;
    recommendations.push({
      id: "retainer-not-configured",
      priority: "MEDIUM",
      title: "Retained accounts have no cadence cycle configured",
      rationale:
        "Retained accounts without a cadence cycle cannot be included in operator review queues. This leaves governance coverage gaps.",
      recommendedAction:
        "Open retainer readiness and create initial cadence cycles for unconfigured accounts.",
      href: sig.href ?? "/admin/retainer-readiness",
      actionLabel: "Go to retainer readiness",
      evidence: sig.evidence,
    });
  }

  // ── Rule 11: Unavailable data sources (cautious) ─────────────────────────
  const unavailableSources = signals.filter((s) => s.status === "UNAVAILABLE");
  if (unavailableSources.length > 0) {
    const sourceNames = unavailableSources.map((s) => s.label).join("; ");
    recommendations.push({
      id: "data-unavailable",
      priority: "LOW",
      title: "One or more data sources could not be loaded",
      rationale:
        "When a data source is unavailable, its queue may contain unresolved items. Treat unavailable as unknown — not empty.",
      recommendedAction:
        "Check server logs and investigate the unavailable sources. Do not treat an unavailable queue as a clean queue.",
      evidence: [sourceNames],
    });
  }

  // ── Rule 12: Outcome verification pending (low pressure) ─────────────────
  if (
    has("OUTCOME_VERIFICATION", "PENDING")
    && !has("OUTCOME_VERIFICATION", "OVERDUE")
    && !has("OUTCOME_VERIFICATION", "CRITICAL_PENDING")
  ) {
    const sig = get("OUTCOME_VERIFICATION", "PENDING")!;
    recommendations.push({
      id: "outcome-verification-pending",
      priority: "LOW",
      title: "Outcome verification records pending review",
      rationale:
        "Pending records within SLA are low-pressure but should be cleared before they age into critical state.",
      recommendedAction:
        "Review pending outcome verification records at the next available operator session.",
      href: sig.href ?? "/admin/outcome-verification",
      actionLabel: "Go to outcome verification",
      evidence: sig.evidence,
    });
  }

  // Sort by priority
  recommendations.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  return recommendations;
}

// ─── Convenience entry point ──────────────────────────────────────────────────

/**
 * Build the full doctrine recommendation set from operator queue cards.
 * Signals are extracted then rules applied in doctrine order.
 */
export function buildOperatorDoctrine(
  cards: OperatorQueueCard[],
): AdminActionDoctrineRecommendation[] {
  const signals = extractDoctrineSignals(cards);
  return buildDoctrineRecommendations(signals);
}
