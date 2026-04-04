import { describe, expect, it } from "vitest";
import {
  serializeExecutiveReportToJson,
  serializeExecutiveReportToPdfPayload,
} from "./executive-report-serializer";

const mockReport = {
  state: "MISALIGNED",
  narrative: {
    headline: "Structural Misalignment Identified",
    summary: "Total exposure is rising across execution and talent layers.",
    mandate: "Suspend acceleration, correct the weakest domain, and restore order.",
  },
  ogr: {
    integrationTax: 36.88,
    velocityMultiplier: 1.41,
    resonanceAlpha: 17.5,
    sovereignCertainty: 80.55,
    isAuthorizedToExecute: false,
  },
  resonance: {
    telemetry: {
      averageDissonance: 26.5,
      isDisordered: false,
      domains: [
        {
          label: "STRATEGIC_INTENT",
          intent: 95,
          reality: 72,
          dissonance: 23,
          coverage: "HIGH",
          responseCount: 6,
        },
        {
          label: "OPERATIONAL_CLARITY",
          intent: 88,
          reality: 45,
          dissonance: 43,
          coverage: "HIGH",
          responseCount: 6,
        },
        {
          label: "LEADERSHIP_TRUST",
          intent: 92,
          reality: 58,
          dissonance: 34,
          coverage: "MEDIUM",
          responseCount: 4,
        },
      ],
      strongestDomain: "STRATEGIC_INTENT",
      weakestDomain: "OPERATIONAL_CLARITY",
      domainCount: 3,
      totalResponses: 16,
    },
    metrics: [
      {
        label: "OPERATIONAL_CLARITY",
        intent: 88,
        reality: 45,
        dissonance: 43,
        coverage: "HIGH",
        responseCount: 6,
      },
      {
        label: "LEADERSHIP_TRUST",
        intent: 92,
        reality: 58,
        dissonance: 34,
        coverage: "MEDIUM",
        responseCount: 4,
      },
      {
        label: "STRATEGIC_INTENT",
        intent: 95,
        reality: 72,
        dissonance: 23,
        coverage: "HIGH",
        responseCount: 6,
      },
    ],
  },
  hcdAggregate: {
    overallBurnoutIndex: 63,
    riskScore: "HIGH",
    totalReplacementCost: 245000,
    averageUtilization: 87,
    criticalDomains: ["LEADERSHIP_EXHAUSTION"],
    elevatedDomains: ["ENGINEERING_VELOCITY"],
    stableDomains: ["ROLE_VACANCY"],
  },
  financialExposure: {
    replacementCost: 245000,
    executionLoss: 26500,
    totalExposure: 271500,
  },
  priorityStack: [
    "Suspend execution — alignment not verified",
    "Correct OPERATIONAL_CLARITY (dissonance: 43%)",
    "Reduce leadership load concentration",
  ],
  failureModes: [
    "Execution Stall",
    "Capacity Saturation",
    "Leadership Signal Erosion",
  ],
};

describe("serializeExecutiveReportToJson", () => {
  it("returns canonical JSON payload", () => {
    const result = serializeExecutiveReportToJson(mockReport as any);

    expect(result).toBeTruthy();
    expect(result.meta).toBeTruthy();
    expect(result.meta.version).toBe("2.0.0");
    expect(result.meta.state).toBe("MISALIGNED");

    expect(result.narrative).toEqual(mockReport.narrative);
    expect(result.ogr).toEqual(mockReport.ogr);
    expect(result.financialExposure).toEqual(mockReport.financialExposure);
    expect(result.priorityStack).toEqual(mockReport.priorityStack);
    expect(result.failureModes).toEqual(mockReport.failureModes);
  });

  it("maps resonance telemetry into stable JSON shape", () => {
    const result = serializeExecutiveReportToJson(mockReport as any);

    expect(result.resonance.averageDissonance).toBe(26.5);
    expect(result.resonance.isDisordered).toBe(false);
    expect(Array.isArray(result.resonance.domains)).toBe(true);
    expect(result.resonance.domains).toHaveLength(3);

    expect(result.resonance.domains[0]).toEqual({
      label: "OPERATIONAL_CLARITY",
      intent: 88,
      reality: 45,
      dissonance: 43,
      coverage: "HIGH",
      responseCount: 6,
    });
  });

  it("maps HCD aggregate into stable JSON shape", () => {
    const result = serializeExecutiveReportToJson(mockReport as any);

    expect(result.hcd).toEqual({
      overallBurnoutIndex: 63,
      riskScore: "HIGH",
      totalReplacementCost: 245000,
      averageUtilization: 87,
      criticalDomains: ["LEADERSHIP_EXHAUSTION"],
      elevatedDomains: ["ENGINEERING_VELOCITY"],
    });
  });

  it("adds generated timestamp metadata", () => {
    const before = Date.now();
    const result = serializeExecutiveReportToJson(mockReport as any);
    const after = Date.now();

    const generated = Date.parse(result.meta.generatedAt);

    expect(Number.isFinite(generated)).toBe(true);
    expect(generated).toBeGreaterThanOrEqual(before - 1000);
    expect(generated).toBeLessThanOrEqual(after + 1000);
  });

  it("preserves order of priority stack and failure modes", () => {
    const result = serializeExecutiveReportToJson(mockReport as any);

    expect(result.priorityStack[0]).toBe("Suspend execution — alignment not verified");
    expect(result.priorityStack[1]).toBe("Correct OPERATIONAL_CLARITY (dissonance: 43%)");
    expect(result.failureModes[2]).toBe("Leadership Signal Erosion");
  });

  it("serializes empty arrays without crashing", () => {
    const emptyReport = {
      ...mockReport,
      resonance: {
        telemetry: {
          averageDissonance: 0,
          isDisordered: false,
          domains: [],
          strongestDomain: null,
          weakestDomain: null,
          domainCount: 0,
          totalResponses: 0,
        },
        metrics: [],
      },
      hcdAggregate: {
        ...mockReport.hcdAggregate,
        criticalDomains: [],
        elevatedDomains: [],
      },
      priorityStack: [],
      failureModes: [],
    };

    const result = serializeExecutiveReportToJson(emptyReport as any);

    expect(result.resonance.domains).toEqual([]);
    expect(result.hcd.criticalDomains).toEqual([]);
    expect(result.hcd.elevatedDomains).toEqual([]);
    expect(result.priorityStack).toEqual([]);
    expect(result.failureModes).toEqual([]);
  });
});

describe("serializeExecutiveReportToPdfPayload", () => {
  it("returns canonical PDF payload", () => {
    const result = serializeExecutiveReportToPdfPayload(mockReport as any);

    expect(result).toBeTruthy();
    expect(result.title).toBe("Executive Diagnostic Report");
    expect(result.subtitle).toBe("Institutional Diagnostics Engine");
    expect(result.state).toBe("MISALIGNED");

    expect(result.headline).toBe(mockReport.narrative.headline);
    expect(result.summary).toBe(mockReport.narrative.summary);
    expect(result.mandate).toBe(mockReport.narrative.mandate);
  });

  it("maps integrity block correctly", () => {
    const result = serializeExecutiveReportToPdfPayload(mockReport as any);

    expect(result.integrity).toEqual({
      sovereignCertainty: 80.55,
      authorized: false,
      averageDissonance: 26.5,
      burnoutIndex: 63,
    });
  });

  it("formats exposure values as currency strings", () => {
    const result = serializeExecutiveReportToPdfPayload(mockReport as any);

    expect(typeof result.exposure.replacementCost).toBe("string");
    expect(typeof result.exposure.executionLoss).toBe("string");
    expect(typeof result.exposure.totalExposure).toBe("string");

    expect(result.exposure.replacementCost).toContain("245");
    expect(result.exposure.executionLoss).toContain("26");
    expect(result.exposure.totalExposure).toContain("271");
  });

  it("maps priorities and failure modes directly", () => {
    const result = serializeExecutiveReportToPdfPayload(mockReport as any);

    expect(result.priorities).toEqual(mockReport.priorityStack);
    expect(result.failureModes).toEqual(mockReport.failureModes);
  });

  it("maps domains into PDF-friendly table rows", () => {
    const result = serializeExecutiveReportToPdfPayload(mockReport as any);

    expect(Array.isArray(result.domains)).toBe(true);
    expect(result.domains).toHaveLength(3);

    expect(result.domains[1]).toEqual({
      label: "LEADERSHIP_TRUST",
      intent: 92,
      reality: 58,
      dissonance: 34,
    });
  });

  it("adds generated timestamp to PDF payload", () => {
    const before = Date.now();
    const result = serializeExecutiveReportToPdfPayload(mockReport as any);
    const after = Date.now();

    const generated = Date.parse(result.generatedAt);

    expect(Number.isFinite(generated)).toBe(true);
    expect(generated).toBeGreaterThanOrEqual(before - 1000);
    expect(generated).toBeLessThanOrEqual(after + 1000);
  });

  it("handles authorized state correctly", () => {
    const authorizedReport = {
      ...mockReport,
      state: "ORDERED",
      ogr: {
        ...mockReport.ogr,
        sovereignCertainty: 94.2,
        isAuthorizedToExecute: true,
      },
    };

    const result = serializeExecutiveReportToPdfPayload(authorizedReport as any);

    expect(result.state).toBe("ORDERED");
    expect(result.integrity.authorized).toBe(true);
    expect(result.integrity.sovereignCertainty).toBe(94.2);
  });

  it("handles empty domain matrix without crashing", () => {
    const report = {
      ...mockReport,
      resonance: {
        telemetry: {
          averageDissonance: 0,
          isDisordered: false,
          domains: [],
          strongestDomain: null,
          weakestDomain: null,
          domainCount: 0,
          totalResponses: 0,
        },
        metrics: [],
      },
    };

    const result = serializeExecutiveReportToPdfPayload(report as any);

    expect(result.domains).toEqual([]);
  });
});