import { describe, expect, it } from "vitest";

import {
  TEAM_ASSESSMENT_SINGLE_RESPONDENT_POLICY,
  evaluateJudgementAgainstDelivery,
  getJudgementTruthContract,
  getJudgementVsDeliveryTruth,
} from "@/lib/intelligence/judgement-truth-contract";

describe("judgement truth contract", () => {
  it("caps team assessment judgement by the consequence brief and delivery readiness", () => {
    const contract = getJudgementTruthContract("team_assessment");
    const truth = getJudgementVsDeliveryTruth("team_assessment");

    expect(contract).toBeDefined();
    expect(contract!.judgementCeiling).toBe(7);
    expect(truth).toBeDefined();
    expect(truth!.deliveryCeiling).toBe(6);
    expect(truth!.effectiveCeiling).toBe(6);
    expect(truth!.mustNotClaim.join(" ")).toMatch(
      /cross-respondent divergence from a single respondent/i,
    );
  });

  it("enforces the single-respondent confidence ceiling from the diagnostic architecture brief", () => {
    const evaluation = evaluateJudgementAgainstDelivery({
      surface: "team_assessment",
      proposedJudgementScore: 7,
      respondentCount: 1,
      confidence: "HIGH",
      claimsCrossRespondentDivergence: true,
    });

    expect(TEAM_ASSESSMENT_SINGLE_RESPONDENT_POLICY.maxJudgementScore).toBe(4);
    expect(evaluation.effectiveCeiling).toBe(4);
    expect(evaluation.allowedReleaseScore).toBe(4);
    expect(evaluation.violationReasons.join(" ")).toMatch(/may not claim HIGH confidence/i);
    expect(evaluation.violationReasons.join(" ")).toMatch(/may not claim cross-respondent divergence/i);
  });

  it("allows multi-respondent judgement to rise while still respecting the delivery ceiling", () => {
    const evaluation = evaluateJudgementAgainstDelivery({
      surface: "team_assessment",
      proposedJudgementScore: 8,
      respondentCount: 3,
      confidence: "MEDIUM",
      claimsCrossRespondentDivergence: true,
    });

    expect(evaluation.violationReasons).toEqual([]);
    expect(evaluation.effectiveCeiling).toBe(6);
    expect(evaluation.allowedReleaseScore).toBe(6);
    expect(evaluation.releaseCeilingReasons.join(" ")).toMatch(/exceeds the release ceiling/i);
  });
});
