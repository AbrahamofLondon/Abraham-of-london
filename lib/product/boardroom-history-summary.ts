import type { BoardroomArchiveSummary } from "@/lib/product/boardroom-archive-contract";

export function summarizeBoardroomHistory(summary: BoardroomArchiveSummary) {
  return {
    headline: summary.totalDossiers === 0
      ? "No boardroom memory exists yet."
      : `${summary.totalDossiers} boardroom dossier record(s) exist. ${summary.unresolvedBoardLevelIssues} remain unresolved.`,
    trend: summary.escalationTrend,
    repeatedExposure: summary.repeatedExposureCount,
    latestReason: summary.latestDossierReason ?? null,
  };
}
