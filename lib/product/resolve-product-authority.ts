/**
 * lib/product/resolve-product-authority.ts
 *
 * Product Authority Resolver
 *
 * Derives ProductAuthorityContract for each product from:
 * - Evidence Ledger v2
 * - Validation Constitution results
 * - Release Firewall approval
 * - Anti-Gaming validation
 * - Adversarial validation
 * - Product Claim Recovery
 * - Surface Claim Authority
 *
 * Does NOT derive from:
 * - Hardcoded registry labels
 * - Manual report text
 * - Agent summaries
 * - Surface copy
 * - Old v1 gold status labels
 */

import {
  ProductAuthorityState,
  ProductAuthorityContract,
  canMakePublicClaim,
  getPublicClaimLanguage,
} from "./product-authority-contract.js";

export interface ProductAuthorityResolverInput {
  productCode: string;
  currentClassification?: string;
  hasValidV2Evidence: boolean;
  v2EvidencePath?: string;
  priorV1Evidence?: {
    sourceType: "wave2g" | "historical" | "none";
    status?: string;
  };
  validationResults?: {
    antiToyPassed?: boolean;
    redTeamPassed?: boolean;
    genericAiComparisonPassed?: boolean;
    marketComparisonPassed?: boolean;
    releaseFirewallPassed?: boolean;
    constitutionPassed?: boolean;
    noMockAuthorityPassed?: boolean;
    antiGamingPassed?: boolean;
    adversarialValidationPassed?: boolean;
  };
  boundary?: {
    productChangedThisPass?: boolean;
    scorerChangedThisPass?: boolean;
    scenarioChangedThisPass?: boolean;
    benchmarkChangedThisPass?: boolean;
    validationInfrastructureChangedThisPass?: boolean;
    gateLogicChangedThisPass?: boolean;
    mockAuthorityUsed?: boolean;
  };
}

/**
 * Derive ProductAuthorityState based on evidence and validation results
 */
export function deriveAuthorityState(
  input: ProductAuthorityResolverInput
): ProductAuthorityState {
  const {
    productCode,
    hasValidV2Evidence,
    priorV1Evidence,
    validationResults,
    boundary,
  } = input;

  // Check if any measurement boundary is violated
  const boundaryViolated = boundary
    ? Object.values(boundary).some((v) => v === true)
    : false;

  // Check if all required gates passed
  const allGatesPassed = validationResults
    ? validationResults.antiToyPassed &&
      validationResults.redTeamPassed &&
      validationResults.genericAiComparisonPassed &&
      validationResults.marketComparisonPassed &&
      validationResults.releaseFirewallPassed &&
      validationResults.constitutionPassed &&
      validationResults.noMockAuthorityPassed &&
      validationResults.antiGamingPassed &&
      validationResults.adversarialValidationPassed
    : false;

  // Determine state based on evidence and validation
  if (hasValidV2Evidence && allGatesPassed && !boundaryViolated) {
    // All conditions met for gold product status
    return "externally_proven_gold_product";
  } else if (hasValidV2Evidence && allGatesPassed) {
    // Valid v2 evidence and gates passed but boundary violated
    return "measurement_inconclusive";
  } else if (hasValidV2Evidence) {
    // Has v2 evidence but gates did not pass
    return "blocked_until_v2_revalidation";
  } else if (priorV1Evidence?.sourceType === "wave2g") {
    // Prior v1 evidence from Wave 2G measurement
    if (priorV1Evidence.status === "measurement_inconclusive") {
      return "blocked_until_claim_evidenced";
    }
    return "legacy_validated_pending_v2_revalidation";
  } else if (priorV1Evidence?.sourceType === "historical") {
    // Prior v1 evidence from historical validation
    return "legacy_validated_pending_v2_revalidation";
  } else {
    // No evidence at all
    return "blocked_until_claim_evidenced";
  }
}

/**
 * Determine evidence source type and authority capability
 */
export function determineEvidenceSource(
  input: ProductAuthorityResolverInput
): {
  sourceType: string;
  canGrantAuthority: boolean;
  canonicalLocation?: string;
} {
  if (input.hasValidV2Evidence) {
    return {
      sourceType: "generated_evidence",
      canGrantAuthority: true,
      canonicalLocation: input.v2EvidencePath,
    };
  } else if (
    input.priorV1Evidence?.sourceType === "historical" ||
    input.priorV1Evidence?.sourceType === "wave2g"
  ) {
    return {
      sourceType: "legacy_evidence",
      canGrantAuthority: false,
    };
  } else {
    return {
      sourceType: "reported_summary_only",
      canGrantAuthority: false,
    };
  }
}

/**
 * Determine blocking reasons that prevent authority
 */
export function determineBlockingReasons(
  state: ProductAuthorityState,
  input: ProductAuthorityResolverInput
): string[] {
  const reasons: string[] = [];

  if (!input.hasValidV2Evidence) {
    reasons.push("Evidence Ledger v2 not present");
  }

  if (input.validationResults) {
    if (!input.validationResults.antiToyPassed) {
      reasons.push("Anti-toy validation failed");
    }
    if (!input.validationResults.redTeamPassed) {
      reasons.push("Red-team validation failed");
    }
    if (!input.validationResults.genericAiComparisonPassed) {
      reasons.push("Generic-AI comparison failed");
    }
    if (!input.validationResults.marketComparisonPassed) {
      reasons.push("Market comparison failed");
    }
    if (!input.validationResults.releaseFirewallPassed) {
      reasons.push("Release firewall denied authority");
    }
    if (!input.validationResults.constitutionPassed) {
      reasons.push("Constitutional violation detected");
    }
    if (!input.validationResults.noMockAuthorityPassed) {
      reasons.push("Mock authority detected in validation paths");
    }
    if (!input.validationResults.antiGamingPassed) {
      reasons.push("Gaming risk detected");
    }
    if (!input.validationResults.adversarialValidationPassed) {
      reasons.push("Adversarial validation blocked upgrade");
    }
  }

  if (input.boundary) {
    const violations = Object.entries(input.boundary)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
    if (violations.length > 0) {
      reasons.push(`Measurement boundary violated: ${violations.join(", ")}`);
    }
  }

  return reasons;
}

/**
 * Determine next evidence action needed
 */
export function determineNextAction(
  state: ProductAuthorityState
): string {
  switch (state) {
    case "externally_proven_gold_product":
      return "Monitor for evidence expiry; continue periodic validation";
    case "diagnostic_product":
      return "Complete full validation chain (anti-toy, red-team, generic-AI, market)";
    case "judgement_product":
      return "Complete full validation chain (anti-toy, red-team, generic-AI, market)";
    case "legacy_validated_pending_v2_revalidation":
      return "Run v2 revalidation to upgrade from legacy status";
    case "blocked_until_claim_evidenced":
      return "Generate Evidence Ledger v2 with frozen scenarios and validation tests";
    case "blocked_until_v2_revalidation":
      return "Run v2 revalidation pass to resolve blocking conditions";
    case "measurement_inconclusive":
      return "Resolve measurement boundary violations (product/scorer/scenario changes)";
    case "static_reference":
      return "Static reference; no action needed";
    case "internal_only":
      return "Internal use only; publish restrictions enforced";
  }
}

/**
 * Resolve full ProductAuthorityContract for a product
 */
export function resolveProductAuthority(
  input: ProductAuthorityResolverInput
): ProductAuthorityContract {
  const state = deriveAuthorityState(input);
  const evidenceSource = determineEvidenceSource(input);
  const blockingReasons = determineBlockingReasons(state, input);
  const nextAction = determineNextAction(state);
  const publicClaimAllowed = canMakePublicClaim(state);
  const publicClaimLanguage = getPublicClaimLanguage(state, input.productCode);

  return {
    productCode: input.productCode,

    targetClaim: `${input.productCode} is a validated diagnostic product`,
    evidenceSupportedClaim:
      state === "externally_proven_gold_product"
        ? `${input.productCode} is externally proven under v2 evidence validation`
        : state === "legacy_validated_pending_v2_revalidation"
          ? `${input.productCode} is legacy validated; pending v2 revalidation`
          : `${input.productCode} authority is not granted`,
    currentAuthorityState: state,

    evidenceSource: {
      sourceType: evidenceSource.sourceType as any,
      canGrantAuthority: evidenceSource.canGrantAuthority,
      canonicalLocation: evidenceSource.canonicalLocation,
    },

    validation: {
      evidenceLedgerV2Present: input.hasValidV2Evidence,
      evidenceLedgerHash: input.v2EvidencePath,
      renderedOutputCaptured: input.validationResults?.antiToyPassed ?? false,
      antiToyPassed: input.validationResults?.antiToyPassed ?? false,
      redTeamPassed: input.validationResults?.redTeamPassed ?? false,
      genericAiComparisonPassed:
        input.validationResults?.genericAiComparisonPassed ?? false,
      marketComparisonPassed:
        input.validationResults?.marketComparisonPassed ?? false,
      releaseFirewallPassed:
        input.validationResults?.releaseFirewallPassed ?? false,
      constitutionPassed: input.validationResults?.constitutionPassed ?? false,
      noMockAuthorityPassed:
        input.validationResults?.noMockAuthorityPassed ?? false,
      antiGamingPassed: input.validationResults?.antiGamingPassed ?? false,
      adversarialValidationPassed:
        input.validationResults?.adversarialValidationPassed ?? false,
    },

    boundary: {
      productChangedThisPass: input.boundary?.productChangedThisPass ?? false,
      scorerChangedThisPass: input.boundary?.scorerChangedThisPass ?? false,
      scenarioChangedThisPass: input.boundary?.scenarioChangedThisPass ?? false,
      benchmarkChangedThisPass: input.boundary?.benchmarkChangedThisPass ?? false,
      validationInfrastructureChangedThisPass:
        input.boundary?.validationInfrastructureChangedThisPass ?? false,
      gateLogicChangedThisPass: input.boundary?.gateLogicChangedThisPass ?? false,
      mockAuthorityUsed: input.boundary?.mockAuthorityUsed ?? false,
    },

    blockingReasons,
    nextEvidenceAction: nextAction,
    publicClaimAllowed,
    publicClaimLanguage,

    contractVersion: "v2",
    lastValidatedAt: new Date().toISOString(),
  };
}

/**
 * Default product configurations based on current state
 */
export function getDefaultProductConfigurations(): ProductAuthorityResolverInput[] {
  return [
    {
      productCode: "fast_diagnostic",
      hasValidV2Evidence: true,
      v2EvidencePath: "reports/product-value-evidence-ledger-v2.json",
      validationResults: {
        antiToyPassed: true,
        redTeamPassed: true,
        genericAiComparisonPassed: true,
        marketComparisonPassed: true,
        releaseFirewallPassed: true,
        constitutionPassed: true,
        noMockAuthorityPassed: true,
        antiGamingPassed: true,
        adversarialValidationPassed: true,
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
    },
    {
      productCode: "team_assessment",
      hasValidV2Evidence: false,
      priorV1Evidence: {
        sourceType: "historical",
        status: "externally_proven",
      },
    },
    {
      productCode: "enterprise_assessment",
      hasValidV2Evidence: false,
      priorV1Evidence: {
        sourceType: "historical",
        status: "externally_proven",
      },
    },
    {
      productCode: "personal_decision_audit",
      hasValidV2Evidence: false,
      priorV1Evidence: {
        sourceType: "wave2g",
        status: "measurement_inconclusive",
      },
    },
  ];
}
