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
  | "BOARDROOM_ESCALATED"
  | "CLIENT_VIEW_READY"
  | "DELIVERY_FAILED"
  | "CYCLE_ARCHIVED";

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

export type OversightCycleAudience =
  | "INTERNAL_OPERATOR"
  | "CLIENT_SPONSOR"
  | "BOARD_LEVEL"
  | "RESPONDENT_SAFE";

export type OversightCycleArchiveRecord = {
  cycleId: string;
  accountId: string;
  organisationId?: string | null;
  subjectEmail?: string | null;
  periodStart: string;
  periodEnd: string;
  internalPayloadHash: string;
  clientPayloadHash?: string | null;
  audiencePayloadHashes: Partial<Record<OversightCycleAudience, string>>;
  efficacyGrade: string;
  efficacyScore: number;
  suppressions: Array<{
    section: string;
    reason: string;
    explanation: string;
  }>;
  warnings: string[];
  reviewDecision?: string | null;
  operatorId?: string | null;
  deliveryStatus: string;
  deliveryUrl?: string | null;
  nextCycleIntent?: {
    cadence: string;
    nextCycleRecommendedDate: string;
    reason: string;
  } | null;
  createdAt: string;
  approvedAt?: string | null;
  deliveredAt?: string | null;
};
