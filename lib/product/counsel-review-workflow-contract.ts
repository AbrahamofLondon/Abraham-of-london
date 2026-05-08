export type CounselWorkflowStatus =
  | "NOT_REQUIRED"
  | "RECOMMENDED"
  | "REQUIRED"
  | "ASSIGNED"
  | "UNDER_REVIEW"
  | "COUNSEL_RESPONSE_RECORDED"
  | "COUNSEL_ACTION_ACCEPTED"
  | "COUNSEL_ACTION_REJECTED"
  | "ESCALATED_TO_RETAINER_OVERSIGHT";

export type CounselReviewAction = {
  id: string;
  caseId: string;
  cycleId?: string;
  status: CounselWorkflowStatus;
  triggerReason: string;
  triggerSource?: string;
  assignedTo?: string;
  assignedBy?: string;
  requestedReviewQuestion?: string;
  counselResponseSummary?: string;
  evidenceNodeIds?: string[];
  requiredActionIds?: string[];
  operatorDisposition?: "ACCEPTED" | "REJECTED" | "PENDING";
  nextAction?: string;
};
