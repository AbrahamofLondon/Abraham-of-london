export type OversightReviewDecision =
  | "APPROVE_FOR_CLIENT"
  | "REVISE_BEFORE_DELIVERY"
  | "WITHHOLD_FROM_CLIENT"
  | "ESCALATE_TO_COUNSEL"
  | "ESCALATE_TO_BOARDROOM"
  | "WAIT_FOR_MORE_EVIDENCE";

export type OversightReviewDecisionReason =
  | "EFFICACY_TOO_LOW"
  | "CLIENT_SAFE"
  | "SENSITIVE_DATA_SUPPRESSED"
  | "COUNSEL_REQUIRED"
  | "BOARDROOM_THRESHOLD_MET"
  | "INSUFFICIENT_EVIDENCE"
  | "FIRST_CYCLE_EXCEPTION"
  | "OPERATOR_APPROVED"
  | "OPERATOR_WITHHELD"
  | "DELIVERY_NOT_READY";

export type OversightReviewDecisionRecord = {
  id: string;
  accountId: string;
  organisationId?: string | null;
  cycleId: string;
  briefId?: string | null;
  decision: OversightReviewDecision;
  reasons: OversightReviewDecisionReason[];
  operatorId?: string | null;
  operatorNote?: string | null;
  efficacyGrade: string;
  efficacyScore: number;
  clientSafe: boolean;
  deliveryAllowed: boolean;
  createdAt: string;
};
