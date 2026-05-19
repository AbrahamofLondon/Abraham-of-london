import { describe, expect, it } from "vitest";

import {
  buildMarketConfidencePosture,
  getEvidenceClassDisclosure,
  getEvidenceClassLabel,
  requiresConfidenceBand,
  requiresSourceReference,
  type MarketEvidenceClass,
} from "./market-intelligence-evidence-standard";

describe("getEvidenceClassLabel", () => {
  it("returns a non-empty label for every evidence class", () => {
    const classes: MarketEvidenceClass[] = [
      "PRIMARY_DATA",
      "INSTITUTIONAL_SOURCE",
      "MARKET_IMPLIED_SIGNAL",
      "MODELLED_ESTIMATE",
      "SCENARIO_ASSUMPTION",
      "OPERATOR_JUDGEMENT",
    ];
    for (const cls of classes) {
      expect(getEvidenceClassLabel(cls)).toBeTruthy();
    }
  });

  it("distinguishes all six classes", () => {
    const classes: MarketEvidenceClass[] = [
      "PRIMARY_DATA",
      "INSTITUTIONAL_SOURCE",
      "MARKET_IMPLIED_SIGNAL",
      "MODELLED_ESTIMATE",
      "SCENARIO_ASSUMPTION",
      "OPERATOR_JUDGEMENT",
    ];
    const labels = classes.map(getEvidenceClassLabel);
    expect(new Set(labels).size).toBe(6);
  });
});

describe("getEvidenceClassDisclosure", () => {
  it("includes 'Source reference required' for primary data", () => {
    expect(getEvidenceClassDisclosure("PRIMARY_DATA")).toContain(
      "Source reference required",
    );
  });

  it("includes 'Source reference required' for institutional sources", () => {
    expect(getEvidenceClassDisclosure("INSTITUTIONAL_SOURCE")).toContain(
      "Source reference required",
    );
  });

  it("includes 'Method note required' for scenario assumptions", () => {
    expect(getEvidenceClassDisclosure("SCENARIO_ASSUMPTION")).toContain(
      "Method note required",
    );
  });

  it("includes 'Not a forecast' for scenario assumptions", () => {
    expect(getEvidenceClassDisclosure("SCENARIO_ASSUMPTION")).toContain(
      "Not a forecast",
    );
  });

  it("includes 'Confidence band required' for operator judgement", () => {
    expect(getEvidenceClassDisclosure("OPERATOR_JUDGEMENT")).toContain(
      "Confidence band required",
    );
  });
});

describe("requiresSourceReference", () => {
  it("returns true for PRIMARY_DATA", () => {
    expect(requiresSourceReference("PRIMARY_DATA")).toBe(true);
  });

  it("returns true for INSTITUTIONAL_SOURCE", () => {
    expect(requiresSourceReference("INSTITUTIONAL_SOURCE")).toBe(true);
  });

  it("returns false for MARKET_IMPLIED_SIGNAL", () => {
    expect(requiresSourceReference("MARKET_IMPLIED_SIGNAL")).toBe(false);
  });

  it("returns false for MODELLED_ESTIMATE", () => {
    expect(requiresSourceReference("MODELLED_ESTIMATE")).toBe(false);
  });

  it("returns false for SCENARIO_ASSUMPTION", () => {
    expect(requiresSourceReference("SCENARIO_ASSUMPTION")).toBe(false);
  });

  it("returns false for OPERATOR_JUDGEMENT", () => {
    expect(requiresSourceReference("OPERATOR_JUDGEMENT")).toBe(false);
  });
});

describe("requiresConfidenceBand", () => {
  it("returns true for MODELLED_ESTIMATE", () => {
    expect(requiresConfidenceBand("MODELLED_ESTIMATE")).toBe(true);
  });

  it("returns true for SCENARIO_ASSUMPTION", () => {
    expect(requiresConfidenceBand("SCENARIO_ASSUMPTION")).toBe(true);
  });

  it("returns true for OPERATOR_JUDGEMENT", () => {
    expect(requiresConfidenceBand("OPERATOR_JUDGEMENT")).toBe(true);
  });

  it("returns false for PRIMARY_DATA", () => {
    expect(requiresConfidenceBand("PRIMARY_DATA")).toBe(false);
  });

  it("returns false for INSTITUTIONAL_SOURCE", () => {
    expect(requiresConfidenceBand("INSTITUTIONAL_SOURCE")).toBe(false);
  });

  it("returns false for MARKET_IMPLIED_SIGNAL", () => {
    expect(requiresConfidenceBand("MARKET_IMPLIED_SIGNAL")).toBe(false);
  });
});

describe("buildMarketConfidencePosture", () => {
  it("returns all four confidence bands", () => {
    const posture = buildMarketConfidencePosture();
    const bands = posture.items.map((i) => i.band);
    expect(bands).toContain("HIGH");
    expect(bands).toContain("MEDIUM");
    expect(bands).toContain("LOW");
    expect(bands).toContain("MONITORING");
  });

  it("HIGH band includes structural thesis", () => {
    const posture = buildMarketConfidencePosture();
    const high = posture.items.find((i) => i.band === "HIGH");
    expect(high?.examples.some((e) => e.toLowerCase().includes("structural"))).toBe(
      true,
    );
  });

  it("MONITORING band includes FX anomaly signals", () => {
    const posture = buildMarketConfidencePosture();
    const monitoring = posture.items.find((i) => i.band === "MONITORING");
    expect(
      monitoring?.examples.some((e) => e.toLowerCase().includes("fx")),
    ).toBe(true);
  });

  it("every band has at least one example", () => {
    const posture = buildMarketConfidencePosture();
    for (const item of posture.items) {
      expect(item.examples.length).toBeGreaterThan(0);
    }
  });
});
