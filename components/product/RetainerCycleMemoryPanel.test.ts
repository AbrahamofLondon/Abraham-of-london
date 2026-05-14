import { describe, expect, it } from "vitest";

import {
  buildRetainerCycleMemoryPanelModel,
  getRetainerCycleMemoryEscalationLabel,
  getRetainerCycleMemoryStatusLabel,
} from "@/components/product/RetainerCycleMemoryPanel";

describe("RetainerCycleMemoryPanel helpers", () => {
  it("maps all cycle-memory statuses to restrained governance labels", () => {
    expect(getRetainerCycleMemoryStatusLabel("NEW_SIGNAL")).toBe("New operating signal");
    expect(getRetainerCycleMemoryStatusLabel("REPEATED_SIGNAL")).toBe("Repeated operating pattern");
    expect(getRetainerCycleMemoryStatusLabel("DETERIORATED_AFTER_WARNING")).toBe("Deteriorated after prior warning");
    expect(getRetainerCycleMemoryStatusLabel("DETERIORATED_AFTER_INTERVENTION")).toBe("Deteriorated after intervention");
    expect(getRetainerCycleMemoryStatusLabel("IMPROVED_AFTER_INTERVENTION")).toBe("Improved after intervention");
    expect(getRetainerCycleMemoryStatusLabel("STABLE_UNRESOLVED")).toBe("Stable but unresolved");
    expect(getRetainerCycleMemoryStatusLabel("EVIDENCE_UNAVAILABLE")).toBe("Evidence unavailable");
    expect(getRetainerCycleMemoryStatusLabel("INSUFFICIENT_HISTORY")).toBe("Insufficient history");
  });

  it("builds a restrained empty state for null memory", () => {
    const model = buildRetainerCycleMemoryPanelModel(null);
    expect(model.empty).toBe(true);
    expect(model.summary).toContain("enough archived oversight history");
  });

  it("does not expose raw snapshot-like fields in the formatted finding model", () => {
    const model = buildRetainerCycleMemoryPanelModel({
      status: "available",
      generatedAt: "2026-05-14T00:00:00.000Z",
      accountId: "acct_1",
      userId: "user_1",
      escalationRequired: true,
      escalationLevel: "RETAINED_INTERVENTION",
      summary: "Prior cycle evidence indicates this operating pattern repeated after prior warning.",
      findings: [{
        id: "finding_1",
        signalKey: "meetingCancellationRate",
        source: "google_calendar",
        status: "DETERIORATED_AFTER_WARNING",
        severity: "HIGH",
        currentDirection: "DETERIORATING",
        priorDirections: ["DETERIORATING"],
        cyclesObserved: 2,
        cyclesDeteriorating: 2,
        cyclesUnavailable: 0,
        explanation: "Prior cycle evidence indicates the same source and signal deteriorated again after warning.",
        recommendedAction: "Retained intervention recommended.",
      }],
    });

    expect(model.empty).toBe(false);
    expect(model.findings[0]?.statusLabel).toBe("Deteriorated after prior warning");
    expect(model.findings[0]?.sourceLabel).toBe("Google Calendar");
    expect(model.findings[0]).not.toHaveProperty("rawCountBasis");
    expect(model.findings[0]).not.toHaveProperty("metadata");
    expect(model.findings[0]).not.toHaveProperty("payload");
    expect(model.findings[0]).not.toHaveProperty("attendees");
  });

  it("maps escalation labels without adding extra escalation language", () => {
    expect(getRetainerCycleMemoryEscalationLabel("NONE")).toBe("No escalation required.");
    expect(getRetainerCycleMemoryEscalationLabel("OPERATING_CADENCE_RESET")).toBe("Operating cadence reset recommended.");
    expect(getRetainerCycleMemoryEscalationLabel("RETAINED_INTERVENTION")).toBe("Retained intervention recommended.");
    expect(getRetainerCycleMemoryEscalationLabel("BOARDROOM_REVIEW")).toBe("Boardroom review threshold reached.");
    expect(getRetainerCycleMemoryEscalationLabel("COUNSEL_REVIEW")).toBe("Counsel review threshold reached.");
  });
});
