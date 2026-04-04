// lib/ai/predictive-deal-engine.test.ts
import { describe, expect, it } from "vitest";
import { predictDealOutcome } from "./predictive-deal-engine";

describe("predictDealOutcome", () => {
  it("elevates strong founder/operator signals into high probability", () => {
    const result = predictDealOutcome({
      revenue: 1500000,
      problem:
        "We are scaling fast and leadership is starting to feel structural drag across execution, team clarity, and operating rhythm. We need intervention before the issue hardens.",
      urgency: "within weeks",
      authority: "yes",
      ruleScore: 88,
      aiScore: 84,
      aiConfidence: 0.92,
      sessionDepth: 7,
      timeOnSite: 720,
      returnVisitor: true,
    });

    expect(result.winProbability).toBeGreaterThanOrEqual(75);
    expect(result.priority === "HIGH" || result.priority === "CRITICAL").toBe(true);
    expect(result.nextBestAction).toBe("FAST_TRACK_STRATEGY");
  });

  it("routes moderate deals into diagnostic posture", () => {
    const result = predictDealOutcome({
      revenue: 280000,
      problem:
        "We need help understanding why our leadership team is feeling some drag and misalignment.",
      urgency: "within 2 months",
      authority: "no",
      ruleScore: 58,
      aiScore: 55,
      aiConfidence: 0.7,
      sessionDepth: 2,
      timeOnSite: 150,
      returnVisitor: false,
    });

    expect(result.winProbability).toBeGreaterThanOrEqual(35);
    expect(result.nextBestAction === "SEND_TO_DIAGNOSTIC" || result.nextBestAction === "MANUAL_REVIEW").toBe(true);
  });

  it("keeps weak or low-seriousness deals cold", () => {
    const result = predictDealOutcome({
      revenue: 40000,
      problem: "Just exploring options.",
      urgency: "sometime later",
      authority: "no",
      ruleScore: 18,
      aiScore: 12,
      aiConfidence: 0.55,
      sessionDepth: 1,
      timeOnSite: 40,
      returnVisitor: false,
    });

    expect(result.winProbability).toBeLessThan(35);
    expect(result.nextBestAction).toBe("REJECT_OR_NURTURE");
    expect(result.pipelineTemperature).toBe("COLD");
  });
});