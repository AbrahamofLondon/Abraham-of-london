import type { PurposeAlignmentEvidenceCarryForward } from "@/lib/alignment/evidence-loader";
import type { FinancialExposureSnapshot } from "@/lib/product/financial-exposure-persistence";
import {
  createFieldProvenance,
  sourceSurfaceLabel,
  type FieldProvenance,
} from "@/lib/product/field-provenance-contract";

type BaseContext = {
  caseId?: string | null;
  journeyId?: string | null;
  executiveRunId?: string | null;
  assessmentId?: string | null;
};

export function normalisePurposeAlignmentEvidence(
  evidence: PurposeAlignmentEvidenceCarryForward | null | undefined,
  context: BaseContext = {},
): FieldProvenance[] {
  if (!evidence?.available) return [];
  const fields = [
    "profile",
    "compositeScore",
    "strongestDomain",
    "weakestDomain",
    "competingObligation",
    "consequence",
    "institutionalConsequence",
    "primaryPattern",
    "patternConsequence",
    "firstAction",
  ] as const;
  const items = fields
    .filter((field) => evidence[field] != null)
    .map((field) =>
      createFieldProvenance({
        fieldKey: field,
        sourceSurface: "PURPOSE_ALIGNMENT",
        sourceLabel: "Purpose Alignment",
        capturedAt: evidence.assessedAt,
        assessmentId: evidence.assessmentId ?? context.assessmentId ?? null,
        caseId: context.caseId ?? null,
        journeyId: context.journeyId ?? null,
        scopeType: "ASSESSMENT",
        scopeId: evidence.assessmentId ?? context.assessmentId ?? context.caseId ?? null,
        evidencePosture:
          field === "competingObligation" ||
          field === "consequence" ||
          field === "institutionalConsequence"
            ? "USER_REPORTED"
            : "SYSTEM_INFERRED",
        confidenceLabel:
          field === "compositeScore"
            ? "MEASURED"
            : field === "competingObligation" || field === "consequence"
              ? "REPORTED"
              : "CAPTURED",
      }),
    );

  evidence.contradictions.forEach((_, index) => {
    items.push(
      createFieldProvenance({
        fieldKey: `contradictions.${index}`,
        sourceSurface: "PURPOSE_ALIGNMENT",
        sourceLabel: "Purpose Alignment",
        capturedAt: evidence.assessedAt,
        assessmentId: evidence.assessmentId ?? context.assessmentId ?? null,
        caseId: context.caseId ?? null,
        journeyId: context.journeyId ?? null,
        scopeType: "ASSESSMENT",
        scopeId: evidence.assessmentId ?? context.assessmentId ?? context.caseId ?? null,
        evidencePosture: "SYSTEM_INFERRED",
        confidenceLabel: "CAPTURED",
      }),
    );
  });

  return items;
}

export function normaliseFinancialExposureSnapshot(
  exposure: FinancialExposureSnapshot | null | undefined,
  context: BaseContext = {},
): FieldProvenance[] {
  if (!exposure) return [];
  const fields = [
    "userCostOfDelayText",
    "estimatedFinancialExposure",
    "exposureBand",
  ] as const;
  return fields
    .filter((field) => exposure[field] != null)
    .map((field) =>
      createFieldProvenance({
        fieldKey: field,
        sourceSurface: exposure.sourceSurface || "EXECUTIVE_REPORTING",
        sourceLabel: sourceSurfaceLabel(exposure.sourceSurface || "EXECUTIVE_REPORTING"),
        capturedAt: null,
        computedAt: exposure.computedAt,
        caseId: context.caseId ?? null,
        journeyId: context.journeyId ?? null,
        executiveRunId: context.executiveRunId ?? null,
        scopeType: context.executiveRunId ? "RUN" : "CASE",
        scopeId: context.executiveRunId ?? context.caseId ?? context.journeyId ?? null,
        evidencePosture: field === "userCostOfDelayText" ? "USER_REPORTED" : "ESTIMATED",
        confidenceLabel:
          field === "estimatedFinancialExposure"
            ? "ESTIMATED"
            : field === "userCostOfDelayText"
              ? "REPORTED"
              : "CAPTURED",
      }),
    );
}
