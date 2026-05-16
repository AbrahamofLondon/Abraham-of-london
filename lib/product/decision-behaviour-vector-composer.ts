/**
 * lib/product/decision-behaviour-vector-composer.ts
 *
 * Composes a DecisionBehaviourVector from existing case data.
 *
 * The vector is derived from existing Prisma models — no new schema
 * required for v1. Storage is via the existing event/audit system
 * or a dedicated DecisionBehaviourVector table when volume warrants.
 *
 * Migration path:
 *   v1: Store vectors as JSON in an audit event or a dedicated table
 *   v2: Dedicated DecisionBehaviourVector table with indexed fields
 *        for aggregation queries
 *
 * Privacy: The vector NEVER contains raw decision text, personal names,
 * emails, actor IDs, suppression details, private evidence, or operator notes.
 */

import type {
  DecisionBehaviourVector,
  DecisionBehaviourVectorSourceType,
} from "./decision-behaviour-vector-contract";

// ─── Composer input ──────────────────────────────────────────────────────────

export type VectorComposerInput = {
  caseId: string;
  sourceType: DecisionBehaviourVectorSourceType;

  /** Whether the decision was clearly framed by the user */
  framed: boolean;
  /** Whether the case was saved to an account */
  saved: boolean;

  /** Timing in days (null if not applicable / unknown) */
  daysToSave?: number | null;
  daysToFirstAction?: number | null;
  daysToReturnBrief?: number | null;
  daysToResolution?: number | null;

  /** Friction signals detected during the case lifecycle */
  authorityGap?: boolean;
  evidenceGap?: boolean;
  accountabilityGap?: boolean;
  executionGap?: boolean;
  stakeholderGap?: boolean;
  recurrenceDetected?: boolean;

  /** Current outcome status */
  outcomeStatus: DecisionBehaviourVector["outcome"]["status"];
  outcomeSelfReported?: boolean;
  outcomeVerified?: boolean;

  /** Commercial exposure data */
  costBasis?: "USER_REPORTED" | "SYSTEM_ESTIMATED" | "NOT_AVAILABLE";
  delayCostBand?: "LOW" | "MEDIUM" | "HIGH" | "SEVERE" | null;

  /** Privacy consent */
  anonymisable: boolean;
  contributionConsent: boolean;
};

// ─── Composer ─────────────────────────────────────────────────────────────────

/**
 * Composes a DecisionBehaviourVector from case data.
 *
 * This is a pure function — it does not read from or write to any database.
 * Storage is handled by the caller.
 */
export function composeDecisionBehaviourVector(
  input: VectorComposerInput,
): DecisionBehaviourVector {
  const now = new Date().toISOString();

  const acted =
    input.outcomeStatus === "ACTED" ||
    input.outcomeStatus === "RESOLVED" ||
    input.outcomeStatus === "RECURRED" ||
    input.outcomeStatus === "ESCALATED";

  const delayed =
    input.outcomeStatus === "DELAYED" ||
    (input.daysToFirstAction !== null &&
      input.daysToFirstAction !== undefined &&
      input.daysToFirstAction > 14);

  const blocked = input.outcomeStatus === "BLOCKED";
  const abandoned = input.outcomeStatus === "ABANDONED";
  const reopened = input.outcomeStatus === "RECURRED";
  const resolved = input.outcomeStatus === "RESOLVED";

  return {
    version: 1,
    caseId: input.caseId,
    sourceType: input.sourceType,
    createdAt: now,
    updatedAt: null,

    decisionState: {
      framed: input.framed,
      saved: input.saved,
      acted: acted || null,
      delayed: delayed || null,
      blocked: blocked || null,
      abandoned: abandoned || null,
      reopened: reopened || null,
      resolved: resolved || null,
    },

    timing: {
      daysToSave: input.daysToSave ?? null,
      daysToFirstAction: input.daysToFirstAction ?? null,
      daysToReturnBrief: input.daysToReturnBrief ?? null,
      daysToResolution: input.daysToResolution ?? null,
    },

    friction: {
      authorityGap: input.authorityGap || undefined,
      evidenceGap: input.evidenceGap || undefined,
      accountabilityGap: input.accountabilityGap || undefined,
      executionGap: input.executionGap || undefined,
      stakeholderGap: input.stakeholderGap || undefined,
      recurrenceDetected: input.recurrenceDetected || undefined,
    },

    outcome: {
      status: input.outcomeStatus,
      selfReported: input.outcomeSelfReported || undefined,
      verified: input.outcomeVerified || undefined,
    },

    commercialExposure: input.costBasis
      ? {
          costBasis: input.costBasis,
          delayCostBand: input.delayCostBand ?? null,
        }
      : undefined,

    privacy: {
      anonymisable: input.anonymisable,
      contributionConsent: input.contributionConsent,
      containsRawDecisionText: false,
    },
  };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

/**
 * Storage key prefix for vectors stored in the event/audit system.
 * v1 uses this prefix; v2 should migrate to a dedicated table.
 */
export const VECTOR_STORAGE_PREFIX = "dbv:v1:";

/**
 * Builds a storage key for a vector.
 */
export function buildVectorStorageKey(caseId: string): string {
  return `${VECTOR_STORAGE_PREFIX}${caseId}`;
}

/**
 * Serialises a vector to JSON for storage.
 */
export function serialiseVector(vector: DecisionBehaviourVector): string {
  return JSON.stringify(vector);
}

/**
 * Deserialises a vector from JSON.
 */
export function deserialiseVector(json: string): DecisionBehaviourVector {
  return JSON.parse(json) as DecisionBehaviourVector;
}
