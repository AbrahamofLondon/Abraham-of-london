import type { PurposeAlignmentEvidenceCarryForward } from "@/lib/alignment/evidence-loader";
import type { LivingCase } from "@/lib/product/living-case-store";
import type { IntelligenceMeta, IntelligenceScope } from "@/lib/product/intelligence-contract";
import { defaultIntelligenceMeta } from "@/lib/product/intelligence-contract";
import { createFieldProvenance } from "@/lib/product/field-provenance-contract";

function toFieldEvidencePosture(
  posture: "SYSTEM_INFERRED" | "MIXED" | "INSUFFICIENT",
): "SYSTEM_INFERRED" | "INSUFFICIENT_DATA" {
  return posture === "INSUFFICIENT" ? "INSUFFICIENT_DATA" : "SYSTEM_INFERRED";
}

export type CrossAssessmentIntelligence = {
  asOf: string;
  conflicts: Array<{
    label: string;
    description: string;
    surfacesInvolved: string[];
    evidencePosture: "SYSTEM_INFERRED" | "MIXED" | "INSUFFICIENT";
    severity: "LOW" | "MEDIUM" | "HIGH";
    userSafeExplanation: string;
    basis: Array<{ stage: string; capturedAt: string | null }>;
  }>;
  reinforcingSignals: Array<{
    label: string;
    description: string;
    surfacesInvolved: string[];
    basis: Array<{ stage: string; capturedAt: string | null }>;
  }>;
  caution?: string;
  meta: IntelligenceMeta;
};

type StagePayload = Record<string, unknown>;

function readObject(value: unknown): StagePayload {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as StagePayload
    : {};
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hasValue(value: unknown): boolean {
  return value != null && (!(typeof value === "string") || value.trim().length > 0);
}

export function buildCrossAssessmentIntelligence(input: {
  livingCase: LivingCase;
  scope: IntelligenceScope;
  stages?: Array<{ stage: string; payload: unknown }>;
  purposeAlignment?: PurposeAlignmentEvidenceCarryForward | null;
  strategyRoomActive?: boolean;
  latestCheckpointStatus?: string | null;
  generatedAt?: string;
}): CrossAssessmentIntelligence | null {
  const purposeAlignment = input.purposeAlignment;
  const constitutional = input.stages?.find((stage) => stage.stage === "constitutional");
  const executive = input.stages?.find((stage) => stage.stage === "executive_reporting");
  const strategy = input.stages?.find((stage) => stage.stage === "strategy_room");
  const constitutionalPayload = readObject(constitutional?.payload);
  const executivePayload = readObject(executive?.payload);
  const strategyPayload = readObject(strategy?.payload);

  const conflicts: CrossAssessmentIntelligence["conflicts"] = [];
  const reinforcingSignals: CrossAssessmentIntelligence["reinforcingSignals"] = [];

  const constitutionalSections = readObject(constitutionalPayload.sections);
  const constitutionalPosture = readObject(constitutionalSections.constitutionalPosture);
  const executiveSections = readObject(executivePayload.sections);
  const executiveFinancial = readObject(executiveSections.financialExposure);

  const authorityScore = readNumber(constitutionalPayload.authorityScore ?? constitutionalPosture.authorityScore);
  const governanceScore = readNumber(constitutionalPayload.governanceScore ?? constitutionalPosture.governanceScore);
  const totalExposure = readNumber(executiveFinancial.totalExposure ?? executivePayload.totalExposure);

  if (
    purposeAlignment?.available
    && ((purposeAlignment.compositeScore ?? 0) >= 70 || String(purposeAlignment.profile || "").toUpperCase().includes("ALIGNED"))
    && ((authorityScore != null && authorityScore < 55) || (governanceScore != null && governanceScore < 55))
  ) {
    conflicts.push({
      label: "Mandate exceeds authority",
      description: "Purpose Alignment suggests clear intent, while governance evidence suggests decision authority remains weak.",
      surfacesInvolved: ["Purpose Alignment", "Constitutional Diagnostic"],
      evidencePosture: "MIXED",
      severity: "HIGH",
      userSafeExplanation: "Purpose Alignment suggests strong personal mandate, but governance evidence suggests unclear decision authority. This may mean the issue is less personal motivation and more structural governance.",
      basis: [
        { stage: "Purpose Alignment", capturedAt: purposeAlignment.assessedAt ?? null },
        { stage: "Constitutional Diagnostic", capturedAt: readString(constitutionalPayload.createdAt) ?? readString(constitutionalPayload.assessedAt) ?? null },
      ],
    });
  }

  if (
    purposeAlignment?.available
    && hasValue(purposeAlignment.firstAction)
    && input.strategyRoomActive
    && (input.latestCheckpointStatus === "OVERDUE" || input.latestCheckpointStatus === "BLOCKED")
  ) {
    conflicts.push({
      label: "Intent without execution confirmation",
      description: "A named first move exists, but execution governance has not confirmed that it held.",
      surfacesInvolved: ["Purpose Alignment", "Strategy Room", "Return Brief"],
      evidencePosture: "MIXED",
      severity: input.latestCheckpointStatus === "BLOCKED" ? "HIGH" : "MEDIUM",
      userSafeExplanation: "The record includes a stated first move, but execution evidence has not yet confirmed that it happened. The issue may now be follow-through rather than diagnosis.",
      basis: [
        { stage: "Purpose Alignment", capturedAt: purposeAlignment.assessedAt ?? null },
        { stage: "Strategy Room", capturedAt: readString(strategyPayload.createdAt) ?? readString(strategyPayload.assessedAt) ?? null },
        { stage: "Return Brief", capturedAt: null },
      ],
    });
  }

  if ((totalExposure ?? 0) >= 25000 && input.livingCase.contradictions.length >= 2) {
    conflicts.push({
      label: "Material exposure under active contradiction",
      description: "Executive Reporting indicates material cost exposure while contradiction evidence remains unresolved.",
      surfacesInvolved: ["Executive Reporting", "Strategy Room", "Decision Centre"],
      evidencePosture: "SYSTEM_INFERRED",
      severity: (totalExposure ?? 0) >= 100000 ? "HIGH" : "MEDIUM",
      userSafeExplanation: "Financial exposure appears material while contradiction evidence remains active. This suggests the condition is becoming more expensive before it is becoming clearer.",
      basis: [
        { stage: "Executive Reporting", capturedAt: readString(executivePayload.generatedAt) ?? readString(executivePayload.createdAt) ?? null },
        { stage: "Decision Centre", capturedAt: input.livingCase.createdAt },
      ],
    });
  }

  const stageNames = new Set(
    input.livingCase.contradictions
      .map((item) => item.sourceStage)
      .filter(Boolean),
  );
  if (stageNames.size >= 2) {
    reinforcingSignals.push({
      label: "Repeated structural evidence",
      description: `The same condition is appearing across ${stageNames.size} assessed surfaces, which strengthens the case that this is structural rather than isolated.`,
      surfacesInvolved: Array.from(stageNames).map((stage) => stage.replace(/_/g, " ")),
      basis: Array.from(stageNames).map((stage) => {
        const matched = input.stages?.find((item) => item.stage === stage);
        const payload = readObject(matched?.payload);
        return {
          stage: stage.replace(/_/g, " "),
          capturedAt: readString(payload.createdAt) ?? readString(payload.assessedAt) ?? readString(payload.completedAt) ?? null,
        };
      }),
    });
  }

  if (input.strategyRoomActive && hasValue(readString(strategyPayload.directive))) {
    reinforcingSignals.push({
      label: "Execution route is active",
      description: "The case has already progressed into Strategy Room execution, so the system is not only diagnosing the condition but tracking whether the move holds.",
      surfacesInvolved: ["Strategy Room", "Decision Centre"],
      basis: [
        { stage: "Strategy Room", capturedAt: readString(strategyPayload.createdAt) ?? readString(strategyPayload.assessedAt) ?? null },
        { stage: "Decision Centre", capturedAt: input.livingCase.createdAt },
      ],
    });
  }

  if (conflicts.length === 0 && reinforcingSignals.length === 0) return null;

  return {
    asOf: input.generatedAt ?? new Date().toISOString(),
    conflicts,
    reinforcingSignals,
    caution: input.stages && input.stages.length < 2
      ? "Cross-assessment intelligence will become stronger after additional governed stages are completed."
      : undefined,
    meta: defaultIntelligenceMeta({
      scope: input.scope,
      sourceLabel: "Cross-assessment comparison",
      sourceSurfaces: [...new Set([
        ...conflicts.flatMap((item) => item.surfacesInvolved),
        ...reinforcingSignals.flatMap((item) => item.surfacesInvolved),
      ])],
      generatedAt: input.generatedAt,
      capturedAt: input.livingCase.createdAt,
      evidencePosture: conflicts.some((item) => item.evidencePosture === "MIXED") ? "SYSTEM_INFERRED" : "INSUFFICIENT_DATA",
      confidenceLabel: conflicts.length > 0 || reinforcingSignals.length > 0 ? "INFERRED" : "UNAVAILABLE",
      dataQuality: conflicts.length + reinforcingSignals.length >= 2 ? "MATURE" : "THIN",
      evidenceBasis: "This pattern is inferred from multiple completed assessments.",
      meaning: "Shows where recorded assessments reinforce or conflict with each other.",
      limitation: "This does not prove causation or resolution on its own.",
      nextAction: conflicts.length > 0 ? "Inspect the conflicting surfaces and resolve the blocker." : undefined,
      provenance: [
        ...conflicts.flatMap((item) =>
          item.basis.map((basis, index) =>
            createFieldProvenance({
              fieldKey: `${item.label}.${index}`,
              sourceSurface: item.surfacesInvolved[index]?.replace(/ /g, "_").toUpperCase() || "DECISION_CENTRE",
              sourceLabel: basis.stage,
              capturedAt: basis.capturedAt,
              caseId: input.scope.caseId ?? null,
              journeyId: input.scope.journeyId ?? null,
              strategyRoomSessionId: input.scope.strategyRoomSessionId ?? null,
              executiveRunId: input.scope.executiveRunId ?? null,
              scopeType: input.scope.scopeType,
              scopeId: input.scope.caseId ?? input.scope.journeyId ?? input.scope.strategyRoomSessionId ?? input.scope.executiveRunId ?? null,
              evidencePosture: toFieldEvidencePosture(item.evidencePosture),
              confidenceLabel: "INFERRED",
            }),
          ),
        ),
        ...reinforcingSignals.flatMap((item) =>
          item.basis.map((basis, index) =>
            createFieldProvenance({
              fieldKey: `${item.label}.${index}`,
              sourceSurface: item.surfacesInvolved[index]?.replace(/ /g, "_").toUpperCase() || "DECISION_CENTRE",
              sourceLabel: basis.stage,
              capturedAt: basis.capturedAt,
              caseId: input.scope.caseId ?? null,
              journeyId: input.scope.journeyId ?? null,
              strategyRoomSessionId: input.scope.strategyRoomSessionId ?? null,
              executiveRunId: input.scope.executiveRunId ?? null,
              scopeType: input.scope.scopeType,
              scopeId: input.scope.caseId ?? input.scope.journeyId ?? input.scope.strategyRoomSessionId ?? input.scope.executiveRunId ?? null,
              evidencePosture: "SYSTEM_INFERRED",
              confidenceLabel: "INFERRED",
            }),
          ),
        ),
      ],
      comparisonBasis: [...conflicts, ...reinforcingSignals].some((item) =>
        item.basis.some((basis) => Boolean(basis.capturedAt)),
      )
        ? "BASELINE_ONLY"
        : "THIN_STATE",
    }),
  };
}
