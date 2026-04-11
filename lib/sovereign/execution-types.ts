export type MandateStatus =
  | "PROPOSED"
  | "ACCEPTED"
  | "ACTIVE"
  | "BLOCKED"
  | "COMPLETED"
  | "TERMINATED";

export type MandateSource =
  | "AUTO_ESCALATION"
  | "OPERATOR_ACCEPTED"
  | "TRIBUNAL_FORCED";

export type MandateRecord = {
  id: string;

  caseKey: string;
  operatorKey?: string;

  source: MandateSource;

  title: string;
  description: string;

  commercial: {
    feeModel: "FIXED" | "RETAINER" | "SUCCESS";
    value: number;
    currency: string;
  };

  execution: {
    owner?: string;
    startDate?: string;
    dueDate?: string;
    milestones?: Array<{
      title: string;
      completed: boolean;
    }>;
  };

  status: MandateStatus;

  audit: {
    createdAt: string;
    acceptedAt?: string;
    completedAt?: string;
  };

  metadata?: Record<string, any>;
};