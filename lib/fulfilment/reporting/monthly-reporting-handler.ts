/**
 * lib/fulfilment/reporting/monthly-reporting-handler.ts
 *
 * PR F FulfilmentHandler adapter for reporting_monthly. This plugs the recurring
 * cycle service into the existing fulfilment execution authority — it does NOT
 * create a parallel fulfilment path. Dependencies (store/generator/deliverer) are
 * injected so the adapter is testable and the runtime wiring (prisma + email)
 * lives in a thin bootstrap.
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
import { deriveCycleId, monthStart } from "./recurring-cycle";
import { toCanonicalState } from "./reporting-cycle-types";
import type { ReportDeliverer, ReportGenerator, ReportingCycleInputs, ReportingCycleStore } from "./reporting-cycle-types";
import {
  REPORTING_MONTHLY_PRODUCT_CODE,
  approveCycle,
  deliverCycle,
  generateCycleOutput,
  openCycle,
  resumeCycle,
  validateCycleOutput,
} from "./monthly-reporting-service";

export interface MonthlyReportingHandlerDeps {
  store: ReportingCycleStore;
  generator: ReportGenerator;
  deliverer: ReportDeliverer;
  /** resolves the required/resolved input sources for a given period. */
  resolveInputsForPeriod: (periodStart: string) => Promise<ReportingCycleInputs>;
  /** auto-approve reviewer identity, if the deployment auto-approves; else null. */
  autoApprover?: string | null;
}

function cycleIdFromContext(ctx: FulfilmentContext): { cycleId: string; periodStart: string } {
  const raw = ctx.sourceId?.trim();
  if (raw && raw.includes(":")) {
    const periodStart = `${raw.split(":")[1]}-01`;
    return { cycleId: raw, periodStart };
  }
  const periodStart = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw.slice(0, 7)}-01` : monthStart(new Date());
  return { cycleId: deriveCycleId(REPORTING_MONTHLY_PRODUCT_CODE, periodStart), periodStart };
}

export function createMonthlyReportingHandler(deps: MonthlyReportingHandlerDeps): FulfilmentHandler {
  const { store, generator, deliverer, resolveInputsForPeriod, autoApprover = null } = deps;

  return {
    productCode: REPORTING_MONTHLY_PRODUCT_CODE,
    deliveryClass: "subscription_retainer_cycle",

    async initiate(ctx): Promise<FulfilmentResult> {
      const { periodStart, cycleId } = cycleIdFromContext(ctx);
      const inputs = await resolveInputsForPeriod(periodStart);
      const cycle = await openCycle(store, REPORTING_MONTHLY_PRODUCT_CODE, periodStart, inputs);
      if (cycle.state === "MISSING_INPUTS") {
        return { ok: true, state: toCanonicalState(cycle.state), nextAction: "resolve_inputs", details: { cycleId } };
      }
      await generateCycleOutput(store, cycleId, generator);
      const validated = await validateCycleOutput(store, cycleId);
      return {
        ok: validated.state !== "GENERATION_FAILED" && validated.state !== "VALIDATION_FAILED",
        state: toCanonicalState(validated.state),
        nextAction: validated.state === "AWAITING_REVIEW" ? "human_review" : validated.state === "APPROVED" ? "deliver" : "resume",
        details: { cycleId },
      };
    },

    async resume(ctx): Promise<FulfilmentResult> {
      const { cycleId } = cycleIdFromContext(ctx);
      const c = await resumeCycle(store, cycleId, { generator, deliverer });
      return { ok: c.state !== "GENERATION_FAILED" && c.state !== "DELIVERY_FAILED", state: toCanonicalState(c.state), details: { cycleId } };
    },

    async validateOutput(ctx): Promise<OutputValidationResult> {
      const { cycleId } = cycleIdFromContext(ctx);
      const c = await validateCycleOutput(store, cycleId);
      const v = c.validation ?? { ok: false, errors: ["no validation"], warnings: [] };
      return {
        ok: v.ok,
        validated: v.ok,
        errors: v.errors,
        warnings: v.warnings,
        humanReviewRequired: c.review.required && c.review.approvedAt === null,
      };
    },

    async deliver(ctx): Promise<DeliveryResult> {
      const { cycleId } = cycleIdFromContext(ctx);
      // If review is required and pending, an auto-approver may release it; else gate holds.
      const current = await store.get(cycleId);
      if (current?.state === "AWAITING_REVIEW" && autoApprover) {
        await approveCycle(store, cycleId, autoApprover);
      }
      const { cycle, proof, alreadyDelivered } = await deliverCycle(store, cycleId, deliverer);
      return {
        ok: cycle.state === "DELIVERED",
        delivered: cycle.state === "DELIVERED",
        deliveryMethod: proof?.deliveryMechanism,
        deliveryProof: proof?.proofEvidence,
        error: cycle.state === "DELIVERED" || alreadyDelivered ? undefined : `Not delivered (state=${cycle.state}).`,
      };
    },

    async inspect(ctx): Promise<FulfilmentState> {
      const { cycleId } = cycleIdFromContext(ctx);
      const c = await store.get(cycleId);
      const contract = getContractByProductCode(REPORTING_MONTHLY_PRODUCT_CODE) ?? null;
      const assurance = getAssuranceByProductCode(REPORTING_MONTHLY_PRODUCT_CODE) ?? null;
      return {
        productCode: REPORTING_MONTHLY_PRODUCT_CODE,
        deliveryClass: "subscription_retainer_cycle",
        contract,
        assurance,
        obligationState: c?.state ?? "NONE",
        generationState: c?.output ? "READY" : c?.state === "GENERATING" ? "GENERATING" : null,
        outputValidationState: c?.validation ? (c.validation.ok ? "VALIDATED" : "FAILED") : null,
        deliveryState: c?.state === "DELIVERED" || c?.state === "ARCHIVED" ? "delivered" : c?.state === "DELIVERY_FAILED" ? "failed" : null,
        deliveryProofState: c?.deliveryProof ? "recorded" : null,
        blocker: c?.state === "MISSING_INPUTS" ? "awaiting_inputs" : c?.state === "AWAITING_REVIEW" ? "awaiting_review" : null,
        nextAction: c?.state === "DELIVERED" ? "archive_and_continue" : c?.state === "AWAITING_REVIEW" ? "approve" : "advance",
        retryable: c?.state === "GENERATION_FAILED" || c?.state === "DELIVERY_FAILED",
        customerVisible: c?.state === "DELIVERED" || c?.state === "ARCHIVED",
        adminVisible: true,
      };
    },
  };
}
