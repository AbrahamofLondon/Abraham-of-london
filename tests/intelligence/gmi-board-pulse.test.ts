import { describe, expect, it } from "vitest";

import { buildGmiBoardPulse } from "@/lib/intelligence/gmi-control-plane";

describe("GMI board pulse", () => {
  const pulse = buildGmiBoardPulse("GMI-Q2-2026");

  it("includes the Operator Consequence Index", () => {
    expect(pulse.operatorConsequenceIndex).toHaveLength(6);
    expect(pulse.operatorConsequenceIndex.every((item) => item.score >= 0 && item.score <= 5)).toBe(true);
    expect(pulse.operatorConsequenceIndex.every((item) => item.decisionImplication.length > 0)).toBe(true);
  });

  it("includes decision deadlines", () => {
    expect(pulse.boardDecisions).toHaveLength(5);
    expect(pulse.decisionsToPrepareIn90Days.length).toBeGreaterThan(0);
    expect(pulse.decisionsToDefer.length).toBeGreaterThan(0);
  });

  it("does not expose gated full-report content", () => {
    const serialized = JSON.stringify(pulse);
    expect(serialized).not.toContain("scenarioProbabilities");
    expect(serialized).not.toContain("fullEditionSourceAppendix");
    expect(serialized).not.toContain("CLIENT_SPECIFIC_ADDENDUM");
  });
});
