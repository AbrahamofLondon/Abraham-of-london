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
  escalationTrend?: "STABLE" | "ESCALATING" | "DE_ESCALATING" | null;
  latestDossierReason?: string | null;
  summary: string;
  entries: BoardroomArchiveEntry[];
};
