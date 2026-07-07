/**
 * lib/fulfilment/reporting/__tests__/custom-reporting-handler.test.ts
 *
 * Proves reporting_custom plugs into the EXISTING PR F authority and that its
 * contract is operationally DISTINCT from reporting_monthly (not a relabel).
 */

import { describe, it, expect } from "vitest";
import {
  registerHandler,
  executeFulfilmentOperation,
  getHandler,
  type DeliveryProof,
  type FulfilmentResult,
  type FulfilmentState,
} from "@/lib/fulfilment/fulfilment-execution-authority";
import { getContractByProductCode } from "@/lib/product/product-fulfilment-contract";
import { createCustomReportingHandler } from "../custom-reporting-handler";
import { createInMemoryEngagementStore, buildCustomReportOutput, REPORTING_CUSTOM_PRODUCT_CODE } from "../custom-reporting-service";

function makeHandler() {
  const store = createInMemoryEngagementStore();
  const deliverer = async (e: any, o: any): Promise<DeliveryProof> => ({
    productCode: e.productCode, deliveryClass: "manual_review_required", sourceId: e.engagementId,
    customerEmail: e.client.email, deliveryMechanism: "secure_link", proofEvidence: `link:${o.contentHash}`,
    deliveredAt: new Date().toISOString(), independentlyVerifiable: true, customerConfirmed: false,
  });
  return createCustomReportingHandler({ store, generator: buildCustomReportOutput, deliverer });
}

describe("custom reporting handler ↔ PR F authority", () => {
  it("registers and initiate opens an inquiry (human-driven, not auto-run)", async () => {
    const handler = makeHandler();
    registerHandler(handler);
    expect(getHandler(REPORTING_CUSTOM_PRODUCT_CODE)).toBe(handler);
    const res = (await executeFulfilmentOperation({ productCode: REPORTING_CUSTOM_PRODUCT_CODE, operation: "initiate", sourceId: "eng-1", email: "c@x.com" })) as FulfilmentResult;
    expect(res.ok).toBe(true);
    expect(res.state).toBe("INQUIRY");
    expect(res.nextAction).toBe("qualify_engagement");
  });

  it("inspect reports the engagement state through PR F", async () => {
    const handler = makeHandler();
    registerHandler(handler);
    await executeFulfilmentOperation({ productCode: REPORTING_CUSTOM_PRODUCT_CODE, operation: "initiate", sourceId: "eng-2", email: "c@x.com" });
    const st = (await executeFulfilmentOperation({ productCode: REPORTING_CUSTOM_PRODUCT_CODE, operation: "inspect", sourceId: "eng-2" })) as FulfilmentState;
    expect(st.deliveryClass).toBe("manual_review_required");
    expect(st.obligationState).toBe("INQUIRY");
  });

  it("contract is operationally distinct from reporting_monthly", () => {
    const custom = getContractByProductCode("reporting_custom");
    const monthly = getContractByProductCode("reporting_monthly");
    expect(custom).toBeDefined();
    expect(monthly).toBeDefined();
    // different fulfilment type (bespoke dossier vs recurring cycle)
    expect(custom?.fulfilmentType).toBe("human_reviewed_dossier");
    expect(monthly?.fulfilmentType).toBe("retainer_cycle");
    // notes encode the operating-model distinctions
    expect(custom?.notes).toMatch(/inquiry-driven/);
    expect(custom?.notes).toMatch(/scope lock/);
    expect(custom?.notes).toMatch(/change control/);
    expect(monthly?.notes).toMatch(/recurring/i);
  });
});
