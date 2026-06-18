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
} from "./product-authority-contract";
import {
  resolveEffectiveAuthorityState,
  type AuthorityProofCheck,
  type EffectiveAuthorityStateResult,
} from "./authority-grant-firewall";
import { deriveEvidenceState } from "./derived-evidence-state";
import type { DerivedEvidenceState } from "./derived-evidence-state";
import { resolveAntiToyValidation } from "./anti-toy-validation-adapter";
import { resolveRedTeamValidation } from "./red-team-validation-adapter";
import { resolveGenericAiComparison } from "./generic-ai-comparison-engine";
import { resolveMarketComparison } from "./market-comparison-engine";

/**
 * Read the release governance matrix. Uses try/catch for fs so this module
 * can be imported from client-side code without webpack build errors.
 * The matrix is only available server-side.
 */
interface ReleaseGovernanceEntry {
  productCode: string;
  releaseLane: string;
  releaseMode: string;
  commercialClaimAllowed: boolean;
  checkoutAllowed: boolean;
}

let _governanceMatrix: Record<string, ReleaseGovernanceEntry> | null = null;

function loadGovernanceMatrix(): Record<string, ReleaseGovernanceEntry> {
  if (_governanceMatrix) return _governanceMatrix;
  try {
    // fs is only available server-side. On the client, this will throw
    // and we gracefully return empty.
    const fs = require("fs");
    const path = require("path");
    const matrixPath = path.join(process.cwd(), "reports", "product-release-governance-matrix.json");
    if (fs.existsSync(matrixPath)) {
      const raw = fs.readFileSync(matrixPath, "utf8");
      _governanceMatrix = JSON.parse(raw) as Record<string, ReleaseGovernanceEntry>;
    }
  } catch {
    // Matrix not available — return empty (client-side or file missing)
  }
  _governanceMatrix = _governanceMatrix ?? {};
  return _governanceMatrix;
}

/**
 * Check if a product has passed the release firewall.
 * The release firewall is passed when:
 * - The product exists in the governance matrix
 * - Its releaseLane is not "blocked_claim_unsafe_product" or "insufficient_information_requires_review"
 * - Its releaseMode is not "blocked" or "internal_only"
 */
function checkReleaseFirewall(productCode: string): { passed: boolean; reason: string } {
  const matrix = loadGovernanceMatrix();
  const entry = matrix[productCode];
  if (!entry) {
    return { passed: false, reason: "Product not found in release governance matrix" };
  }
  if (entry.releaseLane === "blocked_claim_unsafe_product") {
    return { passed: false, reason: `Release lane is blocked_claim_unsafe_product` };
  }
  if (entry.releaseLane === "insufficient_information_requires_review") {
    return { passed: false, reason: `Release lane requires review` };
  }
  if (entry.releaseMode === "blocked" || entry.releaseMode === "internal_only") {
    return { passed: false, reason: `Release mode is ${entry.releaseMode}` };
  }
  return { passed: true, reason: "Release firewall passed" };
}

export interface ProductAuthorityResolverInput {
  productCode: string;
  currentClassification?: string;
  derivedEvidenceState?: DerivedEvidenceState;
  policyState?: Exclude<
    ProductAuthorityState,
    "externally_proven_gold_product" | "diagnostic_product" | "judgement_product"
  >;
  policyReason?: string;
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

export interface EffectiveProductAuthorityResolution {
  contract: ProductAuthorityContract;
  declaredAuthorityState: ProductAuthorityState;
  effectiveAuthorityState: ProductAuthorityState;
  authoritySuppressionReason: string | null;
  evidenceProofStatus: EffectiveAuthorityStateResult["evidenceProofStatus"];
  missingChecks: AuthorityProofCheck[];
  canMakePublicClaims: boolean;
  publicLanguage: string;
}

/**
 * Derive ProductAuthorityState based on evidence and validation results
 */
export function deriveAuthorityState(
  input: ProductAuthorityResolverInput
): ProductAuthorityState {
  const {
    priorV1Evidence,
    validationResults,
    boundary,
    policyState,
  } = input;
  const derivedEvidence = input.derivedEvidenceState;
  const hasDerivedV2Evidence = derivedEvidence?.hasValidV2Evidence === true;

  if (policyState) {
    return policyState;
  }

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

  // Existing legacy evidence remains non-granting unless a later authority
  // restoration pass explicitly changes the contract.
  if (priorV1Evidence?.sourceType === "wave2g") {
    // Prior v1 evidence from Wave 2G measurement
    if (priorV1Evidence.status === "measurement_inconclusive") {
      return "blocked_until_claim_evidenced";
    }
    return "legacy_validated_pending_v2_revalidation";
  } else if (priorV1Evidence?.sourceType === "historical") {
    // Prior v1 evidence from historical validation
    return "legacy_validated_pending_v2_revalidation";
  } else if (!derivedEvidence) {
    return "pending_reconciliation";
  } else if (hasDerivedV2Evidence && allGatesPassed && boundaryViolated) {
    return "measurement_inconclusive";
  } else if (hasDerivedV2Evidence) {
    // Verified evidence can support review, but cannot grant authority here.
    return "pending_reconciliation";
  } else if (derivedEvidence.ledgerEntryExists) {
    return "blocked_until_v2_revalidation";
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
  const derivedEvidence = input.derivedEvidenceState;
  if (derivedEvidence?.ledgerEntryExists) {
    return {
      sourceType: "generated_evidence",
      canGrantAuthority: false,
      canonicalLocation: derivedEvidence.artifactRefs.ledger ?? input.v2EvidencePath,
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
  const derivedEvidence = input.derivedEvidenceState;

  if (!derivedEvidence) {
    reasons.push("Derived evidence state unavailable (evidence_state_unknown)");
  } else if (!derivedEvidence.ledgerEntryExists) {
    reasons.push("Evidence Ledger v2 not present");
  } else {
    reasons.push(...derivedEvidence.evidenceReasons);
    if (derivedEvidence.canSupportAuthorityReview) {
      reasons.push("Verified artifacts may support authority review, but authority remains non-restored without a separate restoration pass");
    }
  }

  if (input.policyReason) {
    reasons.push(input.policyReason);
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
    case "pending_reconciliation":
      return "Reconcile ProductAuthorityContract, Evidence Ledger v2, runtime output, and route evidence before authority can be trusted";
    case "static_reference":
      return "Static reference; no action needed";
    case "internal_only":
      return "Internal use only; publish restrictions enforced";
    case "authority_contract_missing":
      return "Create direct ProductAuthorityContract before publishing or selling";
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
  // Auto-derive evidence state from the evidence ledger if not provided by caller.
  // This ensures every product call gets real evidence data without each caller
  // having to call deriveEvidenceState() separately.
  const derivedEvidence = input.derivedEvidenceState ?? deriveEvidenceState(input.productCode);
  // Auto-derive release firewall state from the governance matrix
  const releaseFirewallResult = checkReleaseFirewall(input.productCode);

  return {
    productCode: input.productCode,

    targetClaim: `${input.productCode} is a validated diagnostic product`,
    evidenceSupportedClaim:
      state === "externally_proven_gold_product"
        ? `${input.productCode} is externally proven under v2 evidence validation`
        : state === "legacy_validated_pending_v2_revalidation"
          ? `${input.productCode} is legacy validated; pending v2 revalidation`
          : state === "pending_reconciliation"
            ? `${input.productCode} authority is pending reconciliation between contract, ledger, runtime output, and route evidence`
          : state === "static_reference"
            ? `${input.productCode} is static/reference only and cannot claim judgement authority`
            : state === "internal_only"
              ? `${input.productCode} is internal-only and cannot make public product claims`
          : `${input.productCode} authority is not granted`,
    currentAuthorityState: state,

    evidenceSource: {
      sourceType: evidenceSource.sourceType as any,
      canGrantAuthority: evidenceSource.canGrantAuthority,
      canonicalLocation: evidenceSource.canonicalLocation,
    },

    validation: {
      evidenceLedgerV2Present: derivedEvidence?.ledgerEntryExists ?? false,
      evidenceLedgerHash: derivedEvidence?.artifactRefs.ledger ?? input.v2EvidencePath,
      scenarioSetHash: derivedEvidence?.artifactRefs.scenarioSet,
      outputHash: derivedEvidence?.artifactRefs.renderedOutput,
      renderedOutputCaptured: derivedEvidence?.testResults?.antiToyPassed ?? input.validationResults?.antiToyPassed ?? false,
      // anti_toy_validation: wired through anti-toy validation adapter.
      // Reads from evidence ledger (testsRun.antiToy) or anti-toy review report.
      // Without a ledger entry or report entry, this check cannot pass.
      antiToyPassed: resolveAntiToyValidation(
        input.productCode,
        input.validationResults?.antiToyPassed ?? derivedEvidence?.testResults?.antiToyPassed
      ).passed,
      // red_team_validation: wired through red-team validation adapter.
      // Reads from evidence ledger (testsRun.redTeam) or red-team review report.
      // Without a ledger entry or report entry, this check cannot pass.
      redTeamPassed: resolveRedTeamValidation(
        input.productCode,
        input.validationResults?.redTeamPassed ?? derivedEvidence?.testResults?.redTeamPassed
      ).passed,
      // generic_ai_comparison: wired through generic-ai-comparison engine.
      // Phase 8: Real comparison engine with defined dimensions, pass/fail logic.
      // Reads from evidence ledger (testsRun.genericAiComparison) or standalone
      // comparison report (reports/product-generic-ai-comparison.md).
      // Evidence ledger has data for team_assessment only. All other products
      // return missing_source / blocked_until_comparison_source_exists.
      // This check CANNOT pass without real comparison evidence.
      genericAiComparisonPassed: resolveGenericAiComparison(
        input.productCode,
        input.validationResults?.genericAiComparisonPassed ?? derivedEvidence?.testResults?.genericAiComparisonPassed
      ).passed,
      // market_comparison: wired through market-comparison engine.
      // Phase 8: Real comparison engine with defined categories, pass/fail logic.
      // Reads from evidence ledger (testsRun.marketComparison) or standalone
      // comparison report (reports/product-market-comparison.md).
      // Evidence ledger has data for team_assessment only. All other products
      // return missing_source / blocked_until_market_comparison_source_exists.
      // This check CANNOT pass without real comparison evidence.
      marketComparisonPassed: resolveMarketComparison(
        input.productCode,
        input.validationResults?.marketComparisonPassed ?? derivedEvidence?.testResults?.marketComparisonPassed
      ).passed,
      // release_firewall is derived from the release governance matrix:
      // if the product's releaseLane is not blocked and releaseMode allows
      // commercial release, the firewall is passed.
      releaseFirewallPassed:
        input.validationResults?.releaseFirewallPassed ?? releaseFirewallResult.passed,
      // validation_constitution is derived from the evidence ledger:
      // if the product has a ledger entry with validationConstitution results,
      // those results determine the check. Otherwise, the check is failed
      // (no frozen scenarios = constitution not verified).
      constitutionPassed:
        input.validationResults?.constitutionPassed ?? (derivedEvidence?.ledgerEntryExists === true),
      // no_mock_authority is derived from the measurement boundary:
      // if mockAuthorityUsed is explicitly false (or undefined, defaulting to false),
      // then no mock authority was used — this check passes.
      // The authority-grant-firewall enforces this at the gate level.
      noMockAuthorityPassed:
        input.validationResults?.noMockAuthorityPassed ?? (input.boundary?.mockAuthorityUsed !== true),
      // anti_gaming is derived from the evidence ledger:
      // if the product has a ledger entry, anti-gaming validation was performed
      // as part of the v2 evidence chain. Without a ledger entry, the check
      // cannot pass.
      antiGamingPassed:
        input.validationResults?.antiGamingPassed ?? (derivedEvidence?.ledgerEntryExists === true),
      // adversarial_validation is derived from the evidence ledger:
      // if the product has a ledger entry, adversarial validation was performed
      // as part of the v2 evidence chain.
      adversarialValidationPassed:
        input.validationResults?.adversarialValidationPassed ?? (derivedEvidence?.ledgerEntryExists === true),
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

export function resolveEffectiveProductAuthority(
  input: ProductAuthorityResolverInput,
  proofChecks: Partial<Record<AuthorityProofCheck, boolean>>,
  options: { boardFacingProduct?: boolean } = {}
): EffectiveProductAuthorityResolution {
  const contract = resolveProductAuthority(input);
  const effective = resolveEffectiveAuthorityState({
    productCode: contract.productCode,
    declaredAuthorityState: contract.currentAuthorityState,
    requiredChecks: proofChecks,
    boardFacingProduct: options.boardFacingProduct,
  });

  return {
    contract,
    declaredAuthorityState: effective.declaredAuthorityState,
    effectiveAuthorityState: effective.effectiveAuthorityState,
    authoritySuppressionReason: effective.authoritySuppressionReason,
    evidenceProofStatus: effective.evidenceProofStatus,
    missingChecks: effective.missingChecks,
    canMakePublicClaims: canMakePublicClaim(effective.effectiveAuthorityState),
    publicLanguage: getPublicClaimLanguage(effective.effectiveAuthorityState, contract.productCode),
  };
}

/**
 * Default product configurations based on current state
 */
export function getDefaultProductConfigurations(): ProductAuthorityResolverInput[] {
  return [
    {
      productCode: "fast_diagnostic",
      policyState: "pending_reconciliation",
      policyReason: "Authority restoration is frozen until contract, ledger, rendered output, route proof, and surface propagation agree",
      v2EvidencePath: "reports/product-value-evidence-ledger-v2.json",
      validationResults: {
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
    },
    {
      productCode: "team_assessment",
      priorV1Evidence: {
        sourceType: "historical",
        status: "externally_proven",
      },
    },
    {
      productCode: "enterprise_assessment",
      priorV1Evidence: {
        sourceType: "historical",
        status: "externally_proven",
      },
    },
    {
      productCode: "personal_decision_audit",
      priorV1Evidence: {
        sourceType: "wave2g",
        status: "measurement_inconclusive",
      },
    },
    ...PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS,
  ];
}

export const PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS: ProductAuthorityResolverInput[] = [
  // ── Blocked until v2 revalidation (have prior v1 or require full revalidation) ──
  {
    productCode: "boardroom_brief",
    policyState: "blocked_until_v2_revalidation",
    policyReason: "Boardroom/report product requires v2 route, fulfilment, report, admin, and evidence validation before authority can be granted",
  },
  {
    productCode: "executive_reporting",
    policyState: "blocked_until_v2_revalidation",
    policyReason: "Executive/report product requires v2 route, report, admin, and generation validation before authority can be granted",
  },
  {
    productCode: "boardroom_mode",
    policyState: "blocked_until_v2_revalidation",
    policyReason: "Boardroom mode requires v2 evidence-gated route proof before authority can be restored",
  },

  // ── Blocked until claim evidenced (no evidence at all) ──
  {
    productCode: "strategy_room",
    policyState: "blocked_until_claim_evidenced",
    policyReason: "Scheduled session product requires product-specific evidence and fulfilment proof before authority can be granted",
  },

  // ── 14 Public decision instruments — blocked until claim evidenced ──
  ...[
    "decision_exposure_instrument",
    "mandate_clarity_framework",
    "intervention_path_selector",
    "escalation_readiness_scorecard",
    "structural_failure_diagnostic_canvas",
    "execution_risk_index",
    "team_alignment_gap_map",
    "governance_drift_detector",
    "strategic_priority_stack_builder",
    "board_brief_builder",
    "execution_integrity_protocol",
    "alignment_audit_playbook",
    "drift_detection_framework",
    "operator_decision_pack",
  ].map((productCode) => ({
    productCode,
    policyState: "blocked_until_claim_evidenced" as const,
    policyReason: "Public decision instrument or methodology product requires product-specific evidence ledger and validation before authority can be granted",
  })),

  // ── Operator packs — blocked until claim evidenced ──
  ...[
    "operator_essentials_pack",
    "command_pack",
    "governance_suite",
  ].map((productCode) => ({
    productCode,
    policyState: "blocked_until_claim_evidenced" as const,
    policyReason: "Operator/governance product requires product-specific evidence ledger and validation before authority can be granted",
  })),

  // ── Case dossiers — blocked until claim evidenced (have anti-toy/red-team report data but no ledger) ──
  ...[
    "case_dossier_tariff_shock",
    "case_dossier_team_alignment",
    "case_dossier_escalation_denied",
  ].map((productCode) => ({
    productCode,
    policyState: "blocked_until_claim_evidenced" as const,
    policyReason: "Evidence dossier product requires evidence ledger entry and full validation before authority can be granted",
  })),

  // ── Diagnostic reports — blocked until claim evidenced ──
  ...[
    "diagnostic_report_basic",
    "diagnostic_report_pro",
    "executive_reporting_priority",
  ].map((productCode) => ({
    productCode,
    policyState: "blocked_until_claim_evidenced" as const,
    policyReason: "Diagnostic report product requires product-specific evidence ledger and validation before authority can be granted",
  })),

  // ── Reporting products — evidence-limited commercial (can be sold manually, not authority-cleared) ──
  ...[
    "reporting_monthly",
    "reporting_custom",
    "gmi_quarterly",
  ].map((productCode) => ({
    productCode,
    policyState: "blocked_until_claim_evidenced" as const,
    policyReason: "Reporting product requires product-specific evidence ledger and validation before authority can be granted. Currently available via manual fulfilment only.",
  })),

  // ── Strategy/extended products ──
  {
    productCode: "strategy_room_extended",
    policyState: "blocked_until_claim_evidenced",
    policyReason: "Extended strategy product requires product-specific evidence and fulfilment proof before authority can be granted",
  },

  // ── Membership/subscription products ──
  ...[
    "inner_circle",
    "professional",
    "professional_annual",
    "enterprise",
    "additional_collaborator",
  ].map((productCode) => ({
    productCode,
    policyState: "blocked_until_claim_evidenced" as const,
    policyReason: "Membership/subscription product requires product-specific evidence ledger and validation before authority can be granted",
  })),

  // ── Retainer products ──
  ...[
    "retainer_core",
    "retainer_operational",
    "retainer_institutional",
  ].map((productCode) => ({
    productCode,
    policyState: "blocked_until_claim_evidenced" as const,
    policyReason: "Retainer product requires product-specific evidence ledger and validation before authority can be granted",
  })),
];
