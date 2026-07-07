/**
 * lib/fulfilment/gmi/__tests__/gmi-quarterly-fulfilment.test.ts
 *
 * Proves the reusable gmi_quarterly release gate + delivery guard + edition-bound
 * proof. Negative controls, a synthetic authorised positive flow (NOT Q2), and
 * Q2 preservation assertions. No publication, supersession, checkout, or Stripe.
 */

import { describe, it, expect } from "vitest";
import { getMarketIntelligenceRecord, type MarketIntelligenceLifecycleRecord } from "@/lib/intelligence/market-intelligence-lifecycle";
import { CATALOG } from "@/lib/commercial/catalog";
import { getContractByProductCode } from "@/lib/product/product-fulfilment-contract";
import {
  type GmiReleaseContext,
  assertGmiDeliveryAllowed,
  buildGmiDeliveryProof,
  deriveGmiReleaseContextFromControls,
  evaluateGmiReleaseGate,
  gmiProofSatisfies,
} from "../gmi-quarterly-fulfilment";

const OWNER = { authorisedBy: "owner@abrahamoflondon.org", authorityRef: "REL-AUTH-SYNTH-1", authorisedAt: "2099-01-08T00:00:00Z" };
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

function synth(overrides: Partial<MarketIntelligenceLifecycleRecord> = {}): MarketIntelligenceLifecycleRecord {
  return {
    id: "GMI-SYNTH-2099", title: "Synthetic Edition", canonicalLine: "GLOBAL_MARKET_INTELLIGENCE",
    quarter: "Q1", year: 2099, coveragePeriod: "Q1 2099", decisionWindow: "Q2 2099", version: "9.9.9",
    lifecycleState: "DRAFT", supersededBy: null, replaces: "GMI-SYNTH-PRIOR", purchasable: false,
    publicVisible: false, archiveVisible: false, freshnessNote: "synthetic test edition", ...overrides,
  };
}
function fullContext(overrides: Partial<GmiReleaseContext> = {}): GmiReleaseContext {
  return { dataLockComplete: true, sourceBlockersClear: true, priorCallReviewComplete: true, humanReviewComplete: true, ownerReleaseAuthority: OWNER, approvedArtifactHash: HASH_A, ...overrides };
}

describe("GMI release gate — negative controls", () => {
  it("1. draft edition delivery denied", () => {
    const r = assertGmiDeliveryAllowed(synth({ lifecycleState: "DRAFT" }), fullContext(), HASH_A);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blockers.some((b) => b.code === "DRAFT_NOT_DELIVERABLE")).toBe(true);
  });
  it("2. pre-data-lock delivery denied", () => {
    const r = assertGmiDeliveryAllowed(synth({ lifecycleState: "ACTIVE" }), fullContext({ dataLockComplete: false }), HASH_A);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blockers.some((b) => b.code === "DATA_LOCK_PENDING")).toBe(true);
  });
  it("3. source blocker prevents progression", () => {
    const d = evaluateGmiReleaseGate(synth({ lifecycleState: "ACTIVE" }), fullContext({ sourceBlockersClear: false }));
    expect(d.canPublish).toBe(false);
    expect(d.blockers.some((b) => b.code === "SOURCE_BLOCKERS_OUTSTANDING")).toBe(true);
  });
  it("4. missing prior-call review prevents progression", () => {
    const d = evaluateGmiReleaseGate(synth({ lifecycleState: "ACTIVE" }), fullContext({ priorCallReviewComplete: false }));
    expect(d.canPublish).toBe(false);
    expect(d.blockers.some((b) => b.code === "PRIOR_CALL_REVIEW_INCOMPLETE")).toBe(true);
  });
  it("5. missing human review prevents progression", () => {
    const d = evaluateGmiReleaseGate(synth({ lifecycleState: "ACTIVE" }), fullContext({ humanReviewComplete: false }));
    expect(d.canPublish).toBe(false);
    expect(d.blockers.some((b) => b.code === "HUMAN_REVIEW_INCOMPLETE")).toBe(true);
  });
  it("6. missing owner authority prevents publication", () => {
    const d = evaluateGmiReleaseGate(synth({ lifecycleState: "DRAFT" }), fullContext({ ownerReleaseAuthority: null }));
    expect(d.canPublish).toBe(false);
    expect(d.blockers.some((b) => b.code === "OWNER_AUTHORITY_MISSING")).toBe(true);
  });
});

describe("GMI release gate — synthetic authorised positive flow", () => {
  it("7. a fully authorised synthetic edition can publish, grant access, and deliver", () => {
    // draft + full context authorises the release transition
    const draft = evaluateGmiReleaseGate(synth({ lifecycleState: "DRAFT" }), fullContext());
    expect(draft.canPublish).toBe(true);
    expect(draft.canGrantAccess).toBe(false); // not yet actually published

    // after the transition is applied (synthetic ACTIVE) access + delivery open
    const active = synth({ lifecycleState: "ACTIVE" });
    const decision = evaluateGmiReleaseGate(active, fullContext());
    expect(decision.canGrantAccess).toBe(true);
    expect(decision.canDeliver).toBe(true);
    expect(decision.canSupersedePredecessor).toBe(true);

    const guard = assertGmiDeliveryAllowed(active, fullContext(), HASH_A);
    expect(guard.ok).toBe(true);
    const proof = buildGmiDeliveryProof(active, fullContext(), { deliveredArtifactHash: HASH_A, accessRecipient: "client@x.com", deliveryChannel: "governed_access_grant" });
    expect(proof.editionId).toBe("GMI-SYNTH-2099");
    expect(proof.artifactHash).toBe(HASH_A);
    expect(proof.publicationAuthorityRef).toBe(OWNER.authorityRef);
  });

  it("8. supersession requires the successor to be actually released", () => {
    // draft successor (even fully authorised) cannot supersede its predecessor
    expect(evaluateGmiReleaseGate(synth({ lifecycleState: "DRAFT" }), fullContext()).canSupersedePredecessor).toBe(false);
    // real Q2 (DRAFT) cannot supersede Q1
    const q2 = getMarketIntelligenceRecord("GMI-Q2-2026")!;
    expect(evaluateGmiReleaseGate(q2, deriveGmiReleaseContextFromControls("GMI-Q2-2026")).canSupersedePredecessor).toBe(false);
  });

  it("9. access cannot be granted prematurely (draft)", () => {
    expect(evaluateGmiReleaseGate(synth({ lifecycleState: "DRAFT" }), fullContext()).canGrantAccess).toBe(false);
  });
});

describe("GMI delivery proof binding", () => {
  const active = synth({ lifecycleState: "ACTIVE" });
  const proof = buildGmiDeliveryProof(active, fullContext(), { deliveredArtifactHash: HASH_A, accessRecipient: "c@x.com", deliveryChannel: "grant" });

  it("10. proof is edition-specific", () => {
    expect(gmiProofSatisfies(proof, { editionId: "GMI-SYNTH-2099", artifactHash: HASH_A })).toBe(true);
    expect(gmiProofSatisfies(proof, { editionId: "GMI-Q1-2026", artifactHash: HASH_A })).toBe(false);
  });
  it("11. proof is artifact-hash-specific", () => {
    expect(gmiProofSatisfies(proof, { editionId: "GMI-SYNTH-2099", artifactHash: HASH_B })).toBe(false);
  });
  it("12. gate is deterministic (replay-safe)", () => {
    const a = evaluateGmiReleaseGate(active, fullContext());
    const b = evaluateGmiReleaseGate(active, fullContext());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("13. changed artifact after approval invalidates release eligibility", () => {
    const r = assertGmiDeliveryAllowed(active, fullContext({ approvedArtifactHash: HASH_A }), HASH_B);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blockers.some((b) => b.code === "ARTIFACT_HASH_MISMATCH")).toBe(true);
  });
});

describe("publication authority never infers commerce", () => {
  const decision = evaluateGmiReleaseGate(synth({ lifecycleState: "ACTIVE" }), fullContext());
  it("14. does not activate checkout", () => {
    expect(decision.commercialInference.checkoutActivated).toBe(false);
  });
  it("15. does not create Stripe identity", () => {
    expect(decision.commercialInference.stripeProductId).toBeNull();
    expect(decision.commercialInference.stripePriceId).toBeNull();
  });
});

describe("16. GMI Q2 controlled pre-release boundary is preserved", () => {
  const q2 = getMarketIntelligenceRecord("GMI-Q2-2026")!;
  const q1 = getMarketIntelligenceRecord("GMI-Q1-2026")!;

  it("Q2 remains DRAFT / not purchasable / not public", () => {
    expect(q2.lifecycleState).toBe("DRAFT");
    expect(q2.purchasable).toBe(false);
    expect(q2.publicVisible).toBe(false);
  });
  it("Q2 catalog + contract carry no Stripe identity and no checkout", () => {
    expect(CATALOG.gmi_q2_2026!.stripeProductId).toBeNull();
    expect(CATALOG.gmi_q2_2026!.stripePriceId).toBeNull();
    expect(CATALOG.gmi_q2_2026!.requiresCheckout).toBe(false);
    expect(getContractByProductCode("gmi_q2_2026")?.stripePriceId).toBeNull();
  });
  it("Q1 remains unsuperseded", () => {
    expect(q1.supersededBy).toBeNull();
    expect(q1.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
  });
  it("future data-lock dependency remains outstanding", () => {
    expect(deriveGmiReleaseContextFromControls("GMI-Q2-2026").dataLockComplete).toBe(false);
  });
  it("no delivery operation can bypass the Q2 boundary", () => {
    const r = assertGmiDeliveryAllowed(q2, deriveGmiReleaseContextFromControls("GMI-Q2-2026"), HASH_A);
    expect(r.ok).toBe(false);
  });
  it("gmi_quarterly family contract is CONTROLLED_RELEASE_READY by design", () => {
    const fam = getContractByProductCode("gmi_quarterly");
    expect(fam).toBeDefined();
    expect(fam?.warnings.some((w) => w.includes("CONTROLLED_RELEASE_READY by permanent design"))).toBe(true);
    expect(fam?.stripePriceId).toBeNull();
  });
});
