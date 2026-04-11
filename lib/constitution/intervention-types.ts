export type InterventionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "FAILED";

export type InterventionPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type InterventionSource =
  | "TRIBUNAL"
  | "DRIFT"
  | "BREACH"
  | "MANUAL"
  | "AUTO_ROUTE_CORRECTION";

export type InterventionActionType =
  | "ROUTE_CORRECTION"
  | "SIGNAL_REASSESSMENT"
  | "MANDATE_REWRITE"
  | "OPERATOR_REVIEW"
  | "ESCALATE_TO_STRATEGY"
  | "DOWNGRADE_TO_DIAGNOSTIC"
  | "BLOCK_FURTHER_SUBMISSIONS";

export type InterventionRecord = {
  id: string;
  caseKey?: string;
  operatorKey?: string;

  title: string;
  description: string;

  source: InterventionSource;
  actionType: InterventionActionType;

  priority: InterventionPriority;
  status: InterventionStatus;

  assignedTo?: string;
  createdAt: string;
  dueAt?: string;
  completedAt?: string;

  evidence?: {
    note?: string;
    attachments?: string[];
    proofScore?: number; // 0–1
  };

  metadata?: Record<string, any>;
};