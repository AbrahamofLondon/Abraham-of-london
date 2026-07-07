/**
 * tests/product-estate/customer-corridor-map.test.ts
 *
 * §6/7 — Corridor Map tests: twin-derived state, evidence basis, move eligibility.
 */
import { describe, it, expect } from "vitest";
import { buildCorridorMap } from "../../lib/intelligence/corridor/customer-corridor-map";

const emptyTwin = { currentDecisionPressure: "low", dominantContradictions: [], activeEvidenceGaps: [], unresolvedCommitments: [], repeatedPatterns: [], currentInterventionReadiness: "not_ready", completedProductCodes: [] };
const populatedTwin = { currentDecisionPressure: "high", dominantContradictions: ["Strategy misalignment"], activeEvidenceGaps: ["Market data insufficient"], unresolvedCommitments: ["Review quarterly"], repeatedPatterns: ["Delayed decisions"], currentInterventionReadiness: "intervention_ready", completedProductCodes: ["fast_diagnostic", "boardroom_brief"] };

describe("Customer Corridor Map", () => {
  it("returns a corridor map for a customer with no twin history", () => {
    const map = buildCorridorMap("test-customer", emptyTwin);
    expect(map.customerId).toBe("test-customer");
    expect(map.currentPosition).toBeNull();
    expect(map.admissibleNextMoves.length).toBeGreaterThan(0);
  });

  it("returns a corridor map for a customer with completed products", () => {
    const map = buildCorridorMap("test-customer", populatedTwin);
    expect(map.completedMilestones.length).toBe(2);
    expect(map.completedMilestones[0]).toBe("fast_diagnostic");
    expect(map.currentPosition).toBe("boardroom_brief");
  });

  it("excludes completed products from admissible next moves", () => {
    const map = buildCorridorMap("test-customer", populatedTwin);
    const completedCodes = new Set(populatedTwin.completedProductCodes);
    for (const move of map.admissibleNextMoves) {
      expect(completedCodes.has(move.productCode)).toBe(false);
    }
  });

  it("every admissible move has required fields", () => {
    const map = buildCorridorMap("test-customer", emptyTwin);
    for (const move of map.admissibleNextMoves) {
      expect(move.productCode).toBeTruthy();
      expect(move.productName).toBeTruthy();
      expect(move.recommendation).toBeTruthy();
      expect(move.reason).toBeTruthy();
      expect(move.evidenceBasis.length).toBeGreaterThan(0);
      expect(move.whatItHelpsResolve).toBeTruthy();
      expect(move.accessMode).toBeTruthy();
      expect(typeof move.isAdmissible).toBe("boolean");
    }
  });

  it("controlled moves are separated from admissible moves", () => {
    const map = buildCorridorMap("test-customer", emptyTwin);
    expect(Array.isArray(map.controlledMoves)).toBe(true);
  });

  it("recommendation does not optimize for highest revenue", () => {
    const map = buildCorridorMap("test-customer", emptyTwin);
    for (const move of map.admissibleNextMoves) {
      expect(move.recommendation.toLowerCase()).not.toContain("most expensive");
      expect(move.recommendation.toLowerCase()).not.toContain("highest value");
      expect(move.reason).toBeTruthy();
    }
  });

  it("recommendation rationale is traceable to twin state", () => {
    const map = buildCorridorMap("test-customer", populatedTwin);
    expect(map.recommendationRationale).toBeTruthy();
    expect(map.recommendationRationale.length).toBeGreaterThan(10);
    expect(map.unresolvedBlockers.length).toBeGreaterThan(0);
  });
});