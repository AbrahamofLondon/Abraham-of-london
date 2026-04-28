// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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
    const result = serializeExecutiveReportToJson({ report: mockReport });

    expect(result).toBeTruthy();
    expect(result.ok).toBe(true);
    expect(result.canonical).toBeTruthy();
    expect(result.canonical.schemaVersion).toBe("canonical-report-v2");

    // orgState defaults to DRIFTING when no constitution is provided
    expect(result.canonical.sections.executiveSummary.state).toBe("DRIFTING");

    // Narrative fields are picked from report.narrative
    expect(result.canonical.sections.executiveSummary.headline).toBe(mockReport.narrative.headline);
    expect(result.canonical.sections.executiveSummary.summary).toBe(mockReport.narrative.summary);
    expect(result.canonical.sections.executiveSummary.mandate).toBe(mockReport.narrative.mandate);

    // Financial exposure
    expect(result.canonical.sections.financialExposure.replacementCost).toBe(245000);
    expect(result.canonical.sections.financialExposure.executionLoss).toBe(26500);
    expect(result.canonical.sections.financialExposure.totalExposure).toBe(271500);

    // Priority stack and failure modes
    expect(result.canonical.sections.priorityStack.items).toEqual(mockReport.priorityStack);
    expect(result.canonical.sections.failureModes.items).toEqual(mockReport.failureModes);
  });

  it("maps resonance telemetry into stable JSON shape", () => {
    const result = serializeExecutiveReportToJson({ report: mockReport });

    const analysis = result.canonical.sections.strategicDomainAnalysis;
    expect(analysis.averageDissonance).toBe(26.5);
    expect(Array.isArray(analysis.domains)).toBe(true);
    expect(analysis.domains).toHaveLength(3);

    expect(analysis.domains[0]).toEqual({
      label: "STRATEGIC_INTENT",
      intent: 95,
      reality: 72,
      dissonance: 23,
    });
  });

  it("maps integrity snapshot from report", () => {
    const result = serializeExecutiveReportToJson({ report: mockReport });

    expect(result.canonical.sections.integritySnapshot).toEqual({
      sovereignCertainty: 80.55,
      burnoutIndex: 63,
      averageDissonance: 26.5,
      authorized: false,
    });
  });

  it("adds generated timestamp metadata", () => {
    const before = Date.now();
    const result = serializeExecutiveReportToJson({ report: mockReport });
    const after = Date.now();

    const generated = Date.parse(result.canonical.generatedAt);

    expect(Number.isFinite(generated)).toBe(true);
    expect(generated).toBeGreaterThanOrEqual(before - 1000);
    expect(generated).toBeLessThanOrEqual(after + 1000);
  });

  it("preserves order of priority stack and failure modes", () => {
    const result = serializeExecutiveReportToJson({ report: mockReport });

    expect(result.canonical.sections.priorityStack.items[0]).toBe("Suspend execution — alignment not verified");
    expect(result.canonical.sections.priorityStack.items[1]).toBe("Correct OPERATIONAL_CLARITY (dissonance: 43%)");
    expect(result.canonical.sections.failureModes.items[2]).toBe("Leadership Signal Erosion");
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

    const result = serializeExecutiveReportToJson({ report: emptyReport });

    expect(result.canonical.sections.strategicDomainAnalysis.domains).toEqual([]);
    expect(result.canonical.sections.priorityStack.items).toEqual([]);
    expect(result.canonical.sections.failureModes.items).toEqual([]);
  });
});

describe("serializeExecutiveReportToPdfPayload", () => {
  it("returns canonical PDF payload", () => {
    const result = serializeExecutiveReportToPdfPayload({ report: mockReport });

    expect(result).toBeTruthy();
    // Default title is "Executive Intelligence Brief"
    expect(result.title).toBe("Executive Intelligence Brief");
    // Default subtitle is ""
    expect(typeof result.subtitle).toBe("string");
    // State derived from constitution.orgState, which defaults to "DRIFTING" without constitution input
    expect(result.state).toBe("DRIFTING");

    expect(result.headline).toBe(mockReport.narrative.headline);
    expect(result.summary).toBe(mockReport.narrative.summary);
    expect(result.mandate).toBe(mockReport.narrative.mandate);
  });

  it("maps integrity block correctly", () => {
    const result = serializeExecutiveReportToPdfPayload({ report: mockReport });

    expect(result.integrity).toEqual({
      sovereignCertainty: 80.55,
      authorized: false,
      averageDissonance: 26.5,
      burnoutIndex: 63,
    });
  });

  it("formats exposure values as strings", () => {
    const result = serializeExecutiveReportToPdfPayload({ report: mockReport });

    expect(typeof result.exposure.replacementCost).toBe("string");
    expect(typeof result.exposure.executionLoss).toBe("string");
    expect(typeof result.exposure.totalExposure).toBe("string");

    expect(result.exposure.replacementCost).toContain("245");
    expect(result.exposure.executionLoss).toContain("26");
    expect(result.exposure.totalExposure).toContain("271");
  });

  it("maps priorities and failure modes directly", () => {
    const result = serializeExecutiveReportToPdfPayload({ report: mockReport });

    expect(result.priorities).toEqual(mockReport.priorityStack);
    expect(result.failureModes).toEqual(mockReport.failureModes);
  });

  it("maps domains into PDF-friendly table rows", () => {
    const result = serializeExecutiveReportToPdfPayload({ report: mockReport });

    expect(Array.isArray(result.domains)).toBe(true);
    expect(result.domains).toHaveLength(3);

    expect(result.domains[1]).toEqual({
      label: "OPERATIONAL_CLARITY",
      intent: 88,
      reality: 45,
      dissonance: 43,
    });
  });

  it("adds generated timestamp to PDF payload", () => {
    const before = Date.now();
    const result = serializeExecutiveReportToPdfPayload({ report: mockReport });
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

    const result = serializeExecutiveReportToPdfPayload({
      report: authorizedReport,
      constitution: { orgState: "ORDERED" },
    });

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

    const result = serializeExecutiveReportToPdfPayload({ report });

    expect(result.domains).toEqual([]);
  });
});
