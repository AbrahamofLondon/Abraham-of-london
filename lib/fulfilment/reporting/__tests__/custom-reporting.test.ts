/**
 * lib/fulfilment/reporting/__tests__/custom-reporting.test.ts
 *
 * Proves the Custom Reporting ENGAGEMENT lifecycle — a genuinely distinct model
 * from Monthly Reporting (inquiry trigger, negotiated + locked scope, client
 * review loop, included revisions vs out-of-scope change control with scope
 * versioning, completion on final approval). Delivery requires a validated real
 * output + durable proof through the channel.
 */

import { describe, it, expect } from "vitest";
import type { DeliveryProof } from "@/lib/fulfilment/fulfilment-execution-authority";
import {
  REPORTING_CUSTOM_PRODUCT_CODE,
  createInMemoryEngagementStore,
  buildCustomReportOutput,
  openInquiry,
  qualifyEngagement,
  draftBrief,
  acceptBrief,
  lockScope,
  provideSources,
  startProduction,
  validateEngagementOutput,
  internalReview,
  requestIncludedRevision,
  applyRevision,
  raiseChangeRequest,
  amendScope,
  finalApprove,
  deliverEngagement,
  archiveEngagement,
  resumeEngagement,
} from "../custom-reporting-service";
import type { CustomEngagementStore, CustomReportGenerator } from "../custom-reporting-types";

const CODE = REPORTING_CUSTOM_PRODUCT_CODE;
const BRIEF = { draft: "Map tariff exposure across supplier nodes.", deliverable: "Tariff exposure map", requiredSources: ["trade_data", "supplier_list"] };

function recordingDeliverer(records: DeliveryProof[]) {
  return async (e: any, output: any): Promise<DeliveryProof> => {
    const proof: DeliveryProof = {
      productCode: e.productCode,
      deliveryClass: "manual_review_required" as unknown as DeliveryProof["deliveryClass"],
      sourceId: e.engagementId,
      customerEmail: e.client.email,
      deliveryMechanism: "secure_link",
      proofEvidence: `secure-link:${output.contentHash}`,
      deliveredAt: new Date().toISOString(),
      independentlyVerifiable: true,
      customerConfirmed: false,
    };
    records.push(proof);
    return proof;
  };
}
const throwingDeliverer = async (): Promise<DeliveryProof> => { throw new Error("secure link service down"); };

async function driveToClientReview(store: CustomEngagementStore, id: string) {
  await openInquiry(store, { engagementId: id, clientEmail: "c@x.com", clientOrg: "Acme", request: "bespoke" });
  await qualifyEngagement(store, id, { qualified: true, reason: "in remit" });
  await draftBrief(store, id, BRIEF);
  await acceptBrief(store, id);
  await lockScope(store, id);
  await provideSources(store, id, ["trade_data", "supplier_list"]);
  await startProduction(store, id, buildCustomReportOutput);
  await validateEngagementOutput(store, id);
  await internalReview(store, id, "analyst@abrahamoflondon.org");
}

describe("custom reporting — engagement lifecycle", () => {
  it("1. valid qualified engagement", async () => {
    const store = createInMemoryEngagementStore();
    await openInquiry(store, { engagementId: "e1", clientEmail: "c@x.com", request: "x" });
    const e = await qualifyEngagement(store, "e1", { qualified: true, reason: "fits remit" });
    expect(e.state).toBe("QUALIFIED");
  });

  it("2. unqualified engagement is rejected and cannot progress", async () => {
    const store = createInMemoryEngagementStore();
    await openInquiry(store, { engagementId: "e2", clientEmail: "c@x.com", request: "x" });
    await qualifyEngagement(store, "e2", { qualified: false, reason: "out of remit" });
    const afterDraft = await draftBrief(store, "e2", BRIEF);
    expect(afterDraft.state).toBe("REJECTED");
    expect(afterDraft.brief.draft).toBeNull();
  });

  it("3. brief not accepted blocks scope lock", async () => {
    const store = createInMemoryEngagementStore();
    await openInquiry(store, { engagementId: "e3", clientEmail: "c@x.com", request: "x" });
    await qualifyEngagement(store, "e3", { qualified: true, reason: "ok" });
    await draftBrief(store, "e3", BRIEF);
    const e = await lockScope(store, "e3"); // not accepted yet
    expect(e.state).toBe("BRIEF_DRAFTED");
    expect(e.scope.locked).toBe(false);
  });

  it("4. scope lock enforced: cannot provide sources before lock", async () => {
    const store = createInMemoryEngagementStore();
    await openInquiry(store, { engagementId: "e4", clientEmail: "c@x.com", request: "x" });
    await qualifyEngagement(store, "e4", { qualified: true, reason: "ok" });
    await draftBrief(store, "e4", BRIEF);
    await acceptBrief(store, "e4");
    await expect(provideSources(store, "e4", ["trade_data"])).rejects.toThrow(/scope lock/i);
    const locked = await lockScope(store, "e4");
    expect(locked.state).toBe("SCOPE_LOCKED");
    expect(locked.scope.version).toBe(1);
  });

  it("5. missing required sources gates production", async () => {
    const store = createInMemoryEngagementStore();
    await openInquiry(store, { engagementId: "e5", clientEmail: "c@x.com", request: "x" });
    await qualifyEngagement(store, "e5", { qualified: true, reason: "ok" });
    await draftBrief(store, "e5", BRIEF);
    await acceptBrief(store, "e5");
    await lockScope(store, "e5");
    const partial = await provideSources(store, "e5", ["trade_data"]); // missing supplier_list
    expect(partial.state).toBe("MISSING_SOURCES");
    const afterProd = await startProduction(store, "e5", buildCustomReportOutput);
    expect(afterProd.state).toBe("MISSING_SOURCES"); // gated
    expect(afterProd.output).toBeNull();
  });

  it("6. generation failure then recovery", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e6";
    await openInquiry(store, { engagementId: id, clientEmail: "c@x.com", request: "x" });
    await qualifyEngagement(store, id, { qualified: true, reason: "ok" });
    await draftBrief(store, id, BRIEF);
    await acceptBrief(store, id);
    await lockScope(store, id);
    await provideSources(store, id, ["trade_data", "supplier_list"]);
    const failing: CustomReportGenerator = async () => { throw new Error("model timeout"); };
    await startProduction(store, id, failing);
    expect((await store.get(id))?.state).toBe("GENERATION_FAILED");
    await resumeEngagement(store, id, { generator: buildCustomReportOutput, deliverer: throwingDeliverer });
    const e = await store.get(id);
    expect(e?.state).toBe("INTERNAL_REVIEW");
    expect(e?.attempts.generation).toBe(2);
  });

  it("7. validation failure closes the gate", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e7";
    await openInquiry(store, { engagementId: id, clientEmail: "c@x.com", request: "x" });
    await qualifyEngagement(store, id, { qualified: true, reason: "ok" });
    await draftBrief(store, id, BRIEF);
    await acceptBrief(store, id);
    await lockScope(store, id);
    await provideSources(store, id, ["trade_data", "supplier_list"]);
    const weak: CustomReportGenerator = async (e) => ({
      reportCode: "x", outputType: "custom_report", periodLabel: "v1",
      sections: [{ heading: "misc", body: "y" }], disclosures: [],
      boundaryNotice: "This report is a delivery and interpretation artifact. It is not itself authority-granting evidence.",
      contentHash: "abc",
    });
    await startProduction(store, id, weak);
    const e = await validateEngagementOutput(store, id);
    expect(e.state).toBe("VALIDATION_FAILED");
    expect(e.validation?.errors.some((x) => x.includes("disclosure") || x.includes("deliverable"))).toBe(true);
  });

  it("8. human review gate blocks delivery until final approval", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e8";
    await driveToClientReview(store, id);
    expect((await store.get(id))?.state).toBe("CLIENT_REVIEW");
    const records: DeliveryProof[] = [];
    const blocked = await deliverEngagement(store, id, recordingDeliverer(records));
    expect(blocked.proof).toBeNull();
    expect(records).toHaveLength(0);
  });

  it("9. included revision consumes allowance and re-produces within scope", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e9";
    await driveToClientReview(store, id);
    const { accepted } = await requestIncludedRevision(store, id);
    expect(accepted).toBe(true);
    expect((await store.get(id))?.state).toBe("REVISION_IN_PROGRESS");
    const e = await applyRevision(store, id, buildCustomReportOutput);
    expect(e.state).toBe("INTERNAL_REVIEW");
    expect(e.revisions.includedUsed).toBe(1);
    expect(e.scope.version).toBe(1); // same locked scope
  });

  it("10. out-of-scope change request", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e10";
    await driveToClientReview(store, id);
    const e = await raiseChangeRequest(store, id, "Add competitor benchmarking (new scope)");
    expect(e.state).toBe("CHANGE_REQUESTED");
    expect(e.changeRequests).toHaveLength(1);
    expect(e.changeRequests[0]?.inScope).toBe(false);
  });

  it("11. scope amendment bumps version and resolves the change request", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e11";
    await driveToClientReview(store, id);
    await raiseChangeRequest(store, id, "Add competitor benchmarking");
    const e = await amendScope(store, id, { deliverable: "Tariff exposure map + competitor benchmark", addSources: ["competitor_data"], reason: "client change request" });
    expect(e.scope.version).toBe(2);
    expect(e.scopeHistory).toHaveLength(2);
    expect(e.changeRequests[0]?.resolvedByAmendmentVersion).toBe(2);
    expect(e.state).toBe("MISSING_SOURCES"); // new source not yet provided
  });

  it("12. successful final delivery writes durable proof", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e12";
    await driveToClientReview(store, id);
    await finalApprove(store, id, "principal@abrahamoflondon.org");
    const records: DeliveryProof[] = [];
    const { engagement, proof } = await deliverEngagement(store, id, recordingDeliverer(records));
    expect(engagement.state).toBe("DELIVERED");
    expect(proof?.deliveryMechanism).toBe("secure_link");
    const persisted = await store.get(id);
    expect(persisted?.deliveryProof?.proofEvidence).toContain(engagement.output?.contentHash);
  });

  it("13. duplicate delivery does not re-deliver", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e13";
    await driveToClientReview(store, id);
    await finalApprove(store, id, "p@x.com");
    const records: DeliveryProof[] = [];
    await deliverEngagement(store, id, recordingDeliverer(records));
    const second = await deliverEngagement(store, id, recordingDeliverer(records));
    expect(second.alreadyDelivered).toBe(true);
    expect(records).toHaveLength(1);
  });

  it("14. replay/idempotency: re-opening an inquiry yields one engagement", async () => {
    const store = createInMemoryEngagementStore();
    const a = await openInquiry(store, { engagementId: "e14", clientEmail: "c@x.com", request: "x" });
    const b = await openInquiry(store, { engagementId: "e14", clientEmail: "c@x.com", request: "x" });
    expect(a.engagementId).toBe(b.engagementId);
    expect(await store.list()).toHaveLength(1);
  });

  it("15. archive and retrieval", async () => {
    const store = createInMemoryEngagementStore();
    const id = "e15";
    await driveToClientReview(store, id);
    await finalApprove(store, id, "p@x.com");
    await deliverEngagement(store, id, recordingDeliverer([]));
    const archived = await archiveEngagement(store, id);
    expect(archived.state).toBe("ARCHIVED");
    const all = await store.list();
    expect(all.find((e) => e.engagementId === id)?.state).toBe("ARCHIVED");
    expect(all.find((e) => e.engagementId === id)?.productCode).toBe(CODE);
  });
});
