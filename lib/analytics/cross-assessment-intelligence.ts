import type { PurposeAlignmentEvidenceCarryForward } from "@/lib/alignment/evidence-loader";
import type { LivingCase } from "@/lib/product/living-case-store";

export type CrossAssessmentIntelligence = {
  conflicts: Array<{
    label: string;
    description: string;
    surfacesInvolved: string[];
    evidencePosture: "SYSTEM_INFERRED" | "MIXED" | "INSUFFICIENT";
    severity: "LOW" | "MEDIUM" | "HIGH";
    userSafeExplanation: string;
  }>;
  reinforcingSignals: Array<{
    label: string;
    description: string;
    surfacesInvolved: string[];
  }>;
  caution?: string;
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
  stages?: Array<{ stage: string; payload: unknown }>;
  purposeAlignment?: PurposeAlignmentEvidenceCarryForward | null;
  strategyRoomActive?: boolean;
  latestCheckpointStatus?: string | null;
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
      userSafeExplanation: "The system can see a stated first move, but execution governance has not yet confirmed that it happened. The issue may now be follow-through rather than diagnosis.",
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
    });
  }

  if (input.strategyRoomActive && hasValue(readString(strategyPayload.directive))) {
    reinforcingSignals.push({
      label: "Execution route is active",
      description: "The case has already progressed into Strategy Room execution, so the system is not only diagnosing the condition but tracking whether the move holds.",
      surfacesInvolved: ["Strategy Room", "Decision Centre"],
    });
  }

  if (conflicts.length === 0 && reinforcingSignals.length === 0) return null;

  return {
    conflicts,
    reinforcingSignals,
    caution: input.stages && input.stages.length < 2
      ? "Cross-assessment intelligence will become stronger after additional governed stages are completed."
      : undefined,
  };
}
