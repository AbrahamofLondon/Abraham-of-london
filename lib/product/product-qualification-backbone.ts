import {
  getAllProducts,
  getProduct,
  type CatalogProduct,
} from "@/lib/commercial/catalog";
import { AdversarialEvidenceShield } from "@/lib/decision-spine/adversarial-evidence-shield";
import {
  validateAgainstConstitution,
} from "@/lib/validation/validation-constitution";
import { deriveEvidenceState, type DerivedEvidenceState } from "./derived-evidence-state";
import {
  getExternalEvidenceGeneratedAt,
  getExternalLiveRouteCapture,
  getExternalMarketComparisonRows,
  getExternalProductBenchmark,
  getExternalProductDescriptor,
  getExternalRenderedOutputReview,
  type ExternalLiveRouteCapture,
  type ExternalRenderedOutputReview,
} from "./external-product-value-evidence";
import {
  validateProductUpgradeNotGamed,
  type AntiGamingValidationResult,
} from "./anti-gaming-validation-authority";
import {
  validateContract as validateFulfilmentContract,
  type ProductReadinessResult,
} from "./fulfilment-readiness-validator";
import {
  resolveGenericAiComparisonRecord,
  type GenericAiComparisonRecord,
} from "./generic-ai-comparison-engine";
import {
  resolveMarketComparisonRecord,
  type MarketComparisonRecord,
} from "./market-comparison-engine";
import {
  getAssuranceByProductCode,
  type ProductFulfilmentAssurance,
} from "./product-fulfilment-assurance";
import {
  getContractByProductCode,
  type ProductFulfilmentContract,
} from "./product-fulfilment-contract";
import { getFulfilmentStateMap, type ProductFulfilmentStateMap } from "./universal-fulfilment-state";

export type ProductEvidenceState =
  | "verified"
  | "source_backed"
  | "proxy_backed"
  | "insufficient"
  | "missing"
  | "blocked"
  | "not_applicable";

export type SourceCoverageLevel =
  | "comprehensive"
  | "partial"
  | "minimal"
  | "none"
  | "not_applicable";

export type SourceApplicability =
  | "product_specific"
  | "product_family"
  | "mixed"
  | "estate_only"
  | "not_applicable";

export type SourceFreshness =
  | "current"
  | "mixed"
  | "stale"
  | "unknown"
  | "not_applicable";

export type EvidenceSourceApplicability = "product_specific" | "product_family" | "estate_only";

export interface EvidenceSourceReference {
  sourceId: string;
  sourceType:
    | "evidence_ledger"
    | "artifact_verification"
    | "external_descriptor"
    | "external_benchmark"
    | "external_market_comparison"
    | "rendered_output_review"
    | "live_route_capture"
    | "validation_constitution"
    | "anti_gaming"
    | "adversarial_validation"
    | "fulfilment_contract"
    | "fulfilment_assurance"
    | "fulfilment_state_map"
    | "fulfilment_validator"
    | "v2_revalidation_contract"
    | "release_firewall"
    | "checkout_contract";
  location: string;
  applicability: EvidenceSourceApplicability;
  freshness: Exclude<SourceFreshness, "mixed" | "not_applicable">;
  note?: string;
}

export interface ProductEvidenceObject {
  productId: string;
  productName: string;
  productFamily: string;
  evidenceLedgerEntryExists: boolean;
  evidenceLedgerEntryId: string | null;
  evidenceSources: EvidenceSourceReference[];
  comparisonSources: EvidenceSourceReference[];
  marketSources: EvidenceSourceReference[];
  antiToySources: EvidenceSourceReference[];
  redTeamSources: EvidenceSourceReference[];
  validationSources: EvidenceSourceReference[];
  fulfilmentSources: EvidenceSourceReference[];
  sourceCoverageLevel: SourceCoverageLevel;
  sourceApplicability: SourceApplicability;
  sourceFreshness: SourceFreshness;
  evidenceState: ProductEvidenceState;
  blockers: string[];
  nextRequiredEvidence: string[];
}

export type LedgerInventoryStatus =
  | "real_entry"
  | "missing_entry"
  | "not_applicable"
  | "blocked_until_source";

export interface ProductLedgerInventoryRecord {
  productId: string;
  productName: string;
  ledgerStatus: LedgerInventoryStatus;
  evidenceLedgerEntryExists: boolean;
  evidenceLedgerEntryId: string | null;
  availableSources: string[];
  missingSources: string[];
  authorityConsequence: string;
  nextRequiredAction: string;
}

export type QualificationState =
  | "passed"
  | "failed"
  | "missing_source"
  | "blocked"
  | "insufficient"
  | "not_applicable"
  | "requires_product_review";

export interface ProductValidationRecord {
  productId: string;
  state: QualificationState;
  sources: EvidenceSourceReference[];
  reasons: string[];
  applicable: boolean;
}

export type ProductV2RevalidationStatus =
  | "not_started"
  | "in_review"
  | "evidence_missing"
  | "failed"
  | "passed"
  | "blocked";

export interface ProductV2RevalidationRecord {
  productId: string;
  currentVersion: string;
  requiredVersion: string;
  revalidationStatus: ProductV2RevalidationStatus;
  requiredEvidence: string[];
  completedEvidence: string[];
  missingEvidence: string[];
  authorityConsequence: string;
  releaseConsequence: string;
  publicClaimConsequence: string;
  fulfilmentConsequence: string;
}

export type DirectAdapterState =
  | "passed"
  | "failed"
  | "proxy_only"
  | "direct_adapter_missing"
  | "source_missing"
  | "requires_engine_wiring";

export interface DirectAdapterVerificationRecord {
  adapterId: "validation_constitution" | "anti_gaming" | "adversarial_validation";
  state: DirectAdapterState;
  directInvocation: boolean;
  sources: EvidenceSourceReference[];
  reasons: string[];
}

export type FulfilmentQualificationState =
  | "not_applicable"
  | "ordered"
  | "paid"
  | "queued"
  | "in_review"
  | "dossier_generated"
  | "delivered"
  | "proof_attached"
  | "blocked"
  | "failed_evidence_validation";

export interface ProductFulfilmentQualificationRecord {
  productId: string;
  state: FulfilmentQualificationState;
  readinessStatus: string;
  deliveryClass: string | null;
  sources: EvidenceSourceReference[];
  reasons: string[];
  dashboardVisible: boolean;
}

export type ReleaseFirewallState =
  | "release_ready"
  | "free_release"
  | "manual_only"
  | "inactive"
  | "blocked";

export interface ProductReleaseFirewallRecord {
  productId: string;
  state: ReleaseFirewallState;
  passed: boolean;
  reasons: string[];
}

export type CheckoutAgreementState = "passed" | "failed" | "not_applicable";

export interface ProductCheckoutAgreementRecord {
  productId: string;
  state: CheckoutAgreementState;
  requiresCheckout: boolean;
  reasons: string[];
}

export interface ProductNoMockAuthorityRecord {
  productId: string;
  state: "passed" | "failed";
  reasons: string[];
}

export type AuthorityClearanceState =
  | "authority_cleared"
  | "blocked"
  | "evidence_incomplete"
  | "revalidation_required"
  | "not_release_eligible"
  | "not_claim_eligible";

export interface ProductAuthorityClearanceRecord {
  productId: string;
  state: AuthorityClearanceState;
  blockers: string[];
  publicClaimPermission: boolean;
}

export interface ProductAdapterVerificationBundle {
  validationConstitution: DirectAdapterVerificationRecord;
  antiGaming: DirectAdapterVerificationRecord;
  adversarialValidation: DirectAdapterVerificationRecord;
}

export interface ProductAuthorityBackboneRecord {
  productId: string;
  productName: string;
  productFamily: string;
  evidence: ProductEvidenceObject;
  ledger: ProductLedgerInventoryRecord;
  genericAiComparison: GenericAiComparisonRecord;
  marketComparison: MarketComparisonRecord;
  antiToy: ProductValidationRecord;
  redTeam: ProductValidationRecord;
  v2Revalidation: ProductV2RevalidationRecord;
  adapterVerification: ProductAdapterVerificationBundle;
  fulfilmentQualification: ProductFulfilmentQualificationRecord;
  noMockAuthority: ProductNoMockAuthorityRecord;
  releaseFirewall: ProductReleaseFirewallRecord;
  checkoutAgreement: ProductCheckoutAgreementRecord;
  authorityClearance: ProductAuthorityClearanceRecord;
  validationState: QualificationState;
  blockerSummary: string[];
  nextRequiredEvidence: string[];
}

export interface ProductAuthorityBackboneReport {
  generatedAt: string;
  totalProducts: number;
  summary: {
    explicitEvidenceObjects: number;
    productsWithLedgerEntries: number;
    productsWithExplicitMissingLedgerStates: number;
    authorityCleared: number;
    blocked: number;
    evidenceIncomplete: number;
    genericAiCoverage: number;
    marketCoverage: number;
    antiToyCoverage: number;
    redTeamCoverage: number;
    v2Coverage: number;
    publicClaimPermissionEnabled: number;
  };
  products: ProductAuthorityBackboneRecord[];
}

const PRIOR_HISTORICAL_PRODUCTS = new Set([
  "fast_diagnostic",
  "team_assessment",
  "enterprise_assessment",
]);

const MEASUREMENT_INCONCLUSIVE_PRODUCTS = new Set(["personal_decision_audit"]);

const V2_BLOCKED_PRODUCTS = new Set([
  "boardroom_brief",
  "executive_reporting",
  "boardroom_mode",
]);

const NON_OUTPUT_WRAPPER_PRODUCTS = new Set([
  "operator_decision_pack",
  "operator_essentials_pack",
  "command_pack",
  "governance_suite",
  "professional",
  "professional_annual",
  "additional_collaborator",
  "enterprise",
  "inner_circle",
  "retainer_core",
  "retainer_operational",
  "retainer_institutional",
]);

const NON_CASE_DERIVED_VALIDATION_PRODUCTS = new Set([
  ...NON_OUTPUT_WRAPPER_PRODUCTS,
  "gmi_q1_2026",
  "gmi_q2_2026",
  "gmi_q3_2026",
]);

const EXCLUDED_PHASE_8B_ARCHIVE_PRODUCTS = new Set([
  "reporting_monthly",
  "reporting_custom",
  "gmi_quarterly",
]);

const CURRENT_TIME = new Date();

function createSource(
  sourceId: EvidenceSourceReference["sourceId"],
  sourceType: EvidenceSourceReference["sourceType"],
  location: string,
  applicability: EvidenceSourceApplicability,
  freshness: Exclude<SourceFreshness, "mixed" | "not_applicable"> = "current",
  note?: string,
): EvidenceSourceReference {
  return { sourceId, sourceType, location, applicability, freshness, note };
}

function dedupeSources(sources: EvidenceSourceReference[]): EvidenceSourceReference[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.sourceId}:${source.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function ageFreshness(iso: string | null | undefined): Exclude<SourceFreshness, "mixed" | "not_applicable"> {
  if (!iso) return "unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  const ageMs = CURRENT_TIME.getTime() - date.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays <= 30 ? "current" : "stale";
}

function aggregateFreshness(sources: EvidenceSourceReference[], evidenceState: ProductEvidenceState): SourceFreshness {
  if (evidenceState === "not_applicable") return "not_applicable";
  if (sources.length === 0) return "unknown";
  const freshness = uniqueStrings(sources.map((source) => source.freshness));
  if (freshness.length === 1) {
    return freshness[0] as SourceFreshness;
  }
  if (freshness.includes("current")) return "mixed";
  if (freshness.includes("stale")) return "stale";
  return "unknown";
}

function aggregateApplicability(sources: EvidenceSourceReference[], evidenceState: ProductEvidenceState): SourceApplicability {
  if (evidenceState === "not_applicable") return "not_applicable";
  if (sources.length === 0) return "estate_only";
  const applicability = uniqueStrings(sources.map((source) => source.applicability));
  if (applicability.length === 1) {
    const only = applicability[0];
    if (only === "product_specific" || only === "product_family" || only === "estate_only") {
      return only;
    }
  }
  return "mixed";
}

function getCoverageLevel(
  evidenceState: ProductEvidenceState,
  flags: {
    descriptor: boolean;
    benchmark: boolean;
    comparison: boolean;
    renderedOutput: boolean;
    fulfilment: boolean;
  },
): SourceCoverageLevel {
  if (evidenceState === "not_applicable") return "not_applicable";
  const score = Object.values(flags).filter(Boolean).length;
  if (score >= 5) return "comprehensive";
  if (score >= 3) return "partial";
  if (score >= 1) return "minimal";
  return "none";
}

function isOutputValidationApplicable(productCode: string): boolean {
  return !NON_CASE_DERIVED_VALIDATION_PRODUCTS.has(productCode);
}

function isComparisonApplicable(productCode: string): boolean {
  return !NON_OUTPUT_WRAPPER_PRODUCTS.has(productCode);
}

function buildBoundaryFlags(productCode: string) {
  return {
    productChangedThisPass: false,
    scorerChangedThisPass: MEASUREMENT_INCONCLUSIVE_PRODUCTS.has(productCode),
    scenarioChangedThisPass: false,
    benchmarkChangedThisPass: false,
    validationInfrastructureChangedThisPass: false,
    gateLogicChangedThisPass: false,
    mockAuthorityUsed: false,
  };
}

function buildEvidenceSources(
  product: CatalogProduct,
  derivedEvidence: DerivedEvidenceState,
): {
  evidenceSources: EvidenceSourceReference[];
  comparisonSources: EvidenceSourceReference[];
  marketSources: EvidenceSourceReference[];
  antiToySources: EvidenceSourceReference[];
  redTeamSources: EvidenceSourceReference[];
  validationSources: EvidenceSourceReference[];
  fulfilmentSources: EvidenceSourceReference[];
} {
  const descriptor = getExternalProductDescriptor(product.code);
  const benchmark = getExternalProductBenchmark(product.code);
  const review = getExternalRenderedOutputReview(product.code);
  const liveCapture = getExternalLiveRouteCapture(product.code);
  const comparisonRows = getExternalMarketComparisonRows(product.code);
  const generatedFreshness = ageFreshness(getExternalEvidenceGeneratedAt());
  const fulfilmentSources: EvidenceSourceReference[] = [];

  if (getContractByProductCode(product.code)) {
    fulfilmentSources.push(
      createSource(
        `fulfilment-contract:${product.code}`,
        "fulfilment_contract",
        "lib/product/product-fulfilment-contract.ts",
        "product_specific",
      ),
    );
  }
  if (getAssuranceByProductCode(product.code)) {
    fulfilmentSources.push(
      createSource(
        `fulfilment-assurance:${product.code}`,
        "fulfilment_assurance",
        "lib/product/product-fulfilment-assurance.ts",
        "product_specific",
      ),
    );
  }
  if (getFulfilmentStateMap(product.code)) {
    fulfilmentSources.push(
      createSource(
        `fulfilment-state-map:${product.code}`,
        "fulfilment_state_map",
        "lib/product/universal-fulfilment-state.ts",
        "product_specific",
      ),
    );
  }
  if (getContractByProductCode(product.code)) {
    fulfilmentSources.push(
      createSource(
        `fulfilment-validator:${product.code}`,
        "fulfilment_validator",
        "lib/product/fulfilment-readiness-validator.ts",
        "product_specific",
      ),
    );
  }

  const evidenceSources = dedupeSources([
    ...(descriptor ? [
      createSource(
        `descriptor:${product.code}`,
        "external_descriptor",
        "reports/external-product-value-evidence.json",
        "product_specific",
        generatedFreshness,
      ),
    ] : []),
    ...(benchmark ? [
      createSource(
        `benchmark:${product.code}`,
        "external_benchmark",
        "reports/external-product-value-evidence.json",
        "product_specific",
        generatedFreshness,
      ),
    ] : []),
    ...(comparisonRows.length > 0 ? [
      createSource(
        `comparison:${product.code}`,
        "external_market_comparison",
        "reports/external-product-value-evidence.json",
        "product_specific",
        generatedFreshness,
      ),
    ] : []),
    ...(review ? [
      createSource(
        `rendered-output-review:${product.code}`,
        "rendered_output_review",
        "reports/external-product-value-evidence.json",
        "product_specific",
        generatedFreshness,
      ),
    ] : []),
    ...(liveCapture ? [
      createSource(
        `live-route:${product.code}`,
        "live_route_capture",
        "reports/external-product-value-evidence.json",
        "product_specific",
        ageFreshness(liveCapture.capturedAt),
      ),
    ] : []),
    ...(derivedEvidence.ledgerEntryExists ? [
      createSource(
        `ledger:${product.code}`,
        "evidence_ledger",
        "reports/product-value-evidence-ledger-v2.json",
        "product_specific",
      ),
      createSource(
        `artifact-verification:${product.code}`,
        "artifact_verification",
        "reports/evidence-ledger-artifact-verification.json",
        "product_specific",
      ),
    ] : []),
    ...fulfilmentSources,
  ]);

  return {
    evidenceSources,
    comparisonSources: evidenceSources.filter((source) =>
      source.sourceType === "external_benchmark" ||
      source.sourceType === "external_market_comparison" ||
      source.sourceType === "rendered_output_review" ||
      source.sourceType === "live_route_capture" ||
      source.sourceType === "evidence_ledger"
    ),
    marketSources: evidenceSources.filter((source) =>
      source.sourceType === "external_market_comparison" ||
      source.sourceType === "rendered_output_review" ||
      source.sourceType === "live_route_capture" ||
      source.sourceType === "evidence_ledger"
    ),
    antiToySources: evidenceSources.filter((source) =>
      source.sourceType === "rendered_output_review" ||
      source.sourceType === "evidence_ledger" ||
      source.sourceType === "live_route_capture"
    ),
    redTeamSources: evidenceSources.filter((source) =>
      source.sourceType === "rendered_output_review" ||
      source.sourceType === "evidence_ledger" ||
      source.sourceType === "live_route_capture"
    ),
    validationSources: evidenceSources.filter((source) =>
      source.sourceType === "rendered_output_review" ||
      source.sourceType === "live_route_capture" ||
      source.sourceType === "evidence_ledger" ||
      source.sourceType === "artifact_verification"
    ),
    fulfilmentSources,
  };
}

function buildEvidenceState(
  product: CatalogProduct,
  derivedEvidence: DerivedEvidenceState,
  review: ExternalRenderedOutputReview | null,
  liveCapture: ExternalLiveRouteCapture | null,
  comparisonRowsCount: number,
): ProductEvidenceState {
  if (NON_OUTPUT_WRAPPER_PRODUCTS.has(product.code)) {
    return "not_applicable";
  }
  if (derivedEvidence.hasValidV2Evidence) {
    return "verified";
  }
  if (MEASUREMENT_INCONCLUSIVE_PRODUCTS.has(product.code) || V2_BLOCKED_PRODUCTS.has(product.code)) {
    return "blocked";
  }
  if (review || liveCapture) {
    return "source_backed";
  }
  if (comparisonRowsCount > 0) {
    return "insufficient";
  }
  return "missing";
}

function buildAntiToyRecord(
  product: CatalogProduct,
  derivedEvidence: DerivedEvidenceState,
  sources: EvidenceSourceReference[],
): ProductValidationRecord {
  if (!isOutputValidationApplicable(product.code)) {
    return {
      productId: product.code,
      state: "not_applicable",
      sources,
      reasons: ["Anti-toy validation does not apply to non-judgement wrapper or static archive products."],
      applicable: false,
    };
  }

  const review = getExternalRenderedOutputReview(product.code);
  if (derivedEvidence.testResults?.antiToyPassed === true || derivedEvidence.testResults?.antiToyPassed === false) {
    return {
      productId: product.code,
      state: derivedEvidence.testResults.antiToyPassed ? "passed" : "failed",
      sources,
      reasons: [
        derivedEvidence.testResults.antiToyPassed
          ? "Evidence ledger anti-toy result passed."
          : "Evidence ledger anti-toy result failed.",
      ],
      applicable: true,
    };
  }
  if (review) {
    if (review.antiToy.failsAntiToyTest) {
      return {
        productId: product.code,
        state: "failed",
        sources,
        reasons: review.antiToy.reasons.length > 0
          ? review.antiToy.reasons
          : ["Rendered output review failed anti-toy validation."],
        applicable: true,
      };
    }
    return {
      productId: product.code,
      state: "passed",
      sources,
      reasons: ["Rendered output review passed anti-toy validation."],
      applicable: true,
    };
  }
  if (getExternalLiveRouteCapture(product.code)) {
    return {
      productId: product.code,
      state: "requires_product_review",
      sources,
      reasons: ["Live route capture exists, but no product-applicable anti-toy review has been recorded."],
      applicable: true,
    };
  }
  return {
    productId: product.code,
    state: "missing_source",
    sources,
    reasons: ["No product-applicable anti-toy evidence source exists."],
    applicable: true,
  };
}

function buildRedTeamRecord(
  product: CatalogProduct,
  derivedEvidence: DerivedEvidenceState,
  sources: EvidenceSourceReference[],
): ProductValidationRecord {
  if (!isOutputValidationApplicable(product.code)) {
    return {
      productId: product.code,
      state: "not_applicable",
      sources,
      reasons: ["Red-team validation does not apply to non-judgement wrapper or static archive products."],
      applicable: false,
    };
  }

  const review = getExternalRenderedOutputReview(product.code);
  if (derivedEvidence.testResults?.redTeamPassed === true || derivedEvidence.testResults?.redTeamPassed === false) {
    return {
      productId: product.code,
      state: derivedEvidence.testResults.redTeamPassed ? "passed" : "failed",
      sources,
      reasons: [
        derivedEvidence.testResults.redTeamPassed
          ? "Evidence ledger red-team result passed."
          : "Evidence ledger red-team result failed.",
      ],
      applicable: true,
    };
  }
  if (review) {
    if (!review.redTeam.survives) {
      return {
        productId: product.code,
        state: "failed",
        sources,
        reasons: review.redTeam.criticalRejections.length > 0
          ? review.redTeam.criticalRejections
          : ["Rendered output review failed red-team validation."],
        applicable: true,
      };
    }
    return {
      productId: product.code,
      state: "passed",
      sources,
      reasons: ["Rendered output review survived red-team validation."],
      applicable: true,
    };
  }
  if (getExternalLiveRouteCapture(product.code)) {
    return {
      productId: product.code,
      state: "requires_product_review",
      sources,
      reasons: ["Live route capture exists, but no product-applicable red-team review has been recorded."],
      applicable: true,
    };
  }
  return {
    productId: product.code,
    state: "missing_source",
    sources,
    reasons: ["No product-applicable red-team evidence source exists."],
    applicable: true,
  };
}

function normalizeGenericComparisonRecord(
  applicable: boolean,
  record: GenericAiComparisonRecord,
): GenericAiComparisonRecord {
  if (applicable) return record;
  return {
    ...record,
    passed: false,
    state: "not_applicable",
    comparisonEvidenceExists: false,
    productApplicableEvidence: false,
    thresholdPassed: false,
    authorityImplication: "does_not_support_authority",
    reasons: ["Generic-AI comparison does not apply to non-judgement wrapper products."],
    dimensions: [],
  };
}

function normalizeMarketComparisonRecord(
  applicable: boolean,
  record: MarketComparisonRecord,
): MarketComparisonRecord {
  if (applicable) return record;
  return {
    ...record,
    passed: false,
    state: "not_applicable",
    comparisonEvidenceExists: false,
    productApplicableEvidence: false,
    thresholdPassed: false,
    authorityImplication: "does_not_support_authority",
    reasons: ["Market comparison does not apply to non-judgement wrapper products."],
    categories: [],
  };
}

function buildValidationInput(
  productCode: string,
  antiToy: ProductValidationRecord,
  redTeam: ProductValidationRecord,
  genericAiComparison: GenericAiComparisonRecord,
  marketComparison: MarketComparisonRecord,
) {
  const boundary = buildBoundaryFlags(productCode);
  return {
    productCode,
    decisionForcePassed:
      antiToy.state === "passed" ||
      redTeam.state === "passed" ||
      genericAiComparison.productApplicableEvidence ||
      marketComparison.productApplicableEvidence,
    fullValidationChainPassed:
      antiToy.state === "passed" &&
      redTeam.state === "passed" &&
      genericAiComparison.state === "passed" &&
      marketComparison.state === "passed",
    antiToyPassed: antiToy.state === "passed",
    redTeamPassed: redTeam.state === "passed",
    genericAiComparisonPassed: genericAiComparison.state === "passed",
    marketComparisonPassed: marketComparison.state === "passed",
    manualClassificationOverride: false,
    scorerChangedThisPass: boundary.scorerChangedThisPass,
    productChangedThisPass: boundary.productChangedThisPass,
    scenarioChangedThisPass: boundary.scenarioChangedThisPass,
  };
}

function buildConstitutionVerification(
  product: CatalogProduct,
  sources: EvidenceSourceReference[],
  antiToy: ProductValidationRecord,
  redTeam: ProductValidationRecord,
  genericAiComparison: GenericAiComparisonRecord,
  marketComparison: MarketComparisonRecord,
): DirectAdapterVerificationRecord {
  const input = buildValidationInput(
    product.code,
    antiToy,
    redTeam,
    genericAiComparison,
    marketComparison,
  );
  const result = validateAgainstConstitution(input, product.code);
  return {
    adapterId: "validation_constitution",
    state: result.passed ? "passed" : "failed",
    directInvocation: true,
    sources: [
      ...sources,
      createSource(
        `validation-constitution:${product.code}`,
        "validation_constitution",
        "lib/validation/validation-constitution.ts",
        "estate_only",
      ),
    ],
    reasons: result.passed
      ? ["Validation constitution passed on direct invocation."]
      : result.blockingReasons,
  };
}

function buildAntiGamingVerification(
  product: CatalogProduct,
  derivedEvidence: DerivedEvidenceState,
  sources: EvidenceSourceReference[],
  antiToy: ProductValidationRecord,
  redTeam: ProductValidationRecord,
  genericAiComparison: GenericAiComparisonRecord,
  marketComparison: MarketComparisonRecord,
): { record: DirectAdapterVerificationRecord; raw: AntiGamingValidationResult } {
  const boundary = buildBoundaryFlags(product.code);
  const result = validateProductUpgradeNotGamed(product.code, {
    scenarioSetFrozen: derivedEvidence.ledgerEntryExists || Boolean(getExternalLiveRouteCapture(product.code)),
    scenarioSetHash: derivedEvidence.artifactRefs.scenarioSet ?? getExternalLiveRouteCapture(product.code)?.scenarioId ?? null,
    benchmarkIndependentFromProductChange: derivedEvidence.ledgerEntryExists,
    scorerChangedThisPass: boundary.scorerChangedThisPass,
    productChangedThisPass: boundary.productChangedThisPass,
    scorerAndProductChangedTogether:
      boundary.scorerChangedThisPass && boundary.productChangedThisPass,
    antiToyPassed: antiToy.applicable ? antiToy.state === "passed" : true,
    redTeamPassed: redTeam.applicable ? redTeam.state === "passed" : true,
    genericAiComparisonPassed: isComparisonApplicable(product.code)
      ? genericAiComparison.state === "passed"
      : true,
    marketComparisonPassed: isComparisonApplicable(product.code)
      ? marketComparison.state === "passed"
      : true,
    decisionForcePassed:
      antiToy.state === "passed" ||
      redTeam.state === "passed" ||
      genericAiComparison.productApplicableEvidence,
    evidenceLedgerComplete: derivedEvidence.ledgerEntryExists,
    claimAuthorityPassed: false,
  });

  return {
    raw: result,
    record: {
      adapterId: "anti_gaming",
      state: result.upgradeAllowed ? "passed" : "failed",
      directInvocation: true,
      sources: [
        ...sources,
        createSource(
          `anti-gaming:${product.code}`,
          "anti_gaming",
          "lib/product/anti-gaming-validation-authority.ts",
          "estate_only",
        ),
      ],
      reasons: result.upgradeAllowed
        ? ["Anti-gaming validation passed on direct invocation."]
        : result.blockingReasons,
    },
  };
}

function buildAdversarialVerification(
  product: CatalogProduct,
  sources: EvidenceSourceReference[],
): DirectAdapterVerificationRecord {
  const review = getExternalRenderedOutputReview(product.code);
  const liveCapture = getExternalLiveRouteCapture(product.code);
  const renderedText = [
    ...(review?.samples.map((sample) => sample.outputText) ?? []),
    ...(liveCapture?.renderedOutputText ? [liveCapture.renderedOutputText] : []),
  ].join("\n\n");

  if (!renderedText.trim()) {
    return {
      adapterId: "adversarial_validation",
      state: "source_missing",
      directInvocation: false,
      sources,
      reasons: ["No direct rendered output text exists for adversarial source verification."],
    };
  }

  const risk = AdversarialEvidenceShield.evaluateAdversarialEvidenceRisk(renderedText);
  return {
    adapterId: "adversarial_validation",
    state: risk.riskLevel === "clean" ? "passed" : "failed",
    directInvocation: true,
    sources: [
      ...sources,
      createSource(
        `adversarial-validation:${product.code}`,
        "adversarial_validation",
        "lib/decision-spine/adversarial-evidence-shield.ts",
        "estate_only",
      ),
    ],
    reasons: risk.riskLevel === "clean"
      ? ["Adversarial evidence shield found no quarantine-level risk in recorded output."]
      : risk.threats.map((threat) => `${threat.category}: ${threat.remediation}`),
  };
}

function buildV2RevalidationRecord(
  product: CatalogProduct,
  derivedEvidence: DerivedEvidenceState,
  evidence: ProductEvidenceObject,
  genericAiComparison: GenericAiComparisonRecord,
  marketComparison: MarketComparisonRecord,
  antiToy: ProductValidationRecord,
  redTeam: ProductValidationRecord,
): ProductV2RevalidationRecord {
  const requiredEvidence = uniqueStrings([
    "product_evidence_object",
    "evidence_ledger_inventory_record",
    isComparisonApplicable(product.code) ? "generic_ai_comparison_source" : "",
    isComparisonApplicable(product.code) ? "market_comparison_source" : "",
    antiToy.applicable ? "anti_toy_validation" : "",
    redTeam.applicable ? "red_team_validation" : "",
  ]);

  const completedEvidence = uniqueStrings([
    evidence.evidenceState === "verified" ? "product_evidence_object" : "",
    derivedEvidence.ledgerEntryExists ? "evidence_ledger_inventory_record" : "",
    genericAiComparison.state === "passed" ? "generic_ai_comparison_source" : "",
    marketComparison.state === "passed" ? "market_comparison_source" : "",
    antiToy.state === "passed" ? "anti_toy_validation" : "",
    redTeam.state === "passed" ? "red_team_validation" : "",
  ]);
  const missingEvidence = requiredEvidence.filter((entry) => !completedEvidence.includes(entry));

  let revalidationStatus: ProductV2RevalidationStatus;
  if (derivedEvidence.hasValidV2Evidence && missingEvidence.length === 0) {
    revalidationStatus = "passed";
  } else if (V2_BLOCKED_PRODUCTS.has(product.code)) {
    revalidationStatus = "blocked";
  } else if (missingEvidence.length > 0 && PRIOR_HISTORICAL_PRODUCTS.has(product.code)) {
    revalidationStatus = "evidence_missing";
  } else if (derivedEvidence.ledgerEntryExists || getExternalLiveRouteCapture(product.code)) {
    revalidationStatus = "in_review";
  } else {
    revalidationStatus = "not_started";
  }

  return {
    productId: product.code,
    currentVersion: derivedEvidence.hasValidV2Evidence
      ? "v2"
      : PRIOR_HISTORICAL_PRODUCTS.has(product.code)
        ? "v1"
        : "v0",
    requiredVersion: "v2",
    revalidationStatus,
    requiredEvidence,
    completedEvidence,
    missingEvidence,
    authorityConsequence: revalidationStatus === "passed"
      ? "V2 evidence exists, but final authority still depends on release and claim gates."
      : "Authority remains blocked until required v2 evidence exists.",
    releaseConsequence: revalidationStatus === "passed"
      ? "Release posture may proceed to non-authority gates."
      : "Release posture cannot rely on v2 authority evidence.",
    publicClaimConsequence: "Public claims remain denied until v2 evidence and final authority clearance align.",
    fulfilmentConsequence: "Fulfilment status does not satisfy v2 revalidation on its own.",
  };
}

function buildFulfilmentQualificationRecord(
  product: CatalogProduct,
  contract: ProductFulfilmentContract | undefined,
  assurance: ProductFulfilmentAssurance | undefined,
  stateMap: ProductFulfilmentStateMap | undefined,
): { record: ProductFulfilmentQualificationRecord; validation: ProductReadinessResult | null } {
  const sources = dedupeSources([
    ...(contract ? [createSource(
      `fulfilment-contract:${product.code}`,
      "fulfilment_contract",
      "lib/product/product-fulfilment-contract.ts",
      "product_specific",
    )] : []),
    ...(assurance ? [createSource(
      `fulfilment-assurance:${product.code}`,
      "fulfilment_assurance",
      "lib/product/product-fulfilment-assurance.ts",
      "product_specific",
    )] : []),
    ...(stateMap ? [createSource(
      `fulfilment-state-map:${product.code}`,
      "fulfilment_state_map",
      "lib/product/universal-fulfilment-state.ts",
      "product_specific",
    )] : []),
  ]);

  if (!contract) {
    return {
      validation: null,
      record: {
        productId: product.code,
        state: "blocked",
        readinessStatus: "missing_contract",
        deliveryClass: null,
        sources,
        reasons: ["No product fulfilment contract exists."],
        dashboardVisible: false,
      },
    };
  }

  const validation = validateFulfilmentContract(contract);
  let state: FulfilmentQualificationState;
  if (validation.computedStatus === "not_sellable") {
    state = "blocked";
  } else if (validation.computedStatus === "not_applicable") {
    state = "not_applicable";
  } else if (validation.computedStatus === "proof_ready") {
    state = contract.fulfilmentType === "human_reviewed_dossier" ? "in_review" : "queued";
  } else if (validation.computedStatus === "sellable") {
    state = contract.proofRunCompleted ? "proof_attached" : "queued";
  } else {
    state = "failed_evidence_validation";
  }

  return {
    validation,
    record: {
      productId: product.code,
      state,
      readinessStatus: validation.computedStatus,
      deliveryClass: assurance?.deliveryClass ?? stateMap?.deliveryClass ?? null,
      sources: dedupeSources([
        ...sources,
        createSource(
          `fulfilment-validator:${product.code}`,
          "fulfilment_validator",
          "lib/product/fulfilment-readiness-validator.ts",
          "product_specific",
        ),
      ]),
      reasons: [
        ...validation.hardFailures.map((failure) => failure.message),
        ...validation.warnings.map((warning) => warning.message),
        ...validation.contractWarnings,
      ],
      dashboardVisible: contract.dashboardVisibility,
    },
  };
}

function buildReleaseFirewallRecord(
  product: CatalogProduct,
  fulfilment: ProductFulfilmentQualificationRecord,
): ProductReleaseFirewallRecord {
  if (!product.active || product.commercialStatus === "inactive" || product.commercialStatus === "retired") {
    return {
      productId: product.code,
      state: "inactive",
      passed: false,
      reasons: ["Product is inactive or retired."],
    };
  }
  if (fulfilment.state === "blocked" || fulfilment.state === "failed_evidence_validation") {
    return {
      productId: product.code,
      state: "blocked",
      passed: false,
      reasons: ["Fulfilment qualification is blocked or failed."],
    };
  }
  if (product.commercialStatus === "manual_billing" || product.commercialStatus === "contracted") {
    return {
      productId: product.code,
      state: "manual_only",
      passed: false,
      reasons: ["Product requires manual billing or contracted release."],
    };
  }
  if (product.commercialStatus === "free_controlled" || product.commercialStatus === "evidence_gated") {
    return {
      productId: product.code,
      state: "free_release",
      passed: true,
      reasons: ["Product is released as a controlled free or evidence-gated surface."],
    };
  }
  return {
    productId: product.code,
    state: "release_ready",
    passed: true,
    reasons: ["Commercial status and fulfilment qualification allow release posture review."],
  };
}

function buildCheckoutAgreementRecord(
  product: CatalogProduct,
  contract: ProductFulfilmentContract | undefined,
): ProductCheckoutAgreementRecord {
  if (product.requiresCheckout !== true) {
    return {
      productId: product.code,
      state: "not_applicable",
      requiresCheckout: false,
      reasons: ["Product does not require self-serve checkout."],
    };
  }
  if (!contract) {
    return {
      productId: product.code,
      state: "failed",
      requiresCheckout: true,
      reasons: ["Catalog requires checkout, but no fulfilment contract exists."],
    };
  }
  const reasons: string[] = [];
  if (!contract.checkoutRoute) {
    reasons.push("Fulfilment contract has no checkout route.");
  }
  if (product.stripePriceId !== contract.stripePriceId) {
    reasons.push("Catalog Stripe price ID does not match fulfilment contract.");
  }
  return {
    productId: product.code,
    state: reasons.length === 0 ? "passed" : "failed",
    requiresCheckout: true,
    reasons: reasons.length === 0
      ? ["Checkout contract matches catalog requirements."]
      : reasons,
  };
}

function buildNoMockAuthorityRecord(productCode: string, derivedEvidence: DerivedEvidenceState): ProductNoMockAuthorityRecord {
  const mockReason = derivedEvidence.evidenceReasons.find((reason) => reason.toLowerCase().includes("mock"));
  return {
    productId: productCode,
    state: mockReason ? "failed" : "passed",
    reasons: mockReason ? [mockReason] : ["No mock-authority signal is recorded for this product."],
  };
}

function neutralState(state: string): boolean {
  return state === "not_applicable";
}

function buildAuthorityClearanceRecord(
  product: CatalogProduct,
  evidence: ProductEvidenceObject,
  genericAiComparison: GenericAiComparisonRecord,
  marketComparison: MarketComparisonRecord,
  antiToy: ProductValidationRecord,
  redTeam: ProductValidationRecord,
  v2Revalidation: ProductV2RevalidationRecord,
  adapterVerification: ProductAdapterVerificationBundle,
  noMockAuthority: ProductNoMockAuthorityRecord,
  releaseFirewall: ProductReleaseFirewallRecord,
  checkoutAgreement: ProductCheckoutAgreementRecord,
): ProductAuthorityClearanceRecord {
  const blockers: string[] = [];

  if (noMockAuthority.state !== "passed") {
    blockers.push(...noMockAuthority.reasons);
    return { productId: product.code, state: "blocked", blockers: uniqueStrings(blockers), publicClaimPermission: false };
  }

  if (releaseFirewall.state === "inactive" || releaseFirewall.state === "manual_only") {
    blockers.push(...releaseFirewall.reasons);
    return { productId: product.code, state: "not_release_eligible", blockers: uniqueStrings(blockers), publicClaimPermission: false };
  }

  if (checkoutAgreement.state === "failed") {
    blockers.push(...checkoutAgreement.reasons);
    return { productId: product.code, state: "not_release_eligible", blockers: uniqueStrings(blockers), publicClaimPermission: false };
  }

  if (v2Revalidation.revalidationStatus === "blocked" || v2Revalidation.revalidationStatus === "evidence_missing") {
    blockers.push(...v2Revalidation.missingEvidence);
    return { productId: product.code, state: "revalidation_required", blockers: uniqueStrings(blockers), publicClaimPermission: false };
  }

  if (MEASUREMENT_INCONCLUSIVE_PRODUCTS.has(product.code)) {
    blockers.push("Prior measurement for this product is inconclusive and remains blocked.");
    return { productId: product.code, state: "blocked", blockers, publicClaimPermission: false };
  }

  if (antiToy.state === "failed" || redTeam.state === "failed") {
    blockers.push(...antiToy.reasons, ...redTeam.reasons);
    return { productId: product.code, state: "blocked", blockers: uniqueStrings(blockers), publicClaimPermission: false };
  }

  const evidenceIncomplete = [
    evidence.evidenceState === "missing",
    evidence.evidenceState === "insufficient",
    evidence.evidenceState === "blocked",
    genericAiComparison.state === "missing_source" || genericAiComparison.state === "insufficient",
    marketComparison.state === "missing_source" || marketComparison.state === "insufficient",
    antiToy.state === "missing_source" || antiToy.state === "requires_product_review",
    redTeam.state === "missing_source" || redTeam.state === "requires_product_review",
    adapterVerification.validationConstitution.state !== "passed",
    adapterVerification.antiGaming.state !== "passed",
    !neutralState(adapterVerification.adversarialValidation.state) &&
      adapterVerification.adversarialValidation.state !== "passed",
  ].some(Boolean);

  if (evidenceIncomplete) {
    blockers.push(
      ...evidence.nextRequiredEvidence,
      ...genericAiComparison.reasons,
      ...marketComparison.reasons,
      ...antiToy.reasons,
      ...redTeam.reasons,
      ...adapterVerification.validationConstitution.reasons,
      ...adapterVerification.antiGaming.reasons,
      ...adapterVerification.adversarialValidation.reasons,
    );
    return {
      productId: product.code,
      state: "evidence_incomplete",
      blockers: uniqueStrings(blockers),
      publicClaimPermission: false,
    };
  }

  if (
    releaseFirewall.state !== "release_ready" &&
    releaseFirewall.state !== "free_release"
  ) {
    blockers.push(...releaseFirewall.reasons);
    return { productId: product.code, state: "not_release_eligible", blockers: uniqueStrings(blockers), publicClaimPermission: false };
  }

  if (product.commercialStatus === "free_controlled" || product.commercialStatus === "evidence_gated") {
    blockers.push("Controlled or corridor-stage products are not public-claim eligible by authority alone.");
    return { productId: product.code, state: "not_claim_eligible", blockers: uniqueStrings(blockers), publicClaimPermission: false };
  }

  return {
    productId: product.code,
    state: "authority_cleared",
    blockers: [],
    publicClaimPermission: true,
  };
}

function buildValidationState(
  adapterVerification: ProductAdapterVerificationBundle,
): QualificationState {
  const states = [
    adapterVerification.validationConstitution.state,
    adapterVerification.antiGaming.state,
    adapterVerification.adversarialValidation.state,
  ];
  if (states.every((state) => state === "passed")) return "passed";
  if (states.some((state) => state === "failed")) return "failed";
  if (states.some((state) => state === "source_missing")) return "missing_source";
  return "blocked";
}

function buildEvidenceObject(
  product: CatalogProduct,
  derivedEvidence: DerivedEvidenceState,
  sources: ReturnType<typeof buildEvidenceSources>,
): ProductEvidenceObject {
  const review = getExternalRenderedOutputReview(product.code);
  const liveCapture = getExternalLiveRouteCapture(product.code);
  const comparisonRows = getExternalMarketComparisonRows(product.code);
  const evidenceState = buildEvidenceState(
    product,
    derivedEvidence,
    review,
    liveCapture,
    comparisonRows.length,
  );
  const blockers = uniqueStrings([
    ...(derivedEvidence.ledgerEntryExists ? derivedEvidence.evidenceReasons : []),
    ...(MEASUREMENT_INCONCLUSIVE_PRODUCTS.has(product.code)
      ? ["Prior Wave 2G measurement is inconclusive; product remains blocked pending fresh evidence."]
      : []),
    ...(V2_BLOCKED_PRODUCTS.has(product.code)
      ? ["Product requires explicit v2 revalidation evidence before authority can progress."]
      : []),
    ...(!derivedEvidence.ledgerEntryExists && !NON_OUTPUT_WRAPPER_PRODUCTS.has(product.code)
      ? ["Missing evidence ledger entry."]
      : []),
  ]);
  const nextRequiredEvidence = uniqueStrings([
    ...(!derivedEvidence.ledgerEntryExists && !NON_OUTPUT_WRAPPER_PRODUCTS.has(product.code)
      ? ["Create a real or explicit missing-state ledger inventory row for this product."]
      : []),
    ...(comparisonRows.length === 0 && isComparisonApplicable(product.code)
      ? ["Record product-specific generic-AI and market comparator sources."]
      : []),
    ...(!review && getExternalLiveRouteCapture(product.code) && isOutputValidationApplicable(product.code)
      ? ["Convert live route capture into rendered output review, anti-toy review, and red-team review."]
      : []),
    ...(!review && !getExternalLiveRouteCapture(product.code) && isOutputValidationApplicable(product.code)
      ? ["Capture rendered output from the live customer surface."]
      : []),
    ...(V2_BLOCKED_PRODUCTS.has(product.code)
      ? ["Provide source-backed v2 evidence before release or claim progression."]
      : []),
  ]);

  const sourceCoverageLevel = getCoverageLevel(evidenceState, {
    descriptor: Boolean(getExternalProductDescriptor(product.code)),
    benchmark: Boolean(getExternalProductBenchmark(product.code)),
    comparison: comparisonRows.length > 0,
    renderedOutput: Boolean(review || liveCapture),
    fulfilment: sources.fulfilmentSources.length > 0,
  });

  return {
    productId: product.code,
    productName: product.displayName,
    productFamily: getExternalProductDescriptor(product.code)?.productFamily ?? "unknown",
    evidenceLedgerEntryExists: derivedEvidence.ledgerEntryExists,
    evidenceLedgerEntryId: derivedEvidence.ledgerEntryExists
      ? derivedEvidence.artifactRefs.validationRun ?? `ledger:${product.code}`
      : V2_BLOCKED_PRODUCTS.has(product.code)
        ? `blocked:${product.code}`
        : NON_OUTPUT_WRAPPER_PRODUCTS.has(product.code)
          ? `not_applicable:${product.code}`
          : `missing:${product.code}`,
    evidenceSources: sources.evidenceSources,
    comparisonSources: sources.comparisonSources,
    marketSources: sources.marketSources,
    antiToySources: sources.antiToySources,
    redTeamSources: sources.redTeamSources,
    validationSources: sources.validationSources,
    fulfilmentSources: sources.fulfilmentSources,
    sourceCoverageLevel,
    sourceApplicability: aggregateApplicability(sources.evidenceSources, evidenceState),
    sourceFreshness: aggregateFreshness(sources.evidenceSources, evidenceState),
    evidenceState,
    blockers,
    nextRequiredEvidence,
  };
}

function buildLedgerRecord(
  product: CatalogProduct,
  evidence: ProductEvidenceObject,
): ProductLedgerInventoryRecord {
  let ledgerStatus: LedgerInventoryStatus;
  if (evidence.evidenceLedgerEntryExists) {
    ledgerStatus = "real_entry";
  } else if (evidence.evidenceState === "not_applicable") {
    ledgerStatus = "not_applicable";
  } else if (evidence.evidenceState === "blocked") {
    ledgerStatus = "blocked_until_source";
  } else {
    ledgerStatus = "missing_entry";
  }

  return {
    productId: product.code,
    productName: product.displayName,
    ledgerStatus,
    evidenceLedgerEntryExists: evidence.evidenceLedgerEntryExists,
    evidenceLedgerEntryId: evidence.evidenceLedgerEntryId,
    availableSources: evidence.evidenceSources.map((source) => source.sourceId),
    missingSources: uniqueStrings([
      ...(!evidence.evidenceLedgerEntryExists && evidence.evidenceState !== "not_applicable"
        ? ["evidence_ledger_v2"]
        : []),
      ...evidence.nextRequiredEvidence,
    ]),
    authorityConsequence: evidence.evidenceLedgerEntryExists
      ? "Ledger entry can support authority review but does not grant authority on its own."
      : "Missing or blocked ledger state prevents authority clearance.",
    nextRequiredAction: evidence.nextRequiredEvidence[0] ?? "No additional evidence action recorded.",
  };
}

function resolveCatalogProductBackbone(product: CatalogProduct): ProductAuthorityBackboneRecord {
  const derivedEvidence = deriveEvidenceState(product.code);
  const sources = buildEvidenceSources(product, derivedEvidence);
  const evidence = buildEvidenceObject(product, derivedEvidence, sources);
  const ledger = buildLedgerRecord(product, evidence);
  const genericAiComparison = normalizeGenericComparisonRecord(
    isComparisonApplicable(product.code),
    resolveGenericAiComparisonRecord(product.code, derivedEvidence.testResults?.genericAiComparisonPassed),
  );
  const marketComparison = normalizeMarketComparisonRecord(
    isComparisonApplicable(product.code),
    resolveMarketComparisonRecord(product.code, derivedEvidence.testResults?.marketComparisonPassed),
  );
  const antiToy = buildAntiToyRecord(product, derivedEvidence, evidence.antiToySources);
  const redTeam = buildRedTeamRecord(product, derivedEvidence, evidence.redTeamSources);
  const validationConstitution = buildConstitutionVerification(
    product,
    evidence.validationSources,
    antiToy,
    redTeam,
    genericAiComparison,
    marketComparison,
  );
  const antiGaming = buildAntiGamingVerification(
    product,
    derivedEvidence,
    evidence.validationSources,
    antiToy,
    redTeam,
    genericAiComparison,
    marketComparison,
  );
  const adversarialValidation = buildAdversarialVerification(
    product,
    evidence.validationSources,
  );
  const adapterVerification: ProductAdapterVerificationBundle = {
    validationConstitution,
    antiGaming: antiGaming.record,
    adversarialValidation,
  };
  const v2Revalidation = buildV2RevalidationRecord(
    product,
    derivedEvidence,
    evidence,
    genericAiComparison,
    marketComparison,
    antiToy,
    redTeam,
  );
  const contract = getContractByProductCode(product.code);
  const assurance = getAssuranceByProductCode(product.code);
  const stateMap = getFulfilmentStateMap(product.code);
  const fulfilment = buildFulfilmentQualificationRecord(product, contract, assurance, stateMap);
  const releaseFirewall = buildReleaseFirewallRecord(product, fulfilment.record);
  const checkoutAgreement = buildCheckoutAgreementRecord(product, contract);
  const noMockAuthority = buildNoMockAuthorityRecord(product.code, derivedEvidence);
  const authorityClearance = buildAuthorityClearanceRecord(
    product,
    evidence,
    genericAiComparison,
    marketComparison,
    antiToy,
    redTeam,
    v2Revalidation,
    adapterVerification,
    noMockAuthority,
    releaseFirewall,
    checkoutAgreement,
  );
  const validationState = buildValidationState(adapterVerification);
  const blockerSummary = uniqueStrings([
    ...evidence.blockers,
    ...authorityClearance.blockers,
    ...antiToy.reasons,
    ...redTeam.reasons,
    ...genericAiComparison.reasons,
    ...marketComparison.reasons,
    ...validationConstitution.reasons,
    ...antiGaming.record.reasons,
    ...adversarialValidation.reasons,
  ]).slice(0, 12);
  const nextRequiredEvidence = uniqueStrings([
    ...evidence.nextRequiredEvidence,
    ...ledger.missingSources,
    ...v2Revalidation.missingEvidence,
  ]);

  return {
    productId: product.code,
    productName: product.displayName,
    productFamily: evidence.productFamily,
    evidence,
    ledger,
    genericAiComparison,
    marketComparison,
    antiToy,
    redTeam,
    v2Revalidation,
    adapterVerification,
    fulfilmentQualification: fulfilment.record,
    noMockAuthority,
    releaseFirewall,
    checkoutAgreement,
    authorityClearance,
    validationState,
    blockerSummary,
    nextRequiredEvidence,
  };
}

export function getProductAuthorityEstateProducts(): CatalogProduct[] {
  return getAllProducts().filter(
    (product) => !EXCLUDED_PHASE_8B_ARCHIVE_PRODUCTS.has(product.code),
  );
}

export function resolveProductAuthorityBackbone(productCode: string): ProductAuthorityBackboneRecord {
  const product = getProduct(productCode);
  if (!product) {
    return resolveUnclassifiedProductBackbone(productCode);
  }
  return resolveCatalogProductBackbone(product);
}

export function resolveUnclassifiedProductBackbone(
  productCode: string,
  overrides: { productName?: string; productFamily?: string } = {},
): ProductAuthorityBackboneRecord {
  const productName = overrides.productName ?? productCode;
  const productFamily = overrides.productFamily ?? "unclassified";
  const missingSource = createSource(
    `unclassified:${productCode}`,
    "external_descriptor",
    "unclassified",
    "estate_only",
    "unknown",
    "Product is not present in the commercial catalog or evidence registry.",
  );
  const evidence: ProductEvidenceObject = {
    productId: productCode,
    productName,
    productFamily,
    evidenceLedgerEntryExists: false,
    evidenceLedgerEntryId: `missing:${productCode}`,
    evidenceSources: [missingSource],
    comparisonSources: [],
    marketSources: [],
    antiToySources: [],
    redTeamSources: [],
    validationSources: [],
    fulfilmentSources: [],
    sourceCoverageLevel: "none",
    sourceApplicability: "estate_only",
    sourceFreshness: "unknown",
    evidenceState: "blocked",
    blockers: ["Product is unclassified and defaults to blocked until explicitly inventoried."],
    nextRequiredEvidence: [
      "Add the product to the commercial catalog and fulfilment contract registry.",
      "Create an explicit evidence object and ledger inventory state before release.",
    ],
  };
  const ledger = buildLedgerRecord({
    code: productCode,
    displayName: productName,
  } as CatalogProduct, evidence);
  const emptyComparison: GenericAiComparisonRecord = {
    productCode,
    passed: false,
    source: "missing_source",
    reasons: ["Product is unclassified."],
    state: "blocked",
    comparisonEngineExists: true,
    comparisonEvidenceExists: false,
    productApplicableEvidence: false,
    thresholdPassed: false,
    authorityImplication: "does_not_support_authority",
    dimensions: [],
    traceableSources: [],
  };
  const emptyMarket: MarketComparisonRecord = {
    productCode,
    passed: false,
    source: "missing_source",
    reasons: ["Product is unclassified."],
    state: "blocked",
    comparisonEngineExists: true,
    comparisonEvidenceExists: false,
    productApplicableEvidence: false,
    thresholdPassed: false,
    authorityImplication: "does_not_support_authority",
    categories: [],
    traceableSources: [],
  };
  const emptyValidation: ProductValidationRecord = {
    productId: productCode,
    state: "blocked",
    sources: [],
    reasons: ["Product is unclassified."],
    applicable: true,
  };
  const adapterVerification: ProductAdapterVerificationBundle = {
    validationConstitution: {
      adapterId: "validation_constitution",
      state: "direct_adapter_missing",
      directInvocation: false,
      sources: [],
      reasons: ["Product is unclassified."],
    },
    antiGaming: {
      adapterId: "anti_gaming",
      state: "direct_adapter_missing",
      directInvocation: false,
      sources: [],
      reasons: ["Product is unclassified."],
    },
    adversarialValidation: {
      adapterId: "adversarial_validation",
      state: "direct_adapter_missing",
      directInvocation: false,
      sources: [],
      reasons: ["Product is unclassified."],
    },
  };
  return {
    productId: productCode,
    productName,
    productFamily,
    evidence,
    ledger,
    genericAiComparison: emptyComparison,
    marketComparison: emptyMarket,
    antiToy: emptyValidation,
    redTeam: emptyValidation,
    v2Revalidation: {
      productId: productCode,
      currentVersion: "v0",
      requiredVersion: "v2",
      revalidationStatus: "blocked",
      requiredEvidence: ["catalog_classification", "evidence_object", "fulfilment_contract"],
      completedEvidence: [],
      missingEvidence: ["catalog_classification", "evidence_object", "fulfilment_contract"],
      authorityConsequence: "Authority is blocked until the product is classified.",
      releaseConsequence: "Release is blocked until the product is classified.",
      publicClaimConsequence: "Public claims are denied until the product is classified.",
      fulfilmentConsequence: "Fulfilment is blocked until the product is classified.",
    },
    adapterVerification,
    fulfilmentQualification: {
      productId: productCode,
      state: "blocked",
      readinessStatus: "unclassified",
      deliveryClass: null,
      sources: [],
      reasons: ["Product is unclassified."],
      dashboardVisible: false,
    },
    noMockAuthority: {
      productId: productCode,
      state: "failed",
      reasons: ["Product is unclassified."],
    },
    releaseFirewall: {
      productId: productCode,
      state: "blocked",
      passed: false,
      reasons: ["Product is unclassified."],
    },
    checkoutAgreement: {
      productId: productCode,
      state: "not_applicable",
      requiresCheckout: false,
      reasons: ["Product is unclassified."],
    },
    authorityClearance: {
      productId: productCode,
      state: "blocked",
      blockers: ["Product is unclassified and defaults to blocked until classified."],
      publicClaimPermission: false,
    },
    validationState: "blocked",
    blockerSummary: ["Product is unclassified and defaults to blocked until classified."],
    nextRequiredEvidence: evidence.nextRequiredEvidence,
  };
}

export function resolveProductAuthorityBackboneEstate(): ProductAuthorityBackboneRecord[] {
  return getProductAuthorityEstateProducts().map(resolveCatalogProductBackbone);
}

export function buildProductAuthorityBackboneReport(): ProductAuthorityBackboneReport {
  const products = resolveProductAuthorityBackboneEstate();
  return {
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    summary: {
      explicitEvidenceObjects: products.length,
      productsWithLedgerEntries: products.filter((product) => product.evidence.evidenceLedgerEntryExists).length,
      productsWithExplicitMissingLedgerStates: products.filter((product) => product.ledger.ledgerStatus === "missing_entry").length,
      authorityCleared: products.filter((product) => product.authorityClearance.state === "authority_cleared").length,
      blocked: products.filter((product) => product.authorityClearance.state === "blocked").length,
      evidenceIncomplete: products.filter((product) => product.authorityClearance.state === "evidence_incomplete").length,
      genericAiCoverage: products.length,
      marketCoverage: products.length,
      antiToyCoverage: products.length,
      redTeamCoverage: products.length,
      v2Coverage: products.length,
      publicClaimPermissionEnabled: products.filter((product) => product.authorityClearance.publicClaimPermission).length,
    },
    products,
  };
}
