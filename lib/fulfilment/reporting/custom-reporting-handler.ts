/**
 * lib/fulfilment/reporting/custom-reporting-handler.ts
 *
 * PR F FulfilmentHandler adapter for reporting_custom. PR F governs the
 * automatable operations (initiate an engagement, validate output, deliver,
 * inspect, resume); the bespoke human steps (qualify, brief, accept, lock,
 * review, approve, amend) are driven through the engagement service by operators
 * and clients. This plugs into the existing execution authority — no parallel
 * framework.
 */

import {
  type DeliveryResult,
  type FulfilmentContext,
  type FulfilmentHandler,
  type FulfilmentResult,
  type FulfilmentState,
  type OutputValidationResult,
} from "@/lib/fulfilment/fulfilment-execution-authority";
import { getContractByProductCode } from "@/lib/product/product-fulfilment-contract";
import { getAssuranceByProductCode } from "@/lib/product/product-fulfilment-assurance";
import type { CustomEngagementStore, CustomReportDeliverer, CustomReportGenerator } from "./custom-reporting-types";
import {
  REPORTING_CUSTOM_PRODUCT_CODE,
  deliverEngagement,
  openInquiry,
  resumeEngagement,
  validateEngagementOutput,
} from "./custom-reporting-service";

export interface CustomReportingHandlerDeps {
  store: CustomEngagementStore;
  generator: CustomReportGenerator;
  deliverer: CustomReportDeliverer;
}

function engagementIdFromContext(ctx: FulfilmentContext): string {
  return ctx.sourceId?.trim() || ctx.checkoutSessionId?.trim() || `${REPORTING_CUSTOM_PRODUCT_CODE}:${ctx.email ?? "unknown"}`;
}

export function createCustomReportingHandler(deps: CustomReportingHandlerDeps): FulfilmentHandler {
  const { store, generator, deliverer } = deps;

  return {
    productCode: REPORTING_CUSTOM_PRODUCT_CODE,
    deliveryClass: "manual_review_required",

    async initiate(ctx): Promise<FulfilmentResult> {
      const id = engagementIdFromContext(ctx);
      const e = await openInquiry(store, { engagementId: id, clientEmail: ctx.email ?? "unknown", request: "custom reporting inquiry" });
      return { ok: true, state: e.state, nextAction: "qualify_engagement", details: { engagementId: id } };
    },

    async resume(ctx): Promise<FulfilmentResult> {
      const id = engagementIdFromContext(ctx);
      const e = await resumeEngagement(store, id, { generator, deliverer });
      return { ok: e.state !== "GENERATION_FAILED" && e.state !== "DELIVERY_FAILED", state: e.state, details: { engagementId: id } };
    },

    async validateOutput(ctx): Promise<OutputValidationResult> {
      const id = engagementIdFromContext(ctx);
      const e = await validateEngagementOutput(store, id);
      const v = e.validation ?? { ok: false, errors: ["no validation"], warnings: [] };
      return { ok: v.ok, validated: v.ok, errors: v.errors, warnings: v.warnings, humanReviewRequired: true };
    },

    async deliver(ctx): Promise<DeliveryResult> {
      const id = engagementIdFromContext(ctx);
      const { engagement, proof } = await deliverEngagement(store, id, deliverer);
      return {
        ok: engagement.state === "DELIVERED",
        delivered: engagement.state === "DELIVERED",
        deliveryMethod: proof?.deliveryMechanism,
        deliveryProof: proof?.proofEvidence,
        error: engagement.state === "DELIVERED" ? undefined : `Not delivered (state=${engagement.state}); requires FINAL_APPROVED.`,
      };
    },

    async inspect(ctx): Promise<FulfilmentState> {
      const id = engagementIdFromContext(ctx);
      const e = await store.get(id);
      return {
        productCode: REPORTING_CUSTOM_PRODUCT_CODE,
        deliveryClass: "manual_review_required",
        contract: getContractByProductCode(REPORTING_CUSTOM_PRODUCT_CODE) ?? null,
        assurance: getAssuranceByProductCode(REPORTING_CUSTOM_PRODUCT_CODE) ?? null,
        obligationState: e?.state ?? "NONE",
        generationState: e?.output ? "READY" : e?.state === "IN_PRODUCTION" ? "GENERATING" : null,
        outputValidationState: e?.validation ? (e.validation.ok ? "VALIDATED" : "FAILED") : null,
        deliveryState: e?.state === "DELIVERED" || e?.state === "ARCHIVED" ? "delivered" : e?.state === "DELIVERY_FAILED" ? "failed" : null,
        deliveryProofState: e?.deliveryProof ? "recorded" : null,
        blocker:
          e?.state === "MISSING_SOURCES" ? "awaiting_sources"
          : e?.state === "CHANGE_REQUESTED" ? "awaiting_scope_amendment"
          : e?.state === "CLIENT_REVIEW" ? "awaiting_client_approval"
          : e?.state === "INTERNAL_REVIEW" ? "awaiting_internal_review"
          : null,
        nextAction: e?.state === "DELIVERED" ? "archive" : e?.state === "FINAL_APPROVED" ? "deliver" : "advance_engagement",
        retryable: e?.state === "GENERATION_FAILED" || e?.state === "DELIVERY_FAILED",
        customerVisible: e?.state === "DELIVERED" || e?.state === "ARCHIVED" || e?.state === "CLIENT_REVIEW",
        adminVisible: true,
      };
    },
  };
}
