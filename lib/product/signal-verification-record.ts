/**
 * lib/product/signal-verification-record.ts
 *
 * Creates a durable accountability record after every material signal output.
 *
 * This is separate from the efficacy checkpoint (which tracks the commanded
 * action) — this record tracks the signal finding itself and whether its
 * prediction proved accurate.
 *
 * Called server-side only after:
 *   - Fast Diagnostic result is built
 *   - Decision Instrument result is built
 *   - Executive Reporting result is built
 *   - Strategy Room session is committed
 *   - Oversight Brief is delivered
 *
 * SERVER_ONLY — imports prisma directly.
 */

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma.server";

// ─── Status lifecycle ────────────────────────────────────────────────────────

export type SignalVerificationStatus =
  | "PENDING_VERIFICATION"
  | "VERIFICATION_REQUESTED"
  | "COMPLETED"
  | "DISPUTED"
  | "BLOCKED"
  | "NO_CHANGE"
  | "INSUFFICIENT_EVIDENCE"
  | "OPERATOR_REVIEWED"
  | "MEMORY_UPDATED"
  // P4 — Reversibility: prior confirmed outcomes can be re-opened or downgraded
  // without deleting history. The original record is preserved; a new event is
  // appended to the audit trail.
  | "OUTCOME_REOPENED"
  | "OPERATOR_REVISED"
  | "MEMORY_DOWNGRADED"
  | "COMPARISON_BASIS_REDUCED";

// ─── Evidence posture (P3) ───────────────────────────────────────────────────

/**
 * Describes the quality and source of evidence behind a verification claim.
 * Used to weight how much a verified outcome contributes to memory.
 * Order matters: higher postures carry more institutional weight.
 */
export type VerificationEvidencePosture =
  | "INSUFFICIENT"          // No usable evidence — cannot support any memory claim
  | "SELF_REPORTED_ONLY"    // User stated an outcome with no corroboration
  | "ACTION_CONFIRMED"      // User confirmed action was taken and change observed
  | "DOCUMENT_SUPPORTED"    // Supporting document or artefact referenced
  | "OPERATOR_OBSERVED"     // Operator reviewed and confirmed in context
  | "MULTI_SOURCE_SUPPORTED"; // Multiple independent sources confirm the outcome

// ─── Record types ────────────────────────────────────────────────────────────

export type SignalVerificationRecord = {
  recordId: string;
  /** Deterministic key — prevents duplicate PENDING_VERIFICATION records
   *  for the same surface + source + signal + purpose combination. */
  verificationKey: string;
  sourceSurface: string;
  sourceId: string;
  originalSignal: string | null;
  originalSeverity: string | null;
  originalScore: number | null;
  comparisonBasis: string | null;
  comparisonMaturityLevel: number | null;
  recommendedMove: string | null;
  verificationDueAt: string;
  verificationStatus: SignalVerificationStatus;
  verificationEvidencePosture: VerificationEvidencePosture;
  operatorReviewRequired: boolean;
  userEmail: string | null;
  createdAt: string;
};

export type CreateSignalVerificationInput = {
  sourceSurface: string;
  sourceId: string;
  originalSignal?: string | null;
  originalSeverity?: string | null;
  originalScore?: number | null;
  comparisonBasis?: string | null;
  comparisonMaturityLevel?: number | null;
  recommendedMove?: string | null;
  /** Discriminates between different purposes for the same surface+sourceId
   *  (e.g. "signal_output" vs "recurrence_check"). Defaults to "signal_output". */
  verificationPurpose?: string;
  /** Days until verification is due — defaults to 14 */
  dueDays?: number;
  /** Whether CRITICAL severity requires operator review */
  operatorReviewRequired?: boolean;
  userEmail?: string | null;
};

// ─── Idempotency key ─────────────────────────────────────────────────────────

/**
 * Computes a deterministic 16-char hex key from the four discriminants.
 * Two calls with identical inputs will always produce the same key, preventing
 * duplicate PENDING_VERIFICATION records for the same output event.
 */
function computeVerificationKey(
  surface: string,
  sourceId: string,
  signal: string | null,
  purpose: string,
): string {
  const raw = `${surface}::${sourceId}::${signal ?? ""}::${purpose}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

// ─── Core create ─────────────────────────────────────────────────────────────

/**
 * Creates a durable signal verification record after a material output.
 * Idempotent — returns the existing record if one already exists for the same
 * surface + sourceId + signal + purpose combination.
 *
 * Non-fatal — callers must wrap in try/catch.
 */
export async function createSignalVerificationRecord(
  input: CreateSignalVerificationInput,
): Promise<SignalVerificationRecord> {
  const purpose = input.verificationPurpose ?? "signal_output";
  const verificationKey = computeVerificationKey(
    input.sourceSurface,
    input.sourceId,
    input.originalSignal ?? null,
    purpose,
  );
  const verdictPrefix = `vk:${verificationKey}`;

  // Idempotency check — return existing record if the key already exists.
  // Uses a startsWith match on the verdict field which carries the vk: prefix.
  // A future migration should add an index on verdict for high-volume tables.
  const existing = await prisma.diagnosticRecord.findFirst({
    where: {
      diagnosticType: "signal_verification",
      verdict: { startsWith: verdictPrefix },
    },
    select: { responsesJson: true },
  });
  if (existing?.responsesJson) {
    try {
      return JSON.parse(existing.responsesJson) as SignalVerificationRecord;
    } catch {
      // malformed — fall through and create a fresh record
    }
  }

  const recordId = `svr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const dueDays = input.dueDays ?? 14;
  const verificationDueAt = new Date(Date.now() + dueDays * 86400000).toISOString();

  const operatorReviewRequired = input.operatorReviewRequired ??
    (input.originalSeverity === "CRITICAL" || input.originalSeverity === "ALERT");

  const payload: SignalVerificationRecord = {
    recordId,
    verificationKey,
    sourceSurface: input.sourceSurface,
    sourceId: input.sourceId,
    originalSignal: input.originalSignal ?? null,
    originalSeverity: input.originalSeverity ?? null,
    originalScore: input.originalScore ?? null,
    comparisonBasis: input.comparisonBasis ?? null,
    comparisonMaturityLevel: input.comparisonMaturityLevel ?? null,
    recommendedMove: input.recommendedMove ?? null,
    verificationDueAt,
    verificationStatus: "PENDING_VERIFICATION",
    verificationEvidencePosture: "SELF_REPORTED_ONLY",
    operatorReviewRequired,
    userEmail: input.userEmail ?? null,
    createdAt,
  };

  await prisma.diagnosticRecord.create({
    data: {
      diagnosticType: "signal_verification",
      userEmail: input.userEmail ?? "",
      userId: null,
      status: "draft",
      score: input.originalScore ?? 0,
      severity: operatorReviewRequired ? "high" : "moderate",
      verdict: `${verdictPrefix} | Signal verification pending — ${input.sourceSurface} / ${input.originalSignal ?? "unnamed signal"}`,
      responsesJson: JSON.stringify(payload),
    },
  });

  return payload;
}

/**
 * Convenience wrapper for creating a verification record from any material output surface.
 * Normalises severity strings, derives due dates from severity, and calls through to
 * createSignalVerificationRecord. Non-fatal — callers must wrap in try/catch.
 */
export async function createMaterialOutputVerificationRecord(input: {
  source: string;
  sourceId: string;
  userEmail?: string | null;
  conditionName?: string | null;
  severity?: string | null;
  score?: number | null;
  comparisonBasis?: string | null;
  comparisonMaturityLevel?: number | null;
  recommendedMove?: string | null;
  operatorReviewRequired?: boolean;
  dueDays?: number;
}): Promise<SignalVerificationRecord> {
  const normalisedSeverity = normaliseSeverity(input.severity);
  const dueDays = input.dueDays ?? deriveDueDays(normalisedSeverity);
  const operatorReviewRequired = input.operatorReviewRequired ?? isHighSeverity(normalisedSeverity);
  return createSignalVerificationRecord({
    sourceSurface: input.source,
    sourceId: input.sourceId,
    originalSignal: input.conditionName ?? null,
    originalSeverity: normalisedSeverity,
    originalScore: input.score ?? null,
    comparisonBasis: input.comparisonBasis ?? null,
    comparisonMaturityLevel: input.comparisonMaturityLevel ?? null,
    recommendedMove: input.recommendedMove ?? null,
    operatorReviewRequired,
    userEmail: input.userEmail ?? null,
    dueDays,
  });
}

/**
 * Creates a governed review obligation — an operator-mandatory verification record
 * for board-visible and oversight outputs. Routes into the operator queue, not user
 * self-verification. Non-fatal — callers must wrap in try/catch.
 */
export async function createGovernedReviewObligation(input: {
  source: string;
  sourceId: string;
  userEmail?: string | null;
  summary?: string | null;
}): Promise<SignalVerificationRecord> {
  return createSignalVerificationRecord({
    sourceSurface: input.source,
    sourceId: input.sourceId,
    originalSignal: input.summary ?? `${input.source} governed review obligation`,
    originalSeverity: "ALERT",
    originalScore: null,
    comparisonBasis: null,
    comparisonMaturityLevel: null,
    recommendedMove: "Operator review required before memory application",
    operatorReviewRequired: true,
    userEmail: input.userEmail ?? null,
    dueDays: 14,
  });
}

// ─── P3 — Evidence posture resolution ────────────────────────────────────────

/**
 * Resolves the appropriate evidence posture for a verification record.
 * Posture determines how much weight the outcome carries in memory.
 */
export function resolveVerificationEvidencePosture(input: {
  didAct?: string | null;
  hasEvidenceSummary: boolean;
  hasDocumentRef: boolean;
  hasOperatorReview: boolean;
  hasMultipleSourcesConfirmed: boolean;
}): VerificationEvidencePosture {
  if (!input.hasEvidenceSummary && !input.hasDocumentRef && !input.hasOperatorReview) {
    return "INSUFFICIENT";
  }
  if (input.hasMultipleSourcesConfirmed) return "MULTI_SOURCE_SUPPORTED";
  if (input.hasOperatorReview) return "OPERATOR_OBSERVED";
  if (input.hasDocumentRef) return "DOCUMENT_SUPPORTED";
  if (input.didAct === "YES" && input.hasEvidenceSummary) return "ACTION_CONFIRMED";
  return "SELF_REPORTED_ONLY";
}

/**
 * Returns a 0.0–1.0 weight for how much a verified outcome contributes to
 * institutional memory and comparison basis maturity.
 * INSUFFICIENT posture contributes nothing; MULTI_SOURCE_SUPPORTED contributes fully.
 */
export function memoryWeightForPosture(posture: VerificationEvidencePosture): number {
  switch (posture) {
    case "MULTI_SOURCE_SUPPORTED": return 1.0;
    case "OPERATOR_OBSERVED":      return 0.85;
    case "DOCUMENT_SUPPORTED":     return 0.7;
    case "ACTION_CONFIRMED":       return 0.5;
    case "SELF_REPORTED_ONLY":     return 0.3;
    case "INSUFFICIENT":           return 0.0;
  }
}

// ─── P4 — Reversibility ───────────────────────────────────────────────────────

/**
 * Re-opens a previously completed verification record without deleting history.
 * Appends a OUTCOME_REOPENED event to the audit trail.
 * Use when new evidence contradicts a prior COMPLETED classification.
 */
export async function reopenVerificationRecord(input: {
  diagnosticRecordId: string;
  operatorEmail: string;
  reason: string;
}): Promise<void> {
  const existing = await prisma.diagnosticRecord.findUnique({
    where: { id: input.diagnosticRecordId },
    select: { responsesJson: true },
  });
  if (!existing) return;

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(existing.responsesJson ?? "{}") as Record<string, unknown>;
  } catch {
    return;
  }

  const previousStatus = payload.verificationStatus ?? payload.status;
  payload.verificationStatus = "OUTCOME_REOPENED";
  payload.reopenEvent = {
    previousStatus,
    reopenedBy: input.operatorEmail,
    reason: input.reason,
    reopenedAt: new Date().toISOString(),
  };

  await prisma.diagnosticRecord.update({
    where: { id: input.diagnosticRecordId },
    data: { responsesJson: JSON.stringify(payload) },
  });
}

/**
 * Downgrades a memory application — records MEMORY_DOWNGRADED or
 * COMPARISON_BASIS_REDUCED without erasing the original confirmed state.
 * Use when operator revises a prior ACCURACY_CONFIRMED decision.
 */
export async function downgradeVerificationRecord(input: {
  diagnosticRecordId: string;
  operatorEmail: string;
  newStatus: "MEMORY_DOWNGRADED" | "COMPARISON_BASIS_REDUCED" | "OPERATOR_REVISED";
  reason: string;
}): Promise<void> {
  const existing = await prisma.diagnosticRecord.findUnique({
    where: { id: input.diagnosticRecordId },
    select: { responsesJson: true },
  });
  if (!existing) return;

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(existing.responsesJson ?? "{}") as Record<string, unknown>;
  } catch {
    return;
  }

  const previousStatus = payload.verificationStatus ?? payload.status;
  payload.verificationStatus = input.newStatus;
  payload.downgradeEvent = {
    previousStatus,
    downgradedBy: input.operatorEmail,
    reason: input.reason,
    downgradedAt: new Date().toISOString(),
  };

  await prisma.diagnosticRecord.update({
    where: { id: input.diagnosticRecordId },
    data: { responsesJson: JSON.stringify(payload) },
  });
}

// ─── P5 — Public claim alignment ─────────────────────────────────────────────

/**
 * Returns the appropriate public-facing language for a verification state.
 * Never returns "verified outcome" language unless evidence posture and
 * operator review both support that claim.
 *
 * Safe default: "Every material paid or governed output creates a future review point."
 */
export function buildVerificationPublicClaim(input: {
  verificationStatus: SignalVerificationStatus | null;
  evidencePosture: VerificationEvidencePosture | null;
  hasOperatorConfirmation: boolean;
}): { label: string; detail: string; canClaimVerified: boolean } {
  const { verificationStatus, evidencePosture, hasOperatorConfirmation } = input;

  if (
    hasOperatorConfirmation &&
    (evidencePosture === "MULTI_SOURCE_SUPPORTED" || evidencePosture === "OPERATOR_OBSERVED")
  ) {
    return {
      label: "Operator-confirmed outcome",
      detail: "This outcome has been reviewed and confirmed by an operator with evidence on record.",
      canClaimVerified: true,
    };
  }

  if (verificationStatus === "COMPLETED" && evidencePosture === "ACTION_CONFIRMED") {
    return {
      label: "Outcome reported",
      detail: "The user reported this action was taken and a measurable change was observed.",
      canClaimVerified: false,
    };
  }

  if (verificationStatus === "OPERATOR_REVIEWED") {
    return {
      label: "Operator reviewed",
      detail: "An operator has reviewed this record. Memory application pending evidence threshold.",
      canClaimVerified: false,
    };
  }

  if (verificationStatus === "MEMORY_DOWNGRADED" || verificationStatus === "OPERATOR_REVISED") {
    return {
      label: "Outcome revised",
      detail: "A prior classification was revised by an operator. Original record preserved in audit trail.",
      canClaimVerified: false,
    };
  }

  // Safe default — always true for any material paid/governed output
  return {
    label: "Review point created",
    detail: "Every material paid or governed output creates a future review point.",
    canClaimVerified: false,
  };
}

function normaliseSeverity(s?: string | null): string | null {
  if (!s) return null;
  const u = s.toUpperCase();
  if (u === "CRITICAL" || u === "ALERT" || u === "CONCERN" || u === "WATCH") return u;
  if (u === "HIGH") return "ALERT";
  if (u === "MODERATE" || u === "MEDIUM") return "CONCERN";
  if (u === "LOW") return "WATCH";
  return s;
}

function deriveDueDays(severity: string | null): number {
  if (severity === "CRITICAL") return 7;
  if (severity === "ALERT") return 14;
  return 30;
}

function isHighSeverity(severity: string | null): boolean {
  return severity === "CRITICAL" || severity === "ALERT";
}

/**
 * Returns pending verification records for a given email.
 * Used by Decision Centre and Oversight to show what needs follow-up.
 */
export async function getPendingSignalVerifications(
  userEmail: string,
  limit = 20,
): Promise<SignalVerificationRecord[]> {
  const records = await prisma.diagnosticRecord.findMany({
    where: {
      diagnosticType: "signal_verification",
      userEmail,
      status: "draft",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, responsesJson: true, createdAt: true },
  });

  const results: SignalVerificationRecord[] = [];
  for (const r of records) {
    try {
      const parsed = JSON.parse(r.responsesJson ?? "{}") as SignalVerificationRecord;
      results.push(parsed);
    } catch {
      // skip malformed
    }
  }
  return results;
}
