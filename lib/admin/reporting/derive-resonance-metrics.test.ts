import { describe, expect, it } from "vitest";
import {
  deriveResonanceMetricsFromResponses,
  type RawAlignmentResponse,
} from "./derive-resonance-metrics";

describe("deriveResonanceMetricsFromResponses", () => {
  it("returns canonical domain order even with no responses", () => {
    const result = deriveResonanceMetricsFromResponses([]);

    expect(result.metrics).toEqual([
      { label: "STRATEGIC_INTENT", intent: 90, reality: 0 },
      { label: "OPERATIONAL_CLARITY", intent: 90, reality: 0 },
      { label: "LEADERSHIP_TRUST", intent: 90, reality: 0 },
      { label: "CULTURAL_COHESION", intent: 90, reality: 0 },
    ]);

    expect(result.telemetry.totalResponses).toBe(0);
    expect(result.telemetry.recognizedResponses).toBe(0);
    expect(result.telemetry.ignoredResponses).toBe(0);
    expect(result.telemetry.completeDomains).toBe(0);
    expect(result.telemetry.incompleteDomains).toBe(4);
    expect(result.telemetry.averageDissonance).toBe(90);
    expect(result.telemetry.isDisordered).toBe(true);
  });

  it("aggregates multiple reality scores per domain by average", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 70 },
      { domain: "STRATEGIC_INTENT", score: 80 },
      { domain: "STRATEGIC_INTENT", score: 90 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const strategic = result.metrics.find(
      (m) => m.label === "STRATEGIC_INTENT"
    );

    expect(strategic).toEqual({
      label: "STRATEGIC_INTENT",
      intent: 90,
      reality: 80,
    });
  });

  it("uses explicit intent values when present", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "LEADERSHIP_TRUST", score: 58, intent: 94 },
      { domain: "LEADERSHIP_TRUST", score: 62, intent: 96 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const trust = result.metrics.find((m) => m.label === "LEADERSHIP_TRUST");

    expect(trust).toEqual({
      label: "LEADERSHIP_TRUST",
      intent: 95,
      reality: 60,
    });
  });

  it("supports domain aliases", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "strategy", score: 72 },
      { domain: "operations", score: 45 },
      { domain: "trust_index", score: 58 },
      { domain: "culture", score: 79 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    expect(result.metrics).toEqual([
      { label: "STRATEGIC_INTENT", intent: 90, reality: 72 },
      { label: "OPERATIONAL_CLARITY", intent: 90, reality: 45 },
      { label: "LEADERSHIP_TRUST", intent: 90, reality: 58 },
      { label: "CULTURAL_COHESION", intent: 90, reality: 79 },
    ]);
  });

  it("ignores unrecognized domains", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "nonsense_field", score: 99 },
      { domain: "STRATEGIC_INTENT", score: 80 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    expect(result.telemetry.totalResponses).toBe(2);
    expect(result.telemetry.recognizedResponses).toBe(1);
    expect(result.telemetry.ignoredResponses).toBe(1);
  });

  it("ignores responses with no usable score", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "STRATEGIC_INTENT", score: null },
      { domain: "STRATEGIC_INTENT", value: "" },
      { domain: "STRATEGIC_INTENT", rating: undefined },
      { domain: "STRATEGIC_INTENT", score: 88 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const strategic = result.metrics.find(
      (m) => m.label === "STRATEGIC_INTENT"
    );

    expect(strategic?.reality).toBe(88);
    expect(result.telemetry.recognizedResponses).toBe(1);
    expect(result.telemetry.ignoredResponses).toBe(3);
  });

  it("clamps hostile numeric input into 0..100", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 150, intent: 200 },
      { domain: "OPERATIONAL_CLARITY", score: -25, intent: -10 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    expect(result.metrics).toContainEqual({
      label: "STRATEGIC_INTENT",
      intent: 100,
      reality: 100,
    });

    expect(result.metrics).toContainEqual({
      label: "OPERATIONAL_CLARITY",
      intent: 0,
      reality: 0,
    });
  });

  it("honors the provided default intent", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "CULTURAL_COHESION", score: 77 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses, {
      defaultIntent: 95,
    });

    const culture = result.metrics.find(
      (m) => m.label === "CULTURAL_COHESION"
    );

    expect(culture).toEqual({
      label: "CULTURAL_COHESION",
      intent: 95,
      reality: 77,
    });
  });

  it("calculates coverage based on minimumResponsesPerDomain", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 80 },
      { domain: "STRATEGIC_INTENT", score: 82 },
      { domain: "OPERATIONAL_CLARITY", score: 60 },
      { domain: "LEADERSHIP_TRUST", score: 70 },
      { domain: "LEADERSHIP_TRUST", score: 72 },
      { domain: "LEADERSHIP_TRUST", score: 74 },
      { domain: "LEADERSHIP_TRUST", score: 76 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses, {
      minimumResponsesPerDomain: 2,
    });

    const domains = Object.fromEntries(
      result.telemetry.domains.map((d) => [d.label, d])
    );

    expect(domains.STRATEGIC_INTENT.coverage).toBe("ADEQUATE");
    expect(domains.OPERATIONAL_CLARITY.coverage).toBe("LOW");
    expect(domains.LEADERSHIP_TRUST.coverage).toBe("STRONG");
    expect(domains.CULTURAL_COHESION.coverage).toBe("NONE");

    expect(result.telemetry.completeDomains).toBe(2);
    expect(result.telemetry.incompleteDomains).toBe(2);
  });

  it("flags disordered when average dissonance exceeds threshold", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 20 },
      { domain: "OPERATIONAL_CLARITY", score: 25 },
      { domain: "LEADERSHIP_TRUST", score: 30 },
      { domain: "CULTURAL_COHESION", score: 35 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses, {
      defaultIntent: 90,
    });

    expect(result.telemetry.averageDissonance).toBe(62.5);
    expect(result.telemetry.isDisordered).toBe(true);
    expect(result.telemetry.disorderThreshold).toBe(30);
  });

  it("does not flag disordered when average dissonance stays below threshold", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "STRATEGIC_INTENT", score: 78, intent: 90 },
      { domain: "OPERATIONAL_CLARITY", score: 70, intent: 88 },
      { domain: "LEADERSHIP_TRUST", score: 75, intent: 92 },
      { domain: "CULTURAL_COHESION", score: 82, intent: 85 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    expect(result.telemetry.averageDissonance).toBe(12.5);
    expect(result.telemetry.isDisordered).toBe(false);
  });

  it("accepts value and rating as alternate score fields", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "STRATEGIC_INTENT", value: 66 },
      { domain: "OPERATIONAL_CLARITY", rating: 54 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    expect(result.metrics).toContainEqual({
      label: "STRATEGIC_INTENT",
      intent: 90,
      reality: 66,
    });

    expect(result.metrics).toContainEqual({
      label: "OPERATIONAL_CLARITY",
      intent: 90,
      reality: 54,
    });
  });

  it("rounds averages cleanly for executive output", () => {
    const responses: RawAlignmentResponse[] = [
      { domain: "LEADERSHIP_TRUST", score: 58.3333, intent: 94.7777 },
      { domain: "LEADERSHIP_TRUST", score: 61.6666, intent: 95.2222 },
    ];

    const result = deriveResonanceMetricsFromResponses(responses);

    const trust = result.telemetry.domains.find(
      (d) => d.label === "LEADERSHIP_TRUST"
    );

    expect(trust?.intent).toBe(95);
    expect(trust?.reality).toBe(60);
    expect(trust?.dissonance).toBe(35);
  });

  it("is hostile-input safe when responses is not a proper array shape", () => {
    const result = deriveResonanceMetricsFromResponses(
      [
        null,
        undefined,
        {} as RawAlignmentResponse,
        { domain: 123, score: "55" },
      ] as unknown as RawAlignmentResponse[]
    );

    expect(result.telemetry.totalResponses).toBe(4);
    expect(result.telemetry.recognizedResponses).toBe(0);
    expect(result.telemetry.ignoredResponses).toBe(4);
    expect(result.metrics).toHaveLength(4);
  });
});