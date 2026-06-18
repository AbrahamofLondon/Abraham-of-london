import { describe, expect, it } from "vitest";
import {
  buildProductAuthorityBackboneReport,
  getProductAuthorityEstateProducts,
  resolveUnclassifiedProductBackbone,
} from "@/lib/product/product-qualification-backbone";

const POSITIVE_FULFILMENT_STATES = new Set([
  "ordered",
  "paid",
  "queued",
  "in_review",
  "dossier_generated",
  "delivered",
  "proof_attached",
]);

describe("product authority backbone", () => {
  const report = buildProductAuthorityBackboneReport();
  const products = report.products;

  it("covers the intended 43-product phase 8B estate", () => {
    expect(getProductAuthorityEstateProducts()).toHaveLength(43);
    expect(report.totalProducts).toBe(43);
    expect(products).toHaveLength(43);
  });

  it("gives every product an explicit evidence object", () => {
    for (const product of products) {
      expect(product.evidence.productId).toBe(product.productId);
      expect(product.evidence.productName).toBe(product.productName);
      expect(product.evidence.productFamily).toBe(product.productFamily);
      expect(product.evidence.evidenceState).toBeTruthy();
      expect(product.evidence.blockers).toBeDefined();
      expect(product.evidence.nextRequiredEvidence).toBeDefined();
    }
  });

  it("gives every product explicit qualification states", () => {
    for (const product of products) {
      expect(product.genericAiComparison.state).toBeTruthy();
      expect(product.marketComparison.state).toBeTruthy();
      expect(product.antiToy.state).toBeTruthy();
      expect(product.redTeam.state).toBeTruthy();
      expect(product.v2Revalidation.revalidationStatus).toBeTruthy();
      expect(product.authorityClearance.state).toBeTruthy();
    }
  });

  it("never passes generic-AI comparison with a missing source", () => {
    for (const product of products) {
      if (product.genericAiComparison.state === "passed") {
        expect(product.genericAiComparison.source).not.toBe("missing_source");
        expect(product.genericAiComparison.traceableSources.length).toBeGreaterThan(0);
        expect(product.genericAiComparison.productApplicableEvidence).toBe(true);
      }
    }
  });

  it("never passes market comparison with a missing source", () => {
    for (const product of products) {
      if (product.marketComparison.state === "passed") {
        expect(product.marketComparison.source).not.toBe("missing_source");
        expect(product.marketComparison.traceableSources.length).toBeGreaterThan(0);
        expect(product.marketComparison.productApplicableEvidence).toBe(true);
      }
    }
  });

  it("never passes anti-toy without product-applicable evidence", () => {
    for (const product of products) {
      if (product.antiToy.state === "passed") {
        expect(product.antiToy.applicable).toBe(true);
        expect(product.antiToy.sources.length).toBeGreaterThan(0);
      }
    }
  });

  it("never passes red-team without product-applicable evidence", () => {
    for (const product of products) {
      if (product.redTeam.state === "passed") {
        expect(product.redTeam.applicable).toBe(true);
        expect(product.redTeam.sources.length).toBeGreaterThan(0);
      }
    }
  });

  it("never authority-clears a product with a missing ledger entry", () => {
    for (const product of products) {
      if (!product.evidence.evidenceLedgerEntryExists) {
        expect(product.authorityClearance.state).not.toBe("authority_cleared");
      }
    }
  });

  it("never passes v2 revalidation without recorded evidence", () => {
    for (const product of products) {
      if (product.v2Revalidation.revalidationStatus === "passed") {
        expect(product.v2Revalidation.completedEvidence.length).toBeGreaterThan(0);
        expect(product.v2Revalidation.missingEvidence).toHaveLength(0);
        expect(product.evidence.evidenceLedgerEntryExists).toBe(true);
      }
    }
  });

  it("does not let fulfilment imply authority", () => {
    for (const product of products) {
      const fulfilmentPositive = POSITIVE_FULFILMENT_STATES.has(product.fulfilmentQualification.state);
      const evidenceReady =
        product.evidence.evidenceLedgerEntryExists &&
        product.genericAiComparison.state === "passed" &&
        product.marketComparison.state === "passed" &&
        product.antiToy.state === "passed" &&
        product.redTeam.state === "passed";

      if (fulfilmentPositive && !evidenceReady) {
        expect(product.authorityClearance.state).not.toBe("authority_cleared");
      }
    }
  });

  it("does not let delivery or proof imply validation", () => {
    for (const product of products) {
      const fulfilmentPositive = POSITIVE_FULFILMENT_STATES.has(product.fulfilmentQualification.state);
      const validationEvidenceComplete =
        product.antiToy.state === "passed" &&
        product.redTeam.state === "passed" &&
        product.adapterVerification.validationConstitution.state === "passed" &&
        product.adapterVerification.antiGaming.state === "passed";

      if (fulfilmentPositive && !validationEvidenceComplete) {
        expect(product.validationState).not.toBe("passed");
      }
    }
  });

  it("does not let no-mock authority alone imply full authority", () => {
    const noMockPassed = products.filter((product) => product.noMockAuthority.state === "passed");
    expect(noMockPassed.length).toBeGreaterThan(0);
    expect(
      noMockPassed.some((product) => product.authorityClearance.state !== "authority_cleared"),
    ).toBe(true);
  });

  it("keeps public claim permission at zero unless authority is cleared", () => {
    const publicClaimEnabled = products.filter(
      (product) => product.authorityClearance.publicClaimPermission,
    );
    expect(publicClaimEnabled).toHaveLength(report.summary.authorityCleared);
    for (const product of publicClaimEnabled) {
      expect(product.authorityClearance.state).toBe("authority_cleared");
    }
  });

  it("defaults future products to blocked until classified", () => {
    const product = resolveUnclassifiedProductBackbone("future_authority_product");
    expect(product.evidence.evidenceState).toBe("blocked");
    expect(product.ledger.ledgerStatus).toBe("blocked_until_source");
    expect(product.genericAiComparison.state).toBe("blocked");
    expect(product.marketComparison.state).toBe("blocked");
    expect(product.antiToy.state).toBe("blocked");
    expect(product.redTeam.state).toBe("blocked");
    expect(product.authorityClearance.state).toBe("blocked");
    expect(product.authorityClearance.publicClaimPermission).toBe(false);
  });
});
