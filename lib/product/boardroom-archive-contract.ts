export type BoardroomArchiveEntry = {
  id: string;
  cycleId?: string;
  caseId: string;
  organisationId?: string | null;
  qualifiedAt: string;
  dossierSummary: string;
  triggerReason: string;
  costThreshold?: number | null;
  decisionPathRecommended?: string | null;
  objectionsGenerated: number;
  exportStatus: "NOT_EXPORTED" | "READY" | "EXPORTED";
};

export type BoardroomArchiveSummary = {
  totalDossiers: number;
  previousDossierCount: number;
  unresolvedBoardLevelIssues: number;
  repeatedExposureCount: number;
  currentTriggers: number;
  summary: string;
  entries: BoardroomArchiveEntry[];
};
