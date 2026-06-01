export type OutcomeVerificationStatus =
  | "NOT_REQUESTED"
  | "REQUESTED"
  | "COMPLETED"
  | "PARTIAL"
  | "BLOCKED"
  | "DISPUTED"
  | "NO_CHANGE"
  | "INSUFFICIENT_EVIDENCE";

export type OutcomeVerificationClassification =
  | "ACTION_CONFIRMED"
  | "OUTCOME_IMPROVED"
  | "OUTCOME_UNCHANGED"
  | "ACTION_BLOCKED"
  | "SYSTEM_FINDING_DISPUTED"
  | "INSUFFICIENT_EVIDENCE";

export type OutcomeVerificationEvidencePosture =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "OPERATOR_REVIEWED"
  | "VERIFIED"
  | "INSUFFICIENT_EVIDENCE";

export type OutcomeDidAct =
  | "YES"
  | "PARTIAL"
  | "NO"
  | "BLOCKED";

export type OutcomeChangedState =
  | "IMPROVED"
  | "UNCHANGED"
  | "WORSENED"
  | "UNKNOWN";

export type OutcomeAccuracyAnswer =
  | "ACCURATE"
  | "PARTIAL"
  | "INACCURATE";

export type OutcomeUsefulnessAnswer =
  | "USEFUL"
  | "PARTIAL"
  | "NOT_USEFUL";

export type OutcomeVerificationReference = {
  checkpointId?: string | null;
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
};

export type OutcomeVerificationRequest = OutcomeVerificationReference & {
  token?: string | null;
  didAct: OutcomeDidAct;
  changedState: OutcomeChangedState;
  whatChanged: string;
  evidenceSummary?: string | null;
  systemDiagnosisAccuracy: OutcomeAccuracyAnswer;
  requiredMoveUsefulness: OutcomeUsefulnessAnswer;
  rememberNote?: string | null;
  /** Optional recommendationId to bind this outcome to a specific recommendation ledger entry */
  recommendationId?: string | null;
};

export type OutcomeVerificationContext = OutcomeVerificationReference & {
  checkpointTitle?: string | null;
  sourceSurface?: string | null;
  sourceLabel?: string | null;
  evidencePosture?: string | null;
  dueAt?: string | null;
};

export type OutcomeVerificationRecord = OutcomeVerificationContext & {
  verificationId: string;
  userEmail: string;
  userId?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  status: OutcomeVerificationStatus;
  outcomeClassification: OutcomeVerificationClassification;
  evidencePosture: OutcomeVerificationEvidencePosture;
  didAct: OutcomeDidAct;
  changedState: OutcomeChangedState;
  systemDiagnosisAccuracy: OutcomeAccuracyAnswer;
  requiredMoveUsefulness: OutcomeUsefulnessAnswer;
  whatChanged: string;
  evidenceSummary?: string | null;
  rememberNote?: string | null;
  createdAt: string;
  checkpointResponseStatus?: string | null;
  proofLabels: OutcomeVerificationEvidencePosture[];
};

export type OutcomeVerificationResult = {
  ok: true;
  record: OutcomeVerificationRecord;
  checkpointId?: string | null;
  checkpointResponseStatus?: string | null;
  calibration?: {
    modelKey: string;
    modelVersion: string;
    predictionError: number | null;
    accuracyScore: number | null;
    biasScore: number | null;
    outcomeCount: number;
  } | null;
};

export function classifyOutcomeVerification(
  input: Pick<
    OutcomeVerificationRequest,
    "didAct" | "changedState" | "systemDiagnosisAccuracy" | "requiredMoveUsefulness" | "evidenceSummary"
  >,
): {
  status: OutcomeVerificationStatus;
  outcomeClassification: OutcomeVerificationClassification;
  evidencePosture: OutcomeVerificationEvidencePosture;
  checkpointResponseStatus: "COMPLETED" | "PARTIALLY_COMPLETED" | "BLOCKED" | "ABANDONED" | "DISPUTED_FINDING";
} {
  const hasEvidence = Boolean(input.evidenceSummary && input.evidenceSummary.trim());

  if (input.systemDiagnosisAccuracy === "INACCURATE") {
    return {
      status: "DISPUTED",
      outcomeClassification: "SYSTEM_FINDING_DISPUTED",
      evidencePosture: hasEvidence ? "USER_REPORTED" : "INSUFFICIENT_EVIDENCE",
      checkpointResponseStatus: "DISPUTED_FINDING",
    };
  }

  if (input.didAct === "BLOCKED") {
    return {
      status: "BLOCKED",
      outcomeClassification: "ACTION_BLOCKED",
      evidencePosture: hasEvidence ? "USER_REPORTED" : "INSUFFICIENT_EVIDENCE",
      checkpointResponseStatus: "BLOCKED",
    };
  }

  if (!hasEvidence && input.changedState !== "UNKNOWN") {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      outcomeClassification: "INSUFFICIENT_EVIDENCE",
      evidencePosture: "INSUFFICIENT_EVIDENCE",
      checkpointResponseStatus: input.didAct === "YES" ? "PARTIALLY_COMPLETED" : "ABANDONED",
    };
  }

  if (input.didAct === "NO") {
    return {
      status: input.changedState === "UNCHANGED" || input.changedState === "UNKNOWN"
        ? "NO_CHANGE"
        : "PARTIAL",
      outcomeClassification: input.changedState === "IMPROVED"
        ? "OUTCOME_IMPROVED"
        : "OUTCOME_UNCHANGED",
      evidencePosture: hasEvidence ? "USER_REPORTED" : "INSUFFICIENT_EVIDENCE",
      checkpointResponseStatus: "ABANDONED",
    };
  }

  if (input.didAct === "PARTIAL") {
    return {
      status: hasEvidence ? "PARTIAL" : "INSUFFICIENT_EVIDENCE",
      outcomeClassification: input.changedState === "IMPROVED"
        ? "OUTCOME_IMPROVED"
        : hasEvidence
          ? "OUTCOME_UNCHANGED"
          : "INSUFFICIENT_EVIDENCE",
      evidencePosture: hasEvidence ? "USER_REPORTED" : "INSUFFICIENT_EVIDENCE",
      checkpointResponseStatus: "PARTIALLY_COMPLETED",
    };
  }

  if (input.didAct === "YES" && input.changedState === "IMPROVED" && hasEvidence) {
    return {
      status: "COMPLETED",
      outcomeClassification: input.requiredMoveUsefulness === "NOT_USEFUL"
        ? "OUTCOME_UNCHANGED"
        : "ACTION_CONFIRMED",
      evidencePosture: "USER_REPORTED",
      checkpointResponseStatus: "COMPLETED",
    };
  }

  return {
    status: hasEvidence ? "PARTIAL" : "INSUFFICIENT_EVIDENCE",
    outcomeClassification: hasEvidence ? "OUTCOME_UNCHANGED" : "INSUFFICIENT_EVIDENCE",
    evidencePosture: hasEvidence ? "USER_REPORTED" : "INSUFFICIENT_EVIDENCE",
    checkpointResponseStatus: "PARTIALLY_COMPLETED",
  };
}
