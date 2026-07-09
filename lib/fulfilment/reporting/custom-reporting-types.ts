/**
 * lib/fulfilment/reporting/custom-reporting-types.ts
 *
 * Custom Reporting is a bespoke ENGAGEMENT, not a recurring cycle. It is
 * inquiry-triggered (not cadence-triggered), its scope is NEGOTIATED and LOCKED
 * (not standard), its inputs are engagement-specific, it has a CLIENT review loop
 * and revision/change-control with scope VERSIONING, and it completes on final
 * approval of an agreed deliverable (not on a period boundary).
 *
 * It reuses PR F (DeliveryProof, canonical states) and the shared ReportOutput /
 * CycleValidation types — it does NOT fork a separate fulfilment framework.
 */

import type { DeliveryProof } from "@/lib/fulfilment/fulfilment-execution-authority";
import type { CycleValidation, ReportOutput } from "./reporting-cycle-types";

export type { CycleValidation, ReportOutput };

/** Engagement lifecycle — distinct from the recurring cycle states. */
export type CustomEngagementState =
  | "INQUIRY"
  | "QUALIFIED"
  | "REJECTED"
  | "BRIEF_DRAFTED"
  | "BRIEF_ACCEPTED"
  | "SCOPE_LOCKED"
  | "MISSING_SOURCES"
  | "IN_PRODUCTION"
  | "GENERATION_FAILED"
  | "OUTPUT_GENERATED"
  | "VALIDATION_FAILED"
  | "INTERNAL_REVIEW"
  | "CLIENT_REVIEW"
  | "REVISION_IN_PROGRESS"
  | "CHANGE_REQUESTED"
  | "FINAL_APPROVED"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "ARCHIVED";

export interface EngagementScope {
  locked: boolean;
  lockedAt: string | null;
  /** monotonic scope version; increments on amendment. */
  version: number;
  deliverable: string;
  requiredSources: string[];
}

export interface ScopeVersionRecord {
  version: number;
  deliverable: string;
  requiredSources: string[];
  lockedAt: string;
  reason: string;
}

export interface ChangeRequest {
  id: string;
  description: string;
  /** false = out of locked scope (requires amendment). */
  inScope: boolean;
  resolvedByAmendmentVersion: number | null;
  createdAt: string;
}

export interface RevisionPolicy {
  /** number of in-scope revisions included in the engagement. */
  includedAllowance: number;
  includedUsed: number;
}

export interface CustomEngagement {
  engagementId: string;
  productCode: "reporting_custom";
  client: { email: string; org: string | null };
  state: CustomEngagementState;
  qualification: { qualified: boolean | null; reason: string | null };
  brief: { draft: string | null; accepted: boolean; acceptedAt: string | null };
  scope: EngagementScope;
  scopeHistory: ScopeVersionRecord[];
  resolvedSources: string[];
  output: ReportOutput | null;
  validation: CycleValidation | null;
  review: { internalApprovedBy: string | null; clientApprovedAt: string | null; finalApprovedBy: string | null };
  revisions: RevisionPolicy;
  changeRequests: ChangeRequest[];
  deliveryProof: DeliveryProof | null;
  attempts: { generation: number; delivery: number };
  createdAt: string;
  updatedAt: string;
}

export interface CustomEngagementStore {
  get(id: string): Promise<CustomEngagement | null>;
  put(e: CustomEngagement): Promise<void>;
  list(): Promise<CustomEngagement[]>;
}

export type CustomReportGenerator = (e: CustomEngagement) => Promise<ReportOutput>;
export type CustomReportDeliverer = (e: CustomEngagement, output: ReportOutput) => Promise<DeliveryProof>;

export interface InquiryInput {
  engagementId: string;
  clientEmail: string;
  clientOrg?: string | null;
  request: string;
}

export interface BriefInput {
  draft: string;
  deliverable: string;
  requiredSources: string[];
}
