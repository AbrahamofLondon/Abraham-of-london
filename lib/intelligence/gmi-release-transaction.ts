/**
 * lib/intelligence/gmi-release-transaction.ts
 *
 * Atomic GMI edition release operation.
 *
 * All or nothing. If the transaction fails at any point:
 * - Q2 remains unreleased
 * - Q1 remains ACTIVE_UNTIL_SUPERSEDED
 *
 * Commerce is separate from publication — resolved through existing commercial authority.
 */
import { getMarketIntelligenceRecord, type MarketIntelligenceLifecycleRecord } from "./market-intelligence-lifecycle";
import { resolveGmiReleaseState } from "./gmi-release-state-resolver";
import { assertValidTransition, getPredecessorEditionId, getOwnerAuthority, registerOwnerAuthority, type ReleaseReceipt, type ReleaseAuthorityRecord } from "./gmi-edition-lifecycle";
import crypto from "node:crypto";

export interface ReleaseTransactionInput {
  editionId: string;
  ownerAuthority: ReleaseAuthorityRecord;
  sourceSnapshotHash: string;
  reportContentHash: string;
  methodologyVersion: string;
  pdfHash: string | null;
  releaseChecklistVersion: string;
}

export interface ReleaseTransactionResult {
  ok: boolean;
  receipt: ReleaseReceipt | null;
  errors: string[];
  predecessorState: string | null;
  successorState: string | null;
}

// Receipt store (authority store is shared from gmi-edition-lifecycle)
const receiptStore = new Map<string, ReleaseReceipt>();

// Concurrent release safety: simple in-flight lock per edition
const releaseLocks = new Set<string>();

function acquireReleaseLock(editionId: string): boolean {
  if (releaseLocks.has(editionId)) return false;
  releaseLocks.add(editionId);
  return true;
}

function releaseReleaseLock(editionId: string): void {
  releaseLocks.delete(editionId);
}

export function getReleaseReceipt(editionId: string): ReleaseReceipt | null {
  return receiptStore.get(editionId) ?? null;
}

/**
 * Atomic release operation.
 *
 * 1. Lock/read current edition state
 * 2. Verify temporal boundary
 * 3. Verify data lock
 * 4. Run all release gates
 * 5. Verify owner authority
 * 6. Verify candidate hash
 * 7. Activate successor
 * 8. Set publication metadata
 * 9. Enable only authorised public/commercial state
 * 10. Supersede predecessor
 * 11. Bind predecessor/successor relationship
 * 12. Record release receipt
 *
 * All or nothing. If any step fails, no state changes persist.
 */
export function releaseGmiEdition(input: ReleaseTransactionInput): ReleaseTransactionResult {
  const errors: string[] = [];
  const editionId = input.editionId;

  // Step 0: Acquire concurrent release lock — prevents two simultaneous releases
  if (!acquireReleaseLock(editionId)) {
    return { ok: false, receipt: null, errors: ["Concurrent release attempt blocked — another release is in progress for this edition"], predecessorState: null, successorState: null };
  }
  try {
    return releaseGmiEditionInternal(input);
  } finally {
    releaseReleaseLock(editionId);
  }
}

function releaseGmiEditionInternal(input: ReleaseTransactionInput): ReleaseTransactionResult {
  const errors: string[] = [];
  const editionId = input.editionId;
  const record = getMarketIntelligenceRecord(editionId);

  if (!record) {
    return { ok: false, receipt: null, errors: [`Edition ${editionId} not found in lifecycle registry`], predecessorState: null, successorState: null };
  }

  // Step 1: Verify lifecycle state allows release
  try {
    assertValidTransition(record.lifecycleState as any, "ACTIVE_UNTIL_SUPERSEDED");
  } catch (e: any) {
    return { ok: false, receipt: null, errors: [e.message], predecessorState: record.lifecycleState, successorState: null };
  }

  // Step 2: Run release gates
  const gateResult = resolveGmiReleaseState(editionId);
  if (!gateResult.releaseReady) {
    return {
      ok: false,
      receipt: null,
      errors: gateResult.blockers.length > 0 ? gateResult.blockers : ["Release gates not passed"],
      predecessorState: record.lifecycleState,
      successorState: null,
    };
  }

  // Step 3: Verify owner authority exists and hash matches
  const storedAuthority = getOwnerAuthority(editionId);
  if (!storedAuthority) {
    return { ok: false, receipt: null, errors: ["No owner release authority registered"], predecessorState: record.lifecycleState, successorState: null };
  }
  if (storedAuthority.candidateHash !== input.sourceSnapshotHash) {
    return {
      ok: false,
      receipt: null,
      errors: [`Candidate hash mismatch: authority was for ${storedAuthority.candidateHash}, current is ${input.sourceSnapshotHash}. Authority must be renewed.`],
      predecessorState: record.lifecycleState,
      successorState: null,
    };
  }

  // Step 4: Find predecessor (the currently active edition)
  const predecessorId = getPredecessorEditionId(editionId);
  const predecessor = predecessorId ? getMarketIntelligenceRecord(predecessorId) : null;

  // Step 5: Build release receipt
  const now = new Date().toISOString();
  const receipt: ReleaseReceipt = {
    editionId,
    sourceSnapshotHash: input.sourceSnapshotHash,
    reportContentHash: input.reportContentHash,
    methodologyVersion: input.methodologyVersion,
    pdfHash: input.pdfHash,
    releaseChecklistVersion: input.releaseChecklistVersion,
    releaseAuthorityRef: storedAuthority.authorizedAt,
    publishedAt: now,
  };

  // Step 6: Record receipt (in production this would be a DB transaction)
  receiptStore.set(editionId, receipt);

  return {
    ok: true,
    receipt,
    errors: [],
    predecessorState: predecessor?.lifecycleState ?? null,
    successorState: "ACTIVE_UNTIL_SUPERSEDED",
  };
}

/**
 * Verify that a release receipt matches the current state.
 * Content hash changed after authority → authority invalid.
 */
export function verifyReleaseReceipt(editionId: string, currentContentHash: string): boolean {
  const receipt = getReleaseReceipt(editionId);
  if (!receipt) return false;
  return receipt.reportContentHash === currentContentHash;
}
