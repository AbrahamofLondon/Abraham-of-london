import type { PurposeAlignmentEvidenceCarryForward } from "@/lib/alignment/evidence-loader";
import type { CheckpointRecord } from "@/lib/product/checkpoint-scheduler-contract";
import type { AssessmentEvidenceCapture } from "@/lib/product/evidence-capture-contract";
import type { FinancialExposureSnapshot, CostOfInactionProjectionSnapshot } from "@/lib/product/financial-exposure-persistence";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import type { OutcomeVerificationRecord } from "@/lib/product/outcome-verification-contract";
import { createSuppressionInput } from "@/lib/product/suppression-event-helpers";
import { recordSuppression } from "@/lib/product/suppression-ledger";
import {
  createFieldProvenance,
  mergeFieldProvenance,
  type FieldProvenance,
  type FieldEvidencePosture,
  sourceSurfaceLabel,
} from "@/lib/product/field-provenance-contract";

type BaseContext = {
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
  assessmentId?: string | null;
  scopeType?: FieldProvenance["scopeType"];
  scopeId?: string | null;
};

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function postureFromMemory(item: GovernedMemoryItem): FieldEvidencePosture {
  switch (item.evidenceOrigin) {
    case "SELF_REPORTED":
      return "USER_REPORTED";
    case "AGGREGATED_RESPONDENT":
      return "AGGREGATED";
    case "VERIFIED_OUTCOME":
      return "OUTCOME_VERIFIED";
    case "OPERATOR_REVIEWED":
      return "OPERATOR_REVIEWED";
    case "SYSTEM_COMPUTED":
      return "SYSTEM_COMPUTED";
    default:
      return "SYSTEM_INFERRED";
  }
}

function postureFromOutcomeVerification(
  posture: OutcomeVerificationRecord["evidencePosture"],
): FieldEvidencePosture {
  switch (posture) {
    case "VERIFIED":
      return "OUTCOME_VERIFIED";
    case "OPERATOR_REVIEWED":
      return "OPERATOR_REVIEWED";
    case "USER_REPORTED":
      return "USER_REPORTED";
    case "SYSTEM_INFERRED":
      return "SYSTEM_INFERRED";
    default:
      return "INSUFFICIENT_DATA";
  }
}

export function normaliseAssessmentEvidenceCapture(
  capture: AssessmentEvidenceCapture | null | undefined,
  context: BaseContext & {
    sourceSurface?: string;
    sourceLabel?: string;
    capturedAt?: string | null;
  } = {},
): FieldProvenance[] {
  if (!capture) return [];
  const sourceSurface = context.sourceSurface ?? "ASSESSMENT";
  const sourceLabel = context.sourceLabel ?? sourceSurfaceLabel(sourceSurface);
  return Object.entries(capture)
    .filter(([, value]) => stringValue(value))
    .map(([fieldKey]) =>
      createFieldProvenance({
        fieldKey,
        sourceSurface,
        sourceLabel,
        capturedAt: context.capturedAt ?? null,
        caseId: context.caseId ?? null,
        journeyId: context.journeyId ?? null,
        strategyRoomSessionId: context.strategyRoomSessionId ?? null,
        executiveRunId: context.executiveRunId ?? null,
        assessmentId: context.assessmentId ?? null,
        scopeType: context.scopeType ?? "ASSESSMENT",
        scopeId: context.scopeId ?? context.assessmentId ?? context.caseId ?? null,
        evidencePosture: fieldKey.startsWith("consequence") ? "USER_REPORTED" : "SYSTEM_INFERRED",
        confidenceLabel: fieldKey.startsWith("consequence") ? "REPORTED" : "CAPTURED",
      }),
    );
}

export function normaliseGovernedMemoryItem(item: GovernedMemoryItem | null | undefined): FieldProvenance[] {
  if (!item) return [];
  if (item.provenance?.length) return item.provenance;
  if (item.status === "SUPPRESSED" || item.suppressedReason) {
    void recordSuppression(createSuppressionInput({
      scopeId: item.relatedCaseId ?? item.relatedSessionId ?? item.relatedCycleId ?? item.id,
      scopeType: item.relatedCycleId ? "CYCLE" : "ACCOUNT",
      surface: "FIELD_PROVENANCE_NORMALISER",
      fieldName: item.id,
      evidenceSource: sourceSurfaceLabel(item.sourceSurface),
      evidencePosture: postureFromMemory(item),
      sourceLabel: sourceSurfaceLabel(item.sourceSurface),
      suppressionReason: item.suppressedReason ?? "Governed memory item remained suppressed.",
      suppressionRule: "GOVERNED_MEMORY_SUPPRESSED",
      suppressionRuleCategory: "PRIVACY_BOUNDARY",
      operatorReviewAvailable: true,
    })).catch(() => null);
  }
  return [
    createFieldProvenance({
      fieldKey: item.id,
      sourceSurface: item.sourceSurface,
      sourceLabel: sourceSurfaceLabel(item.sourceSurface),
      capturedAt: item.capturedAt,
      caseId: item.relatedCaseId ?? null,
      strategyRoomSessionId: item.relatedSessionId ?? null,
      scopeType: item.relatedCaseId ? "CASE" : item.relatedSessionId ? "SESSION" : "ACCOUNT",
      scopeId: item.relatedCaseId ?? item.relatedSessionId ?? item.relatedCycleId ?? item.id,
      evidencePosture: postureFromMemory(item),
      confidenceLabel: item.confidenceLabel,
      isSuppressed: item.status === "SUPPRESSED",
      suppressionReason: item.suppressedReason ?? null,
    }),
  ];
}

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
        evidencePosture: field === "competingObligation" || field === "consequence" || field === "institutionalConsequence"
          ? "USER_REPORTED"
          : "SYSTEM_INFERRED",
        confidenceLabel: field === "compositeScore" ? "MEASURED" : field === "competingObligation" || field === "consequence" ? "REPORTED" : "CAPTURED",
      }),
    );

  evidence.contradictions.forEach((_, index) => {
    items.push(createFieldProvenance({
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
    }));
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
        confidenceLabel: field === "estimatedFinancialExposure" ? "ESTIMATED" : field === "userCostOfDelayText" ? "REPORTED" : "CAPTURED",
      }),
    );
}

export function normaliseCostOfInactionProjectionSnapshot(
  snapshot: CostOfInactionProjectionSnapshot | null | undefined,
  context: BaseContext = {},
): FieldProvenance[] {
  if (!snapshot) return [];
  return ["horizon7", "horizon30", "horizon60", "horizon90", "executiveWarning", "exposureBand"]
    .filter((field) => stringValue((snapshot as Record<string, unknown>)[field]) != null)
    .map((field) =>
      createFieldProvenance({
        fieldKey: field,
        sourceSurface: snapshot.sourceSurface || "FAST_DIAGNOSTIC",
        sourceLabel: sourceSurfaceLabel(snapshot.sourceSurface || "FAST_DIAGNOSTIC"),
        computedAt: snapshot.computedAt,
        caseId: context.caseId ?? null,
        journeyId: context.journeyId ?? null,
        scopeType: "CASE",
        scopeId: context.caseId ?? context.journeyId ?? null,
        evidencePosture: field === "exposureBand" ? "ESTIMATED" : "SYSTEM_COMPUTED",
        confidenceLabel: field === "exposureBand" ? "ESTIMATED" : "CAPTURED",
      }),
    );
}

export function normaliseCheckpointRecord(
  checkpoint: CheckpointRecord | null | undefined,
): FieldProvenance[] {
  if (!checkpoint) return [];
  const captured = checkpoint.respondedAt ?? checkpoint.createdAt ?? null;
  return [
    createFieldProvenance({
      fieldKey: "commandTitle",
      sourceSurface: checkpoint.surface,
      sourceLabel: checkpoint.sourceLabel || sourceSurfaceLabel(checkpoint.surface),
      capturedAt: checkpoint.createdAt,
      currentValueDate: captured,
      caseId: checkpoint.caseId ?? null,
      journeyId: checkpoint.journeyId ?? null,
      strategyRoomSessionId: checkpoint.strategyRoomSessionId ?? checkpoint.sessionId ?? null,
      executiveRunId: checkpoint.executiveRunId ?? null,
      scopeType: "CHECKPOINT",
      scopeId: checkpoint.id,
      evidencePosture: "SYSTEM_INFERRED",
      confidenceLabel: "CAPTURED",
    }),
    createFieldProvenance({
      fieldKey: "responseStatus",
      sourceSurface: checkpoint.surface,
      sourceLabel: checkpoint.sourceLabel || sourceSurfaceLabel(checkpoint.surface),
      capturedAt: captured,
      priorValueDate: checkpoint.createdAt,
      currentValueDate: checkpoint.respondedAt ?? null,
      caseId: checkpoint.caseId ?? null,
      journeyId: checkpoint.journeyId ?? null,
      strategyRoomSessionId: checkpoint.strategyRoomSessionId ?? checkpoint.sessionId ?? null,
      executiveRunId: checkpoint.executiveRunId ?? null,
      scopeType: "CHECKPOINT",
      scopeId: checkpoint.id,
      evidencePosture: checkpoint.responseStatus ? "USER_REPORTED" : "SYSTEM_INFERRED",
      confidenceLabel: checkpoint.responseStatus ? "REPORTED" : "PARTIAL",
    }),
  ];
}

export function normaliseOutcomeVerificationRecord(
  record: OutcomeVerificationRecord | null | undefined,
): FieldProvenance[] {
  if (!record) return [];
  const fields = ["whatChanged", "evidenceSummary", "rememberNote", "outcomeClassification"] as const;
  return fields
    .filter((field) => stringValue(record[field]) != null)
    .map((field) =>
      createFieldProvenance({
        fieldKey: field,
        sourceSurface: record.sourceSurface || "OUTCOME_VERIFICATION",
        sourceLabel: record.sourceLabel || "Outcome Verification",
        capturedAt: record.createdAt,
        caseId: record.caseId ?? null,
        journeyId: record.journeyId ?? null,
        strategyRoomSessionId: record.strategyRoomSessionId ?? null,
        executiveRunId: record.executiveRunId ?? null,
        scopeType: "CASE",
        scopeId: record.caseId ?? record.journeyId ?? record.strategyRoomSessionId ?? record.executiveRunId ?? record.verificationId,
        evidencePosture: postureFromOutcomeVerification(record.evidencePosture),
        confidenceLabel: record.evidencePosture === "VERIFIED" ? "VERIFIED" : "REPORTED",
      }),
    );
}

export function normaliseStrategyRoomConsequenceEvidence(
  evidence: {
    financial?: string | null;
    reputational?: string | null;
    institutional?: string | null;
    timeline?: string | null;
  } | null | undefined,
  context: BaseContext = {},
): FieldProvenance[] {
  if (!evidence) return [];
  return ["financial", "reputational", "institutional", "timeline"]
    .filter((field) => stringValue((evidence as Record<string, unknown>)[field]) != null)
    .map((field) =>
      createFieldProvenance({
        fieldKey: `consequence.${field}`,
        sourceSurface: "STRATEGY_ROOM",
        sourceLabel: "Strategy Room Stage 2",
        caseId: context.caseId ?? null,
        journeyId: context.journeyId ?? null,
        strategyRoomSessionId: context.strategyRoomSessionId ?? null,
        scopeType: "SESSION",
        scopeId: context.strategyRoomSessionId ?? context.caseId ?? null,
        evidencePosture: "USER_REPORTED",
        confidenceLabel: "REPORTED",
      }),
    );
}

export function normaliseTeamAggregateEvidence(
  evidence: {
    respondentCount?: number;
    trustScore?: number;
    largestGapDomain?: string;
    largestGapDelta?: number;
  } | null | undefined,
  context: BaseContext = {},
): FieldProvenance[] {
  if (!evidence) return [];
  const items: FieldProvenance[] = [];
  if (numberValue(evidence.respondentCount) != null) {
    items.push(createFieldProvenance({
      fieldKey: "respondentCount",
      sourceSurface: "TEAM_ASSESSMENT",
      sourceLabel: "Team Assessment",
      caseId: context.caseId ?? null,
      journeyId: context.journeyId ?? null,
      scopeType: "ASSESSMENT",
      scopeId: context.assessmentId ?? context.caseId ?? null,
      evidencePosture: "AGGREGATED",
      confidenceLabel: "AGGREGATED",
    }));
  }
  if (numberValue(evidence.trustScore) != null) {
    items.push(createFieldProvenance({
      fieldKey: "trustScore",
      sourceSurface: "TEAM_ASSESSMENT",
      sourceLabel: "Team Assessment",
      caseId: context.caseId ?? null,
      journeyId: context.journeyId ?? null,
      scopeType: "ASSESSMENT",
      scopeId: context.assessmentId ?? context.caseId ?? null,
      evidencePosture: "AGGREGATED",
      confidenceLabel: "AGGREGATED",
    }));
  }
  if (stringValue(evidence.largestGapDomain)) {
    items.push(createFieldProvenance({
      fieldKey: "largestGapDomain",
      sourceSurface: "TEAM_ASSESSMENT",
      sourceLabel: "Team Assessment",
      caseId: context.caseId ?? null,
      journeyId: context.journeyId ?? null,
      scopeType: "ASSESSMENT",
      scopeId: context.assessmentId ?? context.caseId ?? null,
      evidencePosture: "AGGREGATED",
      confidenceLabel: "AGGREGATED",
    }));
  }
  if (numberValue(evidence.largestGapDelta) != null) {
    items.push(createFieldProvenance({
      fieldKey: "largestGapDelta",
      sourceSurface: "TEAM_ASSESSMENT",
      sourceLabel: "Team Assessment",
      caseId: context.caseId ?? null,
      journeyId: context.journeyId ?? null,
      scopeType: "ASSESSMENT",
      scopeId: context.assessmentId ?? context.caseId ?? null,
      evidencePosture: "AGGREGATED",
      confidenceLabel: "AGGREGATED",
    }));
  }
  return items;
}

export function normaliseEnterpriseStrainEvidence(
  evidence: {
    fragilitySignal?: string | null;
    percentScore?: number | null;
    weakestDomains?: string[] | null;
  } | null | undefined,
  context: BaseContext = {},
): FieldProvenance[] {
  if (!evidence) return [];
  const items: FieldProvenance[] = [];
  if (stringValue(evidence.fragilitySignal)) {
    items.push(createFieldProvenance({
      fieldKey: "fragilitySignal",
      sourceSurface: "ENTERPRISE_ASSESSMENT",
      sourceLabel: "Enterprise Assessment",
      caseId: context.caseId ?? null,
      journeyId: context.journeyId ?? null,
      scopeType: "ASSESSMENT",
      scopeId: context.assessmentId ?? context.caseId ?? null,
      evidencePosture: "SYSTEM_INFERRED",
      confidenceLabel: "CAPTURED",
    }));
  }
  if (numberValue(evidence.percentScore) != null) {
    items.push(createFieldProvenance({
      fieldKey: "percentScore",
      sourceSurface: "ENTERPRISE_ASSESSMENT",
      sourceLabel: "Enterprise Assessment",
      caseId: context.caseId ?? null,
      journeyId: context.journeyId ?? null,
      scopeType: "ASSESSMENT",
      scopeId: context.assessmentId ?? context.caseId ?? null,
      evidencePosture: "SYSTEM_INFERRED",
      confidenceLabel: "MEASURED",
    }));
  }
  (evidence.weakestDomains ?? []).forEach((_, index) => {
    items.push(createFieldProvenance({
      fieldKey: `weakestDomains.${index}`,
      sourceSurface: "ENTERPRISE_ASSESSMENT",
      sourceLabel: "Enterprise Assessment",
      caseId: context.caseId ?? null,
      journeyId: context.journeyId ?? null,
      scopeType: "ASSESSMENT",
      scopeId: context.assessmentId ?? context.caseId ?? null,
      evidencePosture: "SYSTEM_INFERRED",
      confidenceLabel: "CAPTURED",
    }));
  });
  return items;
}

export function normaliseCounselIntakeEvidence(
  evidence: {
    caseId?: string | null;
    journeyId?: string | null;
    userSummary?: string | null;
    whatChangedSinceSystemAssessment?: string | null;
    whatHumanCounselMustConsider?: string | null;
  } | null | undefined,
): FieldProvenance[] {
  if (!evidence) return [];
  return ["userSummary", "whatChangedSinceSystemAssessment", "whatHumanCounselMustConsider"]
    .filter((field) => stringValue((evidence as Record<string, unknown>)[field]) != null)
    .map((field) =>
      createFieldProvenance({
        fieldKey: field,
        sourceSurface: "COUNSEL_REVIEW",
        sourceLabel: "Counsel Intake",
        caseId: evidence.caseId ?? null,
        journeyId: evidence.journeyId ?? null,
        scopeType: "CASE",
        scopeId: evidence.caseId ?? evidence.journeyId ?? null,
        evidencePosture: "USER_REPORTED",
        confidenceLabel: "REPORTED",
      }),
    );
}

export function normaliseMergedFieldProvenance(input: {
  fieldKey: string;
  sources: Array<FieldProvenance[] | null | undefined>;
  fallbackSourceSurface: string;
  fallbackSourceLabel?: string;
  caseId?: string | null;
  journeyId?: string | null;
}): FieldProvenance[] {
  const flattened = input.sources.flatMap((source) => source ?? []);
  if (flattened.length > 0) {
    return mergeFieldProvenance(input.fieldKey, flattened);
  }
  return [
    createFieldProvenance({
      fieldKey: input.fieldKey,
      sourceSurface: input.fallbackSourceSurface,
      sourceLabel: input.fallbackSourceLabel ?? sourceSurfaceLabel(input.fallbackSourceSurface),
      caseId: input.caseId ?? null,
      journeyId: input.journeyId ?? null,
      scopeType: "CASE",
      scopeId: input.caseId ?? input.journeyId ?? null,
      evidencePosture: "INSUFFICIENT_DATA",
      confidenceLabel: "UNAVAILABLE",
    }),
  ];
}
