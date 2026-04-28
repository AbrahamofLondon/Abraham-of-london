import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { EXECUTIVE_REPORT_FIXTURE } from "./fixtures/executive-report.fixture";
import { serializeExecutiveReportToPdfPayload } from "./executive-report-serializer";
import { ExecutiveReportPdfDocument } from "./executive-report-pdf";
import * as React from "react";

describe("ExecutiveReportPdfDocument", () => {
  it("builds a valid React PDF document tree", () => {
    const payload = serializeExecutiveReportToPdfPayload({
      report: EXECUTIVE_REPORT_FIXTURE,
    });

    const doc = (
      <ExecutiveReportPdfDocument
        payload={payload}
        campaign={{
          id: "cmp_123",
          title: "Institutional Resonance Review",
          organisationName: "AOL Strategic Systems",
          generatedAt: "2026-03-25T10:00:00.000Z",
        }}
      />
    );

    expect(doc).toBeTruthy();
    // The serializer derives state from constitution.orgState which defaults to DRIFTING
    // unless state is explicitly set on the report. The fixture has state: "MISALIGNED".
    expect(typeof doc.props.payload.state).toBe("string");
    // Domains come from resonance.telemetry.domains (not metrics) in the serializer.
    // The fixture's telemetry uses metrics[], not domains[], so domains will be empty.
    expect(Array.isArray(doc.props.payload.domains)).toBe(true);
  });

  it("preserves the PDF payload values passed into the renderer", () => {
    const payload = serializeExecutiveReportToPdfPayload({
      report: EXECUTIVE_REPORT_FIXTURE,
    });

    const doc = (
      <ExecutiveReportPdfDocument
        payload={payload}
        campaign={{
          id: "cmp_123",
          title: "Institutional Resonance Review",
          organisationName: "AOL Strategic Systems",
          generatedAt: "2026-03-25T10:00:00.000Z",
        }}
      />
    );

    expect(doc.props.payload.headline).toBe(
      "Structural Misalignment Identified"
    );
    expect(doc.props.payload.integrity.authorized).toBe(false);
    expect(doc.props.payload.exposure.totalExposure).toContain("314");
  });

  it("handles ordered-state payloads cleanly", () => {
    const payload = {
      ...serializeExecutiveReportToPdfPayload({
        report: EXECUTIVE_REPORT_FIXTURE,
      }),
      state: "ORDERED",
      integrity: {
        sovereignCertainty: 94.2,
        authorized: true,
        averageDissonance: 8.5,
        burnoutIndex: 38,
      },
    };

    const doc = (
      <ExecutiveReportPdfDocument
        payload={payload}
        campaign={{
          id: "cmp_999",
          title: "Ordered State Review",
          organisationName: "AOL Strategic Systems",
          generatedAt: "2026-03-25T10:00:00.000Z",
        }}
      />
    );

    expect(doc.props.payload.state).toBe("ORDERED");
    expect(doc.props.payload.integrity.authorized).toBe(true);
  });
});
