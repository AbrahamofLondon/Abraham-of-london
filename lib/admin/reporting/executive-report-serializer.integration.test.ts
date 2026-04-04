import { describe, expect, it } from "vitest";
import { EXECUTIVE_REPORT_FIXTURE } from "./fixtures/executive-report.fixture";
import {
  serializeExecutiveReportToJson,
  serializeExecutiveReportToPdfPayload,
} from "./executive-report-serializer";

describe("executive-report serializer integration", () => {
  it("serializes fixture to stable JSON contract", () => {
    const result = serializeExecutiveReportToJson(EXECUTIVE_REPORT_FIXTURE);

    expect(result.meta.version).toBe("2.0.0");
    expect(result.meta.state).toBe("MISALIGNED");

    expect(result.narrative.headline).toBe(
      EXECUTIVE_REPORT_FIXTURE.narrative.headline
    );

    expect(result.ogr.sovereignCertainty).toBe(82.35);
    expect(result.ogr.isAuthorizedToExecute).toBe(false);

    expect(result.resonance.averageDissonance).toBe(25.5);
    expect(result.resonance.isDisordered).toBe(false);
    expect(result.resonance.domains).toHaveLength(4);

    expect(result.hcd.overallBurnoutIndex).toBe(71);
    expect(result.hcd.riskScore).toBe("HIGH");
    expect(result.hcd.totalReplacementCost).toBe(276500);
    expect(result.hcd.averageUtilization).toBe(89);
    expect(result.hcd.criticalDomains).toEqual([]);
    expect(result.hcd.elevatedDomains).toEqual(["LEADERSHIP_EXHAUSTION"]);

    expect(result.financialExposure.totalExposure).toBe(314750);
    expect(result.priorityStack).toHaveLength(4);
    expect(result.failureModes).toContain("Unauthorized Expansion");
  });

  it("serializes fixture to stable PDF payload contract", () => {
    const result = serializeExecutiveReportToPdfPayload(
      EXECUTIVE_REPORT_FIXTURE
    );

    expect(result.title).toBe("Executive Diagnostic Report");
    expect(result.subtitle).toBe("Institutional Diagnostics Engine");
    expect(result.state).toBe("MISALIGNED");

    expect(result.headline).toBe(
      EXECUTIVE_REPORT_FIXTURE.narrative.headline
    );
    expect(result.summary).toBe(
      EXECUTIVE_REPORT_FIXTURE.narrative.summary
    );
    expect(result.mandate).toBe(
      EXECUTIVE_REPORT_FIXTURE.narrative.mandate
    );

    expect(result.integrity).toEqual({
      sovereignCertainty: 82.35,
      authorized: false,
      averageDissonance: 25.5,
      burnoutIndex: 71,
    });

    expect(result.priorities).toEqual(
      EXECUTIVE_REPORT_FIXTURE.priorityStack
    );
    expect(result.failureModes).toEqual(
      EXECUTIVE_REPORT_FIXTURE.failureModes
    );
    expect(result.domains).toHaveLength(4);
  });

  it("preserves domain order from executive report metrics", () => {
    const json = serializeExecutiveReportToJson(EXECUTIVE_REPORT_FIXTURE);
    const pdf = serializeExecutiveReportToPdfPayload(EXECUTIVE_REPORT_FIXTURE);

    expect(json.resonance.domains[0].label).toBe("OPERATIONAL_CLARITY");
    expect(json.resonance.domains[1].label).toBe("LEADERSHIP_TRUST");
    expect(pdf.domains[0].label).toBe("OPERATIONAL_CLARITY");
    expect(pdf.domains[1].label).toBe("LEADERSHIP_TRUST");
  });

  it("preserves exposure values across JSON and PDF representations", () => {
    const json = serializeExecutiveReportToJson(EXECUTIVE_REPORT_FIXTURE);
    const pdf = serializeExecutiveReportToPdfPayload(EXECUTIVE_REPORT_FIXTURE);

    expect(json.financialExposure).toEqual({
      replacementCost: 276500,
      executionLoss: 38250,
      totalExposure: 314750,
    });

    expect(pdf.exposure.replacementCost).toContain("276");
    expect(pdf.exposure.executionLoss).toContain("38");
    expect(pdf.exposure.totalExposure).toContain("314");
  });

  it("produces valid ISO timestamps on both serializer outputs", () => {
    const json = serializeExecutiveReportToJson(EXECUTIVE_REPORT_FIXTURE);
    const pdf = serializeExecutiveReportToPdfPayload(EXECUTIVE_REPORT_FIXTURE);

    expect(Number.isFinite(Date.parse(json.meta.generatedAt))).toBe(true);
    expect(Number.isFinite(Date.parse(pdf.generatedAt))).toBe(true);
  });

  it("keeps unauthorized execution visible across both payloads", () => {
    const json = serializeExecutiveReportToJson(EXECUTIVE_REPORT_FIXTURE);
    const pdf = serializeExecutiveReportToPdfPayload(EXECUTIVE_REPORT_FIXTURE);

    expect(json.ogr.isAuthorizedToExecute).toBe(false);
    expect(pdf.integrity.authorized).toBe(false);
  });

  it("handles an ORDERED fixture cleanly", () => {
    const ordered = {
      ...EXECUTIVE_REPORT_FIXTURE,
      state: "ORDERED" as const,
      narrative: {
        headline: "Institutional Order Verified",
        summary: "The operating environment is governable and execution can proceed with discipline.",
        mandate: "Proceed with controlled execution and maintain signal integrity.",
      },
      ogr: {
        ...EXECUTIVE_REPORT_FIXTURE.ogr,
        sovereignCertainty: 94.2,
        isAuthorizedToExecute: true,
      },
      financialExposure: {
        replacementCost: 180000,
        executionLoss: 12000,
        totalExposure: 192000,
      },
    };

    const json = serializeExecutiveReportToJson(ordered);
    const pdf = serializeExecutiveReportToPdfPayload(ordered);

    expect(json.meta.state).toBe("ORDERED");
    expect(json.ogr.isAuthorizedToExecute).toBe(true);
    expect(pdf.state).toBe("ORDERED");
    expect(pdf.integrity.authorized).toBe(true);
    expect(pdf.integrity.sovereignCertainty).toBe(94.2);
  });

  it("handles a DISORDERED fixture cleanly", () => {
    const disordered = {
      ...EXECUTIVE_REPORT_FIXTURE,
      state: "DISORDERED" as const,
      narrative: {
        headline: "Systemic Disorder Detected",
        summary: "Average dissonance and talent fragility have crossed governable boundaries.",
        mandate: "Suspend acceleration and contain systemic drift immediately.",
      },
      resonance: {
        telemetry: {
          ...EXECUTIVE_REPORT_FIXTURE.resonance.telemetry,
          averageDissonance: 36.8,
          isDisordered: true,
        },
        metrics: EXECUTIVE_REPORT_FIXTURE.resonance.metrics,
      },
      ogr: {
        ...EXECUTIVE_REPORT_FIXTURE.ogr,
        sovereignCertainty: 68.1,
        isAuthorizedToExecute: false,
      },
    };

    const json = serializeExecutiveReportToJson(disordered);
    const pdf = serializeExecutiveReportToPdfPayload(disordered);

    expect(json.meta.state).toBe("DISORDERED");
    expect(json.resonance.isDisordered).toBe(true);
    expect(pdf.state).toBe("DISORDERED");
    expect(pdf.integrity.averageDissonance).toBe(36.8);
    expect(pdf.integrity.authorized).toBe(false);
  });
});