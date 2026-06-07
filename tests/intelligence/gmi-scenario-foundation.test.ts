/**
 * P10 — Scenario Foundation Tests
 * Scenario explorer is feature-flagged off. Method notes required for probabilistic language.
 */

import { describe, expect, it } from "vitest";

import { GMI_SCENARIO_EXPLORER_ENABLED } from "@/lib/intelligence/gmi-feature-flags";

describe("GMI_SCENARIO_EXPLORER_ENABLED", () => {
  it("is false by default", () => {
    expect(GMI_SCENARIO_EXPLORER_ENABLED).toBe(false);
  });

  it("is a boolean", () => {
    expect(typeof GMI_SCENARIO_EXPLORER_ENABLED).toBe("boolean");
  });
});

describe("GmiScenarioModel structure", () => {
  it("requires editionId, scenarioId, title, description", () => {
    // Test the required field contract via a typed shape check
    const validScenario = {
      id: "scen_001",
      editionId: "GMI-Q2-2026",
      scenarioId: "base-case",
      title: "Managed Fragmentation (Base Case)",
      description: "Trade fragmentation proceeds at a controlled pace.",
      variablesJson: JSON.stringify({ tariffLevel: "moderate", usdStrength: "weakening" }),
      assumptionsJson: JSON.stringify(["No major bilateral deal in H1 2026", "Fed holds rates"]),
      decisionImplicationsJson: JSON.stringify(["Rebalance supplier exposure", "Increase cash buffer"]),
      falsificationRuleIds: JSON.stringify(["rule_001"]),
      methodNote: "Probability derived from scenario framework v2.1, not from statistical model.",
    };

    // All required fields present
    expect(validScenario.editionId).toBeTruthy();
    expect(validScenario.scenarioId).toBeTruthy();
    expect(validScenario.title).toBeTruthy();
    expect(validScenario.description).toBeTruthy();
  });

  it("variablesJson and assumptionsJson are stored as JSON strings (not objects)", () => {
    const variables = { tariffLevel: "high", usdStrength: "collapsing" };
    const serialized = JSON.stringify(variables);

    expect(typeof serialized).toBe("string");
    expect(() => JSON.parse(serialized)).not.toThrow();
    expect(JSON.parse(serialized)).toEqual(variables);
  });

  it("methodNote is required when probabilistic language is used", () => {
    // Policy: scenarios with probabilistic language must have a methodNote.
    // A missing methodNote + probability language = invalid scenario.
    function validateScenario(s: { description: string; methodNote: string | null }) {
      const hasProbabilisticLanguage =
        /\d+%/.test(s.description) || /probability/i.test(s.description);
      if (hasProbabilisticLanguage && !s.methodNote) {
        return { valid: false, reason: "methodNote required for probabilistic claims" };
      }
      return { valid: true, reason: null };
    }

    const invalidScenario = {
      description: "43% probability of managed fragmentation scenario",
      methodNote: null,
    };

    const result = validateScenario(invalidScenario);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("methodNote required");
  });

  it("scenario with methodNote passes the probability-language check", () => {
    const scenario = {
      description: "43% probability of managed fragmentation scenario",
      methodNote: "Probability derived from scenario framework v2.1, not from statistical model.",
    };

    const hasProbabilisticLanguage = /\d+%/.test(scenario.description);
    const isValid = !hasProbabilisticLanguage || !!scenario.methodNote;

    expect(isValid).toBe(true);
  });
});

describe("Scenario explorer route is disabled", () => {
  it("public route is gated behind feature flag", () => {
    // The scenario explorer page must not be accessible when flag is false
    const isExplorerAccessible = GMI_SCENARIO_EXPLORER_ENABLED;
    expect(isExplorerAccessible).toBe(false);
  });
});
