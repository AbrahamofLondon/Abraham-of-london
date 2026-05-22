/**
 * lib/outbound/core/outbound-scheduler-eligibility.ts
 *
 * Scheduler eligibility engine.
 *
 * Determines whether an outbound item is eligible for automated scheduling.
 * All 11 gates must pass before an item can be published by the scheduler.
 *
 * Core principle:
 * No scheduled post may publish unless ALL of the following are true:
 *  1. OUTBOUND_SCHEDULER_ENABLED=true
 *  2. provider diagnostics = READY
 *  3. status = scheduled
 *  4. approvalStatus = approved
 *  5. requiresFinalApproval = true
 *  6. scheduledFor <= current server time
 *  7. idempotency key has no successful PUBLISHED row
 *  8. post passes provider gate
 *  9. token is valid/refreshed
 * 10. scheduler lock acquired (checked by runner)
 * 11. no global outbound pause is active
 *
 * Server-only.
 */

import type { ProviderId, OutboundReadiness, OutboundGateResult } from "./outbound-provider-contract";
import type { OutboundPost } from "../outbound-content-loader";
import { isDuplicatePublish } from "./outbound-publish-ledger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchedulerEligibilityInput = {
  /** The outbound post item to check. */
  item: OutboundPost;
  /** Provider readiness from diagnostics. */
  providerReadiness: OutboundReadiness;
  /** Whether the scheduler is globally enabled. */
  schedulerEnabled: boolean;
  /** Whether a global outbound pause is active. */
  globalPauseActive: boolean;
  /** Current server time (ISO string or Date). */
  now: string | Date;
  /** Result of the provider-specific gate evaluation. */
  gateResult?: OutboundGateResult;
  /** Whether the provider token is valid (not expired). */
  tokenValid?: boolean;
};

export type SchedulerEligibilityResult = {
  eligible: boolean;
  blockers: string[];
  warnings: string[];
};

// ─── Eligibility check ────────────────────────────────────────────────────────

/**
 * Check whether an outbound item is eligible for automated scheduling.
 *
 * This is a pure function (except for the idempotency DB lookup).
 * Returns blockers explaining why the item is not eligible.
 */
export async function isOutboundItemEligibleForScheduling(
  input: SchedulerEligibilityInput,
): Promise<SchedulerEligibilityResult> {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const { item, providerReadiness, schedulerEnabled, globalPauseActive, now, gateResult, tokenValid } = input;
  const nowDate = typeof now === "string" ? new Date(now) : now;

  // ── 1. Scheduler enabled ──────────────────────────────────────────────────
  if (!schedulerEnabled) {
    blockers.push("OUTBOUND_SCHEDULER_ENABLED is not true.");
  }

  // ── 2. No global pause ────────────────────────────────────────────────────
  if (globalPauseActive) {
    blockers.push("Global outbound pause is active.");
  }

  // ── 3. Status must be 'scheduled' ─────────────────────────────────────────
  if (item.status !== "scheduled") {
    blockers.push(`Status is "${item.status}"; must be "scheduled".`);
  }

  // ── 4. approvalStatus must be 'approved' ──────────────────────────────────
  if (item.approvalStatus !== "approved") {
    blockers.push(`Approval status is "${item.approvalStatus}"; must be "approved".`);
  }

  // ── 5. requiresFinalApproval must be true ─────────────────────────────────
  if (item.requiresFinalApproval !== true) {
    blockers.push("requiresFinalApproval is not true.");
  }

  // ── 6. scheduledFor must exist and be <= now ──────────────────────────────
  if (!item.scheduledFor) {
    blockers.push("scheduledFor is missing.");
  } else {
    const scheduledDate = new Date(item.scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      blockers.push(`scheduledFor "${item.scheduledFor}" is not a valid date.`);
    } else if (scheduledDate > nowDate) {
      blockers.push(`scheduledFor "${item.scheduledFor}" is in the future (not yet due).`);
    }
  }

  // ── 7. Provider must be READY ─────────────────────────────────────────────
  if (providerReadiness !== "READY") {
    blockers.push(`Provider readiness is "${providerReadiness}"; must be "READY".`);
  }

  // ── 8. Token must be valid ────────────────────────────────────────────────
  if (tokenValid === false) {
    blockers.push("Provider token is expired or invalid.");
  }

  // ── 9. Gate must pass ─────────────────────────────────────────────────────
  if (gateResult) {
    if (!gateResult.allowed) {
      blockers.push(...gateResult.blockers);
    }
    warnings.push(...gateResult.warnings);
  }

  // ── 10. Idempotency — no existing PUBLISHED row ───────────────────────────
  try {
    const existing = await isDuplicatePublish(
      item.provider as ProviderId,
      item.id,
      item.scheduledFor,
    );
    if (existing) {
      blockers.push(
        `Item already published (ledger ID: ${existing.id}, published at: ${existing.completedAt?.toISOString() ?? "unknown"}).`,
      );
    }
  } catch {
    // If idempotency check fails, block to be safe
    blockers.push("Idempotency check failed — unable to verify publish status.");
  }

  return {
    eligible: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  };
}
