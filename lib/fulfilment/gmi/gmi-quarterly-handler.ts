/**
 * lib/fulfilment/gmi/gmi-quarterly-handler.ts
 *
 * PR F FulfilmentHandler adapter for the gmi_quarterly product family. Delivery
 * is HARD-GATED by the GMI release gate: a draft/unlocked/unauthorised edition
 * cannot be delivered through PR F. Record + context resolvers are injected so the
 * runtime wires the real controls and tests drive synthetic editions.
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
import type { MarketIntelligenceLifecycleRecord } from "@/lib/intelligence/market-intelligence-lifecycle";
import {
  GMI_QUARTERLY_PRODUCT_CODE,
  type GmiDeliveryProof,
  type GmiReleaseContext,
  assertGmiDeliveryAllowed,
  buildGmiDeliveryProof,
  evaluateGmiReleaseGate,
} from "./gmi-quarterly-fulfilment";

export interface GmiQuarterlyHandlerDeps {
  resolveRecord: (editionId: string) => MarketIntelligenceLifecycleRecord | null;
  resolveContext: (editionId: string) => GmiReleaseContext;
  /** delivers the approved artifact to the recipient; returns the durable proof. */
  deliverer: (proof: GmiDeliveryProof) => Promise<void>;
  resolveRecipient?: (ctx: FulfilmentContext) => string;
}

function editionOf(ctx: FulfilmentContext): string {
  return ctx.sourceId?.trim() || "";
}

export function createGmiQuarterlyHandler(deps: GmiQuarterlyHandlerDeps): FulfilmentHandler {
  const { resolveRecord, resolveContext, deliverer, resolveRecipient } = deps;

  return {
    productCode: GMI_QUARTERLY_PRODUCT_CODE,
    deliveryClass: "manual_review_required",

    async initiate(ctx): Promise<FulfilmentResult> {
      const editionId = editionOf(ctx);
      const record = resolveRecord(editionId);
      if (!record) return { ok: false, error: `Unknown GMI edition: ${editionId}` };
      const decision = evaluateGmiReleaseGate(record, resolveContext(editionId));
      return {
        ok: true,
        state: record.lifecycleState,
        nextAction: decision.canDeliver ? "deliver" : decision.canPublish ? "apply_release_transition" : "resolve_release_blockers",
        details: { editionId, blockers: decision.blockers.map((b) => b.code) },
      };
    },

    async resume(ctx): Promise<FulfilmentResult> {
      return this.initiate(ctx);
    },

    async validateOutput(ctx): Promise<OutputValidationResult> {
      const editionId = editionOf(ctx);
      const record = resolveRecord(editionId);
      const context = resolveContext(editionId);
      const decision = record ? evaluateGmiReleaseGate(record, context) : null;
      const errors = decision ? decision.blockers.map((b) => `${b.code}: ${b.detail}`) : ["UNKNOWN_EDITION"];
      return {
        ok: Boolean(decision?.canDeliver),
        validated: Boolean(context.approvedArtifactHash) && errors.length === 0,
        errors,
        warnings: [],
        humanReviewRequired: !context.humanReviewComplete,
      };
    },

    async deliver(ctx): Promise<DeliveryResult> {
      const editionId = editionOf(ctx);
      const record = resolveRecord(editionId);
      if (!record) return { ok: false, delivered: false, error: `Unknown GMI edition: ${editionId}` };
      const context = resolveContext(editionId);
      const approvedHash = context.approvedArtifactHash ?? "";
      const guard = assertGmiDeliveryAllowed(record, context, approvedHash);
      if (!guard.ok) {
        return { ok: false, delivered: false, error: `Delivery blocked: ${guard.blockers.map((b) => b.code).join(", ")}` };
      }
      const proof = buildGmiDeliveryProof(record, context, {
        deliveredArtifactHash: approvedHash,
        accessRecipient: resolveRecipient?.(ctx) ?? ctx.email ?? "unknown",
        deliveryChannel: "governed_access_grant",
      });
      await deliverer(proof);
      return { ok: true, delivered: true, deliveryMethod: proof.deliveryChannel, deliveryProof: `${proof.editionId}@${proof.artifactHash}` };
    },

    async inspect(ctx): Promise<FulfilmentState> {
      const editionId = editionOf(ctx);
      const record = resolveRecord(editionId);
      const context = resolveContext(editionId);
      const decision = record ? evaluateGmiReleaseGate(record, context) : null;
      return {
        productCode: GMI_QUARTERLY_PRODUCT_CODE,
        deliveryClass: "manual_review_required",
        contract: getContractByProductCode(GMI_QUARTERLY_PRODUCT_CODE) ?? null,
        assurance: getAssuranceByProductCode(GMI_QUARTERLY_PRODUCT_CODE) ?? null,
        obligationState: record?.lifecycleState ?? "UNKNOWN_EDITION",
        generationState: context.approvedArtifactHash ? "READY" : null,
        outputValidationState: decision ? (decision.canDeliver ? "VALIDATED" : "GATED") : null,
        deliveryState: null,
        deliveryProofState: null,
        blocker: decision && decision.blockers.length > 0 ? decision.blockers[0]!.code : null,
        nextAction: decision?.canDeliver ? "deliver" : "resolve_release_blockers",
        retryable: false,
        customerVisible: Boolean(decision?.canGrantAccess),
        adminVisible: true,
      };
    },
  };
}
