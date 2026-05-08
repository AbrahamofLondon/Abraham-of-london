import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { OversightCadenceState } from "@/lib/product/oversight-cadence-contract";
import type { OversightCycleComparison } from "@/lib/product/oversight-cycle-comparison";
import type { BoardroomArchiveSummary } from "@/lib/product/boardroom-archive-contract";
import type { CounselHistory } from "@/lib/product/counsel-history-contract";
import type { OrganisationDivergenceSummary } from "@/lib/product/organisation-divergence-summary";

export type RetainerIndispensabilitySummary = {
  headline: string;
  wouldLose: string[];
  preservedVisibility: string[];
  currentDependencyLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  basis: string[];
};

export function buildRetainerIndispensabilitySummary(input: {
  brief: OversightBrief;
  cadence?: OversightCadenceState | null;
  cycleComparison?: OversightCycleComparison | null;
  boardroomArchive?: BoardroomArchiveSummary | null;
  counselHistory?: CounselHistory | null;
  organisationDivergence?: OrganisationDivergenceSummary[];
}): RetainerIndispensabilitySummary {
  const wouldLose: string[] = [];
  const preservedVisibility: string[] = [];
  const basis: string[] = [];

  if (input.brief.costOfInaction?.totalEstimated) {
    preservedVisibility.push("Cost accumulation is being measured between cycles.");
    wouldLose.push("Accumulating cost exposure would likely return to manual tracking between reviews.");
    basis.push("Real cost-of-inaction basis exists.");
  }
  if (input.brief.patternRecurrence && input.brief.patternRecurrence.status !== "NO_PRIOR_PATTERN") {
    preservedVisibility.push("Recurring structural patterns are being checked against prior case history.");
    wouldLose.push("Pattern recurrence would become harder to detect early.");
    basis.push("Pattern recurrence is present.");
  }
  if (input.brief.verification.unresolvedBreaches > 0 || input.brief.verification.commitmentsVerified > 0) {
    preservedVisibility.push("Commitments are being verified rather than assumed.");
    wouldLose.push("Commitment drift would lose a governed verification trail.");
    basis.push("Commitment verification is active.");
  }
  if ((input.boardroomArchive?.totalDossiers ?? 0) > 0 || input.brief.boardroom.dossiersAvailable > 0) {
    preservedVisibility.push("Board-level exposure has archived memory across cycles.");
    wouldLose.push("Boardroom-grade consequence memory would stop accumulating.");
    basis.push("Boardroom archive evidence exists.");
  }
  if ((input.counselHistory?.totalEvents ?? 0) > 0 || input.brief.counsel.reviewsTriggered > 0) {
    preservedVisibility.push("Counsel escalations are governed and retained as evidence.");
    wouldLose.push("Counsel-trigger history would revert to informal recall.");
    basis.push("Counsel history exists.");
  }
  if ((input.organisationDivergence?.length ?? 0) > 0) {
    preservedVisibility.push("Organisation divergence is being preserved in sponsor-safe aggregate form.");
    wouldLose.push("Divergence signals would likely be lost between reviews.");
    basis.push("Sponsor-safe divergence summaries exist.");
  }
  if (input.cycleComparison?.available) {
    preservedVisibility.push("Cycle-to-cycle movement is archived and comparable.");
    wouldLose.push("What improved, worsened, or repeated since the prior cycle would become less visible.");
    basis.push("Prior-cycle comparison exists.");
  }
  if (input.cadence && input.cadence.status !== "FIRST_CYCLE_PENDING") {
    preservedVisibility.push("Cadence discipline is being monitored rather than left to memory.");
    wouldLose.push("Cycle discipline would return to operator habit rather than product-enforced visibility.");
    basis.push("Cadence state is available.");
  }

  const uniqueWouldLose = [...new Set(wouldLose)];
  const uniquePreserved = [...new Set(preservedVisibility)];
  const severitySeed = uniqueWouldLose.length
    + ((input.boardroomArchive?.repeatedExposureCount ?? 0) > 0 ? 1 : 0)
    + ((input.counselHistory?.openCount ?? 0) > 0 ? 1 : 0);
  const currentDependencyLevel = severitySeed >= 7
    ? "CRITICAL"
    : severitySeed >= 5
      ? "HIGH"
      : severitySeed >= 3
        ? "MODERATE"
        : "LOW";

  return {
    headline: "If oversight stopped today, the following visibility would no longer be maintained.",
    wouldLose: uniqueWouldLose,
    preservedVisibility: uniquePreserved,
    currentDependencyLevel,
    basis,
  };
}
