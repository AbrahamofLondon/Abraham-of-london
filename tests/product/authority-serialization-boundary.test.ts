/**
 * tests/product/authority-serialization-boundary.test.ts
 *
 * Phase 6B — serialization boundary tests.
 *
 * Proves forbidden internal-authority keys/values cannot cross the public
 * boundary. Inspects the ACTUAL serialized object (JSON round-trip), recursively,
 * not just the TypeScript interface.
 *
 * Scope on the integration branch: the public authority projection DTO and the
 * controlled-customer report DTO. (Checkout error JSON is a commercial surface
 * intentionally out of scope on this authority-only branch.)
 */
import { describe, it, expect } from "vitest";
import { projectPublicProductAuthority } from "@/lib/product/public-product-authority-projection";
import type { ProductAuthorityContract, ProductAuthorityState } from "@/lib/product/product-authority-contract";
import type { LiveReportResult } from "@/pages/api/report/[reportId]";

// ── Forbidden keys/values that must never cross a public boundary ─────────────
const FORBIDDEN_KEYS = [
  "blockingReasons", "validation", "antiToyPassed", "redTeamPassed",
  "genericAiComparisonPassed", "marketComparisonPassed", "genericAiComparison",
  "marketComparison", "nextEvidenceAction", "evidenceLedgerInventoryRecord",
  "canonicalLocation", "authorityBackbone", "targetClaim", "evidenceSupportedClaim",
  "currentAuthorityState", "evidenceSource", "boundary", "evidenceLedgerHash",
];

function deepKeys(obj: unknown, acc = new Set<string>()): Set<string> {
  if (Array.isArray(obj)) {
    for (const v of obj) deepKeys(v, acc);
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      acc.add(k);
      deepKeys(v, acc);
    }
  }
  return acc;
}

/** Recursively assert no forbidden key appears anywhere in the serialized object. */
function assertNoForbiddenAuthorityLeak(obj: unknown): void {
  const serialized = JSON.parse(JSON.stringify(obj));
  const keys = deepKeys(serialized);
  for (const forbidden of FORBIDDEN_KEYS) {
    expect(keys.has(forbidden), `forbidden key leaked: ${forbidden}`).toBe(false);
  }
}

function internalContract(state: ProductAuthorityState): ProductAuthorityContract {
  return {
    productCode: "decision_exposure_instrument",
    targetClaim: "T", evidenceSupportedClaim: "E",
    currentAuthorityState: state,
    evidenceSource: { sourceType: "legacy_evidence", canGrantAuthority: false, canonicalLocation: "/x.json" },
    validation: {
      evidenceLedgerV2Present: false, renderedOutputCaptured: false, antiToyPassed: false,
      redTeamPassed: false, genericAiComparisonPassed: false, marketComparisonPassed: false,
      releaseFirewallPassed: false, constitutionPassed: false, noMockAuthorityPassed: false,
      antiGamingPassed: false, adversarialValidationPassed: false,
    },
    boundary: {
      productChangedThisPass: false, scorerChangedThisPass: false, scenarioChangedThisPass: false,
      benchmarkChangedThisPass: false, validationInfrastructureChangedThisPass: false,
      gateLogicChangedThisPass: false, mockAuthorityUsed: false,
    },
    blockingReasons: ["x"], nextEvidenceAction: "y",
    publicClaimAllowed: false, publicClaimLanguage: "z", contractVersion: "v2",
  };
}

describe("6B — public product authority projection DTO", () => {
  const states: ProductAuthorityState[] = [
    "externally_proven_gold_product", "legacy_validated_pending_v2_revalidation",
    "pending_reconciliation", "static_reference", "internal_only", "authority_contract_missing",
  ];

  it.each(states)("serialized projection for %s carries no forbidden key (deep)", (state) => {
    assertNoForbiddenAuthorityLeak(projectPublicProductAuthority(internalContract(state)));
  });

  it("projection with nextPublicAction still carries no forbidden key", () => {
    const p = projectPublicProductAuthority(internalContract("diagnostic_product"), {
      nextPublicAction: { label: "Read the public record", href: "/intelligence/gmi/q2-2026" },
    });
    assertNoForbiddenAuthorityLeak(p);
  });
});

describe("6B — controlled-customer report DTO", () => {
  const report: LiveReportResult = {
    reportId: "case_123",
    diagnosticType: "intelligence_spine",
    status: "ACTIVE",
    generatedAt: "2026-07-10T00:00:00.000Z",
    daysOpen: 4,
    organisation: "Acme",
    primaryDecision: "Whether to restructure",
    primaryConstraint: "Board approval",
    costOfDelay: "Material",
    evidence: [{ kind: "DECISION", label: "Restructure", confidence: 0.7 }],
    caseStatus: "In progress",
    nextAction: "Complete evidence capture",
    decisionCentreHref: "/decision-centre",
    boundaryNote: "Client-safe summary; not a certified outcome.",
  };

  it("serialized report DTO carries no forbidden authority key (deep)", () => {
    assertNoForbiddenAuthorityLeak(report);
  });
});
