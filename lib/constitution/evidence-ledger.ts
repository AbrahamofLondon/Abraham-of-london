/**
 * Evidence Ledger — immutable append-only record of decisions, actions, outcomes.
 *
 * Every stage appends. Nothing is overwritten.
 * This is institutional memory, not software state.
 */

import type { IntelligenceSpine, SpineStage } from "@/lib/decision/intelligence-spine";

export type LedgerEntry = {
  id: string;
  spineId: string;
  email?: string;
  timestamp: string;
  stage: SpineStage;
  contradiction: string | null;
  actionRequired: string | null;
  actionTaken: boolean | null;
  verifiedImpact: "structural_change" | "temporary_fix" | "no_change" | null;
  pressureIndex: number;
  integrityScore: number;
  conditionClass: string;
  costEstimate: number | null;
};

export type EvidenceLedger = {
  entries: LedgerEntry[];
  spineId: string;
  createdAt: string;
};

/**
 * Create a new ledger from a spine.
 * Appends one entry per completed stage in the spine's history.
 */
export function buildLedgerFromSpine(spine: IntelligenceSpine): EvidenceLedger {
  const entries: LedgerEntry[] = spine.history.map((event, i) => ({
    id: `${spine.id}_${event.stage}_${i}`,
    spineId: spine.id,
    email: spine.email,
    timestamp: event.completedAt,
    stage: event.stage,
    contradiction: spine.synthesis?.primaryContradiction ?? spine.deterministic.contradictionSet[0] ?? null,
    actionRequired: spine.synthesis?.concreteMove ?? null,
    actionTaken: spine.execution?.actionTaken ?? null,
    verifiedImpact: spine.execution?.verifiedImpact ?? null,
    pressureIndex: spine.pressureIndex ?? 0,
    integrityScore: spine.integrityScore ?? 1,
    conditionClass: spine.deterministic.conditionClass,
    costEstimate: spine.economics?.estimatedMonthlyCost ?? null,
  }));

  return { entries, spineId: spine.id, createdAt: new Date().toISOString() };
}

/**
 * Append a new entry to an existing ledger. Immutable — returns new ledger.
 */
export function appendToLedger(ledger: EvidenceLedger, entry: LedgerEntry): EvidenceLedger {
  return { ...ledger, entries: [...ledger.entries, entry] };
}

/**
 * Serialize ledger for DB persistence (JSON column).
 */
export function serializeLedger(ledger: EvidenceLedger): string {
  return JSON.stringify(ledger);
}
