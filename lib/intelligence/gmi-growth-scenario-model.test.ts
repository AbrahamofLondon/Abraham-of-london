import { describe, expect, it } from "vitest";

import {
  GMI_2026_GROWTH_INPUTS,
  buildGrowthScenarioComparison,
  getAolScenarioInput,
  getConfirmedInstitutionalInputs,
  getGrowthInputBySource,
} from "./gmi-growth-scenario-model";

describe("GMI_2026_GROWTH_INPUTS — structure", () => {
  it("seeds all institutional sources plus OECD and World Bank", () => {
    const sources = GMI_2026_GROWTH_INPUTS.map((i) => i.source);
    expect(sources).toContain("IMF");
    expect(sources).toContain("OECD");
    expect(sources).toContain("WORLD_BANK");
    expect(sources).toContain("GOLDMAN_SACHS");
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

  it("IMF estimate is the April 2026 figure of 3.1% (downgraded from January 3.3%)", () => {
    const imf = GMI_2026_GROWTH_INPUTS.find((i) => i.source === "IMF");
    expect(imf?.globalGrowthEstimate).toBe(3.1);
  });

  it("World Bank marks the lower bound of the dispersion band at 2.5%", () => {
    const wb = GMI_2026_GROWTH_INPUTS.find((i) => i.source === "WORLD_BANK");
    expect(wb?.globalGrowthEstimate).toBe(2.5);
  });

  it("AoL scenario is labelled SCENARIO_ASSUMPTION", () => {
    const aol = GMI_2026_GROWTH_INPUTS.find((i) => i.source === "AOL_SCENARIO");
    expect(aol?.evidenceClass).toBe("SCENARIO_ASSUMPTION");
  });

  it("Goldman Sachs release-lock value is 2.8%", () => {
    const gs = GMI_2026_GROWTH_INPUTS.find((i) => i.source === "GOLDMAN_SACHS");
    expect(gs?.globalGrowthEstimate).toBe(2.8);
  });

  it("JPMorgan estimate is null — qualitative framing only", () => {
    const jp = GMI_2026_GROWTH_INPUTS.find((i) => i.source === "JPMORGAN");
    expect(jp?.globalGrowthEstimate).toBeNull();
  });

  it("AoL scenario sits in the lower half of the institutional dispersion band", () => {
    const comparison = buildGrowthScenarioComparison();
    const aol = comparison.aolScenario;
    expect(aol?.globalGrowthEstimate).not.toBeNull();
    // Band widened toward AoL: it is now within the band (>= floor) but below the midpoint.
    expect(aol!.globalGrowthEstimate!).toBeGreaterThanOrEqual(comparison.institutionalRange.low);
    expect(aol!.globalGrowthEstimate!).toBeLessThan(comparison.institutionalMidpoint);
  });
});

describe("buildGrowthScenarioComparison", () => {
  it("returns institutional range with low and high", () => {
    const { institutionalRange } = buildGrowthScenarioComparison();
    expect(institutionalRange.low).toBeGreaterThan(0);
    expect(institutionalRange.high).toBeGreaterThanOrEqual(institutionalRange.low);
  });

  it("institutional midpoint sits inside the dispersion band (2.5–3.1%)", () => {
    const { institutionalMidpoint, institutionalRange } = buildGrowthScenarioComparison();
    expect(institutionalRange.low).toBe(2.5);
    expect(institutionalRange.high).toBe(3.1);
    expect(institutionalMidpoint).toBeGreaterThanOrEqual(institutionalRange.low);
    expect(institutionalMidpoint).toBeLessThanOrEqual(institutionalRange.high);
  });

  it("model interpretation leads with dispersion, not a single consensus figure", () => {
    const { model } = buildGrowthScenarioComparison();
    expect(model.interpretation).toContain("dispersed");
    expect(model.interpretation).toContain("2.5");
    expect(model.interpretation).toContain("scenario assumption");
  });

  it("model identifies AoL as scenario assumption, not settled consensus", () => {
    const { model } = buildGrowthScenarioComparison();
    expect(model.downsideRange).toContain("scenario assumption");
  });

  it("release note freezes the evidence set without waiting for IMF July WEO", () => {
    const { releaseNote } = buildGrowthScenarioComparison();
    expect(releaseNote).toContain("Goldman Sachs is locked at 2.8%");
    expect(releaseNote).toContain("Morgan Stanley is excluded");
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
    expect(imf?.globalGrowthEstimate).toBe(3.1);
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

  it("includes IMF and Goldman Sachs, but excludes Morgan Stanley from hard inputs", () => {
    const confirmed = getConfirmedInstitutionalInputs();
    const sources = confirmed.map((i) => i.source);
    expect(sources).toContain("IMF");
    expect(sources).toContain("GOLDMAN_SACHS");
    expect(sources).not.toContain("MORGAN_STANLEY");
  });
});

describe("getAolScenarioInput", () => {
  it("returns the AoL scenario assumption", () => {
    const aol = getAolScenarioInput();
    expect(aol).not.toBeNull();
    expect(aol?.evidenceClass).toBe("SCENARIO_ASSUMPTION");
  });
});
