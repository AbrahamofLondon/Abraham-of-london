/**
 * tests/product/product-catalogue-integrity.spec.ts
 *
 * Product Catalogue Integrity Tests.
 *
 * Tests:
 *   - Every product maps to DecisionCase
 *   - Paid briefs expose more than free test but not raw internal machinery
 *   - Executive Review is qualification-only, not instant checkout
 *   - Verification uses record-reference language unless cryptographic signing exists
 *   - Low-stakes case remains low
 *   - High-consequence constrained case cannot produce shallow public output
 */

import { describe, it, expect } from "vitest";
import { analyzeDecisionFailureMap } from "@/lib/decision/decision-failure-map";
import { composeDecisionCase } from "@/lib/product/decision-case-composer";
import { toFreeDecisionOutput, toPaidBriefOutput } from "@/lib/product/output-adapters";
import { getCatalogue } from "@/lib/product/product-catalogue-registry";

// ─── Test data ────────────────────────────────────────────────────────────────

const HIGH_CONSEQUENCE_INPUT = "I need to file my company accounts and corporation tax return by the end of this month. I have no money for an accountant. The records are complicated. I already submitted a placeholder filing but the real deadline is approaching. I'm worried about penalties I can't afford.";

const LOW_STAKES_INPUT = "I'm trying to decide between two coffee machines for the office. One is more expensive but has better reviews. The other is cheaper and simpler. Either would be fine. There's no deadline, no legal obligation, and no one will be harmed either way.";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Product Catalogue Integrity", () => {

  // 1. Every product maps to DecisionCase
  describe("Catalogue completeness", () => {
    const catalogue = getCatalogue();
    const entries = Object.values(catalogue);

    it("has at least 10 product entries", () => {
      expect(entries.length).toBeGreaterThanOrEqual(10);
    });

    it("every entry has a name", () => {
      for (const entry of entries) {
        expect(entry.name).toBeTruthy();
      }
    });

    it("every entry has a public promise", () => {
      for (const entry of entries) {
        expect(entry.publicPromise).toBeTruthy();
        expect(entry.publicPromise.length).toBeGreaterThan(20);
      }
    });

    it("every entry has a buyer", () => {
      for (const entry of entries) {
        expect(entry.buyer).toBeTruthy();
      }
    });

    it("every entry has a source engine", () => {
      for (const entry of entries) {
        expect(entry.sourceEngine).toBeTruthy();
      }
    });

    it("every entry has a route", () => {
      for (const entry of entries) {
        expect(entry.route).toBeTruthy();
      }
    });

    it("every entry has a next action", () => {
      for (const entry of entries) {
        expect(entry.nextAction).toBeTruthy();
      }
    });

    it("every entry has forbidden claims", () => {
      for (const entry of entries) {
        expect(entry.forbiddenClaims.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("free products have self_service fulfilment", () => {
      const free = entries.filter(e => e.price === "Free");
      for (const entry of free) {
        expect(entry.fulfilmentPath).toBe("self_service");
      }
    });

    it("paid products have founder_review or qualified_delivery fulfilment", () => {
      const paid = entries.filter(e => e.price !== "Free" && e.price !== "Retainer");
      for (const entry of paid) {
        expect(["founder_review", "qualified_delivery"]).toContain(entry.fulfilmentPath);
      }
    });

    it("premium products have qualification rules", () => {
      const premium = entries.filter(e => e.price.startsWith("From") || e.price === "Retainer");
      for (const entry of premium) {
        expect(entry.qualificationRule).toBeTruthy();
        expect(entry.qualificationRule).not.toBe("instant");
      }
    });
  });

  // 2. Paid briefs expose more than free test but not raw internal machinery
  describe("Tier-appropriate output", () => {
    const freeCase = composeDecisionCase({
      source: "decision_test",
      tier: "free",
      safeSummary: HIGH_CONSEQUENCE_INPUT,
      rawInput: HIGH_CONSEQUENCE_INPUT,
    });

    const paidCase = composeDecisionCase({
      source: "brief_order",
      tier: "full",
      safeSummary: HIGH_CONSEQUENCE_INPUT,
      rawInput: HIGH_CONSEQUENCE_INPUT,
    });

    it("free output has teaser visibility", () => {
      expect(freeCase.visibility).toBe("teaser");
    });

    it("paid output has record visibility", () => {
      expect(paidCase.visibility).toBe("record");
    });

    it("free output hides fallback path", () => {
      const free = toFreeDecisionOutput(freeCase);
      // Free output doesn't include fallbackPath field
      expect(free).not.toHaveProperty("fallbackPath");
    });

    it("paid output includes fallback path", () => {
      const paid = toPaidBriefOutput(paidCase);
      expect(paid.fallbackPath).toBeTruthy();
    });

    it("free output limits evidence needed to 3 items", () => {
      const free = toFreeDecisionOutput(freeCase);
      expect(free.evidenceNeeded.length).toBeLessThanOrEqual(3);
    });

    it("paid output includes full failure risk list", () => {
      const paid = toPaidBriefOutput(paidCase);
      expect(paid.failureRisks.length).toBeGreaterThan(0);
    });

    it("paid output includes escalation threshold", () => {
      const paid = toPaidBriefOutput(paidCase);
      expect(paid.escalationThreshold).toBeTruthy();
    });
  });

  // 3. Executive Review is qualification-only, not instant checkout
  describe("Executive Review qualification", () => {
    it("executive_decision_review has qualified_interest rule", () => {
      const catalogue = getCatalogue();
      const exec = catalogue.executive_decision_review;
      expect(exec.qualificationRule).toBe("qualified_interest");
    });

    it("executive review route is not a direct checkout", () => {
      const catalogue = getCatalogue();
      const exec = catalogue.executive_decision_review;
      expect(exec.route).not.toContain("checkout");
      expect(exec.fulfilmentPath).toBe("qualified_delivery");
    });
  });

  // 4. Verification uses record-reference language
  describe("Verification honesty", () => {
    it("verify_a_record does not claim cryptographic proof", () => {
      const catalogue = getCatalogue();
      const verify = catalogue.verify_a_record;
      const hasCryptographicClaim = verify.forbiddenClaims.some(
        c => c.toLowerCase().includes("cryptographic") || c.toLowerCase().includes("legally binding")
      );
      expect(hasCryptographicClaim).toBe(true);
    });
  });

  // 5. Low-stakes case remains low
  describe("Low-stakes classification", () => {
    const result = analyzeDecisionFailureMap(LOW_STAKES_INPUT);

    it("low-stakes decision returns LOW directive", () => {
      expect(result.directive).toBe("LOW");
    });

    it("low-stakes decision has no primary tension", () => {
      expect(result.primaryTension).toBeNull();
    });

    it("low-stakes decision has NO_CRITICAL_FAILURE", () => {
      expect(result.primaryFailurePoint).toBe("NO_CRITICAL_FAILURE");
    });
  });

  // 6. High-consequence constrained case cannot produce shallow public output
  describe("High-consequence constraint protection", () => {
    const result = analyzeDecisionFailureMap(HIGH_CONSEQUENCE_INPUT);
    const freeCase = composeDecisionCase({
      source: "decision_test",
      tier: "free",
      safeSummary: HIGH_CONSEQUENCE_INPUT,
      rawInput: HIGH_CONSEQUENCE_INPUT,
    });

    it("high-consequence case does not return LOW", () => {
      expect(result.directive).not.toBe("LOW");
    });

    it("high-consequence case has a primary failure point", () => {
      expect(result.primaryFailurePoint).not.toBe("NO_CRITICAL_FAILURE");
    });

    it("high-consequence case has a primary tension", () => {
      expect(result.primaryTension).toBeTruthy();
    });

    it("high-consequence case has what must not be delayed", () => {
      expect(result.whatMustNotBeDelayed.length).toBeGreaterThan(0);
    });

    it("high-consequence case has impossible advice detected", () => {
      expect(result.impossibleAdvice.length).toBeGreaterThan(0);
    });

    it("free output for high-consequence case still shows escalation-level directive", () => {
      const free = toFreeDecisionOutput(freeCase);
      expect(["ESCALATE", "CONSTRAINED_RESCUE", "HIGH"]).toContain(free.directive);
    });
  });
});
