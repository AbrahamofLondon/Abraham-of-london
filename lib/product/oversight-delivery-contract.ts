export type OversightDeliveryState =
  | "NOT_READY"
  | "READY_FOR_DELIVERY"
  | "DELIVERY_QUEUED"
  | "DELIVERED"
  | "WITHHELD"
  | "ESCALATED";

export type OversightDeliveryIntent = {
  state: OversightDeliveryState;
  deliveryAllowed: boolean;
  deliveryMethod?: "INTERNAL_PREVIEW" | "EMAIL" | "CLIENT_PORTAL" | "PDF_EXPORT";
  reason: string;
  nextStep: string;
  scheduledFor?: string | null;
};
