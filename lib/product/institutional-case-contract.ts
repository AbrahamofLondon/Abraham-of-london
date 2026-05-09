/**
 * Institutional Case Contract
 *
 * Defines the canonical institutional case type for the governed corridor.
 * Only institutional records may enter the full corridor:
 *   Executive Reporting -> Strategy Room -> Counsel -> Boardroom -> Oversight
 *
 * A case is created when Executive Reporting completes and is progressively
 * enriched as the record moves through corridor surfaces.
 */

/* ------------------------------------------------------------------ */
/*  Qualification states                                              */
/* ------------------------------------------------------------------ */

export type InstitutionalQualificationState =
  | "NOT_INSTITUTIONAL"
  | "INSTITUTIONAL_CANDIDATE"
  | "INSTITUTIONAL_QUALIFIED"
  | "BOARDROOM_ELIGIBLE"
  | "BOARDROOM_QUALIFIED"
  | "OVERSIGHT_ELIGIBLE"
  | "RETAINED_OVERSIGHT_ACTIVE"
  | "RETAINED_OVERSIGHT_HISTORY_LIMITED"
  | "RETAINED_OVERSIGHT_MATURE";

/**
 * Ordered rank — higher index = more advanced corridor state.
 */
export const QUALIFICATION_RANK: Record<InstitutionalQualificationState, number> = {
  NOT_INSTITUTIONAL: 0,
  INSTITUTIONAL_CANDIDATE: 1,
  INSTITUTIONAL_QUALIFIED: 2,
  BOARDROOM_ELIGIBLE: 3,
  BOARDROOM_QUALIFIED: 4,
  OVERSIGHT_ELIGIBLE: 5,
  RETAINED_OVERSIGHT_ACTIVE: 6,
  RETAINED_OVERSIGHT_HISTORY_LIMITED: 7,
  RETAINED_OVERSIGHT_MATURE: 8,
};

/* ------------------------------------------------------------------ */
/*  Evidence posture                                                  */
/* ------------------------------------------------------------------ */

export type InstitutionalEvidencePosture =
  | "NO_EVIDENCE"
  | "DIAGNOSTIC_ONLY"
  | "EXECUTIVE_REPORT_PRESENT"
  | "STRATEGY_EXECUTED"
  | "COUNSEL_ATTACHED"
  | "BOARDROOM_DOSSIER_PRESENT"
  | "OVERSIGHT_ACTIVE"
  | "RETAINED_MATURE";

/* ------------------------------------------------------------------ */
/*  Institutional flags                                               */
/* ------------------------------------------------------------------ */

export type InstitutionalFlags = {
  hasExecutiveReport: boolean;
  hasStrategyRoomSession: boolean;
  hasCounselCase: boolean;
  hasBoardroomDossier: boolean;
  hasOversightBrief: boolean;
  hasCadence: boolean;
  hasOutcomeHistory: boolean;
  hasSuppressionLedger: boolean;
  hasPortfolioMemory: boolean;
  hasDeliveryHistory: boolean;
};

export const EMPTY_FLAGS: InstitutionalFlags = {
  hasExecutiveReport: false,
  hasStrategyRoomSession: false,
  hasCounselCase: false,
  hasBoardroomDossier: false,
  hasOversightBrief: false,
  hasCadence: false,
  hasOutcomeHistory: false,
  hasSuppressionLedger: false,
  hasPortfolioMemory: false,
  hasDeliveryHistory: false,
};

/* ------------------------------------------------------------------ */
/*  Core case type                                                    */
/* ------------------------------------------------------------------ */

export type InstitutionalCase = {
  caseId: string;
  sourceRecordId: string;
  sourceSurface: string;
  subjectUserId: string | null;
  subjectEmail: string;
  organisationId: string | null;
  sponsorUserId: string | null;
  executiveRunId: string | null;
  strategyRoomSessionId: string | null;
  counselCaseId: string | null;
  boardroomDossierId: string | null;
  oversightScopeId: string | null;
  retainedCadenceId: string | null;
  portfolioScopeId: string | null;
  qualificationState: InstitutionalQualificationState;
  evidencePosture: InstitutionalEvidencePosture;
  sourceLabels: string[];
  createdAt: string;
  updatedAt: string;
  lastReviewedAt: string | null;
  institutionalFlags: InstitutionalFlags;
};

/* ------------------------------------------------------------------ */
/*  Corridor surface continuity                                       */
/* ------------------------------------------------------------------ */

export type CorridorSurface =
  | "EXECUTIVE_REPORTING"
  | "STRATEGY_ROOM"
  | "COUNSEL_REVIEW"
  | "BOARDROOM"
  | "OVERSIGHT_COMMAND"
  | "OVERSIGHT_BRIEF"
  | "PORTFOLIO_MEMORY"
  | "PROOF_PACK"
  | "DELIVERY"
  | "SUPPRESSION_LEDGER";

export type CorridorContinuityResult = {
  surface: CorridorSurface;
  caseId: string;
  attached: boolean;
  evidencePosture: InstitutionalEvidencePosture;
  qualificationState: InstitutionalQualificationState;
  flags: InstitutionalFlags;
};

/* ------------------------------------------------------------------ */
/*  Sponsor-safe case summary (public DTO)                            */
/* ------------------------------------------------------------------ */

export type InstitutionalCasePublicSummary = {
  caseId: string;
  qualificationState: InstitutionalQualificationState;
  evidencePosture: InstitutionalEvidencePosture;
  admitted: string[];
  notYetAdmitted: string[];
  strategyRoomEarned: boolean;
  boardroomEarned: boolean;
  counselWarranted: boolean;
  oversightStatus: "PREMATURE" | "ELIGIBLE" | "ACTIVE";
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

export function deriveEvidencePosture(flags: InstitutionalFlags): InstitutionalEvidencePosture {
  if (flags.hasCadence || flags.hasOutcomeHistory) return "RETAINED_MATURE";
  if (flags.hasOversightBrief) return "OVERSIGHT_ACTIVE";
  if (flags.hasBoardroomDossier) return "BOARDROOM_DOSSIER_PRESENT";
  if (flags.hasCounselCase) return "COUNSEL_ATTACHED";
  if (flags.hasStrategyRoomSession) return "STRATEGY_EXECUTED";
  if (flags.hasExecutiveReport) return "EXECUTIVE_REPORT_PRESENT";
  return "NO_EVIDENCE";
}

export function deriveQualificationState(
  flags: InstitutionalFlags,
  organisationId: string | null,
): InstitutionalQualificationState {
  if (flags.hasCadence && flags.hasOutcomeHistory && flags.hasPortfolioMemory) {
    return "RETAINED_OVERSIGHT_MATURE";
  }
  if (flags.hasCadence && flags.hasOversightBrief) {
    if (flags.hasOutcomeHistory) return "RETAINED_OVERSIGHT_ACTIVE";
    return "RETAINED_OVERSIGHT_HISTORY_LIMITED";
  }
  if (flags.hasOversightBrief) return "OVERSIGHT_ELIGIBLE";
  if (flags.hasBoardroomDossier) return "BOARDROOM_QUALIFIED";
  if (flags.hasStrategyRoomSession && organisationId) return "BOARDROOM_ELIGIBLE";
  if (flags.hasExecutiveReport && organisationId) return "INSTITUTIONAL_QUALIFIED";
  if (flags.hasExecutiveReport) return "INSTITUTIONAL_CANDIDATE";
  return "NOT_INSTITUTIONAL";
}

export function buildAdmittedList(flags: InstitutionalFlags): string[] {
  const admitted: string[] = [];
  if (flags.hasExecutiveReport) admitted.push("Executive Report");
  if (flags.hasStrategyRoomSession) admitted.push("Strategy Room session");
  if (flags.hasCounselCase) admitted.push("Counsel review");
  if (flags.hasBoardroomDossier) admitted.push("Boardroom dossier");
  if (flags.hasOversightBrief) admitted.push("Oversight brief");
  if (flags.hasCadence) admitted.push("Retained cadence");
  if (flags.hasOutcomeHistory) admitted.push("Outcome history");
  if (flags.hasSuppressionLedger) admitted.push("Suppression ledger");
  if (flags.hasPortfolioMemory) admitted.push("Portfolio memory");
  if (flags.hasDeliveryHistory) admitted.push("Delivery history");
  return admitted;
}

export function buildNotYetAdmittedList(flags: InstitutionalFlags): string[] {
  const notAdmitted: string[] = [];
  if (!flags.hasExecutiveReport) notAdmitted.push("Executive Report");
  if (!flags.hasStrategyRoomSession) notAdmitted.push("Strategy Room session");
  if (!flags.hasCounselCase) notAdmitted.push("Counsel review");
  if (!flags.hasBoardroomDossier) notAdmitted.push("Boardroom dossier");
  if (!flags.hasOversightBrief) notAdmitted.push("Oversight brief");
  if (!flags.hasCadence) notAdmitted.push("Retained cadence");
  if (!flags.hasOutcomeHistory) notAdmitted.push("Outcome history");
  if (!flags.hasPortfolioMemory) notAdmitted.push("Portfolio memory");
  return notAdmitted;
}

export function buildPublicSummary(ic: InstitutionalCase): InstitutionalCasePublicSummary {
  const f = ic.institutionalFlags;
  const admitted = buildAdmittedList(f);
  const notYetAdmitted = buildNotYetAdmittedList(f);

  let oversightStatus: "PREMATURE" | "ELIGIBLE" | "ACTIVE" = "PREMATURE";
  if (QUALIFICATION_RANK[ic.qualificationState] >= QUALIFICATION_RANK.RETAINED_OVERSIGHT_ACTIVE) {
    oversightStatus = "ACTIVE";
  } else if (QUALIFICATION_RANK[ic.qualificationState] >= QUALIFICATION_RANK.OVERSIGHT_ELIGIBLE) {
    oversightStatus = "ELIGIBLE";
  }

  return {
    caseId: ic.caseId,
    qualificationState: ic.qualificationState,
    evidencePosture: ic.evidencePosture,
    admitted,
    notYetAdmitted,
    strategyRoomEarned: f.hasExecutiveReport,
    boardroomEarned: QUALIFICATION_RANK[ic.qualificationState] >= QUALIFICATION_RANK.BOARDROOM_ELIGIBLE,
    counselWarranted: f.hasStrategyRoomSession || f.hasExecutiveReport,
    oversightStatus,
  };
}
