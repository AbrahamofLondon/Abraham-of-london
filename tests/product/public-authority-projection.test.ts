/**
 * tests/product/public-authority-projection.test.ts
 *
 * Phase 5 — proves the public authority projection:
 *  (a) maps every internal state to the intended public posture;
 *  (b) never leaks internal fields across the boundary (inspects the SERIALIZED
 *      object, not just the TypeScript type).
 */
import { describe, it, expect } from "vitest";
import type {
  ProductAuthorityContract,
  ProductAuthorityState,
} from "@/lib/product/product-authority-contract";
import {
  projectPublicProductAuthority,
  PUBLIC_PROJECTION_ALLOWED_KEYS,
  type PublicProductPosture,
} from "@/lib/product/public-product-authority-projection";

// A fully-populated internal contract with SENTINEL values in every field that
// must never cross the public boundary.
function internalContract(state: ProductAuthorityState): ProductAuthorityContract {
  return {
    productCode: "decision_exposure_instrument",
    targetClaim: "SENTINEL_TARGET_CLAIM",
    evidenceSupportedClaim: "SENTINEL_EVIDENCE_SUPPORTED_CLAIM",
    currentAuthorityState: state,
    evidenceSource: {
      sourceType: "legacy_evidence",
      canGrantAuthority: false,
      canonicalLocation: "/SENTINEL/canonical/evidence/path.json",
    },
    validation: {
      evidenceLedgerV2Present: false,
      evidenceLedgerHash: "SENTINEL_LEDGER_HASH",
      scenarioSetHash: "SENTINEL_SCENARIO_HASH",
      outputHash: "SENTINEL_OUTPUT_HASH",
      renderedOutputCaptured: false,
      antiToyPassed: false,
      redTeamPassed: false,
      genericAiComparisonPassed: false,
      marketComparisonPassed: false,
      releaseFirewallPassed: false,
      constitutionPassed: false,
      noMockAuthorityPassed: false,
      antiGamingPassed: false,
      adversarialValidationPassed: false,
    },
    boundary: {
      productChangedThisPass: false,
      scorerChangedThisPass: false,
      scenarioChangedThisPass: false,
      benchmarkChangedThisPass: false,
      validationInfrastructureChangedThisPass: false,
      gateLogicChangedThisPass: false,
      mockAuthorityUsed: false,
    },
    blockingReasons: ["SENTINEL_BLOCKING_REASON_ANTI_TOY", "SENTINEL_MISSING_EVIDENCE_LEDGER"],
    nextEvidenceAction: "SENTINEL_NEXT_EVIDENCE_ACTION",
    publicClaimAllowed: false,
    publicClaimLanguage: "SENTINEL_INTERNAL_PUBLIC_CLAIM",
    contractVersion: "v2",
    validationHash: "SENTINEL_VALIDATION_HASH",
    authorityBackbone: { SENTINEL_BACKBONE: true } as never,
  };
}

describe("state → posture mapping", () => {
  const cases: Array<[ProductAuthorityState, PublicProductPosture]> = [
    ["externally_proven_gold_product", "AVAILABLE"],
    ["diagnostic_product", "AVAILABLE"],
    ["judgement_product", "AVAILABLE"],
    ["legacy_validated_pending_v2_revalidation", "EVIDENCE_LIMITED"],
    ["blocked_until_claim_evidenced", "EVIDENCE_LIMITED"],
    ["blocked_until_v2_revalidation", "EVIDENCE_LIMITED"],
    ["measurement_inconclusive", "EVIDENCE_LIMITED"],
    ["pending_reconciliation", "CONTROLLED_ACCESS"],
    ["static_reference", "REFERENCE_ONLY"],
    ["internal_only", "UNAVAILABLE"],
    ["authority_contract_missing", "UNAVAILABLE"],
  ];

  it.each(cases)("%s → %s", (state, expected) => {
    const p = projectPublicProductAuthority(internalContract(state));
    expect(p.posture).toBe(expected);
  });

  it("legacy_validated_pending_v2_revalidation is presented as EVIDENCE_LIMITED, never as v2 language", () => {
    const p = projectPublicProductAuthority(internalContract("legacy_validated_pending_v2_revalidation"));
    expect(p.posture).toBe("EVIDENCE_LIMITED");
    expect(JSON.stringify(p).toLowerCase()).not.toContain("v2");
    expect(JSON.stringify(p).toLowerCase()).not.toContain("revalidation");
  });
});

describe("serialization boundary — no internal field crosses", () => {
  const FORBIDDEN_KEYS = [
    "blockingReasons", "validation", "antiToyPassed", "redTeamPassed",
    "genericAiComparisonPassed", "marketComparisonPassed", "canonicalLocation",
    "evidenceSource", "targetClaim", "evidenceSupportedClaim", "nextEvidenceAction",
    "authorityBackbone", "boundary", "currentAuthorityState", "publicClaimAllowed",
    "evidenceLedgerHash", "validationHash", "contractVersion",
  ];
  const FORBIDDEN_VALUES = [
    "SENTINEL_TARGET_CLAIM", "SENTINEL_EVIDENCE_SUPPORTED_CLAIM",
    "SENTINEL_BLOCKING_REASON_ANTI_TOY", "SENTINEL_MISSING_EVIDENCE_LEDGER",
    "SENTINEL_NEXT_EVIDENCE_ACTION", "/SENTINEL/canonical/evidence/path.json",
    "SENTINEL_LEDGER_HASH", "SENTINEL_INTERNAL_PUBLIC_CLAIM", "SENTINEL_BACKBONE",
    "SENTINEL_VALIDATION_HASH",
  ];

  const states: ProductAuthorityState[] = [
    "externally_proven_gold_product",
    "legacy_validated_pending_v2_revalidation",
    "blocked_until_claim_evidenced",
    "internal_only",
    "authority_contract_missing",
  ];

  it.each(states)("projection for %s exposes only allowed keys", (state) => {
    const p = projectPublicProductAuthority(internalContract(state));
    expect(Object.keys(p).sort()).toEqual([...PUBLIC_PROJECTION_ALLOWED_KEYS].sort());
  });

  it.each(states)("serialized projection for %s contains no forbidden key", (state) => {
    const serialized = JSON.parse(JSON.stringify(projectPublicProductAuthority(internalContract(state))));
    const keys = Object.keys(serialized);
    for (const k of FORBIDDEN_KEYS) {
      expect(keys, `leaked key ${k}`).not.toContain(k);
    }
  });

  it.each(states)("serialized projection for %s contains no forbidden internal value", (state) => {
    const text = JSON.stringify(projectPublicProductAuthority(internalContract(state)));
    for (const v of FORBIDDEN_VALUES) {
      expect(text, `leaked value ${v}`).not.toContain(v);
    }
  });

  it("nextPublicAction, when supplied, is bounded to label+href only", () => {
    const p = projectPublicProductAuthority(internalContract("diagnostic_product"), {
      nextPublicAction: { label: "View the public record", href: "/intelligence/gmi/q2-2026" },
    });
    expect(Object.keys(p.nextPublicAction!).sort()).toEqual(["href", "label"]);
  });
});
