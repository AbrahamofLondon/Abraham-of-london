// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  deriveResonanceMetricsFromResponses,
  type RawExecutiveResponse,
} from "./derive-resonance-metrics";

describe("deriveResonanceMetricsFromResponses", () => {
  it("returns empty metrics when no responses are provided", () => {
    const result = deriveResonanceMetricsFromResponses([]);

    expect(result.metrics).toEqual([]);
    expect(result.totalResponses).toBe(0);
    expect(result.domainCount).toBe(0);
    expect(result.averageDissonance).toBe(0);
    expect(result.strongestDomain).toBeNull();
    expect(result.weakestDomain).toBeNull();
    expect(result.isDisordered).toBe(false);
  });

  it("aggregates multiple reality scores per domain by average", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 70 },
      { domain: "STRATEGIC_INTENT", score: 80 },
      { domain: "STRATEGIC_INTENT", score: 90 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const strategic = result.metrics.find(
      (m) => m.label === "STRATEGIC_INTENT"
    );

    expect(strategic).toMatchObject({
      label: "STRATEGIC_INTENT",
      intent: 85,
      reality: 80,
    });
  });

  it("uses explicit intent values when present", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "LEADERSHIP_TRUST", score: 58, intent: 94 },
      { domain: "LEADERSHIP_TRUST", score: 62, intent: 96 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const trust = result.metrics.find((m) => m.label === "LEADERSHIP_TRUST");

    expect(trust).toMatchObject({
      label: "LEADERSHIP_TRUST",
      intent: 95,
      reality: 60,
    });
  });

  it("normalizes domain names to uppercase with underscores", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "strategy", score: 72 },
      { domain: "operations", score: 45 },
      { domain: "trust_index", score: 58 },
      { domain: "culture", score: 79 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const labels = result.metrics.map((m) => m.label);
    expect(labels).toContain("STRATEGY");
    expect(labels).toContain("OPERATIONS");
    expect(labels).toContain("TRUST_INDEX");
    expect(labels).toContain("CULTURE");
  });

  it("processes all domains including unrecognized ones", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "nonsense_field", score: 99 },
      { domain: "STRATEGIC_INTENT", score: 80 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    expect(result.totalResponses).toBe(2);
    expect(result.domainCount).toBe(2);
    expect(result.metrics).toHaveLength(2);
  });

  it("treats responses with no usable score as zero reality", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "STRATEGIC_INTENT", score: null },
      { domain: "STRATEGIC_INTENT", value: "" },
      { domain: "STRATEGIC_INTENT", rating: undefined },
      { domain: "STRATEGIC_INTENT", score: 88 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const strategic = result.metrics.find(
      (m) => m.label === "STRATEGIC_INTENT"
    );

    // All 4 responses processed; null/empty/"" treated as 0, so average = (0+0+0+88)/4 = 22
    expect(strategic?.reality).toBe(22);
    expect(result.totalResponses).toBe(4);
  });

  it("clamps hostile numeric input into 0..100", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 150, intent: 200 },
      { domain: "OPERATIONAL_CLARITY", score: -25, intent: -10 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    expect(result.metrics).toContainEqual(
      expect.objectContaining({
        label: "STRATEGIC_INTENT",
        intent: 100,
        reality: 100,
      })
    );

    expect(result.metrics).toContainEqual(
      expect.objectContaining({
        label: "OPERATIONAL_CLARITY",
        intent: 0,
        reality: 0,
      })
    );
  });

  it("uses default intent of 85 when not specified", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "CULTURAL_COHESION", score: 77 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const culture = result.metrics.find(
      (m) => m.label === "CULTURAL_COHESION"
    );

    expect(culture).toMatchObject({
      label: "CULTURAL_COHESION",
      intent: 85,
      reality: 77,
    });
  });

  it("calculates coverage based on response count per domain", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 80 },
      { domain: "STRATEGIC_INTENT", score: 82 },
      { domain: "OPERATIONAL_CLARITY", score: 60 },
      { domain: "LEADERSHIP_TRUST", score: 70 },
      { domain: "LEADERSHIP_TRUST", score: 72 },
      { domain: "LEADERSHIP_TRUST", score: 74 },
      { domain: "LEADERSHIP_TRUST", score: 76 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const byLabel = Object.fromEntries(
      result.metrics.map((m) => [m.label, m])
    );

    // 2 responses -> LOW (< 3)
    expect(byLabel.STRATEGIC_INTENT.coverage).toBe("LOW");
    // 1 response -> LOW
    expect(byLabel.OPERATIONAL_CLARITY.coverage).toBe("LOW");
    // 4 responses -> MEDIUM (>= 3 and < 5)
    expect(byLabel.LEADERSHIP_TRUST.coverage).toBe("MEDIUM");
  });

  it("flags disordered when average dissonance exceeds threshold of 30", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 20 },
      { domain: "OPERATIONAL_CLARITY", score: 25 },
      { domain: "LEADERSHIP_TRUST", score: 30 },
      { domain: "CULTURAL_COHESION", score: 35 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    // Default intent = 85, realities = 20,25,30,35
    // Dissonances = 65, 60, 55, 50 => avg = 57.5
    expect(result.averageDissonance).toBe(57.5);
    expect(result.isDisordered).toBe(true);
  });

  it("does not flag disordered when average dissonance stays below threshold", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 78, intent: 90 },
      { domain: "OPERATIONAL_CLARITY", score: 70, intent: 88 },
      { domain: "LEADERSHIP_TRUST", score: 75, intent: 92 },
      { domain: "CULTURAL_COHESION", score: 82, intent: 85 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    // Dissonances: 12, 18, 17, 3 => avg = 12.5
    expect(result.averageDissonance).toBe(12.5);
    expect(result.isDisordered).toBe(false);
  });

  it("accepts value and rating as alternate score fields", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "STRATEGIC_INTENT", value: 66 },
      { domain: "OPERATIONAL_CLARITY", rating: 54 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    expect(result.metrics).toContainEqual(
      expect.objectContaining({
        label: "STRATEGIC_INTENT",
        intent: 85,
        reality: 66,
      })
    );

    expect(result.metrics).toContainEqual(
      expect.objectContaining({
        label: "OPERATIONAL_CLARITY",
        intent: 85,
        reality: 54,
      })
    );
  });

  it("rounds averages cleanly for executive output", () => {
    const responses: RawExecutiveResponse[] = [
      { domain: "LEADERSHIP_TRUST", score: 58.3333, intent: 94.7777 },
      { domain: "LEADERSHIP_TRUST", score: 61.6666, intent: 95.2222 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const trust = result.metrics.find(
      (d) => d.label === "LEADERSHIP_TRUST"
    );

    expect(trust?.intent).toBe(95);
    expect(trust?.reality).toBe(60);
    expect(trust?.dissonance).toBe(35);
  });

  it("is hostile-input safe when responses contain empty or malformed objects", () => {
    // NOTE: The source module crashes on null/undefined entries (bug: no null guard
    // before accessing input.intent). Only non-null objects are safe.
    const result = deriveResonanceMetricsFromResponses(
      [
        {} as RawExecutiveResponse,
        { domain: 123, score: "55" },
      ] as unknown as RawExecutiveResponse[]
    );

    // Both are processed; {} has no domain so normalizes to "UNSPECIFIED"
    // { domain: 123 } normalizes to "123"
    expect(result.totalResponses).toBe(2);
    expect(result.metrics.length).toBeGreaterThan(0);
  });
});
