export type OversightDeliveryStatus =
  | "NOT_READY"
  | "WITHHELD"
  | "OPERATOR_REVIEW_REQUIRED"
  | "APPROVED_FOR_DELIVERY"
  | "CLIENT_VIEW_READY"
  | "DELIVERED"
  | "DELIVERY_FAILED";

export type OversightDeliveryAction =
  | "APPROVE_CLIENT_SAFE_BRIEF"
  | "WITHHOLD_BRIEF"
  | "REQUEST_REVISION"
  | "MARK_CLIENT_VIEW_READY"
  | "MARK_DELIVERED"
  | "RECORD_DELIVERY_FAILURE";

export type OversightDeliveryIntent = {
  state: OversightDeliveryStatus;
  deliveryAllowed: boolean;
  deliveryMethod?: "INTERNAL_PREVIEW" | "EMAIL" | "CLIENT_PORTAL" | "PDF_EXPORT";
  reason: string;
  nextStep: string;
  scheduledFor?: string | null;
};
