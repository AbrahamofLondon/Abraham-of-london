import type { CounselReviewAction, CounselWorkflowStatus } from "@/lib/product/counsel-review-workflow-contract";

export type CounselAssignmentRequest = {
  cycleId?: string;
  caseId: string;
  triggerReason: string;
  triggerSource?: string;
  assignedTo: string;
  requestedReviewQuestion?: string;
};

export type CounselReviewSubmission = {
  workflowId: string;
  caseId: string;
  cycleId?: string;
  status: CounselWorkflowStatus;
  reviewStatus: "ACCEPTED" | "REJECTED" | "OUTCOME_PENDING";
  triggerReason: string;
  evidenceBasis: string[];
  recommendation: string;
  contradictionAssessment: string;
  riskIfIgnored: string;
  agreesWithSystemRestriction: boolean;
  requiredClientAction: string;
  outcomeFollowUpDate?: string;
  escalateToRetainerOversight?: boolean;
  escalateToBoardroom?: boolean;
};

export type CounselAssignmentResult = {
  workflow: CounselReviewAction;
};
