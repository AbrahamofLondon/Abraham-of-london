/**
 * lib/product/delivery-audit-contract.ts — Delivery record types for oversight artifacts.
 *
 * Delivery records are persisted as AuditEvent rows with objectType "OVERSIGHT_DELIVERY"
 * and the DeliveryRecord fields stored in the metadata JSON column.
 */

export type DeliveryChannel = "PDF_EXPORT" | "EMAIL" | "CLIENT_PORTAL" | "TRANSPORT_PENDING";

export type DeliveryStatus = "QUEUED" | "APPROVED" | "DELIVERED" | "FAILED" | "TRANSPORT_PENDING";

export type DeliveryRecord = {
  id: string;
  artifactType: "OVERSIGHT_BRIEF" | "PROOF_PACK";
  artifactId: string;
  recipientEmail: string;
  recipientRole: string;
  approvedBy: string | null;
  deliveredBy: string | null;
  deliveredAt: string | null;
  deliveryMethod: DeliveryChannel;
  status: DeliveryStatus;
  suppressionSummary: string;
  clientSafe: boolean;
  providerStatus?: "PROVIDER_READY" | "TEST_MODE_READY" | "TRANSPORT_PENDING";
  providerMessageId?: string | null;
  failureReason?: string | null;
  sourceLabel?: string | null;
  evidencePosture?: string | null;
  latestAttemptAt?: string | null;
  attemptCount?: number;
  institutionalCaseId?: string | null;
  createdAt: string;
};
