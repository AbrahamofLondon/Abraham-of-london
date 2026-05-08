import type { BoardroomArchiveEntry, BoardroomArchiveSummary } from "@/lib/product/boardroom-archive-contract";
import { loadBoardroomArchiveSummary } from "@/lib/product/boardroom-archive";

export async function listBoardroomDossierArchive(input: {
  organisationId?: string | null;
  caseId?: string | null;
}): Promise<BoardroomArchiveEntry[]> {
  const summary = await loadBoardroomArchiveSummary({
    organisationId: input.organisationId ?? null,
    caseIds: input.caseId ? [input.caseId] : undefined,
  });
  return summary.entries;
}

export async function loadBoardroomDossierArchiveSummary(input: {
  organisationId?: string | null;
  caseId?: string | null;
}): Promise<BoardroomArchiveSummary> {
  return loadBoardroomArchiveSummary({
    organisationId: input.organisationId ?? null,
    caseIds: input.caseId ? [input.caseId] : undefined,
  });
}
