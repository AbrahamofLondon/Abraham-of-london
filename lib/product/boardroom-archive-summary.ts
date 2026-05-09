import { loadBoardroomArchiveSummary } from "@/lib/product/boardroom-archive";

export async function loadBoardroomArchiveCommandSummary(input: {
  organisationId?: string | null;
  caseIds?: string[];
}) {
  const summary = await loadBoardroomArchiveSummary({
    organisationId: input.organisationId ?? null,
    caseIds: input.caseIds,
  });
  const latest = summary.entries[0] ?? null;

  return {
    archiveCount: summary.totalDossiers,
    latestDossier: latest ? {
      generatedAt: latest.qualifiedAt,
      caseReference: latest.caseId,
      qualificationStatus: latest.exportStatus === "NOT_EXPORTED" ? "BOARDROOM_READY" : "ARCHIVED",
      downloadAvailable: latest.exportStatus === "READY" || latest.exportStatus === "EXPORTED",
    } : null,
    repeatedExposureCount: summary.repeatedExposureCount,
    unresolvedCount: summary.unresolvedBoardLevelIssues,
    summary: summary.summary,
  };
}

