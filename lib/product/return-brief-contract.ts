export type ReturnBriefV1 = {
  caseRef: string;
  status: "ACTIVE" | "RESOLVED" | "INSUFFICIENT_EVIDENCE" | "UNKNOWN";
  originalCondition?: string | null;
  originalCommitment?: string | null;
  elapsedTimeLabel?: string | null;
  whatChanged: string[];
  whatDidNotChange: string[];
  nowRequired: string[];
  escalationStatus?: "NOT_EARNED" | "RECOMMENDED" | "EARNED" | "UNKNOWN";
  decisionCentreHref: string;
  provenanceStatus?: "UNAVAILABLE" | "AVAILABLE" | "PENDING";
  boundaryNote: string;
};

export type ReturnBriefComposerSource = {
  sessionKey: string;
  trigger?:
    | "fragile_trajectory"
    | "deteriorating_trajectory"
    | "no_activity_after_commitment"
    | "recurrence_detected"
    | "contradiction_persistence"
    | null;
  trajectory?: {
    state?: "ASCENDING" | "STAGNANT" | "FRAGILE" | "DETERIORATING" | null;
    reason?: string | null;
  } | null;
  contradiction?: {
    decision?: string | null;
    constraint?: string | null;
    status?: string | null;
  } | null;
  delta?: {
    clarity?: string | null;
    authority?: string | null;
    readiness?: string | null;
  } | null;
  costOfInaction?: {
    daysElapsed?: number | null;
  } | null;
  verification?: Array<{
    label?: string | null;
    status?: string | null;
  }> | null;
  challenge?: string | null;
};
