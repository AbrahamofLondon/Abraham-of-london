import { describe, expect, it } from "vitest";

import {
  GMI_2026_GROWTH_INPUTS,
  buildGrowthScenarioComparison,
  getAolScenarioInput,
  getConfirmedInstitutionalInputs,
  getGrowthInputBySource,
} from "./gmi-growth-scenario-model";

describe("GMI_2026_GROWTH_INPUTS — structure", () => {
  it("seeds all five sources", () => {
    const sources = GMI_2026_GROWTH_INPUTS.map((i) => i.source);
    expect(sources).toContain("IMF");
    expect(sources).toContain("GOLDMAN_SACHS");
    expect(sources).toContain("MORGAN_STANLEY");
    expect(sources).toContain("JPMORGAN");
    expect(sources).toContain("AOL_SCENARIO");
  });

  it("every input has a non-empty label and notes", () => {
    for (const input of GMI_2026_GROWTH_INPUTS) {
      expect(input.label.length).toBeGreaterThan(0);
      expect(input.notes.length).toBeGreaterThan(0);
    }
  });

  it("all inputs are for year 2026", () => {
    for (const input of GMI_2026_GROWTH_INPUTS) {
      expect(input.year).toBe(2026);
    }
  });

  it("IMF estimate is 3.3%", () => {
    const imf = GMI_2026_GROWTH_INPUTS.find((i) => i.source === "IMF");
    expect(imf?.globalGrowthEstimate).toBe(3.3);
  });

  it("AoL scenario is labelled SCENARIO_ASSUMPTION", () => {
    const aol = GMI_2026_GROWTH_INPUTS.find((i) => i.source === "AOL_SCENARIO");
    expect(aol?.evidenceClass).toBe("SCENARIO_ASSUMPTION");
  });

  it("JPMorgan estimate is null — qualitative framing only", () => {
    const jp = GMI_2026_GROWTH_INPUTS.find((i) => i.source === "JPMORGAN");
    expect(jp?.globalGrowthEstimate).toBeNull();
  });

  it("AoL scenario sits below the institutional range", () => {
    const comparison = buildGrowthScenarioComparison();
    const aol = comparison.aolScenario;
    expect(aol?.globalGrowthEstimate).not.toBeNull();
    expect(aol!.globalGrowthEstimate!).toBeLessThan(comparison.institutionalRange.low);
  });
});

describe("buildGrowthScenarioComparison", () => {
  it("returns institutional range with low and high", () => {
    const { institutionalRange } = buildGrowthScenarioComparison();
    expect(institutionalRange.low).toBeGreaterThan(0);
    expect(institutionalRange.high).toBeGreaterThanOrEqual(institutionalRange.low);
  });

  it("institutional midpoint is in the low-3% area", () => {
    const { institutionalMidpoint } = buildGrowthScenarioComparison();
    expect(institutionalMidpoint).toBeGreaterThan(2.5);
    expect(institutionalMidpoint).toBeLessThan(4.0);
  });

  it("model interpretation mentions constrained low-3% growth environment", () => {
    const { model } = buildGrowthScenarioComparison();
    expect(model.interpretation).toContain("low-3%");
    expect(model.interpretation).toContain("scenario assumption");
  });

  it("model identifies AoL as scenario assumption, not settled consensus", () => {
    const { model } = buildGrowthScenarioComparison();
    expect(model.downsideRange).toContain("scenario assumption");
  });

  it("release note flags IMF July WEO as required", () => {
    const { releaseNote } = buildGrowthScenarioComparison();
    expect(releaseNote).toContain("IMF July 2026 WEO");
  });

  it("tradeHeadwindSeverity is HIGH", () => {
    const { model } = buildGrowthScenarioComparison();
    expect(model.tradeHeadwindSeverity).toBe("HIGH");
  });
});

describe("getGrowthInputBySource", () => {
  it("returns IMF input", () => {
    const imf = getGrowthInputBySource("IMF");
    expect(imf).not.toBeNull();
    expect(imf?.globalGrowthEstimate).toBe(3.3);
  });

  it("returns null for unknown source", () => {
    // @ts-expect-error — testing invalid input
    expect(getGrowthInputBySource("UNKNOWN_BANK")).toBeNull();
  });
});

describe("getConfirmedInstitutionalInputs", () => {
  it("excludes AoL scenario", () => {
    const confirmed = getConfirmedInstitutionalInputs();
    expect(confirmed.some((i) => i.source === "AOL_SCENARIO")).toBe(false);
  });

  it("excludes JPMorgan null estimate", () => {
    const confirmed = getConfirmedInstitutionalInputs();
    expect(confirmed.some((i) => i.source === "JPMORGAN")).toBe(false);
  });

  it("includes IMF, Goldman Sachs, and Morgan Stanley", () => {
    const confirmed = getConfirmedInstitutionalInputs();
    const sources = confirmed.map((i) => i.source);
    expect(sources).toContain("IMF");
    expect(sources).toContain("GOLDMAN_SACHS");
    expect(sources).toContain("MORGAN_STANLEY");
  });
});

describe("getAolScenarioInput", () => {
  it("returns the AoL scenario assumption", () => {
    const aol = getAolScenarioInput();
    expect(aol).not.toBeNull();
    expect(aol?.evidenceClass).toBe("SCENARIO_ASSUMPTION");
  });
});
