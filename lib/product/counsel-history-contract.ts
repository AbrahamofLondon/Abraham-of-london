export type CounselHistoryEntry = {
  id: string;
  cycleId?: string;
  caseId: string;
  triggeredAt: string;
  triggerReason: string;
  triggerSource?: string;
  status: string;
  assignedTo?: string;
  requestedReviewQuestion?: string;
  recommendationSummary?: string;
  evidenceNodeIds: string[];
  operatorDisposition?: "ACCEPTED" | "REJECTED" | "DEFERRED" | "PENDING";
  resultingAction?: string;
  outcomeImpact?: string;
};

export type CounselHistory = {
  totalEvents: number;
  requiredCount: number;
  assignedCount: number;
  reviewedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  deferredCount: number;
  openCount: number;
  summary: string;
  entries: CounselHistoryEntry[];
};
