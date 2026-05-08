export type OversightCycleLedgerEventType =
  | "BRIEF_GENERATED"
  | "EFFICACY_SCORED"
  | "OPERATOR_REVIEWED"
  | "REVISION_REQUESTED"
  | "CLIENT_SAFE_VERSION_CREATED"
  | "APPROVED_FOR_DELIVERY"
  | "DELIVERED"
  | "WITHHELD"
  | "NEXT_CYCLE_SCHEDULED"
  | "COUNSEL_ESCALATED"
  | "BOARDROOM_ESCALATED";

export type OversightCycleLedgerEvent = {
  id: string;
  cycleId: string;
  eventType: OversightCycleLedgerEventType;
  timestamp: string;
  actor?: {
    userId?: string;
    email?: string;
    role?: string;
  };
  reason?: string;
  evidence?: string[];
  warnings?: string[];
};
