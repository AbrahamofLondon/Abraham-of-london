import { describe, expect, it } from "vitest";

import {
  buildRetainerMemoryPreviewModel,
  getDecisionCentreRetainerMemoryEscalationLabel,
  getDecisionCentreRetainerMemoryStatusCopy,
  getDecisionCentreRetainerMemoryStatusLabel,
  retainerMemoryPreviewStyles,
} from "@/components/decision-centre/RetainerMemoryPreview";
import { metadataLabelStyle, microLabelStyle } from "@/lib/design/typography";
import type { DecisionCentreRetainerMemoryPreview } from "@/lib/product/decision-centre-contract";

function makePreview(
  overrides: Partial<DecisionCentreRetainerMemoryPreview> = {},
): DecisionCentreRetainerMemoryPreview {
  return {
    status: "available",
    escalationLevel: "NONE",
    escalationRequired: false,
    summary: "Prior cycle evidence indicates this operating pattern repeated.",
    findings: [
      {
        status: "REPEATED_SIGNAL",
        severity: "HIGH",
        signalKey: "meetingCancellationRate",
        source: "google_calendar",
        sourceLabel: "Calendar reliability",
        explanation: "Prior cycle evidence indicates this operating pattern repeated.",
        recommendedAction: "Retained intervention recommended.",
      },
    ],
    ...overrides,
  };
}

describe("RetainerMemoryPreview model", () => {
  it("renders null and insufficient memory as restrained empty states", () => {
    expect(buildRetainerMemoryPreviewModel(null).summary).toContain("enough archived oversight history");

    const insufficient = buildRetainerMemoryPreviewModel(makePreview({
      status: "insufficient",
      summary: "Original insufficient summary.",
      findings: [],
    }));
    expect(insufficient.empty).toBe(true);
    expect(insufficient.statusLabel).toBe("Insufficient history");
    expect(insufficient.summary).toBe("Retained memory is establishing its baseline. This is not yet recurrence.");
  });

  it("renders new signal as first-cycle signal, not recurrence", () => {
    expect(getDecisionCentreRetainerMemoryStatusLabel("NEW_SIGNAL")).toBe("New signal");
    expect(getDecisionCentreRetainerMemoryStatusCopy("NEW_SIGNAL")).toBe("This is a first-cycle signal, not recurrence.");
  });

  it("renders repeated signal with prior-cycle language", () => {
    const model = buildRetainerMemoryPreviewModel(makePreview());
    expect(model.statusLabel).toBe("Repeated pattern");
    expect(model.statusCopy).toBe("Prior cycle evidence indicates this operating pattern repeated.");
  });

  it("renders deteriorated-after-warning only when provided by data", () => {
    const model = buildRetainerMemoryPreviewModel(makePreview({
      findings: [
        {
          status: "DETERIORATED_AFTER_WARNING",
          severity: "CRITICAL",
          signalKey: "responseDelay",
          source: "decision_centre",
          sourceLabel: "Decision Centre",
          explanation: "Prior cycle evidence indicates this pattern deteriorated after warning.",
          recommendedAction: "Operating cadence reset recommended.",
        },
      ],
    }));

    expect(model.statusLabel).toBe("Deteriorated after warning");
    expect(model.statusCopy).toContain("after warning");
  });

  it("uses sourceLabel when present and a formatted source fallback when absent", () => {
    const model = buildRetainerMemoryPreviewModel(makePreview({
      findings: [
        {
          status: "REPEATED_SIGNAL",
          severity: "HIGH",
          signalKey: "meetingCancellationRate",
          source: "google_calendar",
          sourceLabel: "Calendar reliability",
          explanation: "Prior cycle evidence indicates this operating pattern repeated.",
          recommendedAction: "Retained intervention recommended.",
        },
        {
          status: "NEW_SIGNAL",
          severity: "LOW",
          signalKey: "checkpointGap",
          source: "decision_centre",
          sourceLabel: null,
          explanation: "This is a first-cycle signal, not recurrence.",
          recommendedAction: "Review evidence posture.",
        },
      ],
    }));

    expect(model.findings[0]?.sourceLabel).toBe("Calendar reliability");
    expect(model.findings[1]?.sourceLabel).toBe("Decision Centre");
  });

  it("caps findings at three", () => {
    const findings = Array.from({ length: 4 }, (_, index) => ({
      status: "REPEATED_SIGNAL" as const,
      severity: "MEDIUM" as const,
      signalKey: `signal_${index}`,
      source: "decision_centre",
      sourceLabel: null,
      explanation: "Prior cycle evidence indicates this operating pattern repeated.",
      recommendedAction: "Review retained oversight posture.",
    }));

    expect(buildRetainerMemoryPreviewModel(makePreview({ findings })).findings).toHaveLength(3);
  });

  it("does not expose raw snapshot-like fields in the display model", () => {
    const model = buildRetainerMemoryPreviewModel(makePreview({
      findings: [
        {
          status: "REPEATED_SIGNAL",
          severity: "HIGH",
          signalKey: "meetingCancellationRate",
          source: "google_calendar",
          sourceLabel: "Calendar reliability",
          explanation: "Prior cycle evidence indicates this operating pattern repeated.",
          recommendedAction: "Retained intervention recommended.",
        } as DecisionCentreRetainerMemoryPreview["findings"][number] & {
          rawCountBasis: unknown;
          metadata: unknown;
          payload: unknown;
          attendees: unknown;
        },
      ],
    }));

    expect(model.findings[0]).not.toHaveProperty("rawCountBasis");
    expect(model.findings[0]).not.toHaveProperty("metadata");
    expect(model.findings[0]).not.toHaveProperty("payload");
    expect(model.findings[0]).not.toHaveProperty("attendees");
  });

  it("does not infer escalation beyond escalationLevel", () => {
    const model = buildRetainerMemoryPreviewModel(makePreview({
      escalationLevel: "NONE",
      escalationRequired: false,
      findings: [
        {
          status: "DETERIORATED_AFTER_WARNING",
          severity: "CRITICAL",
          signalKey: "responseDelay",
          source: "decision_centre",
          sourceLabel: "Decision Centre",
          explanation: "Prior cycle evidence indicates this pattern deteriorated after warning.",
          recommendedAction: "Review cadence.",
        },
      ],
    }));

    expect(model.escalationLabel).toBe("No escalation required.");
    expect(getDecisionCentreRetainerMemoryEscalationLabel("BOARDROOM_REVIEW")).toBe("Boardroom review threshold reached.");
  });

  it("uses the shared metadata and micro label token references", () => {
    expect(retainerMemoryPreviewStyles.metadataLabel).toBe(metadataLabelStyle);
    expect(retainerMemoryPreviewStyles.microLabel).toBe(microLabelStyle);
  });
});
