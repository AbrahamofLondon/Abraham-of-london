import { describe, expect, it } from "vitest";

import { CONTROLLED_TRUTH_CLAIMS, getControlledTruthClaim } from "@/lib/intelligence/claim-vocabulary-registry";
import {
  evaluateTruthClaimFirewall,
  inspectTruthClaimsInText,
} from "@/lib/intelligence/truth-claim-firewall";

describe("truth claim firewall", () => {
  it("covers the required controlled estate vocabulary", () => {
    expect(CONTROLLED_TRUTH_CLAIMS.map((claim) => claim.id)).toEqual([
      "intelligent",
      "diagnostic",
      "judgement_led",
      "board_grade",
      "decision_ready",
      "action_ready",
      "evidence_backed",
      "validated",
      "red_team_tested",
      "anti_toy_tested",
      "market_compared",
      "generic_ai_compared",
      "provenance_verified",
      "outcome_informed",
    ]);
  });

  it("maps judgement-led claims to originator-only posture with rejected alternatives", () => {
    const claim = getControlledTruthClaim("judgement_led");

    expect(claim).toBeDefined();
    expect(claim?.requirements.productClasses).toEqual(["originator"]);
    expect(claim?.requirements.minimumJudgementScore).toBe(4);
    expect(claim?.requirements.requireRejectedAlternatives).toBe(true);
  });

  it("blocks wrapper products from claiming intelligence even when other states are present", () => {
    const decision = evaluateTruthClaimFirewall({
      claimId: "intelligent",
      surface: "PUBLIC_PRODUCT_COPY",
      productClass: "wrapper",
      publicClaimAllowed: true,
      evidenceState: "source_backed",
      runState: "VERIFIED",
      harnessState: "PASSING",
      judgementScore: 5,
    });

    expect(decision.decision).toBe("blocked");
    expect(decision.blockers.join(" ")).toMatch(/product class wrapper/i);
  });

  it("fails closed when benchmarked, weak-evidence-safe, and provenance states are missing", () => {
    const decision = evaluateTruthClaimFirewall({
      claimId: "decision_ready",
      surface: "PUBLIC_PRODUCT_COPY",
      productClass: "originator",
      publicClaimAllowed: true,
      evidenceState: "source_backed",
      runState: "VERIFIED",
      harnessState: "PASSING",
      judgementScore: 5,
    });

    expect(decision.decision).toBe("blocked");
    expect(decision.blockers).toContain("Benchmark record is missing.");
  });

  it("allows provenance-verified only when provenance is explicitly verified", () => {
    const decision = evaluateTruthClaimFirewall({
      claimId: "provenance_verified",
      surface: "PUBLIC_PROOF_COPY",
      publicClaimAllowed: true,
      provenanceState: "VERIFIED",
    });

    expect(decision.decision).toBe("allowed");
    expect(decision.blockers).toEqual([]);
  });

  it("blocks action-ready without completed outcome evidence", () => {
    const decision = evaluateTruthClaimFirewall({
      claimId: "action_ready",
      surface: "PUBLIC_PRODUCT_COPY",
      productClass: "originator",
      publicClaimAllowed: true,
      evidenceState: "source_backed",
      runState: "VERIFIED",
      harnessState: "PASSING",
      judgementScore: 5,
      benchmarkRecordPresent: true,
      outcomeState: "INSUFFICIENT",
    });

    expect(decision.decision).toBe("blocked");
    expect(decision.blockers.join(" ")).toMatch(/outcome state/i);
  });

  it("catches controlled language in explicit product-copy sample input", () => {
    const inspection = inspectTruthClaimsInText({
      text: "This product is judgement-led, decision-ready, and evidence-backed.",
      surface: "PUBLIC_PRODUCT_COPY",
    });

    expect(inspection.violations.map((entry) => entry.claimId)).toEqual([
      "judgement_led",
      "decision_ready",
      "evidence_backed",
    ]);
  });

  it("treats sample and disclaimer contexts as bounded instead of passing them as truth claims", () => {
    const inspection = inspectTruthClaimsInText({
      text: [
        "Demonstration only. Sample data for explanation.",
        "This sample is provenance-verified and outcome-informed.",
        "Not connected to your account.",
      ].join("\n"),
      surface: "PUBLIC_SAMPLE_COPY",
    });

    expect(inspection.violations).toHaveLength(0);
    expect(inspection.boundedFindings).toHaveLength(2);
    expect(inspection.boundedFindings.map((entry) => entry.claimId)).toEqual([
      "provenance_verified",
      "outcome_informed",
    ]);
  });
});
