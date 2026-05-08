import type { RetainerTier } from "@/lib/product/retainer-oversight-contract";
import type { OversightDeliveryStatus } from "@/lib/product/oversight-delivery-contract";

export type OversightCadenceFrequency =
  | "MONTHLY"
  | "BIWEEKLY"
  | "WEEKLY";

export type OversightCadenceStatus =
  | "FIRST_CYCLE_PENDING"
  | "ON_TRACK"
  | "REVIEW_DUE"
  | "REVIEW_OVERDUE"
  | "DELIVERY_DUE"
  | "DELIVERY_OVERDUE"
  | "CYCLE_MISSED"
  | "CADENCE_BROKEN"
  | "PAUSED_BY_COUNSEL_ESCALATION"
  | "WAITING_FOR_OPERATOR_REVIEW"
  | "OVERDUE";

export type OversightCadenceHealth =
  | "HEALTHY"
  | "WATCH"
  | "AT_RISK"
  | "BROKEN";

export type OversightCadenceState = {
  status: OversightCadenceStatus;
  health: OversightCadenceHealth;
  frequency: OversightCadenceFrequency;
  currentCycleDueDate?: string;
  nextCycleDueDate?: string;
  reviewOverdue: boolean;
  deliveryOverdue: boolean;
  clientActionRequired?: boolean;
  missedCycleRisk: boolean;
  daysUntilDue?: number;
  basis: string[];
  explanation: string;
};

export type OversightCadenceInput = {
  tier: RetainerTier;
  frequency?: OversightCadenceFrequency;
  now?: Date | string;
  latestArchivedCycle?: {
    periodEnd: string;
    createdAt: string;
    approvedAt?: string | null;
    deliveredAt?: string | null;
    deliveryStatus?: OversightDeliveryStatus | string | null;
  } | null;
  latestDeliveryEvent?: {
    timestamp: string;
    status?: OversightDeliveryStatus | string | null;
  } | null;
  reviewDecision?: {
    createdAt: string;
    decision: string;
  } | null;
  counselOpen?: boolean;
  evidenceInsufficient?: boolean;
};
