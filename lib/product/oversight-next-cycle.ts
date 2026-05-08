import type { OversightBriefEfficacyGrade } from "@/lib/product/oversight-brief-efficacy-contract";
import type { RetainerTier } from "@/lib/product/retainer-oversight-contract";

export function deriveNextOversightCycleIntent(input: {
  tier: RetainerTier;
  currentCycleDate: string;
  unresolvedActions: number;
  counselRequired: boolean;
  boardroomRequired: boolean;
  efficacyGrade: OversightBriefEfficacyGrade | string;
}): {
  nextCycleRecommendedDate: string;
  cadence: "MONTHLY" | "BIWEEKLY" | "WEEKLY" | "ESCALATED";
  reason: string;
  requiresScheduler: boolean;
} {
  const baseDate = new Date(input.currentCycleDate);
  const validDate = Number.isFinite(baseDate.getTime()) ? baseDate : new Date();

  let cadence: "MONTHLY" | "BIWEEKLY" | "WEEKLY" | "ESCALATED" = "MONTHLY";
  let daysToAdd = input.tier === "INSTITUTIONAL_COMMAND" ? 21 : 30;
  let reason = "Normal retainer cadence remains monthly.";

  if (input.efficacyGrade === "WITHHOLD") {
    cadence = "ESCALATED";
    daysToAdd = 7;
    reason = "Current cycle is withheld, so the next oversight cycle should be escalated rather than treated as routine.";
  } else if (input.counselRequired || input.boardroomRequired) {
    cadence = "WEEKLY";
    daysToAdd = 7;
    reason = input.boardroomRequired
      ? "Boardroom escalation requires weekly oversight until the current cycle is resolved."
      : "Counsel escalation requires weekly oversight until the current cycle is resolved.";
  } else if (input.unresolvedActions >= 3) {
    cadence = "BIWEEKLY";
    daysToAdd = 14;
    reason = "Three or more unresolved actions justify a biweekly review cadence.";
  }

  const nextCycleDate = new Date(validDate);
  nextCycleDate.setUTCDate(nextCycleDate.getUTCDate() + daysToAdd);

  return {
    nextCycleRecommendedDate: nextCycleDate.toISOString(),
    cadence,
    reason,
    requiresScheduler: false,
  };
}
