import { describe, expect, it } from "vitest";

import { getControlledTruthClaim } from "@/lib/intelligence/claim-vocabulary-registry";
import {
  evaluateTruthClaimFirewall,
  inspectTruthClaimsInText,
} from "@/lib/intelligence/truth-claim-firewall";

const TRUSTED_EVIDENCE_STATE = {
  ledgerEntryExists: true,
  ledgerStatus: "trusted_artifact_supported" as const,
  hasValidV2Evidence: true,
  canSupportAuthorityReview: true,
};

describe("truth claim firewall", () => {
  it("defines controlled claims with explicit state requirements", () => {
    const claim = getControlledTruthClaim("externally_proven");

    expect(claim).toBeDefined();
    expect(claim?.requirements.authorityStates).toEqual([
      "externally_proven_gold_product",
    ]);
    expect(claim?.requirements.evidenceStatuses).toEqual([
      "trusted_artifact_supported",
    ]);
    expect(claim?.requirements.runStates).toEqual(["VERIFIED"]);
    expect(claim?.requirements.harnessStates).toEqual(["VERIFIED"]);
    expect(claim?.requirements.provenanceStates).toEqual(["AVAILABLE"]);
    expect(claim?.requirements.outcomeStates).toEqual([
      "CONFIRMED_STRONGLY",
    ]);
  });

  it("fails closed when evidence, run, harness, provenance, and outcome states are missing", () => {
    const decision = evaluateTruthClaimFirewall({
      claimId: "externally_proven",
      surface: "PUBLIC_PRODUCT_COPY",
      authorityState: "externally_proven_gold_product",
      publicClaimAllowed: true,
    });

    expect(decision.decision).toBe("blocked");
    expect(decision.blockers).toContain("Missing evidence state.");
    expect(decision.blockers).toContain("Missing run state.");
    expect(decision.blockers).toContain("Missing harness state.");
    expect(decision.blockers).toContain("Missing provenance state.");
    expect(decision.blockers).toContain("Missing outcome state.");
  });

  it("enforces class ceilings for outcome claims on public product copy", () => {
    const decision = evaluateTruthClaimFirewall({
      claimId: "verified_outcome",
      surface: "PUBLIC_PRODUCT_COPY",
      authorityState: "externally_proven_gold_product",
      publicClaimAllowed: true,
      evidenceState: TRUSTED_EVIDENCE_STATE,
      runState: "VERIFIED",
      harnessState: "VERIFIED",
      provenanceState: "AVAILABLE",
      outcomeState: "CONFIRMED_STRONGLY",
    });

    expect(decision.decision).toBe("blocked");
    expect(
      decision.blockers.some((blocker) =>
        blocker.includes("exceeds surface ceiling AUTHORITY")
      )
    ).toBe(true);
  });

  it("allows externally proven claims only when the full trusted state is present", () => {
    const decision = evaluateTruthClaimFirewall({
      claimId: "externally_proven",
      surface: "PUBLIC_PRODUCT_COPY",
      authorityState: "externally_proven_gold_product",
      publicClaimAllowed: true,
      evidenceState: TRUSTED_EVIDENCE_STATE,
      runState: "VERIFIED",
      harnessState: "VERIFIED",
      provenanceState: "AVAILABLE",
      outcomeState: "CONFIRMED_STRONGLY",
    });

    expect(decision.decision).toBe("allowed");
    expect(decision.blockers).toEqual([]);
  });

  it("catches prohibited controlled language in explicit product-copy sample input", () => {
    const inspection = inspectTruthClaimsInText({
      text: "This product delivers guaranteed outcomes for every board decision.",
      surface: "PUBLIC_PRODUCT_COPY",
    });

    expect(inspection.violations).toHaveLength(1);
    expect(inspection.violations[0]?.claimId).toBe("guaranteed_outcome");
  });

  it("treats sample and disclaimer contexts as bounded instead of passing them as truth claims", () => {
    const inspection = inspectTruthClaimsInText({
      text: [
        "Demonstration only. Sample data for explanation.",
        "Outcome verified",
        "Not connected to your account.",
      ].join("\n"),
      surface: "PUBLIC_SAMPLE_COPY",
    });

    expect(inspection.violations).toHaveLength(0);
    expect(inspection.boundedFindings).toHaveLength(1);
    expect(inspection.boundedFindings[0]?.claimId).toBe("verified_outcome");
  });

  it("keeps sample surfaces bounded even when the sample marker is not adjacent to the controlled phrase", () => {
    const inspection = inspectTruthClaimsInText({
      text: [
        "Demonstration only.",
        "This sample explains the client-safe format.",
        "",
        "",
        "Outcome verified",
        "Not connected to your account.",
      ].join("\n"),
      surface: "PUBLIC_SAMPLE_COPY",
    });

    expect(inspection.violations).toHaveLength(0);
    expect(inspection.boundedFindings).toHaveLength(1);
    expect(inspection.boundedFindings[0]?.claimId).toBe("verified_outcome");
  });
});
