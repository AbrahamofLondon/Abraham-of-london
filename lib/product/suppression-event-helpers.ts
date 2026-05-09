import type { SuppressionEvent } from "@/lib/product/suppression-ledger-contract";

export type SuppressionInput = Omit<SuppressionEvent, "eventId">;

export function createSuppressionInput(input: Partial<SuppressionInput> & {
  scopeId: string;
  surface: string;
  fieldName: string;
  evidenceSource: string;
  suppressionReason: string;
  suppressionRule: string;
}): SuppressionInput {
  return {
    scopeId: input.scopeId,
    scopeType: input.scopeType ?? "UNKNOWN",
    surface: input.surface,
    fieldName: input.fieldName,
    fieldReference: input.fieldReference ?? input.fieldName,
    evidenceSource: input.evidenceSource,
    originalPosture: input.originalPosture ?? input.evidencePosture ?? "SYSTEM_INFERRED",
    evidencePosture: input.evidencePosture ?? input.originalPosture ?? "SYSTEM_INFERRED",
    sourceLabel: input.sourceLabel ?? input.evidenceSource,
    suppressionReason: input.suppressionReason,
    suppressionRule: input.suppressionRule,
    suppressionRuleCategory: input.suppressionRuleCategory ?? input.suppressionRule,
    operatorReviewAvailable: input.operatorReviewAvailable ?? true,
    suppressedAt: input.suppressedAt ?? new Date().toISOString(),
    suppressedBySystem: input.suppressedBySystem ?? true,
    reviewedByOperator: input.reviewedByOperator ?? null,
    reviewedAt: input.reviewedAt ?? null,
    overrideStatus: input.overrideStatus ?? "NONE",
    overrideReason: input.overrideReason ?? null,
  };
}
