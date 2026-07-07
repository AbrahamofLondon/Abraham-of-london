/**
 * lib/fulfilment/reporting/__tests__/monthly-reporting.test.ts
 *
 * Proves the REAL recurring Monthly Reporting service cycle. Delivery is never a
 * flag: it requires a validated real output and a durable DeliveryProof returned
 * by the approved channel and persisted to the store.
 *
 * The directive's ten cases:
 *  1 normal cycle · 2 missing inputs · 3 generation failure + recovery ·
 *  4 validation failure · 5 review not approved · 6 successful delivery ·
 *  7 duplicate delivery · 8 replay/idempotency · 9 missed cycle · 10 continuity
 */

import { describe, it, expect } from "vitest";
import type { DeliveryProof } from "@/lib/fulfilment/fulfilment-execution-authority";
import {
  REPORTING_MONTHLY_PRODUCT_CODE,
  createInMemoryCycleStore,
  buildMonthlyReportOutput,
  openCycle,
  generateCycleOutput,
  validateCycleOutput,
  approveCycle,
  deliverCycle,
  archiveAndContinue,
  resumeCycle,
} from "../monthly-reporting-service";
import { detectMissedCycles } from "../recurring-cycle";
import type { ReportGenerator, ReportingCycleInputs } from "../reporting-cycle-types";

const CODE = REPORTING_MONTHLY_PRODUCT_CODE;
const INPUTS: ReportingCycleInputs = {
  requiredSources: ["ops_metrics", "finance_summary"],
  resolvedSources: ["ops_metrics", "finance_summary"],
};

function recordingDeliverer(records: DeliveryProof[]) {
  return async (cycle: any, output: any): Promise<DeliveryProof> => {
    const proof: DeliveryProof = {
      productCode: cycle.productCode,
      deliveryClass: "digital_report" as unknown as DeliveryProof["deliveryClass"],
      sourceId: cycle.cycleId,
      customerEmail: "client@example.com",
      deliveryMechanism: "email",
      proofEvidence: `email-send:${output.contentHash}`,
      deliveredAt: new Date().toISOString(),
      independentlyVerifiable: true,
      customerConfirmed: false,
    };
    records.push(proof);
    return proof;
  };
}

const throwingDeliverer = async (): Promise<DeliveryProof> => {
  throw new Error("smtp unavailable");
};

async function driveToApproved(store: any, period = "2026-01-01") {
  await openCycle(store, CODE, period, INPUTS);
  const id = `${CODE}:${period.slice(0, 7)}`;
  await generateCycleOutput(store, id, buildMonthlyReportOutput);
  await validateCycleOutput(store, id);
  await approveCycle(store, id, "reviewer@abrahamoflondon.org");
  return id;
}

describe("monthly reporting — recurring service cycle", () => {
  it("1. normal cycle: due → generate → validate → review → deliver → durable proof", async () => {
    const store = createInMemoryCycleStore();
    const records: DeliveryProof[] = [];
    const id = await driveToApproved(store);
    const { cycle, proof } = await deliverCycle(store, id, recordingDeliverer(records));

    expect(cycle.state).toBe("DELIVERED");
    // real output exists
    expect(cycle.output?.sections.some((s) => s.body.length > 0)).toBe(true);
    expect(cycle.output?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    // durable proof persisted to the store (not just returned)
    const persisted = await store.get(id);
    expect(persisted?.deliveryProof?.proofEvidence).toBe(proof?.proofEvidence);
    expect(persisted?.deliveryProof?.proofEvidence).toContain(cycle.output?.contentHash);
  });

  it("2. missing inputs: cycle sits in MISSING_INPUTS and generation is gated", async () => {
    const store = createInMemoryCycleStore();
    const partial: ReportingCycleInputs = { requiredSources: ["ops_metrics", "finance_summary"], resolvedSources: ["ops_metrics"] };
    await openCycle(store, CODE, "2026-02-01", partial);
    const id = `${CODE}:2026-02`;
    expect((await store.get(id))?.state).toBe("MISSING_INPUTS");
    await generateCycleOutput(store, id, buildMonthlyReportOutput);
    const c = await store.get(id);
    expect(c?.state).toBe("MISSING_INPUTS"); // gated
    expect(c?.output).toBeNull();
  });

  it("3. generation failure then recovery", async () => {
    const store = createInMemoryCycleStore();
    await openCycle(store, CODE, "2026-03-01", INPUTS);
    const id = `${CODE}:2026-03`;
    const failing: ReportGenerator = async () => { throw new Error("upstream data pull failed"); };
    await generateCycleOutput(store, id, failing);
    expect((await store.get(id))?.state).toBe("GENERATION_FAILED");
    // recover with the real generator
    await resumeCycle(store, id, { generator: buildMonthlyReportOutput, deliverer: throwingDeliverer });
    const c = await store.get(id);
    expect(["OUTPUT_GENERATED", "AWAITING_REVIEW"]).toContain(c?.state);
    expect(c?.output).not.toBeNull();
    expect(c?.attempts.generation).toBe(2);
  });

  it("4. validation failure closes the delivery gate", async () => {
    const store = createInMemoryCycleStore();
    await openCycle(store, CODE, "2026-04-01", INPUTS);
    const id = `${CODE}:2026-04`;
    // generator that omits required disclosures → invalid output
    const weak: ReportGenerator = async (cycle) => ({
      reportCode: `${CODE}:${cycle.periodLabel}`,
      outputType: "monthly_report",
      periodLabel: cycle.periodLabel,
      sections: [{ heading: "x", body: "y" }],
      disclosures: [], // missing required disclosures
      boundaryNotice: "This report is a delivery and interpretation artifact. It is not itself authority-granting evidence.",
      contentHash: "deadbeef",
    });
    await generateCycleOutput(store, id, weak);
    await validateCycleOutput(store, id);
    const c = await store.get(id);
    expect(c?.state).toBe("VALIDATION_FAILED");
    expect(c?.validation?.errors.some((e) => e.includes("disclosure"))).toBe(true);
    // delivery gate closed
    const { proof, alreadyDelivered } = await deliverCycle(store, id, recordingDeliverer([]));
    expect(proof).toBeNull();
    expect(alreadyDelivered).toBe(false);
  });

  it("5. review not yet approved blocks delivery", async () => {
    const store = createInMemoryCycleStore();
    await openCycle(store, CODE, "2026-05-01", INPUTS);
    const id = `${CODE}:2026-05`;
    await generateCycleOutput(store, id, buildMonthlyReportOutput);
    await validateCycleOutput(store, id);
    expect((await store.get(id))?.state).toBe("AWAITING_REVIEW");
    const records: DeliveryProof[] = [];
    const { proof } = await deliverCycle(store, id, recordingDeliverer(records));
    expect(proof).toBeNull();
    expect(records).toHaveLength(0); // channel never invoked
  });

  it("6. successful delivery writes verifiable durable proof through the approved channel", async () => {
    const store = createInMemoryCycleStore();
    const records: DeliveryProof[] = [];
    const id = await driveToApproved(store, "2026-06-01");
    const { proof } = await deliverCycle(store, id, recordingDeliverer(records));
    expect(records).toHaveLength(1);
    expect(proof?.deliveryMechanism).toBe("email");
    expect(proof?.independentlyVerifiable).toBe(true);
    expect(proof?.sourceId).toBe(id);
  });

  it("7. duplicate delivery attempt does not re-deliver", async () => {
    const store = createInMemoryCycleStore();
    const records: DeliveryProof[] = [];
    const id = await driveToApproved(store, "2026-07-01");
    await deliverCycle(store, id, recordingDeliverer(records));
    const second = await deliverCycle(store, id, recordingDeliverer(records));
    expect(second.alreadyDelivered).toBe(true);
    expect(records).toHaveLength(1); // channel invoked once only
  });

  it("8. replay/idempotency: re-opening a period yields one cycle", async () => {
    const store = createInMemoryCycleStore();
    const a = await openCycle(store, CODE, "2026-08-01", INPUTS);
    const b = await openCycle(store, CODE, "2026-08-01", INPUTS);
    expect(a.cycleId).toBe(b.cycleId);
    const all = await store.list(CODE);
    expect(all).toHaveLength(1);
  });

  it("9. missed cycle is operator-visible", async () => {
    const store = createInMemoryCycleStore();
    await openCycle(store, CODE, "2026-01-01", INPUTS); // opened, never delivered
    const cycles = await store.list(CODE);
    const missed = detectMissedCycles(cycles, new Date("2026-03-15T00:00:00Z"));
    expect(missed.map((c) => c.cycleId)).toContain(`${CODE}:2026-01`);
  });

  it("10. continuity: archiving opens the next month's cycle", async () => {
    const store = createInMemoryCycleStore();
    const records: DeliveryProof[] = [];
    const id = await driveToApproved(store, "2026-09-01");
    await deliverCycle(store, id, recordingDeliverer(records));
    const { archived, next } = await archiveAndContinue(store, id, INPUTS);
    expect(archived.state).toBe("ARCHIVED");
    expect(archived.nextCycleId).toBe(`${CODE}:2026-10`);
    expect(next.cycleId).toBe(`${CODE}:2026-10`);
    expect(next.state).toBe("DUE");
  });
});
