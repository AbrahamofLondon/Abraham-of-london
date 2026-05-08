export type OversightSchedulerEventType =
  | "CYCLE_DUE"
  | "CYCLE_GENERATED"
  | "CYCLE_REVIEW_REQUIRED"
  | "CYCLE_OVERDUE"
  | "CLIENT_EVIDENCE_REQUIRED"
  | "OPERATOR_REVIEW_OVERDUE"
  | "COUNSEL_REVIEW_OVERDUE"
  | "BOARDROOM_ESCALATION_OVERDUE"
  | "DELIVERY_PENDING"
  | "DELIVERY_COMPLETED";

export type OversightSchedulerEvent = {
  contractId: string;
  organisationId: string;
  eventType: OversightSchedulerEventType;
  summary: string;
  createdAt: string;
};

export type OversightSchedulerRunResult = {
  generatedAt: string;
  events: OversightSchedulerEvent[];
  generatedCycles: string[];
  warnings: string[];
};
