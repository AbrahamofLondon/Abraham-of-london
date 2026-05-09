import type { BuyerVisibleCadencePosture } from "@/lib/product/retained-cadence-contract";
import type { RetainedOutcomeSummary } from "@/lib/product/retained-outcome-summary";

export type RetainerReadinessClassification =
  | "FOUNDATION_READY"
  | "SELECTIVE_5K_READY"
  | "SELECTIVE_15K_READY"
  | "SELECTIVE_HIGH_VALUE_READY"
  | "GENERAL_50K_BLOCKED"
  | "GENERAL_50K_READY";

export function classifyRetainerReadiness(input: {
  cadence: BuyerVisibleCadencePosture | null;
  cadenceSignalActive: boolean;
  roleContractActive: boolean;
  sponsorCommandSummaryComplete: boolean;
  portfolioExposureMature: boolean;
  retainedOutcomeSummary: RetainedOutcomeSummary | null;
  counselMemoryExists: boolean;
  boardroomMemoryExists: boolean;
  evidenceIntegrity: boolean;
  ipExposureControl: boolean;
}): RetainerReadinessClassification {
  if (!input.evidenceIntegrity || !input.ipExposureControl) return "FOUNDATION_READY";

  const cadenceMature = Boolean(
    input.cadence
    && ["SCHEDULED", "DUE_SOON", "OVERDUE", "COMPLETED", "SKIPPED_WITH_REASON", "ESCALATED"].includes(input.cadence.state)
  );
  const cadenceAutomationActive = Boolean(
    input.cadence
    && (input.cadence.cadenceSource === "scheduled" || input.cadence.cadenceSource === "system_triggered")
  );
  const memoryExists = input.counselMemoryExists || input.boardroomMemoryExists;
  const outcomesReady = Boolean(input.retainedOutcomeSummary && !input.retainedOutcomeSummary.thinState);
  const baseSelectiveReady = input.sponsorCommandSummaryComplete && memoryExists;

  if (!baseSelectiveReady) {
    return input.roleContractActive ? "SELECTIVE_5K_READY" : "FOUNDATION_READY";
  }

  if (
    cadenceMature
    && input.roleContractActive
    && input.sponsorCommandSummaryComplete
    && memoryExists
  ) {
    if (
      cadenceAutomationActive
      && input.cadenceSignalActive
      && outcomesReady
      && input.counselMemoryExists
      && input.boardroomMemoryExists
      && input.portfolioExposureMature
    ) {
      return "GENERAL_50K_READY";
    }

    return "SELECTIVE_HIGH_VALUE_READY";
  }

  if (baseSelectiveReady) {
    if (cadenceMature || input.roleContractActive) return "GENERAL_50K_BLOCKED";
    return "SELECTIVE_15K_READY";
  }

  return "FOUNDATION_READY";
}
