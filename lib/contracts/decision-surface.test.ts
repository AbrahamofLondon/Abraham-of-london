import { describe, expect, it } from "vitest";

import {
  buildDecisionSurfacePayload,
  insufficientEvidenceContradiction,
  normalizeContradictionSeverity,
} from "./decision-surface";

describe("decision surface contract", () => {
  it("normalizes severity and rejects empty contradiction arrays", () => {
    expect(normalizeContradictionSeverity("critical")).toBe(95);
    expect(normalizeContradictionSeverity("high")).toBe(75);
    expect(normalizeContradictionSeverity(88)).toBe(88);

    expect(() => buildDecisionSurfacePayload({
      decisionId: "decision-1",
      contradictions: [],
      enforcementState: "ACTIVE",
    })).toThrow("at least one contradiction");
  });

  it("builds a deterministic payload with normalized contradictions", () => {
    const payload = buildDecisionSurfacePayload({
      decisionId: "decision-1",
      enforcementState: "ESCALATED",
      consequenceScore: 76.4,
      contradictions: [{
        id: "c1",
        label: "Authority conflict",
        summary: "Formal owner and actual owner diverge.",
        severity: "high",
        confidence: 0.82,
        sourceStage: "constitutional",
      }],
    });

    expect(payload.decisionId).toBe("decision-1");
    expect(payload.enforcementState).toBe("ESCALATED");
    expect(payload.consequenceScore).toBe(76);
    expect(payload.contradictions[0]?.severity).toBe(75);
  });

  it("creates a contract-compatible insufficient evidence contradiction", () => {
    const contradiction = insufficientEvidenceContradiction({
      id: "missing",
      sourceStage: "monitoring",
    });

    expect(contradiction.id).toBe("missing");
    expect(contradiction.sourceStage).toBe("monitoring");
    expect(contradiction.severity).toBe(50);
  });
});
