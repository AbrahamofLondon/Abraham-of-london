/**
 * lib/product/boardroom-archive.ts — Boardroom dossier archive.
 *
 * Tracks boardroom dossier generation history so oversight briefs
 * can reference prior board-level escalations and detect repeated
 * boardroom triggers across cycles.
 */

export type BoardroomArchiveEntry = {
  id: string;
  caseId: string;
  cycleId?: string;
  qualifiedAt: string;
  dossierGenerated: boolean;
  exportedAt?: string | null;
  sectionCount: number;
  qualification: {
    qualified: boolean;
    reason: string;
  };
};

export type BoardroomArchive = {
  entries: BoardroomArchiveEntry[];
  totalDossiers: number;
  unresolvedBoardroomIssues: number;
  repeatedTriggerCount: number;
  summary: string;
};

/**
 * Assemble a boardroom archive from available entries.
 * V0: in-memory assembly from provided data.
 * Future: persistence via Prisma model.
 */
export function assembleBoardroomArchive(
  entries: BoardroomArchiveEntry[],
): BoardroomArchive {
  const totalDossiers = entries.filter((e) => e.dossierGenerated).length;
  const unresolvedBoardroomIssues = entries.filter(
    (e) => e.dossierGenerated && !e.exportedAt,
  ).length;

  // Repeated triggers: same caseId appearing more than once
  const caseIdCounts = new Map<string, number>();
  for (const e of entries) {
    caseIdCounts.set(e.caseId, (caseIdCounts.get(e.caseId) || 0) + 1);
  }
  const repeatedTriggerCount = [...caseIdCounts.values()].filter((c) => c > 1).length;

  return {
    entries,
    totalDossiers,
    unresolvedBoardroomIssues,
    repeatedTriggerCount,
    summary: entries.length === 0
      ? "No boardroom escalations recorded."
      : `${totalDossiers} boardroom dossier${totalDossiers !== 1 ? "s" : ""} generated. ${unresolvedBoardroomIssues} unresolved. ${repeatedTriggerCount} repeated trigger${repeatedTriggerCount !== 1 ? "s" : ""}.`,
  };
}
