import type { InstitutionalMemoryArchive } from "@/lib/product/institutional-memory-contract";

export function summarizeInstitutionalMemoryArchive(archive: InstitutionalMemoryArchive) {
  return {
    memorySummary: archive.cycleCount === 0
      ? "No institutional memory archive exists yet."
      : `Continued oversight preserves ${archive.monthsOfMemory} month(s) of decision memory, ${archive.recurringPatternCount} recurring pattern signal(s), ${archive.boardroomEscalationCount} boardroom escalation record(s), ${archive.unresolvedCommitmentCount} unresolved commitment marker(s), and ${archive.verifiedOutcomeCount} verified outcome marker(s).`,
    cancellationLossVisibility: archive.cycleCount === 0
      ? "Insufficient evidence to state cancellation-loss visibility."
      : `If oversight stopped now, visibility would reduce across accumulated cycle history, unresolved commitments, recurring patterns, and boardroom/counsel escalation memory.`,
  };
}
