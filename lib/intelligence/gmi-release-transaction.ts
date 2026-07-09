/**
 * lib/intelligence/gmi-release-transaction.ts
 *
 * Compatibility wrapper for the old release transaction API.
 * Production release authority now lives in Postgres via
 * gmi-release-store.server.ts. This module no longer keeps process-local
 * receipt Maps or release lock Sets.
 */
import type { ReleaseReceipt, ReleaseAuthorityRecord } from "./gmi-edition-lifecycle";
import {
  getDurableReceipt,
  releaseGmiEditionDurable,
  type ReleaseTransactionResult as DurableReleaseTransactionResult,
} from "./gmi-release-store.server";

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

function toLegacyReceipt(result: DurableReleaseTransactionResult): ReleaseReceipt | null {
  if (!result.receipt) return null;
  return {
    editionId: result.receipt.editionId,
    sourceSnapshotHash: result.receipt.sourceSnapshotHash,
    reportContentHash: result.receipt.reportContentHash,
    methodologyVersion: result.receipt.methodologyVersion,
    pdfHash: result.receipt.pdfHash,
    releaseChecklistVersion: result.receipt.releaseChecklistVersion,
    releaseAuthorityRef: result.receipt.authorityId,
    publishedAt: result.receipt.publishedAt.toISOString(),
  };
}

export async function releaseGmiEdition(input: ReleaseTransactionInput): Promise<ReleaseTransactionResult> {
  const durable = await releaseGmiEditionDurable({
    editionId: input.editionId,
    candidateHash: input.sourceSnapshotHash,
    sourceSnapshotHash: input.sourceSnapshotHash,
    reportContentHash: input.reportContentHash,
    methodologyVersion: input.methodologyVersion,
    pdfHash: input.pdfHash,
    releaseChecklistVersion: input.releaseChecklistVersion,
  });

  return {
    ok: durable.ok,
    receipt: toLegacyReceipt(durable),
    errors: durable.errors,
    predecessorState: durable.predecessorState,
    successorState: durable.successorState,
  };
}

export async function getReleaseReceipt(editionId: string): Promise<ReleaseReceipt | null> {
  const receipt = await getDurableReceipt(editionId);
  if (!receipt) return null;
  return {
    editionId: receipt.editionId,
    sourceSnapshotHash: receipt.sourceSnapshotHash,
    reportContentHash: receipt.reportContentHash,
    methodologyVersion: receipt.methodologyVersion,
    pdfHash: receipt.pdfHash,
    releaseChecklistVersion: receipt.releaseChecklistVersion,
    releaseAuthorityRef: receipt.authorityId,
    publishedAt: receipt.publishedAt.toISOString(),
  };
}

export async function verifyReleaseReceipt(editionId: string, currentContentHash: string): Promise<boolean> {
  const receipt = await getDurableReceipt(editionId);
  if (!receipt) return false;
  return receipt.reportContentHash === currentContentHash;
}
