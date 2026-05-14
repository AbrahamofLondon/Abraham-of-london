import { describe, expect, it } from "vitest";

import { toDecisionCentreRetainerMemoryPreview } from "@/lib/product/decision-centre-retainer-memory";
import type { RetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-contract";

function makeSummary(): RetainerCycleMemorySummary {
  return {
    status: "available",
    generatedAt: "2026-05-14T00:00:00.000Z",
    accountId: "acct_1",
    userId: "user_1",
    escalationRequired: true,
    escalationLevel: "RETAINED_INTERVENTION",
    summary: "Prior cycle evidence indicates this operating pattern repeated.",
    findings: Array.from({ length: 4 }, (_, index) => ({
      id: `finding_${index}`,
      signalKey: `signal_${index}`,
      source: "google_calendar",
      sourceLabel: "Calendar reliability",
      status: "REPEATED_SIGNAL",
      severity: "HIGH",
      currentDirection: "DETERIORATING",
      priorDirections: ["DETERIORATING"],
      cyclesObserved: 3,
      cyclesDeteriorating: 2,
      cyclesUnavailable: 0,
      lastObservedAt: "2026-05-14T00:00:00.000Z",
      lastInterventionAt: "2026-05-01T00:00:00.000Z",
      lastWarningAt: "2026-04-01T00:00:00.000Z",
      explanation: "Prior cycle evidence indicates this operating pattern repeated.",
      recommendedAction: "Retained intervention recommended.",
    })),
  };
}

describe("toDecisionCentreRetainerMemoryPreview", () => {
  it("returns null when no retained memory summary is available", () => {
    expect(toDecisionCentreRetainerMemoryPreview(null)).toBeNull();
  });

  it("projects only the Decision Centre-safe retained memory shape", () => {
    const preview = toDecisionCentreRetainerMemoryPreview(makeSummary());

    expect(preview?.findings).toHaveLength(3);
    expect(preview?.escalationLevel).toBe("RETAINED_INTERVENTION");
    expect(preview?.findings[0]).toEqual({
      status: "REPEATED_SIGNAL",
      severity: "HIGH",
      signalKey: "signal_0",
      source: "google_calendar",
      sourceLabel: "Calendar reliability",
      explanation: "Prior cycle evidence indicates this operating pattern repeated.",
      recommendedAction: "Retained intervention recommended.",
    });
    expect(preview).not.toHaveProperty("accountId");
    expect(preview).not.toHaveProperty("userId");
    expect(preview?.findings[0]).not.toHaveProperty("id");
    expect(preview?.findings[0]).not.toHaveProperty("cyclesObserved");
    expect(preview?.findings[0]).not.toHaveProperty("currentDirection");
    expect(preview?.findings[0]).not.toHaveProperty("lastWarningAt");
    expect(preview?.findings[0]).not.toHaveProperty("rawCountBasis");
    expect(preview?.findings[0]).not.toHaveProperty("metadata");
    expect(preview?.findings[0]).not.toHaveProperty("payload");
  });
});
