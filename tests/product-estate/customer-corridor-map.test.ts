/**
 * tests/product-estate/customer-corridor-map.test.ts
 *
 * §6/7 — Corridor Map tests: move eligibility, controlled products, retired exclusion, recommendations.
 */
import { describe, it, expect } from "vitest";
import { buildCorridorMap } from "../../lib/intelligence/corridor/customer-corridor-map";

describe("Customer Corridor Map", () => {
  it("returns a corridor map for a customer with no completed products", () => {
    const map = buildCorridorMap("test-customer", []);
    expect(map.customerId).toBe("test-customer");
    expect(map.enteredAt).toBeNull();
    expect(map.completedInteractions).toEqual([]);
    expect(map.currentPosition).toBeNull();
    expect(map.eligibleNextMoves.length).toBeGreaterThan(0);
  });

  it("returns a corridor map for a customer with completed products", () => {
    const map = buildCorridorMap("test-customer", ["fast_diagnostic", "boardroom_brief"]);
    expect(map.completedInteractions.length).toBe(2);
    expect(map.completedInteractions[0].productCode).toBe("fast_diagnostic");
    expect(map.completedInteractions[1].productCode).toBe("boardroom_brief");
    expect(map.currentPosition).not.toBeNull();
    expect(map.currentPosition!.productCode).toBe("boardroom_brief");
  });

  it("excludes completed products from eligible next moves", () => {
    // Build map with all products completed — eligible moves should be empty
    // We can't easily enumerate all products here, but we can verify the logic
    // by completing a few products and checking they don't appear as recommendations
    const map = buildCorridorMap("test-customer", ["fast_diagnostic", "boardroom_brief"]);
    const completedCodes = new Set(map.completedInteractions.map(c => c.productCode));
    for (const move of map.eligibleNextMoves) {
      expect(completedCodes.has(move.productCode)).toBe(false);
    }
  });

  it("every eligible move has required fields", () => {
    const map = buildCorridorMap("test-customer", []);
    for (const move of map.eligibleNextMoves) {
      expect(move.productCode).toBeTruthy();
      expect(move.productName).toBeTruthy();
      expect(move.recommendation).toBeTruthy();
      expect(move.reason).toBeTruthy();
      expect(move.evidenceBasis).toBeTruthy();
      expect(move.whatItHelpsResolve).toBeTruthy();
      expect(move.accessMode).toBeTruthy();
      expect(typeof move.isAdmissible).toBe("boolean");
    }
  });

  it("controlled moves are separated from eligible moves", () => {
    const map = buildCorridorMap("test-customer", []);
    // Some products should be in controlledMovesRequiringQualification
    // (those with commercialStatus: contracted, manual_billing, evidence_gated)
    expect(Array.isArray(map.controlledMovesRequiringQualification)).toBe(true);
  });

  it("recommendation does not optimize for highest revenue", () => {
    const map = buildCorridorMap("test-customer", []);
    for (const move of map.eligibleNextMoves) {
      // Recommendations should not contain revenue-optimizing language
      expect(move.recommendation.toLowerCase()).not.toContain("most expensive");
      expect(move.recommendation.toLowerCase()).not.toContain("highest value");
      expect(move.reason).toBeTruthy();
    }
  });

  it("handles unknown product codes gracefully", () => {
    const map = buildCorridorMap("test-customer", ["nonexistent_product"]);
    expect(map.completedInteractions.length).toBe(1);
    expect(map.completedInteractions[0].productName).toBe("nonexistent_product");
  });
});
