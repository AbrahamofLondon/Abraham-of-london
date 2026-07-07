/**
 * lib/fulfilment/reporting/__tests__/monthly-reporting-handler.test.ts
 *
 * Proves the Monthly Reporting handler plugs into the EXISTING PR F fulfilment
 * execution authority (not a parallel path): registerHandler + the shared
 * executeFulfilmentOperation route through it, and the recurring cycle advances.
 */

import { describe, it, expect } from "vitest";
import {
  registerHandler,
  executeFulfilmentOperation,
  getHandler,
  type DeliveryProof,
  type DeliveryResult,
  type FulfilmentResult,
} from "@/lib/fulfilment/fulfilment-execution-authority";
import { createMonthlyReportingHandler } from "../monthly-reporting-handler";
import { createInMemoryCycleStore, buildMonthlyReportOutput, REPORTING_MONTHLY_PRODUCT_CODE } from "../monthly-reporting-service";
import type { ReportingCycleInputs } from "../reporting-cycle-types";

const INPUTS: ReportingCycleInputs = { requiredSources: ["ops"], resolvedSources: ["ops"] };

function makeHandler() {
  const records: DeliveryProof[] = [];
  const store = createInMemoryCycleStore();
  const handler = createMonthlyReportingHandler({
    store,
    generator: buildMonthlyReportOutput,
    deliverer: async (cycle, output) => {
      const proof: DeliveryProof = {
        productCode: cycle.productCode,
        deliveryClass: "subscription_retainer_cycle",
        sourceId: cycle.cycleId,
        customerEmail: "c@x.com",
        deliveryMechanism: "email",
        proofEvidence: `email:${output.contentHash}`,
        deliveredAt: new Date().toISOString(),
        independentlyVerifiable: true,
        customerConfirmed: false,
      };
      records.push(proof);
      return proof;
    },
    resolveInputsForPeriod: async () => INPUTS,
    autoApprover: "reviewer@abrahamoflondon.org",
  });
  return { handler, records };
}

describe("monthly reporting handler ↔ PR F authority", () => {
  it("registers and dispatches through executeFulfilmentOperation", async () => {
    const { handler, records } = makeHandler();
    registerHandler(handler);
    expect(getHandler(REPORTING_MONTHLY_PRODUCT_CODE)).toBe(handler);

    const ctx = { productCode: REPORTING_MONTHLY_PRODUCT_CODE, operation: "initiate" as const, sourceId: "2026-01-01" };
    const init = (await executeFulfilmentOperation(ctx)) as FulfilmentResult;
    expect(init.ok).toBe(true);

    const del = (await executeFulfilmentOperation({ ...ctx, operation: "deliver" })) as DeliveryResult;
    expect(del.delivered).toBe(true);
    expect(del.deliveryMethod).toBe("email");
    expect(records).toHaveLength(1);
  });

  it("declares the recurring delivery class", () => {
    const { handler } = makeHandler();
    expect(handler.deliveryClass).toBe("subscription_retainer_cycle");
    expect(handler.productCode).toBe("reporting_monthly");
  });
});
