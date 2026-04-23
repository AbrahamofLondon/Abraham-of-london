import { describe, expect, it } from "vitest";
import { classifyAIDecisionRisk, aiStatusSignalFromDelta } from "./ai-decision-risk";

describe("AI-adaptive decision risk", () => {
  it("flags manual high-exposure decisions as AI absence or lag", () => {
    const result = classifyAIDecisionRisk({
      decisionText: "Keep the manual reporting workflow for competitor response analysis",
      constraintText: "Operations still rely on spreadsheet reconciliation",
      decisionVelocityScore: 30,
    });

    expect(result.aiExposureLevel).toBe("HIGH");
    expect(["AI_ABSENCE", "AI_LAG"]).toContain(result.classification);
    expect(result.contradiction?.type).toBe("AI_CAPABILITY_CONTRADICTION");
    expect(result.contradiction?.severityMultiplier).toBe(1.5);
  });

  it("blocks high-exposure decisions unless an AI leverage action is provided elsewhere", () => {
    const result = classifyAIDecisionRisk({
      decisionText: "Redesign manual support triage against AI-enabled competitors",
      aiExposureLevel: "CRITICAL",
      decisionVelocityScore: 42,
    });

    expect(result.requiresAILeverageAction).toBe(true);
    expect(result.accelerationRiskScore).toBeGreaterThan(0);
  });

  it("classifies drift deltas into velocity status signals", () => {
    expect(aiStatusSignalFromDelta(-8)).toBe("VELOCITY LOSS");
    expect(aiStatusSignalFromDelta(0)).toBe("PARITY HOLD");
    expect(aiStatusSignalFromDelta(9)).toBe("ACCELERATION GAIN");
  });
});
