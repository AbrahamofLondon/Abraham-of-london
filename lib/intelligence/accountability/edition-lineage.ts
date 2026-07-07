/**
 * lib/intelligence/accountability/edition-lineage.ts
 *
 * §7 — Explicit edition lineage fields.
 *
 * Do not infer edition IDs from free-form versionHistory notes.
 * This module provides explicit lineage states and migration for historical records.
 */
export type LineageStatus = "ORIGINATED" | "CARRIED_FORWARD" | "REVISED" | "SUPERSEDED" | "CLOSED" | "FALSIFIED" | "UNRESOLVED";

export interface CallLineageRecord {
  callId: string;
  originEditionId: string;
  reviewedInEditionId: string | null;
  carriedIntoEditionId: string | null;
  supersededByCallId: string | null;
  reviewId: string | null;
  lineageStatus: LineageStatus;
  notes: string;
}

export function buildLineageFromCall(call: {
  id: string;
  reportId: string;
  outcomeStatus?: string | null;
  carryForwardJustification?: string | null;
  versionHistory?: Array<{ version: string; changedAt: string; note: string }> | null;
}): CallLineageRecord {
  const isFalsified = call.outcomeStatus === "DISCONFIRMED";
  const isClosed = call.outcomeStatus === "CONFIRMED_STRONGLY" || call.outcomeStatus === "DIRECTIONALLY_CONFIRMED";
  const isCarriedForward = !!call.carryForwardJustification;
  const hasRevisions = (call.versionHistory?.length ?? 0) > 0;

  let lineageStatus: LineageStatus = "UNRESOLVED";
  if (isFalsified) lineageStatus = "FALSIFIED";
  else if (isClosed) lineageStatus = "CLOSED";
  else if (isCarriedForward) lineageStatus = "CARRIED_FORWARD";
  else if (hasRevisions) lineageStatus = "REVISED";
  else lineageStatus = "ORIGINATED";

  return {
    callId: call.id,
    originEditionId: call.reportId,
    reviewedInEditionId: null,
    carriedIntoEditionId: isCarriedForward ? call.reportId : null,
    supersededByCallId: null,
    reviewId: null,
    lineageStatus,
    notes: call.carryForwardJustification ?? (hasRevisions ? `${call.versionHistory!.length} revision(s)` : ""),
  };
}

export function migrateHistoricalLineage(calls: Array<{
  id: string; reportId: string; outcomeStatus?: string | null;
  carryForwardJustification?: string | null;
  versionHistory?: Array<{ version: string; changedAt: string; note: string }> | null;
}>): CallLineageRecord[] {
  return calls.map(buildLineageFromCall);
}
