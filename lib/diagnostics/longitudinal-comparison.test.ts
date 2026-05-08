import { describe, expect, it } from "vitest";

import { computeLongitudinalComparison } from "./longitudinal-comparison";

const baseline = {
  id: "j_base",
  diagnosticType: "executive",
  startedAt: "2026-01-01T00:00:00.000Z",
  evidenceNodes: [
    {
      sourceStage: "executive_reporting" as const,
      kind: "contradiction" as const,
      label: "Authority mismatch",
      summary: "Authority mismatch",
      confidence: 0.8,
      severity: "high" as const,
    },
    {
      sourceStage: "monitoring" as const,
      kind: "resolved_condition" as const,
      label: "Authority mismatch resolved",
      summary: "Authority mismatch resolved",
      confidence: 0.7,
      severity: "low" as const,
    },
    {
      sourceStage: "executive_reporting" as const,
      kind: "exposure_estimate" as const,
      label: "Risk",
      summary: "Risk",
      confidence: 0.7,
      severity: "medium" as const,
      payload: { totalRisk: 40 },
    },
  ],
  decisionObjects: [
    {
      sourceStage: "executive_reporting" as const,
      decisionKey: "authority-decision",
      decisionText: "Name the decision owner",
      confidence: 0.8,
      normalized: {
        avoidedOrFaced: true,
        hasConstraint: true,
        hasPriorAttempt: false,
        hasDelayCost: false,
        hasStakeholder: true,
        hasCompetingObligation: false,
        hasInstitutionalConsequence: false,
        extractedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  ],
  monitoringSnapshots: [
    {
      snapshot: {
        timestamp: "2026-01-01T00:00:00.000Z",
        coreMetrics: { clarityScore: 52, authorityScore: 40 },
        escalationLevel: 1,
        directive: "DIAGNOSTIC",
      },
    },
  ],
};

const current = {
  id: "j_current",
  diagnosticType: "executive",
  startedAt: "2026-04-01T00:00:00.000Z",
  evidenceNodes: [
    {
      sourceStage: "executive_reporting" as const,
      kind: "contradiction" as const,
      label: "Authority mismatch",
      summary: "Authority mismatch",
      confidence: 0.85,
      severity: "high" as const,
    },
    {
      sourceStage: "executive_reporting" as const,
      kind: "exposure_estimate" as const,
      label: "Risk",
      summary: "Risk",
      confidence: 0.7,
      severity: "high" as const,
      payload: { totalRisk: 62 },
    },
  ],
  decisionObjects: baseline.decisionObjects,
  monitoringSnapshots: [
    {
      snapshot: {
        timestamp: "2026-04-01T00:00:00.000Z",
        coreMetrics: { clarityScore: 60, authorityScore: 35 },
        escalationLevel: 3,
        directive: "STRATEGY",
      },
    },
  ],
};

describe("computeLongitudinalComparison", () => {
  it("loads a baseline, computes deltas, and detects recurrence", () => {
    const result = computeLongitudinalComparison(current, [baseline]);

    expect(result.baseline?.id).toBe("j_base");
    expect(result.delta.daysBetween).toBe(90);
    expect(result.delta.scoreDeltas.clarityScore).toBe(8);
    expect(result.delta.scoreDeltas.authorityScore).toBe(-5);
    expect(result.delta.escalationDelta).toBe(2);
    expect(result.delta.consequenceTrajectory).toBe("deteriorated");
    expect(result.recurrence.resolvedPatternReappeared).toBe(true);
    expect(result.recurrence.recurringDecisionKeys).toContain("authority-decision");
    expect(result.evidenceNodes.some((node) => node.kind === "delta_summary")).toBe(true);
    expect(result.evidenceNodes.some((node) => node.kind === "pattern_recurrence")).toBe(true);
  });
});
