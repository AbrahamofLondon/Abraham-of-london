/**
 * tests/product-estate/governance-trust-centre.test.ts
 *
 * §17/18 — Trust Centre and Governance Receipt tests.
 */
import { describe, it, expect } from "vitest";
import { getEstateGovernanceSummary, getProductGovernanceCard, getGovernanceReceipt, getAllProductGovernanceCards, getAllGovernanceReceipts, verifyGovernanceReceipt } from "../../lib/governance/trust-centre/governance-trust-centre";

describe("Governance Trust Centre", () => {
  it("getEstateGovernanceSummary returns all required fields", () => {
    const summary = getEstateGovernanceSummary();
    expect(summary.commercialAuthorityModel).toBeTruthy();
    expect(summary.failClosedPrinciples.length).toBeGreaterThan(0);
    expect(summary.evidencePosture).toBeTruthy();
    expect(summary.humanReviewPhilosophy).toBeTruthy();
    expect(summary.releaseGovernance).toBeTruthy();
    expect(summary.correctionPolicy).toBeTruthy();
    expect(summary.falsificationPolicy).toBeTruthy();
    expect(summary.provenanceStatement).toBeTruthy();
    expect(summary.deletionExportPrinciples.length).toBeGreaterThan(0);
  });

  it("getProductGovernanceCard returns card for known product", () => {
    const card = getProductGovernanceCard("boardroom_brief");
    expect(card).not.toBeNull();
    expect(card!.productCode).toBe("boardroom_brief");
    expect(card!.productName).toBeTruthy();
    expect(card!.displayState).toBeTruthy();
    expect(card!.checkoutGovernance).toBeTruthy();
  });

  it("getProductGovernanceCard returns null for unknown product", () => {
    const card = getProductGovernanceCard("nonexistent_product");
    expect(card).toBeNull();
  });

  it("getGovernanceReceipt returns receipt for known product", () => {
    const receipt = getGovernanceReceipt("boardroom_brief");
    expect(receipt).not.toBeNull();
    expect(receipt!.productCode).toBe("boardroom_brief");
    expect(receipt!.commercialStatus).toBeTruthy();
    expect(receipt!.lastVerifiedTimestamp).toBeTruthy();
    expect(receipt!.receiptHash).toBeTruthy();
  });

  it("getAllProductGovernanceCards returns cards for all catalog products", () => {
    const cards = getAllProductGovernanceCards();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.productCode).toBeTruthy();
      expect(card.productName).toBeTruthy();
    }
  });

  it("getAllGovernanceReceipts returns receipts for all catalog products", () => {
    const receipts = getAllGovernanceReceipts();
    expect(receipts.length).toBeGreaterThan(0);
    expect(receipts.length).toBe(getAllProductGovernanceCards().length);
  });

  it("Governance Receipt verification detects tampering", () => {
    const receipt = getGovernanceReceipt("boardroom_brief");
    expect(receipt).not.toBeNull();
    // Original receipt verifies
    expect(verifyGovernanceReceipt(receipt!)).toBe(true);
    // Tampered receipt fails
    const tampered = { ...receipt!, productName: "Tampered Name" };
    expect(verifyGovernanceReceipt(tampered)).toBe(false);
  });

  it("displayState is one of the valid states", () => {
    const card = getProductGovernanceCard("boardroom_brief");
    expect(card).not.toBeNull();
    const validStates = ["GOVERNANCE_VERIFIED", "CONTROLLED_BY_DESIGN", "EVIDENCE_PENDING", "RELEASE_GATED", "INACTIVE", "RETIRED", "INTERNAL_ONLY"];
    expect(validStates).toContain(card!.displayState);
  });
});