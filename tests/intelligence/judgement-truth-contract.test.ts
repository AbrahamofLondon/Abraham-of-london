import { describe, expect, it } from "vitest";

import { evaluateDeliverySurfaceContract } from "@/lib/intelligence/delivery-surface-contract";
import {
  TEAM_ASSESSMENT_SINGLE_RESPONDENT_POLICY,
  createJudgementTruthContract,
  evaluateJudgementAgainstDelivery,
  evaluateJudgementDeliveryReadiness,
  getJudgementTruthTemplate,
  getJudgementVsDeliveryTruth,
} from "@/lib/intelligence/judgement-truth-contract";

describe("judgement truth contract", () => {
  it("builds run-level judgement truth contracts with the required fields", () => {
    const contract = createJudgementTruthContract({
      judgementId: "judgement-team-001",
      runId: "run-team-001",
      productId: "team_assessment",
      isCaseDerived: true,
      evidenceAnchoredClaims: 4,
      unsupportedClaims: 0,
      changesWithEvidence: true,
      survivesContradiction: true,
      justifiesNextAction: true,
      namesRejectedAlternatives: true,
      falsificationQuestionsPresent: true,
      genericityResult: "passed",
    });

    expect(contract.judgementId).toBe("judgement-team-001");
    expect(contract.runId).toBe("run-team-001");
    expect(contract.productId).toBe("team_assessment");
    expect(contract.judgementScore).toBeGreaterThanOrEqual(4);
    expect(contract.blockerReasons).not.toContain("Judgement score is below the proof threshold.");
    expect(contract.blockerReasons).not.toContain("Judgement is not case-derived.");
  });

  it("caps non-case-derived judgement at 2", () => {
    const contract = createJudgementTruthContract({
      judgementId: "judgement-case-cap",
      runId: "run-case-cap",
      productId: "team_assessment",
      isCaseDerived: false,
      evidenceAnchoredClaims: 5,
      unsupportedClaims: 0,
      changesWithEvidence: true,
      survivesContradiction: true,
      justifiesNextAction: true,
      namesRejectedAlternatives: true,
      falsificationQuestionsPresent: true,
      genericityResult: "passed",
    });

    expect(contract.judgementScore).toBeLessThanOrEqual(2);
  });

  it("caps contradiction-failing judgement at 3", () => {
    const contract = createJudgementTruthContract({
      judgementId: "judgement-contradiction-cap",
      runId: "run-contradiction-cap",
      productId: "team_assessment",
      isCaseDerived: true,
      evidenceAnchoredClaims: 5,
      unsupportedClaims: 0,
      changesWithEvidence: true,
      survivesContradiction: false,
      justifiesNextAction: true,
      namesRejectedAlternatives: true,
      falsificationQuestionsPresent: true,
      genericityResult: "passed",
    });

    expect(contract.judgementScore).toBeLessThanOrEqual(3);
  });

  it("caps unjustified next-action judgement at 3", () => {
    const contract = createJudgementTruthContract({
      judgementId: "judgement-next-action-cap",
      runId: "run-next-action-cap",
      productId: "team_assessment",
      isCaseDerived: true,
      evidenceAnchoredClaims: 5,
      unsupportedClaims: 0,
      changesWithEvidence: true,
      survivesContradiction: true,
      justifiesNextAction: false,
      namesRejectedAlternatives: true,
      falsificationQuestionsPresent: true,
      genericityResult: "passed",
    });

    expect(contract.judgementScore).toBeLessThanOrEqual(3);
  });

  it("caps unsupported-claim-heavy judgement at 2", () => {
    const contract = createJudgementTruthContract({
      judgementId: "judgement-unsupported-cap",
      runId: "run-unsupported-cap",
      productId: "team_assessment",
      isCaseDerived: true,
      evidenceAnchoredClaims: 1,
      unsupportedClaims: 3,
      changesWithEvidence: true,
      survivesContradiction: true,
      justifiesNextAction: true,
      namesRejectedAlternatives: true,
      falsificationQuestionsPresent: true,
      genericityResult: "passed",
    });

    expect(contract.judgementScore).toBeLessThanOrEqual(2);
  });

  it("keeps team assessment delivery ceilings distinct from run-level judgement scoring", () => {
    const template = getJudgementTruthTemplate("team_assessment");
    const truth = getJudgementVsDeliveryTruth("team_assessment");

    expect(template).toBeDefined();
    expect(template?.judgementCeiling).toBe(7);
    expect(truth).toBeDefined();
    expect(truth?.deliveryCeiling).toBe(6);
    expect(truth?.effectiveCeiling).toBe(6);
    expect(truth?.mustNotClaim.join(" ")).toMatch(
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
    expect(evaluation.violationReasons.join(" ")).toMatch(
      /may not claim cross-respondent divergence/i,
    );
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

  it("does not let delivery polish compensate for weak judgement", () => {
    const judgement = createJudgementTruthContract({
      judgementId: "judgement-weak",
      runId: "run-weak",
      productId: "team_assessment",
      isCaseDerived: false,
      evidenceAnchoredClaims: 1,
      unsupportedClaims: 3,
      changesWithEvidence: "not_tested",
      survivesContradiction: "not_tested",
      justifiesNextAction: false,
      namesRejectedAlternatives: false,
      falsificationQuestionsPresent: false,
      genericityResult: "failed",
    });
    const delivery = evaluateDeliverySurfaceContract({
      artifactId: "artifact-strong",
      productId: "team_assessment",
      hasStructuredSections: true,
      hasExecutiveSummary: true,
      hasForensicLayer: true,
      hasEvidenceReferences: true,
      hasProvenanceReference: true,
      hasConfidenceDisclosure: true,
      mobileParity: true,
      readabilityClass: "board",
    });

    const readiness = evaluateJudgementDeliveryReadiness({
      judgement,
      delivery,
    });

    expect(delivery.deliverySurfaceScore).toBeGreaterThanOrEqual(4);
    expect(judgement.judgementScore).toBeLessThanOrEqual(2);
    expect(readiness.eligibleForIntelligenceProof).toBe(false);
    expect(readiness.blockers.join(" ")).toMatch(/cannot compensate/i);
  });
});
