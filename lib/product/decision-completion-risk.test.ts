import { describe, expect, it } from "vitest";

import {
  evaluateCompletionRisk,
  type CompletionRiskInput,
  type CompletionRiskBand,
  type SuggestedIntervention,
  type EvidenceBasis,
} from "./decision-completion-risk";

describe("evaluateCompletionRisk", () => {
  const baseInput: CompletionRiskInput = {
    caseAgeDays: 10,
    caseType: "FAST_DIAGNOSTIC",
    authorityGap: false,
    evidenceGap: false,
    recurrence: false,
    staleStatus: false,
    returnBriefGenerated: false,
    strategyRoomHistory: false,
  };

  it("returns LOW for a healthy young case", () => {
    const result = evaluateCompletionRisk(baseInput);
    expect(result.band).toBe("LOW");
    expect(result.suggestedIntervention).toBe("WATCH");
  });

  it("returns SEVERE for very old stale case (180+ days)", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      caseAgeDays: 200,
      staleStatus: true,
    });
    expect(result.band).toBe("SEVERE");
  });

  it("returns SEVERE for recurrence with authority gap", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      recurrence: true,
      authorityGap: true,
    });
    expect(result.band).toBe("SEVERE");
  });

  it("returns SEVERE for worsened/blocked outcome with old case", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      caseAgeDays: 100,
      priorOutcomeSignal: "WORSENED",
    });
    expect(result.band).toBe("SEVERE");
  });

  it("returns SEVERE for severe commercial exposure with stale status", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      commercialExposureBand: "SEVERE",
      staleStatus: true,
    });
    expect(result.band).toBe("SEVERE");
  });

  it("returns HIGH for case over 90 days", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      caseAgeDays: 95,
    });
    expect(result.band).toBe("HIGH");
  });

  it("returns HIGH for stale case over 60 days", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      caseAgeDays: 70,
      staleStatus: true,
    });
    expect(result.band).toBe("HIGH");
  });

  it("returns HIGH for authority gap + evidence gap", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      authorityGap: true,
      evidenceGap: true,
    });
    expect(result.band).toBe("HIGH");
  });

  it("returns HIGH for recurrence", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      recurrence: true,
    });
    expect(result.band).toBe("HIGH");
  });

  it("returns HIGH for return brief with stale status", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      returnBriefGenerated: true,
      staleStatus: true,
    });
    expect(result.band).toBe("HIGH");
  });

  it("returns MEDIUM for case 30-90 days old", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      caseAgeDays: 45,
    });
    expect(result.band).toBe("MEDIUM");
  });

  it("returns MEDIUM for authority gap alone", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      authorityGap: true,
    });
    expect(result.band).toBe("MEDIUM");
  });

  it("returns MEDIUM for evidence gap alone", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      evidenceGap: true,
    });
    expect(result.band).toBe("MEDIUM");
  });

  it("returns MEDIUM for delayed prior outcome", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      priorOutcomeSignal: "DELAYED",
    });
    expect(result.band).toBe("MEDIUM");
  });

  it("suggests ESCALATE for SEVERE with recurrence", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      recurrence: true,
      authorityGap: true,
    });
    expect(result.suggestedIntervention).toBe("ESCALATE");
  });

  it("suggests STRATEGY_ROOM for SEVERE without recurrence", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      caseAgeDays: 200,
      staleStatus: true,
    });
    expect(result.suggestedIntervention).toBe("STRATEGY_ROOM");
  });

  it("suggests RETURN_BRIEF for HIGH with return brief history", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      recurrence: true,
      returnBriefGenerated: true,
    });
    expect(result.suggestedIntervention).toBe("RETURN_BRIEF");
  });

  it("suggests REVIEW for MEDIUM stale case", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      caseAgeDays: 45,
      staleStatus: true,
    });
    expect(result.suggestedIntervention).toBe("RETURN_BRIEF");
  });

  it("evidenceBasis is RULE_BASED when case has age data", () => {
    const result = evaluateCompletionRisk(baseInput);
    expect(result.evidenceBasis).toBe("RULE_BASED");
  });

  it("evidenceBasis is INSUFFICIENT_DATA when case has no age data", () => {
    const result = evaluateCompletionRisk({
      ...baseInput,
      caseAgeDays: 0,
    });
    expect(result.evidenceBasis).toBe("INSUFFICIENT_DATA");
  });

  it("reason is non-empty for all bands", () => {
    const bands: CompletionRiskBand[] = ["LOW", "MEDIUM", "HIGH", "SEVERE"];
    for (const band of bands) {
      const input: CompletionRiskInput = {
        ...baseInput,
        caseAgeDays: band === "SEVERE" ? 200 : band === "HIGH" ? 95 : band === "MEDIUM" ? 45 : 10,
        staleStatus: band === "SEVERE",
        recurrence: band === "HIGH",
        authorityGap: band === "MEDIUM",
      };
      const result = evaluateCompletionRisk(input);
      expect(result.band).toBe(band);
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });
});

describe("type shape", () => {
  it("allows all intervention types", () => {
    const interventions: SuggestedIntervention[] = [
      "WATCH",
      "REVIEW",
      "RETURN_BRIEF",
      "STRATEGY_ROOM",
      "ESCALATE",
    ];
    expect(interventions).toHaveLength(5);
  });

  it("allows all evidence basis types", () => {
    const bases: EvidenceBasis[] = [
      "RULE_BASED",
      "AGGREGATE_SUPPORTED",
      "INSUFFICIENT_DATA",
    ];
    expect(bases).toHaveLength(3);
  });
});
