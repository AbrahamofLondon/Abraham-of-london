export type CounselReviewStatus =
  | "NOT_REQUIRED"
  | "RECOMMENDED"
  | "REQUIRED"
  | "ASSIGNED"
  | "REVIEWED"
  | "ACTION_ADDED"
  | "ESCALATED"
  | "CLOSED";

export type CounselReviewAction = {
  id: string;
  caseId: string;
  cycleId?: string;
  status: CounselReviewStatus;
  triggerReason: string;
  assignedTo?: string;
  counselNote?: string;
  evidenceNodeIds?: string[];
  requiredActionIds?: string[];
};
