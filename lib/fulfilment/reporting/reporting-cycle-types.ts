/**
 * lib/fulfilment/reporting/reporting-cycle-types.ts
 *
 * Recurring reporting cycle vocabulary. This is the layer PR F does not cover:
 * PR F's FulfilmentHandler is per-obligation; a recurring report is a SERIES of
 * obligations on a cadence. This module models one cycle and the store/ports the
 * orchestrator drives. It reuses PR F canonical states and DeliveryProof rather
 * than inventing a parallel fulfilment vocabulary.
 */

import {
  FULFILMENT_STATES,
  type CanonicalFulfilmentState,
  type DeliveryProof,
} from "@/lib/fulfilment/fulfilment-execution-authority";

export type ReportingCadence = "monthly";

/**
 * Cycle lifecycle. Each maps to a canonical PR F fulfilment state so the estate
 * spine sees one vocabulary (see toCanonicalState).
 */
export type ReportingCycleState =
  | "DUE"
  | "MISSING_INPUTS"
  | "GENERATING"
  | "GENERATION_FAILED"
  | "OUTPUT_GENERATED"
  | "VALIDATION_FAILED"
  | "AWAITING_REVIEW"
  | "APPROVED"
  | "DELIVERY_PENDING"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "ARCHIVED";

export function toCanonicalState(state: ReportingCycleState): CanonicalFulfilmentState {
  switch (state) {
    case "DUE":
    case "MISSING_INPUTS":
      return FULFILMENT_STATES.AWAITING_CUSTOMER_INPUT;
    case "GENERATING":
      return FULFILMENT_STATES.IN_PROGRESS;
    case "GENERATION_FAILED":
      return FULFILMENT_STATES.FAILED_RETRYABLE;
    case "OUTPUT_GENERATED":
      return FULFILMENT_STATES.OUTPUT_GENERATED;
    case "VALIDATION_FAILED":
      return FULFILMENT_STATES.MANUAL_REVIEW;
    case "AWAITING_REVIEW":
      return FULFILMENT_STATES.AWAITING_OPERATOR_REVIEW;
    case "APPROVED":
    case "DELIVERY_PENDING":
      return FULFILMENT_STATES.DELIVERY_PENDING;
    case "DELIVERED":
    case "ARCHIVED":
      return FULFILMENT_STATES.DELIVERED;
    case "DELIVERY_FAILED":
      return FULFILMENT_STATES.FAILED_RETRYABLE;
  }
}

/** The generated report artifact (real content — not a "delivered" flag). */
export interface ReportOutput {
  reportCode: string;
  outputType: "monthly_report" | "custom_report";
  periodLabel: string;
  sections: { heading: string; body: string }[];
  disclosures: string[];
  boundaryNotice: string;
  contentHash: string;
}

export interface ReportingCycleInputs {
  /** named data inputs required before generation may begin. */
  requiredSources: string[];
  /** which required sources are actually present this cycle. */
  resolvedSources: string[];
}

export interface CycleValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface CycleReview {
  required: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface ReportingCycle {
  cycleId: string; // `${productCode}:${YYYY-MM}`
  productCode: string;
  cadence: ReportingCadence;
  periodStart: string; // YYYY-MM-01
  periodEnd: string; // YYYY-MM-last
  periodLabel: string; // YYYY-MM
  state: ReportingCycleState;
  inputs: ReportingCycleInputs | null;
  output: ReportOutput | null;
  validation: CycleValidation | null;
  review: CycleReview;
  deliveryProof: DeliveryProof | null;
  attempts: { generation: number; delivery: number };
  createdAt: string;
  updatedAt: string;
  /** set when superseded by the next cycle (continuity). */
  nextCycleId: string | null;
}

/** Ports the orchestrator depends on — injected (in-memory for tests, prisma at runtime). */
export interface ReportingCycleStore {
  get(cycleId: string): Promise<ReportingCycle | null>;
  put(cycle: ReportingCycle): Promise<void>;
  list(productCode: string): Promise<ReportingCycle[]>;
}

/** Generates the real report content for a cycle. May throw (generation failure). */
export type ReportGenerator = (cycle: ReportingCycle) => Promise<ReportOutput>;

/** Delivers the output via an approved channel and returns durable proof. May throw. */
export type ReportDeliverer = (
  cycle: ReportingCycle,
  output: ReportOutput,
) => Promise<DeliveryProof>;
