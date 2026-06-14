/**
 * Memory Audit Lock Contract
 *
 * Prevents memory decay from erasing evidence needed for:
 * - Consequence verification (testing whether warnings materialized)
 * - Falsification (proving system was wrong)
 * - Decision debt calculation (showing basis for financial/risk measurement)
 *
 * Memory events can be locked for defined reasons.
 * Decay policy must fail closed when attempting to archive/compress locked events.
 */

export type MemoryAuditLockReason =
  | "linked_to_active_consequence_verification"
  | "linked_to_pending_consequence_verification"
  | "linked_to_falsification_event"
  | "linked_to_authority_boundary"
  | "linked_to_decision_debt"
  | "pinned_by_user"
  | "legal_retention_required";

export interface MemoryAuditLock {
  memoryEventId: string;
  caseId: string;
  locked: boolean;
  reasons: MemoryAuditLockReason[];
  lockedAt: string;
  reviewAfter?: string;
  lockedByProductCode?: string;
}

export interface MemoryAuditLockPolicy {
  // Consequence verification
  consequenceVerificationSourceEventsLocked: boolean;
  consequenceVerificationLockDuration: string;

  // Falsification
  falsificationLinkedEventsLocked: boolean;
  falsificationLockDuration: string;

  // Decision debt
  decisionDebtSourceEventsLocked: boolean;
  decisionDebtLockDuration: string;

  // User pins
  userPinnedEventsLocked: boolean;

  // Legal retention
  legalRetentionLocked: boolean;
  legalRetentionDuration: string;

  // Decay behavior
  decayCannotArchiveLockedEvents: boolean;
  decayCannotCompressLockedEventsWithoutTrace: boolean;
  decayFailsClosedOnLockedEvent: boolean;
}

/**
 * Default audit lock policy
 */
export const DEFAULT_MEMORY_AUDIT_LOCK_POLICY: MemoryAuditLockPolicy = {
  consequenceVerificationSourceEventsLocked: true,
  consequenceVerificationLockDuration: "P2Y", // 2 years after verification due date

  falsificationLinkedEventsLocked: true,
  falsificationLockDuration: "P7Y", // 7 years (audit retention)

  decisionDebtSourceEventsLocked: true,
  decisionDebtLockDuration: "P5Y", // 5 years (financial audit retention)

  userPinnedEventsLocked: true,

  legalRetentionLocked: true,
  legalRetentionDuration: "P7Y", // 7 years

  decayCannotArchiveLockedEvents: true,
  decayCannotCompressLockedEventsWithoutTrace: true,
  decayFailsClosedOnLockedEvent: true,
};

/**
 * Invariants
 */
export const MEMORY_AUDIT_LOCK_INVARIANTS = {
  LOCKS_PREVENT_ERASURE:
    "Locked events cannot be permanently deleted or obscured",
  DECAY_FAILS_CLOSED:
    "Decay policy must fail closed when encountering locked events",
  EVIDENCE_PRESERVED:
    "Falsification-linked, consequence-linked, and debt-linked events must preserve their audit trace",
  VERIFICATION_LOCKED:
    "Events linked to active or pending consequence verification are locked until verification completes and retention period expires",
  FALSIFICATION_LOCKED:
    "Events linked to falsification events are locked for extended retention to support audit and learning",
  DEBT_LOCKED:
    "Events linked to decision debt calculations are locked for financial audit retention",
};
