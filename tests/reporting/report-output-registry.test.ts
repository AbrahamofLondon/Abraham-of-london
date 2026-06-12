import { describe, expect, it } from "vitest";
import { PRODUCT_FULFILMENT_CONTRACTS } from "@/lib/product/product-fulfilment-contract";
import {
  REPORT_OUTPUT_REGISTRY,
  isReportOutputSellable,
  paidProductCodesMissingReportOutput,
} from "@/lib/reporting/report-output-registry";

describe("report output registry", () => {
  it("declares arrival implementation for all paid report outputs", () => {
    const paid = REPORT_OUTPUT_REGISTRY.filter((entry) => entry.reportStandardTier !== "free");

    expect(paid.length).toBeGreaterThan(0);
    expect(paid.every((entry) => entry.arrivalImplemented)).toBe(true);
  });

  it("does not use boardroom or sealed variants for free report outputs", () => {
    const free = REPORT_OUTPUT_REGISTRY.filter((entry) => entry.reportStandardTier === "free");

    expect(free.every((entry) => ["signal", "brief"].includes(entry.arrivalVariant))).toBe(true);
  });

  it("blocks paid report output sellability when arrival is not implemented", () => {
    expect(isReportOutputSellable({ reportStandardTier: "boardroom", arrivalImplemented: false })).toBe(false);
    expect(isReportOutputSellable({ reportStandardTier: "paid", arrivalImplemented: true })).toBe(true);
    expect(isReportOutputSellable({ reportStandardTier: "free", arrivalImplemented: false })).toBe(true);
  });

  it("covers sellable or proof-ready paid products with at least one report output entry", () => {
    const missing = paidProductCodesMissingReportOutput();
    const relevantContracts = PRODUCT_FULFILMENT_CONTRACTS.filter(
      (contract) =>
        contract.readinessStatus !== "not_applicable" &&
        contract.commercialStatus !== "free_controlled" &&
        contract.commercialStatus !== "inactive",
    );

    expect(relevantContracts.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it("declares mandatory arrival fields for every output", () => {
    for (const entry of REPORT_OUTPUT_REGISTRY) {
      expect(entry.standard.arrival.hasPreLoadScreen).toBe(true);
      expect(typeof entry.standard.arrival.hasIdentityMoment).toBe("boolean");
      expect(typeof entry.standard.arrival.hasWeightStatement).toBe("boolean");
      expect(entry.standard.reportCode).toBe(entry.reportCode);
    }
  });

  it("sets the Boardroom dossier to boardroom-grade authority requirements", () => {
    const boardroom = REPORT_OUTPUT_REGISTRY.find((entry) => entry.reportCode === "boardroom_dossier");

    expect(boardroom?.arrivalVariant).toBe("transmission");
    expect(boardroom?.standard.requiresForensicLayer).toBe(true);
    expect(boardroom?.standard.requiresProvenanceHash).toBe(true);
    expect(boardroom?.standard.visualStandard).toBe("boardroom-grade");
  });
});
